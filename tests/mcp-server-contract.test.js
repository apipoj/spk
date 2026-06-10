// tests/mcp-server-contract.test.js
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

// Resolve a real ripgrep binary for live tests. Plain `rg` is preferred; some
// environments only expose ripgrep via the Claude Code multiplexer (invoked
// with argv0=rg), which we cannot pass through SPK_RG_PATH, so those live
// assertions are skipped rather than failing on an environment quirk.
function resolveRg() {
  const probe = spawnSync('rg', ['--version'], { encoding: 'utf-8' });
  if (!probe.error && probe.status === 0) return 'rg';
  return null;
}
const LIVE_RG = resolveRg();
const liveSearch = LIVE_RG ? test : test.skip;

describe('stdio JSON-RPC handshake (live process)', () => {
  function rpc(messages, env = {}) {
    const input = messages.map((m) => JSON.stringify(m)).join('\n') + '\n';
    const r = spawnSync('node', [ENTRY], {
      input,
      encoding: 'utf-8',
      env: { ...process.env, ...env },
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
});
