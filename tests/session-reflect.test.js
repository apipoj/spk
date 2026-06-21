// tests/session-reflect.test.js
// The self-improving session-reflect Stop hook, redesigned (v3.4.0) on the
// coleam00/helpline pattern: the Stop hook (session-reflect.cjs) does cheap
// deterministic detection + dedup and spawns the reflector
// (session-reflect-run.cjs) in the BACKGROUND, which calls headless `claude -p`
// and writes ai_context/session-reflect-review.md.
//
// Loop-proof contract: the hook writes NOTHING to stdout (no decision / no
// additionalContext), so it can never re-feed the model or trip the
// "blocked the turn from ending N times" loop. Guards: recursion lock, dedup
// fingerprint, kill switch, deterministic fallback when `claude` is absent.
const { spawnSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK = path.join(__dirname, '..', 'plugins', 'spk', 'scripts', 'session-reflect.cjs');
const reflector = require('../plugins/spk/scripts/session-reflect-run.cjs');
const hook = require('../plugins/spk/scripts/session-reflect.cjs');

// A claude bin that does not exist -> runClaude fails -> deterministic fallback.
// Guarantees tests never make a real `claude -p` call.
const NO_CLAUDE = path.join(os.tmpdir(), 'spk-no-such-claude-binary');

function gitInitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-reflect-'));
  const g = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'ignore' });
  g('init');
  g('config', 'user.email', 't@t.t');
  g('config', 'user.name', 't');
  g('config', 'commit.gpgsign', 'false');
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Root\n');
  fs.mkdirSync(path.join(dir, 'pkg'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'pkg', 'AGENTS.md'), '# pkg area\n');
  fs.writeFileSync(path.join(dir, 'pkg', 'a.js'), 'const a = 1;\n');
  g('add', '-A');
  g('commit', '-m', 'init');
  return dir;
}

function touch(dir, rel, body) {
  fs.writeFileSync(path.join(dir, rel), body);
}

function runHook(event, env = {}) {
  return spawnSync('node', [HOOK], {
    input: JSON.stringify(event || { hook_event_name: 'Stop' }),
    encoding: 'utf-8',
    env: { ...process.env, ...env }
  });
}

describe('session-reflect-run.cjs (reflector)', () => {
  test('agentsAreas finds every AGENTS.md dir incl. root', () => {
    const dir = gitInitRepo();
    try {
      const areas = reflector.agentsAreas(dir);
      expect(areas.has('.')).toBe(true);
      expect(areas.has('pkg')).toBe(true);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('areaOf maps a changed file to its nearest AGENTS.md area', () => {
    const areas = new Set(['.', 'pkg']);
    expect(reflector.areaOf('pkg/a.js', areas)).toBe('pkg');
    expect(reflector.areaOf('root-file.js', areas)).toBe('.');
  });

  test('touchedAreas counts changed files per area', () => {
    const dir = gitInitRepo();
    try {
      touch(dir, 'pkg/a.js', 'const a = 2;\n');
      const counts = reflector.touchedAreas(dir);
      expect(counts.pkg).toBe(1);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('writes a deterministic fallback review when claude is unavailable', () => {
    const dir = gitInitRepo();
    try {
      touch(dir, 'pkg/a.js', 'const a = 99;\n');
      const code = reflector.reflect({ CLAUDE_PROJECT_DIR: dir, SPK_REFLECT_CLAUDE_BIN: NO_CLAUDE });
      expect(code).toBe(0);
      const review = fs.readFileSync(path.join(dir, reflector.REVIEW_FILE), 'utf-8');
      expect(review).toMatch(/Session reflect/);
      expect(review).toMatch(/deterministic fallback/);
      expect(review).toMatch(/pkg/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('recursion lock: reflector no-ops and writes nothing', () => {
    const dir = gitInitRepo();
    try {
      touch(dir, 'pkg/a.js', 'const a = 5;\n');
      const code = reflector.reflect({ CLAUDE_PROJECT_DIR: dir, [reflector.LOCK_ENV]: '1', SPK_REFLECT_CLAUDE_BIN: NO_CLAUDE });
      expect(code).toBe(0);
      expect(fs.existsSync(path.join(dir, reflector.REVIEW_FILE))).toBe(false);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('no touched AGENTS.md area: reflector writes nothing', () => {
    const dir = gitInitRepo();
    try {
      const code = reflector.reflect({ CLAUDE_PROJECT_DIR: dir, SPK_REFLECT_CLAUDE_BIN: NO_CLAUDE });
      expect(code).toBe(0);
      expect(fs.existsSync(path.join(dir, reflector.REVIEW_FILE))).toBe(false);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe('session-reflect.cjs (Stop hook trigger)', () => {
  test('LOOP-PROOF: hook never writes to stdout, exit 0', () => {
    const dir = gitInitRepo();
    try {
      touch(dir, 'pkg/a.js', 'const a = 3;\n');
      const r = runHook({ hook_event_name: 'Stop' }, { CLAUDE_PROJECT_DIR: dir, SPK_REFLECT_RUNNER: NO_CLAUDE });
      expect(r.status).toBe(0);
      expect(r.stdout).toBe(''); // no decision / no additionalContext -> no re-feed -> no loop
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('kill switch SPK_SESSION_REFLECT=off: no spawn, no state', () => {
    const dir = gitInitRepo();
    try {
      touch(dir, 'pkg/a.js', 'const a = 4;\n');
      const code = hook.propose({ CLAUDE_PROJECT_DIR: dir, SPK_SESSION_REFLECT: 'off' });
      expect(code).toBe(0);
      expect(fs.existsSync(path.join(dir, hook.STATE_FILE))).toBe(false);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('recursion lock: hook no-ops, no state written', () => {
    const dir = gitInitRepo();
    try {
      touch(dir, 'pkg/a.js', 'const a = 6;\n');
      const code = hook.propose({ CLAUDE_PROJECT_DIR: dir, [hook.LOCK_ENV]: '1' });
      expect(code).toBe(0);
      expect(fs.existsSync(path.join(dir, hook.STATE_FILE))).toBe(false);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('no changes: hook no-ops, no state written', () => {
    const dir = gitInitRepo();
    try {
      const code = hook.propose({ CLAUDE_PROJECT_DIR: dir });
      expect(code).toBe(0);
      expect(fs.existsSync(path.join(dir, hook.STATE_FILE))).toBe(false);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('spawns the reflector and records a dedup fingerprint; identical turn does not re-spawn', () => {
    const dir = gitInitRepo();
    const sentinelDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-sentinel-'));
    const sentinel = path.join(sentinelDir, 'ran');
    // A stand-in reflector: appends a line each time it is spawned.
    const fakeRunner = path.join(sentinelDir, 'fake-runner.cjs');
    fs.writeFileSync(fakeRunner, `require('fs').appendFileSync(${JSON.stringify(sentinel)}, 'x');\n`);
    try {
      touch(dir, 'pkg/a.js', 'const a = 7;\n');
      const env = { CLAUDE_PROJECT_DIR: dir, SPK_REFLECT_RUNNER: fakeRunner };

      const c1 = hook.propose(env);
      expect(c1).toBe(0);
      expect(fs.existsSync(path.join(dir, hook.STATE_FILE))).toBe(true);

      // Second call, SAME diff -> dedup -> must NOT spawn again.
      const c2 = hook.propose(env);
      expect(c2).toBe(0);

      // Give the single detached spawn a moment to write the sentinel.
      const deadline = Date.now() + 3000;
      while (!fs.existsSync(sentinel) && Date.now() < deadline) {
        execFileSync('node', ['-e', 'setTimeout(()=>{},50)']);
      }
      const runs = fs.existsSync(sentinel) ? fs.readFileSync(sentinel, 'utf-8').length : 0;
      expect(runs).toBe(1); // spawned exactly once despite two propose() calls
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      fs.rmSync(sentinelDir, { recursive: true, force: true });
    }
  });

  test('malformed stdin never breaks the hook', () => {
    const r = spawnSync('node', [HOOK], { input: 'not json{', encoding: 'utf-8',
      env: { ...process.env, SPK_SESSION_REFLECT: 'off' } });
    expect(r.status).toBe(0);
  });
});
