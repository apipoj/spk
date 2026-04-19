// hooks/PostToolUse/auto-ingest.cjs
// Drop-to-ingest: when a file lands in ai_context/sources/, notify the user
// (idempotent via log.md hash check).
// Controlled by SPK_AUTO_INGEST env: "drop" (default) | "manual" | "full".

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function computeSourceHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function isInSourcesDir(filePath, root) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  return rel.startsWith('ai_context/sources/') && !rel.endsWith('.gitkeep');
}

function isAlreadyIngested(filePath, root) {
  const logFile = path.join(root, 'ai_context/wiki/log.md');
  if (!fs.existsSync(logFile)) return false;
  const log = fs.readFileSync(logFile, 'utf-8');
  const hash = computeSourceHash(filePath);
  return log.includes(`hash=${hash}`);
}

function shouldEnqueue(event, env) {
  env = env || process.env;
  const mode = env.SPK_AUTO_INGEST || 'drop';
  if (mode === 'manual' || mode === 'false') return { enqueue: false };

  const { tool_name, tool_input } = event || {};
  if (tool_name !== 'Write') return { enqueue: false };
  if (!tool_input || !tool_input.file_path) return { enqueue: false };

  const root = env.SPK_PROJECT_ROOT || process.cwd();
  if (!isInSourcesDir(tool_input.file_path, root)) return { enqueue: false };

  if (!fs.existsSync(tool_input.file_path)) return { enqueue: false };

  if (isAlreadyIngested(tool_input.file_path, root)) {
    return { enqueue: false, reason: 'already ingested (hash match in log.md)' };
  }

  return {
    enqueue: true,
    reason: `new source detected: ${tool_input.file_path}`,
    hash: computeSourceHash(tool_input.file_path)
  };
}

function main() {
  let raw = '';
  process.stdin.on('data', chunk => { raw += chunk; });
  process.stdin.on('end', () => {
    let event;
    try { event = JSON.parse(raw || '{}'); } catch { process.exit(0); }
    const result = shouldEnqueue(event);
    if (result.enqueue) {
      process.stderr.write(`[SPK auto-ingest] ${result.reason}. Run /spk:ingest to process.\n`);
    }
    process.exit(0);
  });
}

if (require.main === module) main();

module.exports = { shouldEnqueue, computeSourceHash, isInSourcesDir, isAlreadyIngested };
