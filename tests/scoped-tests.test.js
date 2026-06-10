// tests/scoped-tests.test.js
const { mapToSuites, suitesForPath } = require('../scripts/scoped-tests.cjs');

describe('scoped-tests change-to-suite mapper', () => {
  test('script change maps to its sibling test', () => {
    expect(mapToSuites(['scripts/regenerate-docs.cjs']))
      .toContain('tests/regenerate-docs.test.js');
  });

  test('manifest change maps to sync + manifest suites', () => {
    const s = mapToSuites(['manifest.json']);
    expect(s).toEqual(expect.arrayContaining([
      'tests/manifest-version-sync.test.js',
      'tests/command-manifest-sync.test.js',
      'tests/validate-manifest.test.js',
    ]));
  });

  test('agent change maps to the agent suites', () => {
    const s = mapToSuites(['plugins/spk/agents/researcher.md']);
    expect(s).toEqual(expect.arrayContaining([
      'tests/agent-contracts.test.js',
      'tests/agent-manifest-sync.test.js',
    ]));
  });

  test('skill change maps to native + description suites', () => {
    const s = mapToSuites(['plugins/spk/skills/prime/SKILL.md']);
    expect(s).toEqual(expect.arrayContaining([
      'tests/native-skills.test.js',
      'tests/skill-descriptions.test.js',
    ]));
  });

  test('plugin runtime script maps to its sibling test', () => {
    expect(mapToSuites(['plugins/spk/scripts/gitignore-guard.cjs']))
      .toContain('tests/gitignore-guard.test.js');
  });

  test('unknown path falls back to empty (caller runs full suite)', () => {
    expect(mapToSuites(['README.md'])).toEqual([]);
  });

  test('sibling-less non-hook plugin script is unmappable (full-suite fallback, R7)', () => {
    // A brand-new plugin script with no sibling test and not a registered hook
    // must NOT map to anything — otherwise main() would scope-skip the full
    // suite and silently report zero-coverage code as covered.
    expect(mapToSuites(['plugins/spk/scripts/brand-new-thing.cjs'])).toEqual([]);
    // It must also be reported as unmapped (so it shows in the NOT-scoped warning).
    expect(suitesForPath('plugins/spk/scripts/brand-new-thing.cjs')).toEqual([]);
  });

  test('existing hook script includes the hook-output contract suite', () => {
    expect(mapToSuites(['plugins/spk/scripts/wiki-secret-scan.cjs']))
      .toEqual(expect.arrayContaining(['tests/hook-output-contract.test.js']));
  });

  test('de-duplicates suites across multiple changed files', () => {
    const s = mapToSuites(['manifest.json', 'manifest.json']);
    expect(new Set(s).size).toBe(s.length);
  });
});
