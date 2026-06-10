// tests/primer-contract.test.js
// Pins the primer agent's context-file template to the hierarchy-upgrade
// contract: every generated AGENTS.md must carry a scoped-commands section,
// a code-navigation section (pointing at SPK's own search MCP with a grep
// fallback), and emit a .claudeignore.
const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', 'plugins', 'spk', 'agents');
const PLUGIN_SKILLS = path.join(__dirname, '..', 'plugins', 'spk', 'skills');
const NATIVE_SKILLS = path.join(__dirname, '..', 'skills');

const primer = fs.readFileSync(path.join(AGENTS_DIR, 'primer.md'), 'utf-8');

describe('primer hierarchy-upgrade contract', () => {
  test('primer template includes scoped commands + code navigation sections', () => {
    expect(primer).toMatch(/## Scoped Commands/);
    expect(primer).toMatch(/## Code Navigation/);
  });

  test('primer instructs emitting a .claudeignore', () => {
    expect(primer).toMatch(/\.claudeignore/);
  });

  test('code-navigation block points at spk-codebase-search with grep fallback', () => {
    expect(primer).toMatch(/spk-codebase-search|codebase-search/i);
    expect(primer).toMatch(/fall ?back|when (?:absent|unavailable)|Grep/i);
  });

  test('prime SKILL dispatch prompts mention the new sections', () => {
    const en = fs.readFileSync(path.join(PLUGIN_SKILLS, 'prime', 'SKILL.md'), 'utf-8');
    const th = fs.readFileSync(path.join(NATIVE_SKILLS, 'spk-prime', 'SKILL.md'), 'utf-8');
    expect(en).toMatch(/Scoped Commands|Code Navigation|\.claudeignore/);
    expect(th).toMatch(/Scoped Commands|Code Navigation|\.claudeignore/);
  });
});
