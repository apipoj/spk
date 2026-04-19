// spk/scripts/regenerate-docs.cjs
const fs = require('fs');
const path = require('path');

const MARKER_RE = /<!--\s+SPK-([A-Z-]+):start\s+-->([\s\S]*?)<!--\s+SPK-\1:end\s+-->/g;

function parseMarkers(text) {
  const blocks = [];
  let m;
  while ((m = MARKER_RE.exec(text)) !== null) {
    blocks.push({
      name: `SPK-${m[1]}`,
      start: m.index,
      end: m.index + m[0].length,
      inner: m[2]
    });
  }
  MARKER_RE.lastIndex = 0;
  return blocks;
}

function renderBlock(name, manifest) {
  switch (name) {
    case 'SPK-COUNTS': {
      const orch = manifest.agents.orchestrators.length;
      const spec = manifest.agents.specialists.length;
      const total = orch + spec;
      const cmds = manifest.commands.length;
      return `**${total} agents** (${orch} orchestrators + ${spec} specialists) · **${cmds} commands**`;
    }
    case 'SPK-AGENTS': {
      const rows = [
        '| Name | Role | Model | Color | Phase |',
        '|---|---|---|---|---|',
        ...manifest.agents.orchestrators.map(a =>
          `| \`${a.name}\` | orchestrator | ${a.model} | ${a.color} | ${a.phase} |`),
        ...manifest.agents.specialists.map(a =>
          `| \`${a.name}\` | specialist | ${a.model} | ${a.color} | ${a.phase} |`)
      ];
      return rows.join('\n');
    }
    case 'SPK-COMMANDS': {
      const rows = [
        '| Command | Dispatches to |',
        '|---|---|',
        ...manifest.commands.map(c => {
          const target = c.orchestrator || c.agent || '(no agent)';
          return `| \`${c.name}\` | ${target} |`;
        })
      ];
      return rows.join('\n');
    }
    default:
      return null;
  }
}

function regenerateContent(text, manifest) {
  return text.replace(MARKER_RE, (match, blockName) => {
    const fullName = `SPK-${blockName}`;
    const rendered = renderBlock(fullName, manifest);
    if (rendered === null) return match;
    return `<!-- ${fullName}:start -->\n${rendered}\n<!-- ${fullName}:end -->`;
  });
}

function listTargetFiles(rootDir) {
  const targets = [];
  const candidates = [
    'README.md',
    'CHANGELOG.md',
    'INSTALL_FOR_AGENTS.md',
    'RESOLVER.md'
  ];
  for (const rel of candidates) {
    const abs = path.join(rootDir, rel);
    if (fs.existsSync(abs)) targets.push(abs);
  }
  const docsDir = path.join(rootDir, 'docs');
  if (fs.existsSync(docsDir)) {
    for (const f of fs.readdirSync(docsDir)) {
      if (f.endsWith('.md')) targets.push(path.join(docsDir, f));
    }
  }
  return targets;
}

function main() {
  const args = process.argv.slice(2);
  const checkMode = args.includes('--check');
  const rootDir = path.join(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf-8'));
  const files = listTargetFiles(rootDir);

  let anyChanged = false;
  for (const file of files) {
    const original = fs.readFileSync(file, 'utf-8');
    const regenerated = regenerateContent(original, manifest);
    if (original !== regenerated) {
      anyChanged = true;
      if (checkMode) {
        console.error(`DRIFT: ${path.relative(rootDir, file)} is out of sync with manifest.json`);
      } else {
        fs.writeFileSync(file, regenerated);
        console.log(`Regenerated: ${path.relative(rootDir, file)}`);
      }
    }
  }

  if (checkMode && anyChanged) {
    console.error('\nRun `npm run regen` to update, then commit.');
    process.exit(1);
  }
  if (!anyChanged) console.log('All docs in sync with manifest.json');
}

if (require.main === module) main();

module.exports = { parseMarkers, regenerateContent, renderBlock, listTargetFiles };
