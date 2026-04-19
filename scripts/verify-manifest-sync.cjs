// scripts/verify-manifest-sync.cjs
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'manifest.json'), 'utf-8'));
const PLUGIN_ROOT = path.join(REPO_ROOT, 'plugins', 'spk');

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

function main() {
  const errors = [];
  const allAgents = [...manifest.agents.orchestrators, ...manifest.agents.specialists];
  const expectedAgents = new Set(allAgents.map(a => `${a.name}.md`));

  for (const agent of allAgents) {
    const file = path.join(PLUGIN_ROOT, 'agents', `${agent.name}.md`);
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

  const actualAgents = fs.readdirSync(path.join(PLUGIN_ROOT, 'agents')).filter(f => f.endsWith('.md'));
  for (const f of actualAgents) {
    if (!expectedAgents.has(f)) errors.push(`ORPHAN agent file: plugins/spk/agents/${f} (not in manifest)`);
  }

  for (const cmd of manifest.commands) {
    const slug = cmd.name.replace(/^\//, '');
    const file = path.join(PLUGIN_ROOT, 'skills', slug, 'SKILL.md');
    if (!fs.existsSync(file)) errors.push(`MISSING skill file: plugins/spk/skills/${slug}/SKILL.md`);
  }

  const skillDirs = fs.existsSync(path.join(PLUGIN_ROOT, 'skills'))
    ? fs.readdirSync(path.join(PLUGIN_ROOT, 'skills'), { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name)
    : [];
  const expectedSlugs = new Set(manifest.commands.map(c => c.name.replace(/^\//, '')));
  for (const dir of skillDirs) {
    if (!expectedSlugs.has(dir)) errors.push(`ORPHAN skill dir: plugins/spk/skills/${dir}/ (not in manifest)`);
  }

  if (errors.length) {
    console.error('Manifest sync FAILED:');
    errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }
  console.log(`Manifest sync OK (${allAgents.length} agents, ${manifest.commands.length} commands)`);
}

if (require.main === module) main();
