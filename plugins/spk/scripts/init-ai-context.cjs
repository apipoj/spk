// plugins/spk/scripts/init-ai-context.cjs
// SessionStart hook: scaffold ai_context/ templates into user's project.
// Idempotent via version marker file.

const fs = require('fs');
const path = require('path');

const VERSION_MARKER = '.spk-version';
const MANAGED_FILES = [
  'ai_context/wiki/SCHEMA.md',
  'ai_context/wiki/index.md',
  'ai_context/wiki/log.md',
  'ai_context/sources/.gitkeep'
];

function readMarker(projectRoot) {
  const p = path.join(projectRoot, 'ai_context', VERSION_MARKER);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8').trim();
}

function writeMarker(projectRoot, version) {
  const dir = path.join(projectRoot, 'ai_context');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, VERSION_MARKER), version);
}

function needsScaffold(projectRoot, currentVersion) {
  const marker = readMarker(projectRoot);
  if (marker === null) return true;
  return marker !== currentVersion;
}

function copyRecursive(src, dest, managed) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry), managed);
    }
  } else {
    const destProjectRel = dest.split(path.sep + 'ai_context' + path.sep);
    const relFromProject = destProjectRel.length > 1
      ? 'ai_context/' + destProjectRel[destProjectRel.length - 1].replace(/\\/g, '/')
      : null;
    if (fs.existsSync(dest) && relFromProject && managed.indexOf(relFromProject) === -1) {
      return;
    }
    fs.copyFileSync(src, dest);
  }
}

function runInit(projectRoot, pluginRoot, pluginVersion) {
  if (!needsScaffold(projectRoot, pluginVersion)) {
    return { scaffolded: false, reason: 'already on version ' + pluginVersion };
  }
  const src = path.join(pluginRoot, 'templates', 'ai_context');
  const dest = path.join(projectRoot, 'ai_context');
  if (!fs.existsSync(src)) {
    return { scaffolded: false, reason: 'plugin has no templates/ai_context/' };
  }
  copyRecursive(src, dest, MANAGED_FILES);
  writeMarker(projectRoot, pluginVersion);
  return { scaffolded: true, version: pluginVersion };
}

function main() {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;
  const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (!pluginRoot) return;

  let version = '0.0.0';
  try {
    const pj = JSON.parse(fs.readFileSync(path.join(pluginRoot, '.claude-plugin', 'plugin.json'), 'utf-8'));
    version = pj.version || version;
  } catch {
    // ignore
  }

  const result = runInit(projectRoot, pluginRoot, version);
  if (result.scaffolded) {
    process.stderr.write(`[SPK] scaffolded ai_context/ for v${version}\n`);
  }
}

if (require.main === module) main();

module.exports = { runInit, needsScaffold, readMarker, writeMarker };
