// tests/session-reflect.test.js
// Pins the propose-only Stop hook: it SUGGESTS a learning page + flags stale
// AGENTS.md but WRITES NOTHING. Non-blocking contract = additionalContext JSON
// on stdout + exit 0; kill switch SPK_SESSION_REFLECT=off => silent exit 0.
// Loop guards: it must fire exactly once per session and never re-feed the model
// in a loop (the bug fixed in #4/#5).
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SCRIPT = path.join(__dirname, '..', 'plugins', 'spk', 'scripts', 'session-reflect.cjs');
const { markerPath } = require('../plugins/spk/scripts/session-reflect.cjs');
const COOLDOWN_MARKER = path.join(os.tmpdir(), 'spk-session-reflect-cooldown');

function run(event, env = {}) {
  return spawnSync('node', [SCRIPT], {
    input: JSON.stringify(event),
    encoding: 'utf-8',
    env: { ...process.env, ...env }
  });
}

// Unique, collision-free key per test so per-session markers never bleed between
// tests or across repeated `npm test` runs.
let counter = 0;
function uniqueKey() {
  return `test-${process.pid}-${process.hrtime.bigint()}-${counter++}`;
}

describe('session-reflect Stop hook', () => {
  // Isolate the global cooldown fallback from prior runs.
  beforeEach(() => { fs.rmSync(COOLDOWN_MARKER, { force: true }); });
  afterAll(() => { fs.rmSync(COOLDOWN_MARKER, { force: true }); });

  test('kill switch yields no output and exit 0', () => {
    const r = run({ hook_event_name: 'Stop', session_id: uniqueKey() }, { SPK_SESSION_REFLECT: 'off' });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toBe('');
  });

  test('emits additionalContext JSON on stdout, exit 0', () => {
    const sessionId = uniqueKey();
    const marker = markerPath(sessionId);
    try {
      const r = run({ hook_event_name: 'Stop', session_id: sessionId });
      expect(r.status).toBe(0);
      const out = JSON.parse(r.stdout);
      expect(out.hookSpecificOutput.hookEventName).toBe('Stop');
      expect(out.hookSpecificOutput.additionalContext).toMatch(/learning|AGENTS\.md|reflect/i);
    } finally {
      fs.rmSync(marker, { force: true });
    }
  });

  test('proposes only — writes no files in the project dir', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-reflect-'));
    const sessionId = uniqueKey();
    try {
      const before = fs.readdirSync(dir);
      const r = run({ hook_event_name: 'Stop', session_id: sessionId }, { CLAUDE_PROJECT_DIR: dir, SPK_PROJECT_ROOT: dir });
      expect(r.status).toBe(0);
      const after = fs.readdirSync(dir);
      expect(after).toEqual(before);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      fs.rmSync(markerPath(sessionId), { force: true });
    }
  });

  test('loop guard: stays silent when stop_hook_active is true', () => {
    const r = run({ hook_event_name: 'Stop', stop_hook_active: true, session_id: uniqueKey() });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
  });

  test('loop guard: same session_id fires once, then stays silent', () => {
    const sessionId = uniqueKey();
    const marker = markerPath(sessionId);
    try {
      const first = run({ hook_event_name: 'Stop', session_id: sessionId });
      expect(first.status).toBe(0);
      expect(first.stdout).not.toBe('');
      expect(JSON.parse(first.stdout).hookSpecificOutput.hookEventName).toBe('Stop');

      const second = run({ hook_event_name: 'Stop', session_id: sessionId });
      expect(second.status).toBe(0);
      expect(second.stdout).toBe('');
    } finally {
      fs.rmSync(marker, { force: true });
    }
  });

  test('loop guard: falls back to transcript_path when session_id is absent', () => {
    const transcript = path.join(os.tmpdir(), `${uniqueKey()}.jsonl`);
    const marker = markerPath(transcript);
    try {
      const first = run({ hook_event_name: 'Stop', transcript_path: transcript });
      expect(first.stdout).not.toBe('');

      const second = run({ hook_event_name: 'Stop', transcript_path: transcript });
      expect(second.stdout).toBe('');
    } finally {
      fs.rmSync(marker, { force: true });
    }
  });

  test('loop guard: with NO identifier at all, cooldown still breaks the loop', () => {
    // No session_id, no transcript_path — the worst case. Back-to-back fires
    // (the loop) must not all emit.
    const first = run({ hook_event_name: 'Stop' });
    expect(first.stdout).not.toBe('');

    const second = run({ hook_event_name: 'Stop' });
    expect(second.stdout).toBe('');
  });

  test('malformed stdin never breaks the hook', () => {
    const r = spawnSync('node', [SCRIPT], { input: 'not json{', encoding: 'utf-8' });
    expect(r.status).toBe(0);
  });
});
