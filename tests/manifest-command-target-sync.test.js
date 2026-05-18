// tests/manifest-command-target-sync.test.js
const fs = require('fs');
const path = require('path');
const os = require('os');

const { collectManifestSyncErrors } = require('../scripts/verify-manifest-sync.cjs');

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function writeAgent(root, name, model = 'claude-sonnet-4-6', color = 'green') {
  writeText(path.join(root, `plugins/spk/agents/${name}.md`), `---\nname: ${name}\ndescription: ${name} agent\nmodel: ${model}\ncolor: ${color}\n---\n# ${name}\n`);
}

function writeSkill(root, name) {
  writeText(path.join(root, `plugins/spk/skills/${name}/SKILL.md`), `---\ndescription: ${name} command\n---\n# /spk:${name}\n`);
}

function makeFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-command-target-sync-'));
  const version = '3.1.4';
  writeJson(path.join(root, 'manifest.json'), {
    version,
    agents: {
      orchestrators: [{ name: 'plan-orchestrator', model: 'claude-opus-4-7', color: 'green' }],
      specialists: [{ name: 'planner', model: 'claude-sonnet-4-6', color: 'green' }],
    },
    commands: [
      { name: '/plan', orchestrator: 'plan-orchestrator' },
      { name: '/sunzi', agent: 'planner' },
    ],
  });
  writeJson(path.join(root, 'package.json'), { version });
  writeJson(path.join(root, 'package-lock.json'), { version, packages: { '': { version } } });
  writeJson(path.join(root, 'plugins/spk/.claude-plugin/plugin.json'), { version });
  writeJson(path.join(root, '.claude-plugin/marketplace.json'), { plugins: [{ name: 'spk', version }] });
  writeAgent(root, 'plan-orchestrator', 'claude-opus-4-7', 'green');
  writeAgent(root, 'planner', 'claude-sonnet-4-6', 'green');
  writeSkill(root, 'plan');
  writeSkill(root, 'sunzi');
  return root;
}

describe('manifest command target sync', () => {
  test('passes when commands point to registered orchestrators or specialists', () => {
    const root = makeFixtureRoot();
    try {
      expect(collectManifestSyncErrors(root)).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('reports commands pointing to missing orchestrators or specialists', () => {
    const root = makeFixtureRoot();
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf-8'));
      manifest.commands = [
        { name: '/plan', orchestrator: 'missing-orchestrator' },
        { name: '/sunzi', agent: 'ghost-specialist' },
      ];
      writeJson(path.join(root, 'manifest.json'), manifest);

      const errors = collectManifestSyncErrors(root);
      expect(errors).toEqual(expect.arrayContaining([
        'manifest command /plan: unknown orchestrator "missing-orchestrator"',
        'manifest command /sunzi: unknown agent "ghost-specialist"',
      ]));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
