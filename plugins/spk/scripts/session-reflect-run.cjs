// scripts/session-reflect-run.cjs
// The REFLECTOR — the reasoning half of the self-improving Stop hook, modeled on
// coleam00/helpline's reflect_claude_md.py but adapted to SPK (Node/CJS, keyed
// on SPK's canonical AGENTS.md instead of CLAUDE.md).
//
// session-reflect.cjs (the hook) does the cheap, deterministic part: notice that
// an AGENTS.md-governed area changed, dedup, and spawn THIS file in the
// background. This file does the slow part: gather the session's diff + the
// AGENTS.md of every area that changed, ask headless `claude -p` whether those
// conventions still hold (and whether the session produced a reusable learning),
// and write the proposal to ai_context/session-reflect-review.md.
//
// Two safety properties carried over from the reference:
//   * Recursion guard — the headless `claude` it spawns fires its OWN Stop hook,
//     which would spawn another reflection forever. The child is launched with
//     SPK_REFLECT_LOCK=1; both this file and the hook no-op when it is set.
//   * Graceful fallback — if the `claude` CLI is missing or the call fails, it
//     writes a deterministic "re-check these files" note instead, so drift is
//     still flagged without the model.
//
// Runnable directly for a synchronous reflection (what the tests use):
//   node plugins/spk/scripts/session-reflect-run.cjs

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const LOCK_ENV = 'SPK_REFLECT_LOCK';
const REVIEW_FILE = path.join('ai_context', 'session-reflect-review.md');
const STATE_FILE = path.join('ai_context', '.session-reflect-state');
const MAX_DIFF_CHARS = 12000;
const CLAUDE_TIMEOUT_MS = 180000;
const EXCLUDE = new Set([
  '.git', 'node_modules', 'dist', 'build', 'coverage',
  '.venv', 'venv', 'env', '__pycache__'
]);

function projectRoot(env) {
  env = env || process.env;
  return env.CLAUDE_PROJECT_DIR || env.SPK_PROJECT_ROOT || process.cwd();
}

function git(args, root, timeout = 10000) {
  try {
    return execFileSync('git', args, {
      cwd: root, encoding: 'utf-8', timeout, stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch {
    return '';
  }
}

// session-reflect's OWN generated files (posix). They live under ai_context/ as
// untracked files; if counted as "changes" they would map to the root area and
// shift the diff fingerprint every run — a feedback loop that breaks dedup and
// makes the hook reflect on its own output. Always excluded.
const SELF_ARTIFACTS = new Set([
  REVIEW_FILE.replace(/\\/g, '/'),
  STATE_FILE.replace(/\\/g, '/')
]);
function isSelfArtifact(p) {
  return SELF_ARTIFACTS.has(p.replace(/\\/g, '/'));
}

// Working-tree changed paths (posix), best-effort, excluding our own artifacts.
function changedPaths(root) {
  return git(['status', '--porcelain'], root)
    .split('\n')
    .filter(l => l.length > 3)
    .map(l => l.slice(3).trim().replace(/\\/g, '/'))
    .filter(Boolean)
    .filter(p => !isSelfArtifact(p));
}

// Every directory that carries its own AGENTS.md (the areas the hierarchy
// governs), repo-root included as '.'. Layout-agnostic — works in any repo.
function agentsAreas(root) {
  const areas = new Set();
  (function walk(dir, rel) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    if (entries.some(e => e.isFile() && e.name === 'AGENTS.md')) areas.add(rel || '.');
    for (const e of entries) {
      if (e.isDirectory() && !EXCLUDE.has(e.name)) {
        walk(path.join(dir, e.name), rel ? `${rel}/${e.name}` : e.name);
      }
    }
  })(root, '');
  return areas;
}

// Nearest AGENTS.md-governed directory containing a changed file ('.' = root).
function areaOf(changed, areas) {
  const parts = changed.split('/');
  for (let depth = parts.length - 1; depth >= 1; depth--) {
    const candidate = parts.slice(0, depth).join('/');
    if (areas.has(candidate)) return candidate;
  }
  return areas.has('.') ? '.' : null;
}

// Map touched AGENTS.md areas -> count of files changed.
function touchedAreas(root) {
  const governed = agentsAreas(root);
  const counts = {};
  for (const p of changedPaths(root)) {
    const area = areaOf(p, governed);
    if (area) counts[area] = (counts[area] || 0) + 1;
  }
  return counts;
}

// Untracked files (new this session), scoped to the touched areas.
function untrackedFiles(root, targets) {
  return git(['ls-files', '--others', '--exclude-standard', '--', ...targets], root)
    .split('\n').map(s => s.trim()).filter(Boolean)
    .filter(p => !isSelfArtifact(p));
}

// The working-tree change set to reflect on. `git diff HEAD` only covers TRACKED
// changes, so untracked new files (common in SPK work) are appended as synthetic
// added-file blocks — otherwise a session that only adds files would show an
// empty diff and always fall back to the deterministic note.
function scopedDiff(root, areas) {
  const targets = Object.keys(areas).map(a => (a === '.' ? '.' : a));
  let diff = git(['diff', 'HEAD', '--', ...targets], root);
  for (const f of untrackedFiles(root, targets)) {
    let content = '';
    try { content = fs.readFileSync(path.join(root, f), 'utf-8'); } catch { /* skip */ }
    const added = content.split('\n').map(l => '+' + l).join('\n');
    diff += `\n--- /dev/null\n+++ b/${f}\n${added}\n`;
  }
  if (diff.length > MAX_DIFF_CHARS) {
    diff = diff.slice(0, MAX_DIFF_CHARS) + '\n... (diff truncated for the reflection)';
  }
  return diff;
}

function buildPrompt(root, areas, diff) {
  const blocks = Object.keys(areas).sort().map(area => {
    const file = path.join(root, area === '.' ? '' : area, 'AGENTS.md');
    let content;
    try { content = fs.readFileSync(file, 'utf-8'); }
    catch { content = '(this area has no AGENTS.md yet)'; }
    return `### ${area}/AGENTS.md\n\n${content}`;
  });
  return `You are auditing whether a codebase's AGENTS.md files still match reality \
after a coding session. AGENTS.md is the canonical instruction file an AI coding \
agent loads for that part of the repo (CLAUDE.md just points at it).

Below is the git diff of the session's uncommitted changes, then the current \
AGENTS.md for every area that changed.

For EACH area, output exactly one of:
- \`No change needed\` — the AGENTS.md still holds; or
- a concrete proposed edit: the specific line(s) to add, change, or remove, plus \
one sentence on why. Apply it with /spk:prime <area>.

Then, separately, under a \`## Learnings\` heading, note any reusable decision, \
gotcha, or pattern this session produced that is worth capturing as a wiki \
learning via /spk:ingest — or write \`No learnings\` if none.

Only propose updates for genuine new conventions, gotchas, commands, or \
constraints the AGENTS.md does not yet capture. No stylistic rewrites. Be terse. \
Respond in plain text; do not use tools.

## Git diff (uncommitted work this session)

\`\`\`diff
${diff}
\`\`\`

## Current AGENTS.md file(s)

${blocks.join('\n\n')}
`;
}

// Call headless `claude -p`. Returns the reflection text, or null on failure.
function runClaude(prompt, root, env) {
  env = env || process.env;
  const childEnv = { ...env, [LOCK_ENV]: '1' }; // recursion guard for nested Stop hook
  const bin = env.SPK_REFLECT_CLAUDE_BIN || 'claude'; // overridable for tests
  let result;
  try {
    result = spawnSync(bin, ['-p', '--output-format', 'text'], {
      cwd: root, input: prompt, encoding: 'utf-8', timeout: CLAUDE_TIMEOUT_MS, env: childEnv
    });
  } catch {
    return null;
  }
  if (result.error || result.status !== 0) return null;
  return (result.stdout || '').trim() || null;
}

function deterministicNote(root, areas, stamp) {
  const lines = [
    `# Session reflect — ${stamp}`,
    '',
    '_`claude` CLI unavailable — deterministic fallback. The areas below changed ' +
      'this session; re-check their AGENTS.md by hand (/spk:prime) and capture any ' +
      'learning with /spk:ingest._',
    ''
  ];
  for (const area of Object.keys(areas).sort()) {
    const file = path.join(root, area === '.' ? '' : area, 'AGENTS.md');
    const count = areas[area];
    if (fs.existsSync(file)) {
      lines.push(`- **${area}** (${count} file(s)) — re-read \`${area}/AGENTS.md\`: do its conventions still hold?`);
    } else {
      lines.push(`- **${area}** (${count} file(s)) — no \`${area}/AGENTS.md\` exists; consider /spk:prime ${area}.`);
    }
  }
  return lines.join('\n') + '\n';
}

function reflect(env) {
  env = env || process.env;
  // Recursion guard: if we are already inside a reflection-spawned `claude`, do
  // nothing — this is what stops the Stop hook from looping forever.
  if (env[LOCK_ENV]) return 0;

  const root = projectRoot(env);
  const areas = touchedAreas(root);
  if (Object.keys(areas).length === 0) return 0;

  const diff = scopedDiff(root, areas);
  const stamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  let body, mode;
  const reflection = diff.trim() ? runClaude(buildPrompt(root, areas, diff), root, env) : null;
  if (reflection) {
    const list = Object.keys(areas).sort().join(', ');
    body = `# Session reflect — ${stamp}\n\n_Reflection by \`claude -p\` over ${Object.keys(areas).length} touched area(s): ${list}._\n\n${reflection}\n`;
    mode = 'LLM reflection';
  } else {
    body = deterministicNote(root, areas, stamp);
    mode = 'deterministic fallback';
  }

  const review = path.join(root, REVIEW_FILE);
  try {
    fs.mkdirSync(path.dirname(review), { recursive: true });
    fs.writeFileSync(review, body);
  } catch (exc) {
    process.stderr.write(`[session-reflect] could not write ${REVIEW_FILE}: ${exc}\n`);
    return 1;
  }
  process.stderr.write(`[session-reflect] wrote ${REVIEW_FILE} (${mode})\n`);
  return 0;
}

if (require.main === module) process.exit(reflect());

module.exports = {
  reflect, projectRoot, changedPaths, agentsAreas, areaOf, touchedAreas,
  scopedDiff, buildPrompt, deterministicNote, REVIEW_FILE, STATE_FILE, LOCK_ENV
};
