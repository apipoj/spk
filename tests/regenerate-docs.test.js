// spk/tests/regenerate-docs.test.js
const { parseMarkers, regenerateContent } = require('../scripts/regenerate-docs.cjs');

describe('parseMarkers', () => {
  test('finds a block between markers', () => {
    const text = `line before
<!-- SPK-COUNTS:start -->
old content
<!-- SPK-COUNTS:end -->
line after`;
    const blocks = parseMarkers(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].name).toBe('SPK-COUNTS');
    expect(blocks[0].start).toBeGreaterThan(0);
    expect(blocks[0].end).toBeGreaterThan(blocks[0].start);
  });

  test('finds multiple blocks', () => {
    const text = `<!-- SPK-COUNTS:start -->
a
<!-- SPK-COUNTS:end -->
<!-- SPK-AGENTS:start -->
b
<!-- SPK-AGENTS:end -->`;
    const blocks = parseMarkers(text);
    expect(blocks).toHaveLength(2);
    expect(blocks.map(b => b.name)).toEqual(['SPK-COUNTS', 'SPK-AGENTS']);
  });

  test('returns empty array when no markers', () => {
    expect(parseMarkers('plain text')).toEqual([]);
  });

  test('ignores unmatched start marker', () => {
    const text = `<!-- SPK-COUNTS:start -->
no end`;
    expect(parseMarkers(text)).toEqual([]);
  });
});

describe('regenerateContent', () => {
  const manifest = {
    agents: {
      orchestrators: [{ name: 'plan-orchestrator' }, { name: 'build-orchestrator' }],
      specialists: [{ name: 'planner' }, { name: 'implementer' }]
    },
    commands: [{ name: '/spk-plan' }, { name: '/spk-code' }]
  };

  test('replaces SPK-COUNTS block with totals', () => {
    const input = `## AI Sprint Kit
<!-- SPK-COUNTS:start -->
OLD
<!-- SPK-COUNTS:end -->`;
    const output = regenerateContent(input, manifest);
    expect(output).toContain('**4 agents**');
    expect(output).toContain('2 orchestrators + 2 specialists');
    expect(output).toContain('**2 commands**');
    expect(output).not.toContain('OLD');
  });

  test('preserves content outside markers', () => {
    const input = `# Header
<!-- SPK-COUNTS:start -->
OLD
<!-- SPK-COUNTS:end -->
# Footer`;
    const output = regenerateContent(input, manifest);
    expect(output).toMatch(/^# Header/);
    expect(output).toMatch(/# Footer$/);
  });

  test('no-op when no markers present', () => {
    const input = '# Header\nplain text';
    expect(regenerateContent(input, manifest)).toBe(input);
  });
});
