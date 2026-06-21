// hooks/Stop/session-reflect.cjs
// Self-improving loop, PROPOSE-ONLY. On session end, reflect while context is
// fresh and SUGGEST (never write) two things to the model:
//   1) capturing a `learning` wiki page for anything worth remembering, and
//   2) re-priming any AGENTS.md that may be stale because its subtree changed.
// Contract: non-blocking => hookSpecificOutput.additionalContext JSON on stdout
// + exit 0. Kill switch SPK_SESSION_REFLECT=off => silent exit 0.
// This hook WRITES NOTHING. It only reads (best-effort) to make the suggestion
// concrete, and degrades to a generic suggestion when it cannot read git state.

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

// If the model loops faster than this, the cooldown fallback still catches it.
// Loop iterations are sub-second; a genuine new session is minutes apart.
const COOLDOWN_MS = 90 * 1000;

// Per-session marker path under the OS temp dir. Deterministic from the key,
// no secrets, hashed so an opaque id never lands on disk verbatim.
function markerPath(key) {
  const id = crypto.createHash('sha1').update(String(key)).digest('hex').slice(0, 16);
  return path.join(os.tmpdir(), `spk-session-reflect-${id}`);
}

// A stable per-session identifier from the Stop event. Claude Code always sends
// session_id; transcript_path is an equally per-session fallback. Either one
// gives us once-per-session semantics; null only if the payload has neither.
function sessionKey(event) {
  if (!event) return null;
  return event.session_id || event.transcript_path || null;
}

// Returns true the FIRST time it's called for a session, false after — the guard
// that actually breaks the loop (additionalContext re-prompts WITHOUT setting
// stop_hook_active, so that flag alone never trips). Layered so no single
// missing field can reopen the loop:
//   1. session key present -> once-per-session marker (the normal path).
//   2. no key at all       -> short global cooldown so back-to-back loop fires
//                             are suppressed without muting a later real session.
// Best-effort: a genuinely unwritable temp dir degrades to "fire" and relies on
// Claude Code's stop-hook cap as the last backstop.
function claimOncePerSession(key) {
  if (key) {
    const mp = markerPath(key);
    try {
      if (fs.existsSync(mp)) return false;
    } catch { return true; }
    try { fs.writeFileSync(mp, ''); } catch { /* ignore */ }
    return true;
  }
  const mp = path.join(os.tmpdir(), 'spk-session-reflect-cooldown');
  try {
    if (Date.now() - fs.statSync(mp).mtimeMs < COOLDOWN_MS) return false;
  } catch { /* no prior marker -> fall through and fire */ }
  try { fs.writeFileSync(mp, String(Date.now())); } catch { /* ignore */ }
  return true;
}

// Best-effort, read-only: which tracked source files changed this session?
// Returns [] on any failure (not a git repo, no git, etc.). Never throws.
function changedSourcePaths(root) {
  try {
    const out = execFileSync('git', ['diff', '--name-only', 'HEAD'], {
      cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore']
    });
    return out.split('\n').map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

// Map a changed source file to the subtree AGENTS.md that may now be stale.
// Pure: returns the AGENTS.md path string, or null when not a primeable source.
function staleAgentsFor(file) {
  const f = (file || '').replace(/\\/g, '/');
  if (!f || f.endsWith('AGENTS.md') || f.endsWith('CLAUDE.md')) return null;
  if (/(^|\/)(node_modules|dist|build|coverage|\.git)\//.test(f)) return null;
  const dir = f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '.';
  return dir === '.' ? 'AGENTS.md' : `${dir}/AGENTS.md`;
}

// Build the propose-only suggestion text. Pure given its inputs.
function buildSuggestion(changed) {
  const stale = [...new Set(changed.map(staleAgentsFor).filter(Boolean))];
  const lines = [
    '[SPK session-reflect] Propose-only — nothing has been written.',
    'If this session produced a reusable decision, gotcha, or pattern, capture it as a `learning` wiki page (e.g. ai_context/wiki/learnings/) via /spk:ingest so the layer does not silently rot.'
  ];
  if (stale.length) {
    const shown = stale.slice(0, 8).join(', ');
    lines.push(`Source changed in these subtree(s); their context may be stale — consider re-running /spk:prime: ${shown}${stale.length > 8 ? ', …' : ''}`);
  } else {
    lines.push('If any subtree changed structurally, re-run /spk:prime <scope> to refresh its AGENTS.md.');
  }
  return lines.join(' ');
}

function reflect(event, env) {
  env = env || process.env;
  if ((env.SPK_SESSION_REFLECT || '').toLowerCase() === 'off') return null;
  // Loop guard 1: Claude Code sets stop_hook_active=true when a Stop is itself a
  // continuation triggered by a previous Stop-hook that BLOCKED. Honor it when
  // present — but it is NOT sufficient here: this hook re-feeds the model via
  // hookSpecificOutput.additionalContext, a path that re-prompts WITHOUT setting
  // stop_hook_active on the next Stop. So the flag alone never trips and the
  // suggestion loops until Claude Code's stop-hook cap. (That was bug #4's gap.)
  if (event && event.stop_hook_active) return null;
  // Loop guard 2 (the real fix): claim a per-session marker so the suggestion is
  // emitted exactly once per session regardless of stop_hook_active. The one
  // extra turn it triggers then finds the marker set and stays silent.
  if (!claimOncePerSession(sessionKey(event))) return null;
  const root = env.CLAUDE_PROJECT_DIR || env.SPK_PROJECT_ROOT || process.cwd();
  const changed = changedSourcePaths(root);
  return buildSuggestion(changed);
}

function main() {
  let raw = '';
  process.stdin.on('data', chunk => { raw += chunk; });
  process.stdin.on('end', () => {
    let event;
    try { event = JSON.parse(raw || '{}'); } catch { process.exit(0); }
    let suggestion;
    try { suggestion = reflect(event); } catch { process.exit(0); }
    if (suggestion) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'Stop',
          additionalContext: suggestion
        }
      }) + '\n');
    }
    process.exit(0);
  });
}

if (require.main === module) main();

module.exports = { reflect, buildSuggestion, staleAgentsFor, changedSourcePaths, markerPath, claimOncePerSession, sessionKey };
