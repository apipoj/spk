// tests/wiki-secret-scan.test.js
const { shouldBlock } = require('../plugins/spk/scripts/wiki-secret-scan.cjs');

describe('wiki-secret-scan', () => {
  test('allows non-wiki paths even with secrets', () => {
    const result = shouldBlock({
      tool_name: 'Write',
      tool_input: { file_path: '/proj/.env', content: 'API_KEY=sk-abc123xyz789verylongsecretkey1234' }
    });
    expect(result.block).toBe(false);
  });

  test('blocks wiki write with OpenAI key', () => {
    const result = shouldBlock({
      tool_name: 'Write',
      tool_input: {
        file_path: '/proj/ai_context/wiki/entities/service.md',
        content: '# Service\n\napi: sk-abc123xyz789verylongsecretkey1234'
      }
    });
    expect(result.block).toBe(true);
    expect(result.reason).toMatch(/secret/i);
  });

  test('allows clean wiki write', () => {
    const result = shouldBlock({
      tool_name: 'Write',
      tool_input: {
        file_path: '/proj/ai_context/wiki/entities/service.md',
        content: '# Service\n\nA friendly description.'
      }
    });
    expect(result.block).toBe(false);
  });

  test('allows redacted placeholder', () => {
    const result = shouldBlock({
      tool_name: 'Write',
      tool_input: {
        file_path: '/proj/ai_context/wiki/entities/service.md',
        content: 'api: <REDACTED:openai_api_key origin=sources/x.md:12>'
      }
    });
    expect(result.block).toBe(false);
  });

  test('ignores non-Write tools', () => {
    const result = shouldBlock({
      tool_name: 'Read',
      tool_input: { file_path: '/proj/ai_context/wiki/x.md' }
    });
    expect(result.block).toBe(false);
  });

  test('Edit tool on wiki also scanned', () => {
    const result = shouldBlock({
      tool_name: 'Edit',
      tool_input: {
        file_path: '/proj/ai_context/wiki/concepts/auth.md',
        old_string: 'x',
        new_string: 'api=ghp_abcdefghijklmnopqrstuvwxyz0123456789'
      }
    });
    expect(result.block).toBe(true);
  });
});
