// scripts/verify-manifest-sync.cjs
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]+?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z-]+):\s*(.+)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

function collectVersionSyncErrors(rootDir = REPO_ROOT) {
  const errors = [];
  const manifest = readJson(path.join(rootDir, 'manifest.json'));
  const expected = manifest.version;
  const versionSources = [
    ['package.json', readJson(path.join(rootDir, 'package.json')).version],
    ['package-lock.json', readJson(path.join(rootDir, 'package-lock.json')).version],
    ['package-lock.json packages[""]', readJson(path.join(rootDir, 'package-lock.json')).packages?.['']?.version],
    ['plugins/spk/.claude-plugin/plugin.json', readJson(path.join(rootDir, 'plugins/spk/.claude-plugin/plugin.json')).version],
    ['.claude-plugin/marketplace.json plugins[0]', readJson(path.join(rootDir, '.claude-plugin/marketplace.json')).plugins?.[0]?.version],
  ];

  for (const [source, version] of versionSources) {
    if (version !== expected) {
      errors.push(`${source}: version mismatch (file=${version || '<missing>'} manifest=${expected})`);
    }
  }
  return errors;
}

function collectManifestSyncErrors(rootDir = REPO_ROOT) {
  const errors = [];
  const manifest = readJson(path.join(rootDir, 'manifest.json'));
  const pluginRoot = path.join(rootDir, 'plugins', 'spk');

  errors.push(...collectVersionSyncErrors(rootDir));

  const allAgents = [...manifest.agents.orchestrators, ...manifest.agents.specialists];
  const expectedAgents = new Set(allAgents.map(a => `${a.name}.md`));

  for (const agent of allAgents) {
    const file = path.join(pluginRoot, 'agents', `${agent.name}.md`);
    if (!fs.existsSync(file)) {
      errors.push(`MISSING agent file: plugins/spk/agents/${agent.name}.md`);
      continue;
    }
    const fm = parseFrontmatter(fs.readFileSync(file, 'utf-8'));
    if (!fm) {
      errors.push(`plugins/spk/agents/${agent.name}.md: missing or malformed frontmatter`);
      continue;
    }
    for (const field of ['name', 'model', 'color']) {
      if (fm[field] !== agent[field]) {
        errors.push(`plugins/spk/agents/${agent.name}.md: ${field} mismatch (file=${fm[field]} manifest=${agent[field]})`);
      }
    }
    if (!fm.description) errors.push(`plugins/spk/agents/${agent.name}.md: missing description`);
  }

  const agentsDir = path.join(pluginRoot, 'agents');
  const actualAgents = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
    : [];
  for (const f of actualAgents) {
    if (!expectedAgents.has(f)) errors.push(`ORPHAN agent file: plugins/spk/agents/${f} (not in manifest)`);
  }

  for (const cmd of manifest.commands) {
    const slug = cmd.name.replace(/^\//, '');
    const file = path.join(pluginRoot, 'skills', slug, 'SKILL.md');
    if (!fs.existsSync(file)) errors.push(`MISSING skill file: plugins/spk/skills/${slug}/SKILL.md`);
  }

  const skillsDir = path.join(pluginRoot, 'skills');
  const skillDirs = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name)
    : [];
  const expectedSlugs = new Set(manifest.commands.map(c => c.name.replace(/^\//, '')));
  for (const dir of skillDirs) {
    if (!expectedSlugs.has(dir)) errors.push(`ORPHAN skill dir: plugins/spk/skills/${dir}/ (not in manifest)`);
  }

  return errors;
}

function main() {
  const errors = collectManifestSyncErrors(REPO_ROOT);
  if (errors.length) {
    console.error('Manifest sync FAILED:');
    errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }

  const manifest = readJson(path.join(REPO_ROOT, 'manifest.json'));
  const allAgents = [...manifest.agents.orchestrators, ...manifest.agents.specialists];
  console.log(`Manifest sync OK (${allAgents.length} subagents, ${manifest.commands.length} skills, version ${manifest.version})`);
}

if (require.main === module) main();

module.exports = {
  collectManifestSyncErrors,
  collectVersionSyncErrors,
  parseFrontmatter,
};
