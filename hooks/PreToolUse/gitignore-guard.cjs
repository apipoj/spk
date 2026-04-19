// hooks/PreToolUse/gitignore-guard.cjs
// Layer 5 of SPK's wiki security: during wiki-build (SPK_WIKI_BUILD=true),
// blocks Read/Grep/Glob on files matched by .gitignore.
// Exempts ai_context/sources/ (the designated ingest inbox).

const fs = require('fs');
const path = require('path');

function loadGitignorePatterns(root) {
  const file = path.join(root, '.gitignore');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

function matchesGitignore(filePath, patterns, root) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  for (const pat of patterns) {
    let p = pat;
    if (p.startsWith('/')) p = p.slice(1);
    const trailingSlash = p.endsWith('/');
    if (trailingSlash) p = p.slice(0, -1);

    if (trailingSlash) {
      if (rel === p || rel.startsWith(p + '/')) return true;
    } else {
      if (rel === p) return true;
      if (rel.endsWith('/' + p)) return true;
      const re = new RegExp('^' + p.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      if (re.test(rel) || re.test(path.basename(rel))) return true;
    }
  }
  return false;
}

function extractReadPath(toolName, toolInput) {
  if (!toolInput) return null;
  if (toolName === 'Read') return toolInput.file_path;
  if (toolName === 'Grep') return toolInput.path;
  if (toolName === 'Glob') return toolInput.path;
  return null;
}

function isExempt(filePath, root) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  return rel === 'ai_context/sources' || rel.startsWith('ai_context/sources/');
}

function shouldBlock(event, env) {
  env = env || process.env;
  if (env.SPK_WIKI_BUILD !== 'true') return { block: false };

  const { tool_name, tool_input } = event || {};
  if (!['Read', 'Grep', 'Glob'].includes(tool_name)) return { block: false };

  const target = extractReadPath(tool_name, tool_input);
  if (!target) return { block: false };

  const root = env.SPK_PROJECT_ROOT || process.cwd();
  if (isExempt(target, root)) return { block: false };

  const patterns = loadGitignorePatterns(root);
  if (!matchesGitignore(target, patterns, root)) return { block: false };

  return {
    block: true,
    reason: `gitignore-guard: blocked ${tool_name} of ${target} during wiki-build — path is in .gitignore. Wiki build must not read ignored content. Disable SPK_WIKI_BUILD for general agent work.`
  };
}

function main() {
  let raw = '';
  process.stdin.on('data', chunk => { raw += chunk; });
  process.stdin.on('end', () => {
    let event;
    try { event = JSON.parse(raw || '{}'); } catch { process.exit(0); }
    const result = shouldBlock(event);
    if (result.block) {
      process.stdout.write(JSON.stringify({ decision: 'block', reason: result.reason }) + '\n');
      process.exit(2);
    }
    process.exit(0);
  });
}

if (require.main === module) main();

module.exports = { shouldBlock, matchesGitignore, loadGitignorePatterns };
