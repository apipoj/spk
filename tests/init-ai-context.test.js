// tests/init-ai-context.test.js
const { runInit, needsScaffold } = require('../plugins/spk/scripts/init-ai-context.cjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

function makeTmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spk-init-'));
}

function makePluginRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-pluginroot-'));
  fs.mkdirSync(path.join(dir, 'templates/ai_context/wiki'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'templates/ai_context/sources'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'templates/ai_context/wiki/SCHEMA.md'), 'SCHEMA v3.1.0');
  fs.writeFileSync(path.join(dir, 'templates/ai_context/wiki/index.md'), 'INDEX');
  fs.writeFileSync(path.join(dir, 'templates/ai_context/wiki/log.md'), 'LOG');
  fs.writeFileSync(path.join(dir, 'templates/ai_context/sources/.gitkeep'), '');
  return dir;
}

describe('init-ai-context', () => {
  test('scaffolds when wiki absent', () => {
    const proj = makeTmpProject();
    const plugin = makePluginRoot();
    const result = runInit(proj, plugin, '3.1.0');
    expect(result.scaffolded).toBe(true);
    expect(fs.existsSync(path.join(proj, 'ai_context/wiki/SCHEMA.md'))).toBe(true);
    expect(fs.existsSync(path.join(proj, 'ai_context/wiki/index.md'))).toBe(true);
    expect(fs.existsSync(path.join(proj, 'ai_context/sources/.gitkeep'))).toBe(true);
  });

  test('idempotent — no-op when already scaffolded and version matches', () => {
    const proj = makeTmpProject();
    const plugin = makePluginRoot();
    runInit(proj, plugin, '3.1.0');
    const result = runInit(proj, plugin, '3.1.0');
    expect(result.scaffolded).toBe(false);
  });

  test('re-scaffolds SCHEMA.md on version bump', () => {
    const proj = makeTmpProject();
    const plugin = makePluginRoot();
    runInit(proj, plugin, '3.1.0');
    fs.writeFileSync(path.join(plugin, 'templates/ai_context/wiki/SCHEMA.md'), 'SCHEMA v3.2.0');
    const result = runInit(proj, plugin, '3.2.0');
    expect(result.scaffolded).toBe(true);
    const contents = fs.readFileSync(path.join(proj, 'ai_context/wiki/SCHEMA.md'), 'utf-8');
    expect(contents).toMatch(/v3\.2\.0/);
  });

  test('preserves user-authored wiki pages on version bump', () => {
    const proj = makeTmpProject();
    const plugin = makePluginRoot();
    runInit(proj, plugin, '3.1.0');
    fs.mkdirSync(path.join(proj, 'ai_context/wiki/entities'), { recursive: true });
    fs.writeFileSync(path.join(proj, 'ai_context/wiki/entities/my-service.md'), 'user content');
    runInit(proj, plugin, '3.2.0');
    expect(fs.readFileSync(path.join(proj, 'ai_context/wiki/entities/my-service.md'), 'utf-8')).toBe('user content');
  });
});
