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
const { execFileSync } = require('child_process');

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
  // Loop guard: Claude Code sets stop_hook_active=true when this Stop is itself
  // a continuation triggered by a previous Stop-hook suggestion. Emitting again
  // would re-feed the model and loop forever, so stay silent. Net effect: the
  // suggestion fires exactly once per genuine session end.
  if (event && event.stop_hook_active) return null;
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

module.exports = { reflect, buildSuggestion, staleAgentsFor, changedSourcePaths };
