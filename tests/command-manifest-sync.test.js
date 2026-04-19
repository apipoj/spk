// tests/command-manifest-sync.test.js
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'manifest.json'), 'utf-8'));

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

describe('command manifest sync', () => {
  test.each(manifest.commands.map(c => [c.name, c]))('%s has matching .md file', (name, cmd) => {
    const slug = name.replace(/^\//, '');
    const file = path.join(REPO_ROOT, 'commands', `${slug}.md`);
    expect(fs.existsSync(file)).toBe(true);

    const content = fs.readFileSync(file, 'utf-8');
    const fm = parseFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm.description).toBeTruthy();
  });

  test('no orphan .md files in commands/', () => {
    const expected = new Set(manifest.commands.map(c => c.name.replace(/^\//, '') + '.md'));
    const actual = fs.readdirSync(path.join(REPO_ROOT, 'commands')).filter(f => f.endsWith('.md'));
    for (const f of actual) {
      expect(expected.has(f)).toBe(true);
    }
  });
});
