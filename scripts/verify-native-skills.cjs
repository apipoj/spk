// scripts/verify-native-skills.cjs
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const NATIVE_SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'manifest.json'), 'utf-8'));

const FORBIDDEN_TOKENS = [
  'Task(',
  'Task (',
  'subagent_type',
  'subagent',
  'subagents',
  'spk:',
  'plugin',
  'plugins',
  'plugin install',
  'plugin marketplace',
  '/plugin ',
];

// Thai content signal: at least one Thai character range
const THAI_CHAR_RE = /[\u0E00-\u0E7F]/;

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

function checkForbiddenTokens(content, filePath) {
  const hits = [];
  const lines = content.split('\n');
  for (const token of FORBIDDEN_TOKENS) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(token)) {
        hits.push({ line: i + 1, token, text: lines[i].trim() });
      }
    }
  }
  return hits;
}

function main() {
  const errors = [];
  const warnings = [];

  // Collect expected slugs from manifest, prefixed with spk-
  const expectedSlugs = new Set(MANIFEST.commands.map(c => 'spk-' + c.name.replace(/^\//, '')));

  // Check native skills directory exists
  if (!fs.existsSync(NATIVE_SKILLS_DIR)) {
    errors.push('Native skills directory does not exist: skills/');
    process.exit(1);
  }

  // List actual native skill directories (excluding .gitkeep)
  const actualDirs = fs.readdirSync(NATIVE_SKILLS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  // Check each manifest command has a native skill
  for (const slug of expectedSlugs) {
    const skillFile = path.join(NATIVE_SKILLS_DIR, slug, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
      errors.push(`MISSING native skill: skills/${slug}/SKILL.md (required by manifest command /${slug.replace(/^spk-/, '')})`);
      continue;
    }

    const content = fs.readFileSync(skillFile, 'utf-8');
    const fm = parseFrontmatter(content);

    // Check frontmatter
    if (!fm) {
      errors.push(`skills/${slug}/SKILL.md: missing or malformed frontmatter`);
      continue;
    }
    if (!fm.description) {
      errors.push(`skills/${slug}/SKILL.md: missing description in frontmatter`);
    }

    // Check Thai content signal (body must contain Thai characters)
    const body = content.replace(/^---\n[\s\S]+?\n---/, '');
    if (!THAI_CHAR_RE.test(body)) {
      errors.push(`skills/${slug}/SKILL.md: body lacks Thai content signal — native skills must be written in Thai`);
    }

    // Check forbidden tokens (plugin/subagent dependencies)
    const hits = checkForbiddenTokens(content, skillFile);
    if (hits.length > 0) {
      for (const hit of hits) {
        errors.push(`skills/${slug}/SKILL.md:${hit.line}: forbidden token "${hit.token}" — native skills must not depend on plugins or subagents`);
      }
    }
  }

  // Check for orphan native skill directories
  for (const dir of actualDirs) {
    if (!expectedSlugs.has(dir)) {
      warnings.push(`ORPHAN native skill dir: skills/${dir}/ (not in manifest commands)`);
    }
  }

  // Print results
  if (warnings.length) {
    console.warn('Warnings:');
    warnings.forEach(w => console.warn('  -', w));
  }

  if (errors.length) {
    console.error('Native skills verification FAILED:');
    errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }

  console.log(`Native skills OK (${expectedSlugs.size} skills verified, Thai content OK, no forbidden tokens)`);
}

if (require.main === module) main();

module.exports = { parseFrontmatter, checkForbiddenTokens, FORBIDDEN_TOKENS, THAI_CHAR_RE };
