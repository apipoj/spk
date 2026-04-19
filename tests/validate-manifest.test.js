// spk/tests/validate-manifest.test.js
const { validateManifest } = require('../scripts/validate-manifest.cjs');

describe('validateManifest', () => {
  const validManifest = {
    version: '3.0.0',
    released: '2026-04-19',
    brand: 'AI Sprint Kit',
    slug: 'spk',
    tagline: 'Autonomous development via Claude Code subscription',
    agents: {
      orchestrators: [
        { name: 'plan-orchestrator', model: 'claude-opus-4-7', color: 'green', phase: 'planning' }
      ],
      specialists: [
        { name: 'planner', model: 'claude-opus-4-7', color: 'green', phase: 'planning' }
      ]
    },
    commands: [
      { name: '/spk-plan', orchestrator: 'plan-orchestrator' }
    ]
  };

  test('valid manifest passes', () => {
    const result = validateManifest(validManifest);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('rejects alias model IDs', () => {
    const bad = JSON.parse(JSON.stringify(validManifest));
    bad.agents.specialists[0].model = 'opus';
    const result = validateManifest(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/model/);
  });

  test('rejects invalid color', () => {
    const bad = JSON.parse(JSON.stringify(validManifest));
    bad.agents.specialists[0].color = 'red';
    const result = validateManifest(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/color/);
  });

  test('rejects missing required field', () => {
    const bad = JSON.parse(JSON.stringify(validManifest));
    delete bad.version;
    const result = validateManifest(bad);
    expect(result.valid).toBe(false);
  });
});
