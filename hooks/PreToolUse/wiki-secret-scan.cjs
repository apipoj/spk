// hooks/PreToolUse/wiki-secret-scan.cjs
// Layer 2 of SPK's 5-layer wiki security: blocks Write/Edit to ai_context/wiki/**
// when the content contains secret-shaped strings.

const { scanForSecrets } = require('../../scripts/secret-scanner.cjs');

function isWikiPath(filePath) {
  if (!filePath) return false;
  const norm = filePath.replace(/\\/g, '/');
  return norm.includes('/ai_context/wiki/');
}

function extractContent(toolName, toolInput) {
  if (toolName === 'Write') return toolInput && toolInput.content;
  if (toolName === 'Edit') return toolInput && toolInput.new_string;
  return null;
}

function shouldBlock(event) {
  const { tool_name, tool_input } = event || {};
  if (tool_name !== 'Write' && tool_name !== 'Edit') return { block: false };
  if (!tool_input || !isWikiPath(tool_input.file_path)) return { block: false };

  const content = extractContent(tool_name, tool_input);
  if (!content) return { block: false };

  const findings = scanForSecrets(content);
  if (findings.length === 0) return { block: false };

  const summary = findings.map(f => `${f.type} at line ${f.line}`).join('; ');
  return {
    block: true,
    reason: `wiki-secret-scan: blocked ${tool_name} to ${tool_input.file_path} — detected ${findings.length} secret pattern(s): ${summary}`
  };
}

function main() {
  let raw = '';
  process.stdin.on('data', chunk => { raw += chunk; });
  process.stdin.on('end', () => {
    let event;
    try {
      event = JSON.parse(raw || '{}');
    } catch {
      process.exit(0);
    }
    const result = shouldBlock(event);
    if (result.block) {
      process.stdout.write(JSON.stringify({ decision: 'block', reason: result.reason }) + '\n');
      process.exit(2);
    }
    process.exit(0);
  });
}

if (require.main === module) main();

module.exports = { shouldBlock, isWikiPath };
