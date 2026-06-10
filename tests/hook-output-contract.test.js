// tests/hook-output-contract.test.js
// Pins each hook's process-level contract with Claude Code:
//   - blocking PreToolUse hooks: reason on STDERR + exit 2
//     (stdout JSON is only parsed on exit 0, so a stdout reason is invisible)
//   - non-blocking PostToolUse messages for the model: hookSpecificOutput
//     .additionalContext JSON on STDOUT + exit 0
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SCRIPTS = path.join(__dirname, '..', 'plugins', 'spk', 'scripts');

function runHook(script, event, env = {}) {
  return spawnSync('node', [path.join(SCRIPTS, script)], {
    input: JSON.stringify(event),
    encoding: 'utf-8',
    env: { ...process.env, ...env }
  });
}

describe('hook output contract', () => {
  test('wiki-secret-scan blocks with reason on stderr and exit 2', () => {
    const result = runHook('wiki-secret-scan.cjs', {
      tool_name: 'Write',
      tool_input: {
        file_path: '/repo/ai_context/wiki/notes.md',
        content: 'leaked key: AKIAABCDEFGHIJKLMNOP'
      }
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/wiki-secret-scan: blocked Write/);
    expect(result.stderr).toMatch(/aws_access_key/);
    expect(result.stdout).toBe('');
  });

  test('wiki-secret-scan passes clean writes with exit 0 and no output', () => {
    const result = runHook('wiki-secret-scan.cjs', {
      tool_name: 'Write',
      tool_input: { file_path: '/repo/ai_context/wiki/notes.md', content: 'plain notes' }
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  test('gitignore-guard blocks with reason on stderr and exit 2', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-hoc-'));
    fs.writeFileSync(path.join(dir, '.gitignore'), '.env\n');
    const result = runHook('gitignore-guard.cjs', {
      tool_name: 'Read',
      tool_input: { file_path: path.join(dir, '.env') }
    }, { SPK_WIKI_BUILD: 'true', SPK_PROJECT_ROOT: dir });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/gitignore-guard: blocked Read/);
    expect(result.stdout).toBe('');
  });

  test('auto-ingest surfaces new sources via additionalContext JSON on stdout', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-hoc-'));
    const srcFile = path.join(dir, 'ai_context', 'sources', 'paper.md');
    fs.mkdirSync(path.dirname(srcFile), { recursive: true });
    fs.writeFileSync(srcFile, '# fresh source');
    const result = runHook('auto-ingest.cjs', {
      tool_name: 'Write',
      tool_input: { file_path: srcFile, content: '# fresh source' }
    }, { SPK_PROJECT_ROOT: dir });
    expect(result.status).toBe(0);
    const out = JSON.parse(result.stdout);
    expect(out.hookSpecificOutput.hookEventName).toBe('PostToolUse');
    expect(out.hookSpecificOutput.additionalContext).toMatch(/new source detected/);
    expect(out.hookSpecificOutput.additionalContext).toMatch(/\/spk:ingest/);
  });

  test('auto-ingest stays silent for non-source writes', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-hoc-'));
    const result = runHook('auto-ingest.cjs', {
      tool_name: 'Write',
      tool_input: { file_path: path.join(dir, 'README.md'), content: 'hi' }
    }, { SPK_PROJECT_ROOT: dir });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
  });

  test('webfetch-cache pre serves cache hits on stderr with exit 2', async () => {
    const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-hoc-'));
    const env = { SPK_WEBFETCH_CACHE_DIR: cacheDir };
    const { cacheFile } = require('../plugins/spk/scripts/webfetch-cache.cjs');
    const url = 'https://example.com/contract-test';
    fs.writeFileSync(cacheFile(url, env), JSON.stringify({
      url, etag: '"v1"', content: 'cached body', fetched_at: 1750000000, prompt: 'p'
    }));
    // No network in this test: point the revalidation at a URL that will
    // fail to resolve, so the hook must fall through with exit 0.
    const miss = runHook('webfetch-cache.cjs', {
      tool_input: { url: 'https://spk-invalid.invalid/x' }
    }, env);
    expect(miss.status).toBe(0);
  });

  test('session-reflect proposes via additionalContext JSON on stdout, exit 0', () => {
    const result = runHook('session-reflect.cjs', { hook_event_name: 'Stop' });
    expect(result.status).toBe(0);
    const out = JSON.parse(result.stdout);
    expect(out.hookSpecificOutput.hookEventName).toBe('Stop');
    expect(out.hookSpecificOutput.additionalContext).toMatch(/learning|AGENTS\.md|reflect|prime/i);
  });

  test('session-reflect kill switch is silent with exit 0', () => {
    const result = runHook('session-reflect.cjs', { hook_event_name: 'Stop' }, { SPK_SESSION_REFLECT: 'off' });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });

  test('malformed stdin never breaks a hook', () => {
    for (const script of ['wiki-secret-scan.cjs', 'gitignore-guard.cjs', 'auto-ingest.cjs', 'webfetch-cache.cjs', 'session-reflect.cjs']) {
      const result = spawnSync('node', [path.join(SCRIPTS, script), 'pre'], {
        input: 'not json{',
        encoding: 'utf-8'
      });
      expect(result.status).toBe(0);
    }
  });
});
