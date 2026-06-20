// tests/session-reflect.test.js
// Pins the propose-only Stop hook: it SUGGESTS a learning page + flags stale
// AGENTS.md but WRITES NOTHING. Non-blocking contract = additionalContext JSON
// on stdout + exit 0; kill switch SPK_SESSION_REFLECT=off => silent exit 0.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SCRIPT = path.join(__dirname, '..', 'plugins', 'spk', 'scripts', 'session-reflect.cjs');

function run(event, env = {}) {
  return spawnSync('node', [SCRIPT], {
    input: JSON.stringify(event),
    encoding: 'utf-8',
    env: { ...process.env, ...env }
  });
}

describe('session-reflect Stop hook', () => {
  test('kill switch yields no output and exit 0', () => {
    const r = run({ hook_event_name: 'Stop' }, { SPK_SESSION_REFLECT: 'off' });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toBe('');
  });

  test('emits additionalContext JSON on stdout, exit 0', () => {
    const r = run({ hook_event_name: 'Stop' });
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out.hookSpecificOutput.hookEventName).toBe('Stop');
    expect(out.hookSpecificOutput.additionalContext).toMatch(/learning|AGENTS\.md|reflect/i);
  });

  test('proposes only — writes no files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-reflect-'));
    try {
      const before = fs.readdirSync(dir);
      const r = run({ hook_event_name: 'Stop' }, { CLAUDE_PROJECT_DIR: dir, SPK_PROJECT_ROOT: dir });
      expect(r.status).toBe(0);
      const after = fs.readdirSync(dir);
      expect(after).toEqual(before);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  test('loop guard: stays silent when stop_hook_active is true', () => {
    const r = run({ hook_event_name: 'Stop', stop_hook_active: true });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
  });

  test('malformed stdin never breaks the hook', () => {
    const r = spawnSync('node', [SCRIPT], { input: 'not json{', encoding: 'utf-8' });
    expect(r.status).toBe(0);
  });
});
