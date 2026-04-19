// scripts/install/uninstall.cjs
// Remove SPK from a project. Preserves user data (wiki, sources, custom agents/commands).

'use strict';

const fs = require('fs');
const path = require('path');

const SPK_HOOKS = [
  '.claude/hooks/PreToolUse/wiki-secret-scan.cjs',
  '.claude/hooks/PreToolUse/gitignore-guard.cjs',
  '.claude/hooks/PostToolUse/auto-ingest.cjs'
];

function stripSpkMarkers(content) {
  return content.replace(/\n?<!-- SPK:start -->[\s\S]*?<!-- SPK:end -->\n?/g, '\n');
}

function safeRm(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true, force: true });
    return true;
  }
  return false;
}

function uninstall(projectRoot) {
  const manifestPath = path.join(projectRoot, '.spk/manifest.json');
  let removed = 0;

  if (!fs.existsSync(manifestPath)) {
    return { removed: 0, reason: 'No .spk/manifest.json — nothing to uninstall' };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Remove manifest-tracked agents
  const allAgents = [
    ...(manifest.agents?.orchestrators || []),
    ...(manifest.agents?.specialists || [])
  ];
  for (const a of allAgents) {
    if (safeRm(path.join(projectRoot, `.claude/agents/${a.name}.md`))) removed++;
  }

  // Remove manifest-tracked commands
  for (const c of (manifest.commands || [])) {
    const slug = c.name.replace(/^\//, '');
    if (safeRm(path.join(projectRoot, `.claude/commands/${slug}.md`))) removed++;
  }

  // Remove known SPK hooks
  for (const h of SPK_HOOKS) {
    if (safeRm(path.join(projectRoot, h))) removed++;
  }

  // Remove .spk/ directory entirely
  if (safeRm(path.join(projectRoot, '.spk'))) removed++;

  // Strip SPK block from CLAUDE.md if present
  const claudeMd = path.join(projectRoot, 'CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    const original = fs.readFileSync(claudeMd, 'utf-8');
    const stripped = stripSpkMarkers(original);
    if (original !== stripped) {
      fs.writeFileSync(claudeMd, stripped);
      removed++;
    }
  }

  return { removed, preserved: ['ai_context/wiki/', 'ai_context/sources/'] };
}

function main() {
  const root = process.argv[2] || process.cwd();
  const result = uninstall(root);
  console.log(`Uninstall complete: ${result.removed} items removed`);
  if (result.preserved) {
    console.log('Preserved (user data):');
    result.preserved.forEach(p => console.log('  -', p));
  }
}

if (require.main === module) main();

module.exports = { uninstall, stripSpkMarkers };
