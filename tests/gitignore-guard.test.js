// tests/gitignore-guard.test.js
const { shouldBlock } = require('../hooks/PreToolUse/gitignore-guard.cjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

function makeRepo(gitignoreLines = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-gi-'));
  fs.writeFileSync(path.join(dir, '.gitignore'), gitignoreLines.join('\n'));
  return dir;
}

describe('gitignore-guard', () => {
  test('no-op when SPK_WIKI_BUILD is not set', () => {
    const dir = makeRepo(['.env']);
    const result = shouldBlock({
      tool_name: 'Read',
      tool_input: { file_path: path.join(dir, '.env') }
    }, { SPK_WIKI_BUILD: undefined, SPK_PROJECT_ROOT: dir });
    expect(result.block).toBe(false);
  });

  test('blocks Read of gitignored file during wiki-build', () => {
    const dir = makeRepo(['.env', 'private/']);
    const result = shouldBlock({
      tool_name: 'Read',
      tool_input: { file_path: path.join(dir, '.env') }
    }, { SPK_WIKI_BUILD: 'true', SPK_PROJECT_ROOT: dir });
    expect(result.block).toBe(true);
    expect(result.reason).toMatch(/gitignore/i);
  });

  test('allows read of non-gitignored file during wiki-build', () => {
    const dir = makeRepo(['.env']);
    const result = shouldBlock({
      tool_name: 'Read',
      tool_input: { file_path: path.join(dir, 'README.md') }
    }, { SPK_WIKI_BUILD: 'true', SPK_PROJECT_ROOT: dir });
    expect(result.block).toBe(false);
  });

  test('exempts ai_context/sources/ even if gitignored', () => {
    const dir = makeRepo(['ai_context/sources/', '.env']);
    fs.mkdirSync(path.join(dir, 'ai_context/sources'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'ai_context/sources/file.md'), 'hello');
    const result = shouldBlock({
      tool_name: 'Read',
      tool_input: { file_path: path.join(dir, 'ai_context/sources/file.md') }
    }, { SPK_WIKI_BUILD: 'true', SPK_PROJECT_ROOT: dir });
    expect(result.block).toBe(false);
  });

  test('ignores non-read tools', () => {
    const dir = makeRepo(['.env']);
    const result = shouldBlock({
      tool_name: 'Write',
      tool_input: { file_path: path.join(dir, '.env'), content: 'X=1' }
    }, { SPK_WIKI_BUILD: 'true', SPK_PROJECT_ROOT: dir });
    expect(result.block).toBe(false);
  });

  test('blocks Grep and Glob when SPK_WIKI_BUILD set and path gitignored', () => {
    const dir = makeRepo(['private/']);
    fs.mkdirSync(path.join(dir, 'private'), { recursive: true });
    const grep = shouldBlock({
      tool_name: 'Grep',
      tool_input: { path: path.join(dir, 'private') }
    }, { SPK_WIKI_BUILD: 'true', SPK_PROJECT_ROOT: dir });
    expect(grep.block).toBe(true);

    const glob = shouldBlock({
      tool_name: 'Glob',
      tool_input: { path: path.join(dir, 'private') }
    }, { SPK_WIKI_BUILD: 'true', SPK_PROJECT_ROOT: dir });
    expect(glob.block).toBe(true);
  });
});
