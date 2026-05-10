// tests/native-skills.test.js
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const NATIVE_SKILLS_DIR = path.join(REPO_ROOT, 'skills');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'manifest.json'), 'utf-8'));

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

const FORBIDDEN_TOKENS = [
  'Task(', 'Task (', 'subagent_type', 'subagent', 'subagents', 'spk:', 'plugin', 'plugins',
  'plugin install', 'plugin marketplace', '/plugin ',
];

// Thai content signal: at least one Thai character range
const THAI_CHAR_RE = /[\u0E00-\u0E7F]/;

// Expected native skill dirs are spk-prefixed versions of manifest commands
const expectedSlugs = MANIFEST.commands.map(c => 'spk-' + c.name.replace(/^\//, ''));

describe('native skills', () => {
  test('native skills directory exists', () => {
    expect(fs.existsSync(NATIVE_SKILLS_DIR)).toBe(true);
  });

  test.each(expectedSlugs)('/%s has a native SKILL.md', (slug) => {
    const skillFile = path.join(NATIVE_SKILLS_DIR, slug, 'SKILL.md');
    expect(fs.existsSync(skillFile)).toBe(true);
  });

  test.each(expectedSlugs)('/%s SKILL.md has valid frontmatter', (slug) => {
    const skillFile = path.join(NATIVE_SKILLS_DIR, slug, 'SKILL.md');
    const content = fs.readFileSync(skillFile, 'utf-8');
    const fm = parseFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm.description).toBeTruthy();
  });

  test.each(expectedSlugs)('/%s SKILL.md body contains Thai content', (slug) => {
    const skillFile = path.join(NATIVE_SKILLS_DIR, slug, 'SKILL.md');
    const content = fs.readFileSync(skillFile, 'utf-8');
    // Strip frontmatter to check body only
    const body = content.replace(/^---\n[\s\S]+?\n---/, '');
    expect(body).toMatch(THAI_CHAR_RE);
  });

  test.each(expectedSlugs)('/%s SKILL.md has no forbidden tokens (no plugin/subagent deps)', (slug) => {
    const skillFile = path.join(NATIVE_SKILLS_DIR, slug, 'SKILL.md');
    const content = fs.readFileSync(skillFile, 'utf-8');
    for (const token of FORBIDDEN_TOKENS) {
      expect(content).not.toContain(token);
    }
  });

  test('no orphan native skill directories', () => {
    const expected = new Set(expectedSlugs);
    const actual = fs.readdirSync(NATIVE_SKILLS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);
    for (const dir of actual) {
      expect(expected.has(dir)).toBe(true);
    }
  });
});
