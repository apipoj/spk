// tests/mcp-server-contract.test.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const srv = require('../plugins/spk/mcp/codebase-search.cjs');
const ENTRY = path.join(__dirname, '..', 'plugins', 'spk', 'mcp', 'codebase-search.cjs');

describe('tool surface', () => {
  test('exposes the three tools', () => {
    expect(srv.listTools().map((t) => t.name).sort()).toEqual([
      'file_outline',
      'find_symbol',
      'search_code',
    ]);
  });

  test('each tool has a description and input schema', () => {
    for (const t of srv.listTools()) {
      expect(typeof t.description).toBe('string');
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.inputSchema).toBeTruthy();
      expect(t.inputSchema.type).toBe('object');
    }
  });
});

describe('runtime guards', () => {
  test('missing rg yields structured error, not a throw', () => {
    expect(srv.runRg(['--json', 'x'], { SPK_RG_PATH: '/no/such/rg' })).toMatchObject({
      error: 'rg-not-found',
    });
  });

  test('kill switch disables tools', () => {
    expect(srv.toolsEnabled({ SPK_CODEBASE_SEARCH: 'off' })).toBe(false);
    expect(srv.toolsEnabled({})).toBe(true);
  });

  test('createServer returns an object that can list and dispatch tools', () => {
    const server = srv.createServer();
    expect(typeof server.listTools).toBe('function');
    expect(typeof server.callTool).toBe('function');
    expect(server.listTools().map((t) => t.name).sort()).toEqual([
      'file_outline',
      'find_symbol',
      'search_code',
    ]);
  });

  test('callTool reports disabled when kill switch is set', () => {
    const server = srv.createServer({ SPK_CODEBASE_SEARCH: 'off' });
    const res = server.callTool('search_code', { query: 'foo' });
    expect(res.disabled).toBe(true);
  });
});

// Symlink-escape hardening: an in-root symlink whose target resolves OUTSIDE
// the project root must be rejected when passed as an explicit path arg. Pure
// path math cannot catch this (it never resolves symlinks), so dispatch must
// add realpath-based containment. A symlink staying inside root is allowed, and
// a not-yet-existing path (ENOENT) must still pass.
describe('symlink escape hardening', () => {
  let root;
  let outside;
  beforeEach(() => {
    // realpathSync resolves macOS /var -> /private/var so comparisons are stable.
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spk-root-')));
    outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spk-outside-')));
    fs.mkdirSync(path.join(root, 'src'));
    fs.writeFileSync(path.join(root, 'src', 'a.js'), 'const inRoot = 1;\n');
    fs.writeFileSync(path.join(outside, 'leak.txt'), 'SECRET\n');
  });
  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  });

  function call(name, args) {
    return srv.dispatch(name, args, { CLAUDE_PROJECT_DIR: root });
  }

  test('rejects an in-root symlink that resolves outside root', () => {
    fs.symlinkSync(outside, path.join(root, 'escape'));
    const res = call('search_code', { query: 'SECRET', path: 'escape' });
    expect(res.error).toBe('invalid-argument');
    expect(res.hint).toMatch(/symlink|escapes/i);
  });

  test('rejects an in-root symlink target for file_outline too', () => {
    fs.symlinkSync(path.join(outside, 'leak.txt'), path.join(root, 'escape.txt'));
    const res = call('file_outline', { path: 'escape.txt' });
    expect(res.error).toBe('invalid-argument');
  });

  test('allows an in-root symlink that resolves inside root', () => {
    fs.symlinkSync(path.join(root, 'src'), path.join(root, 'innerlink'));
    const res = call('search_code', { query: 'inRoot', path: 'innerlink' });
    // Either a clean match set or an rg-availability error, but never an
    // invalid-argument containment rejection.
    expect(res.error).not.toBe('invalid-argument');
  });

  test('allows a normal in-root path', () => {
    const res = call('search_code', { query: 'inRoot', path: 'src' });
    expect(res.error).not.toBe('invalid-argument');
  });

  test('allows a not-yet-existing in-root path (ENOENT passes containment)', () => {
    const res = call('search_code', { query: 'x', path: 'does/not/exist/yet' });
    expect(res.error).not.toBe('invalid-argument');
  });
});

// Output bounding: rg -m caps matches PER FILE, so a broad query can return
// max * fileCount matches. dispatch must enforce a real GLOBAL cap and report
// `truncated` based on the true total, not the per-file cap.
describe('global result cap', () => {
  function makeMatches(n) {
    return Array.from({ length: n }, (_, i) => ({ file: `f${i}.js`, line: 1, col: 0, text: 'x' }));
  }

  test('slices to max and reports truncated:true when total exceeds max', () => {
    const out = srv.applyGlobalCap(makeMatches(120), 50);
    expect(out.matches).toHaveLength(50);
    expect(out.truncated).toBe(true);
    expect(out.count).toBe(50);
  });

  test('does not truncate when total is at or under max', () => {
    const out = srv.applyGlobalCap(makeMatches(40), 50);
    expect(out.matches).toHaveLength(40);
    expect(out.truncated).toBe(false);
    expect(out.count).toBe(40);
  });

  test('exactly max is not flagged as truncated', () => {
    const out = srv.applyGlobalCap(makeMatches(50), 50);
    expect(out.truncated).toBe(false);
    expect(out.matches).toHaveLength(50);
  });
});

// Resolve a value usable as SPK_RG_PATH for the live server process (which
// spawns rg internally and cannot set argv0). Plain `rg` is preferred. If
// ripgrep is reachable only via the Claude Code binary (argv0=rg), generate a
// tiny shim wrapper so the live process can still run it. Only skip when no
// ripgrep is reachable at all.
function resolveLiveRgPath() {
  const plain = spawnSync('rg', ['--version'], { encoding: 'utf-8' });
  if (!plain.error && plain.status === 0) return 'rg';
  const candidates = [process.env.CLAUDE_CODE_EXECPATH, '/Users/apipoj/.local/bin/claude'].filter(
    Boolean,
  );
  for (const c of candidates) {
    if (!fs.existsSync(c)) continue;
    const probe = spawnSync(c, ['--version'], { encoding: 'utf-8', argv0: 'rg' });
    if (!probe.error && probe.status === 0 && /ripgrep/.test(probe.stdout || '')) {
      const shim = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'spk-rgshim-')), 'rg');
      fs.writeFileSync(shim, `#!/bin/bash\nexec -a rg ${c} "$@"\n`);
      fs.chmodSync(shim, 0o755);
      return shim;
    }
  }
  return null;
}
const LIVE_RG = resolveLiveRgPath();
const liveSearch = LIVE_RG ? test : test.skip;

describe('stdio JSON-RPC handshake (live process)', () => {
  function rpc(messages, env = {}) {
    const input = messages.map((m) => JSON.stringify(m)).join('\n') + '\n';
    const r = spawnSync('node', [ENTRY], {
      input,
      encoding: 'utf-8',
      env: { ...process.env, SPK_RG_PATH: LIVE_RG || undefined, ...env },
      timeout: 10000,
    });
    const lines = r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l));
    return { lines, status: r.status, stderr: r.stderr };
  }

  test('responds to initialize then tools/list over stdio', () => {
    const { lines } = rpc([
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
    ]);
    const init = lines.find((l) => l.id === 1);
    expect(init.result.protocolVersion).toBeTruthy();
    expect(init.result.serverInfo.name).toBe('spk-codebase-search');

    const list = lines.find((l) => l.id === 2);
    expect(list.result.tools.map((t) => t.name).sort()).toEqual([
      'file_outline',
      'find_symbol',
      'search_code',
    ]);
  });

  liveSearch('search_code over stdio returns capped file/line matches on a real dir', () => {
    const { lines } = rpc([
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'search_code',
          arguments: { query: 'buildSearchArgs', path: 'plugins/spk/mcp' },
        },
      },
    ]);
    const call = lines.find((l) => l.id === 2);
    expect(call.result).toBeTruthy();
    const payload = JSON.parse(call.result.content[0].text);
    expect(Array.isArray(payload.matches)).toBe(true);
    expect(payload.matches.length).toBeGreaterThan(0);
    expect(payload.matches[0]).toHaveProperty('file');
    expect(payload.matches[0]).toHaveProperty('line');
  });

  // End-to-end repro of the no-path / empty-stdin bug: full server process,
  // JSON-RPC over a real stdin pipe, NO path arg. Before the "." default this
  // returned 0 matches because rg read the (drained) JSON-RPC stdin.
  liveSearch('find_symbol over stdio with NO path finds a repo symbol', () => {
    const { lines } = rpc([
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'find_symbol', arguments: { name: 'escapeRegex' } },
      },
    ]);
    const call = lines.find((l) => l.id === 2);
    const payload = JSON.parse(call.result.content[0].text);
    expect(payload.matches.length).toBeGreaterThanOrEqual(1);
    expect(payload.matches.some((m) => /rg\.cjs$/.test(m.file))).toBe(true);
  });
});
