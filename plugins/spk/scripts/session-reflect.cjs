// scripts/session-reflect.cjs
// Stop hook — the TRIGGER half of the self-improving session-reflect, modeled on
// coleam00/helpline's propose_claude_md.py.
//
// The expensive part (reflecting on the session with an LLM) is too slow to
// block the end of every turn on, so the work is split:
//   * THIS file (the hook) does the cheap, deterministic part — notice which
//     AGENTS.md-governed areas changed and decide whether a reflection is worth
//     it — then spawn session-reflect-run.cjs in the BACKGROUND and return
//     immediately.
//   * session-reflect-run.cjs (the reflector) makes the headless `claude -p`
//     call and writes ai_context/session-reflect-review.md a little after the
//     turn ends.
//
// Loop-proof by construction: this hook writes NOTHING to stdout — no
// `decision`, no `hookSpecificOutput`/`additionalContext`. A Stop hook only
// re-feeds the model (and thus risks the "blocked the turn from ending N times"
// loop) when it blocks or returns additionalContext. We do neither. The
// reflection happens out-of-band; the live session just ends.
//
// Three guards keep it well-behaved:
//   * Recursion — the reflector spawns a headless `claude` whose own Stop hook
//     lands right back here; SPK_REFLECT_LOCK makes that a no-op.
//   * Dedup — the Stop hook fires every turn, but the diff is usually unchanged
//     turn to turn; a fingerprint of the touched-area diff skips re-reflecting.
//   * Kill switch — SPK_SESSION_REFLECT=off disables it entirely.
//
// Runnable standalone for testing: node plugins/spk/scripts/session-reflect.cjs

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const reflector = require('./session-reflect-run.cjs');

const LOCK_ENV = reflector.LOCK_ENV; // 'SPK_REFLECT_LOCK'
const STATE_FILE = reflector.STATE_FILE; // ai_context/.session-reflect-state
const RUNNER = path.join(__dirname, 'session-reflect-run.cjs');

// Hash the SAME scoped diff the reflector will reflect on (tracked + untracked),
// so adding a new file changes the fingerprint and a turn that only added files
// is not wrongly deduped against an "empty diff" state.
function diffFingerprint(root, areas) {
  let raw = '';
  try { raw = reflector.scopedDiff(root, areas); } catch { /* empty -> stable */ }
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// Fire-and-forget the reflector, fully detached so it outlives this hook process.
function spawnReflector(root, env) {
  const runner = env.SPK_REFLECT_RUNNER || RUNNER;
  try {
    const child = spawn(process.execPath, [runner], {
      cwd: root,
      env,
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return true;
  } catch (exc) {
    process.stderr.write(`[session-reflect] could not start reflector: ${exc}\n`);
    return false;
  }
}

// Decide-and-act. Returns an exit code. Pure of stdout — never prints to stdout.
function propose(env) {
  env = env || process.env;
  if ((env.SPK_SESSION_REFLECT || '').toLowerCase() === 'off') return 0;
  // Guard 1 — recursion. A reflection spawns a headless `claude` whose own Stop
  // hook runs this file again. If the lock is set, do nothing.
  if (env[LOCK_ENV]) return 0;

  const root = reflector.projectRoot(env);
  const areas = reflector.touchedAreas(root);
  if (Object.keys(areas).length === 0) return 0;

  // Guard 2 — dedup. Only reflect when the touched-area diff is new since the
  // last reflection this session.
  const fingerprint = diffFingerprint(root, areas);
  const state = path.join(root, STATE_FILE);
  try {
    if (fs.readFileSync(state, 'utf-8').trim() === fingerprint) return 0;
  } catch { /* no prior state — first reflection for this diff */ }

  if (!fs.existsSync(env.SPK_REFLECT_RUNNER || RUNNER)) {
    process.stderr.write('[session-reflect] reflector missing — skipped\n');
    return 0;
  }
  if (!spawnReflector(root, env)) return 0;

  // Record the fingerprint so identical follow-up turns do not re-spawn.
  try {
    fs.mkdirSync(path.dirname(state), { recursive: true });
    fs.writeFileSync(state, fingerprint);
  } catch { /* best-effort */ }

  process.stderr.write(
    `[session-reflect] ${Object.keys(areas).length} area(s) changed ` +
    `(${Object.keys(areas).sort().join(', ')}) — reflecting in the background ` +
    `→ ${reflector.REVIEW_FILE}\n`
  );
  return 0;
}

function main() {
  let raw = '';
  process.stdin.on('data', c => { raw += c; });
  process.stdin.on('end', () => {
    let code = 0;
    try { code = propose(process.env); } catch { code = 0; }
    process.exit(code);
  });
  // If stdin never ends (no payload piped), still run.
  process.stdin.on('error', () => { try { process.exit(propose(process.env)); } catch { process.exit(0); } });
}

if (require.main === module) main();

module.exports = { propose, diffFingerprint, spawnReflector, LOCK_ENV, STATE_FILE };
