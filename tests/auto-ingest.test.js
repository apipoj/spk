// tests/auto-ingest.test.js
const { shouldEnqueue, computeSourceHash, isAlreadyIngested } = require('../hooks/PostToolUse/auto-ingest.cjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

function makeTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-ai-'));
  fs.mkdirSync(path.join(dir, 'ai_context/sources'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'ai_context/wiki'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'ai_context/wiki/log.md'), '');
  return dir;
}

describe('auto-ingest', () => {
  test('ignores Write outside ai_context/sources', () => {
    const dir = makeTempProject();
    const result = shouldEnqueue({
      tool_name: 'Write',
      tool_input: { file_path: path.join(dir, 'README.md'), content: 'hi' }
    }, { SPK_PROJECT_ROOT: dir });
    expect(result.enqueue).toBe(false);
  });

  test('ignores non-Write tools', () => {
    const dir = makeTempProject();
    const result = shouldEnqueue({
      tool_name: 'Read',
      tool_input: { file_path: path.join(dir, 'ai_context/sources/x.md') }
    }, { SPK_PROJECT_ROOT: dir });
    expect(result.enqueue).toBe(false);
  });

  test('no-op when SPK_AUTO_INGEST is disabled', () => {
    const dir = makeTempProject();
    const file = path.join(dir, 'ai_context/sources/x.md');
    fs.writeFileSync(file, 'hello');
    const result = shouldEnqueue({
      tool_name: 'Write',
      tool_input: { file_path: file, content: 'hello' }
    }, { SPK_PROJECT_ROOT: dir, SPK_AUTO_INGEST: 'false' });
    expect(result.enqueue).toBe(false);
  });

  test('enqueues when Write hits ai_context/sources and auto-ingest ON', () => {
    const dir = makeTempProject();
    const file = path.join(dir, 'ai_context/sources/new-source.md');
    fs.writeFileSync(file, 'hello world');
    const result = shouldEnqueue({
      tool_name: 'Write',
      tool_input: { file_path: file, content: 'hello world' }
    }, { SPK_PROJECT_ROOT: dir, SPK_AUTO_INGEST: 'drop' });
    expect(result.enqueue).toBe(true);
    expect(result.reason).toMatch(/source/i);
  });

  test('idempotent — skips already-ingested file via log.md', () => {
    const dir = makeTempProject();
    const file = path.join(dir, 'ai_context/sources/x.md');
    fs.writeFileSync(file, 'hello');
    const hash = computeSourceHash(file);
    fs.writeFileSync(
      path.join(dir, 'ai_context/wiki/log.md'),
      `2026-04-19T12:00:00Z INGEST source=ai_context/sources/x.md hash=${hash}\n`
    );
    const result = shouldEnqueue({
      tool_name: 'Write',
      tool_input: { file_path: file, content: 'hello' }
    }, { SPK_PROJECT_ROOT: dir, SPK_AUTO_INGEST: 'drop' });
    expect(result.enqueue).toBe(false);
    expect(result.reason).toMatch(/already/i);
  });

  test('computeSourceHash is stable', () => {
    const dir = makeTempProject();
    const file = path.join(dir, 'ai_context/sources/x.md');
    fs.writeFileSync(file, 'content');
    const h1 = computeSourceHash(file);
    const h2 = computeSourceHash(file);
    expect(h1).toBe(h2);
    expect(typeof h1).toBe('string');
    expect(h1.length).toBeGreaterThan(10);
  });
});
