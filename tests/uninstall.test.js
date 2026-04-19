// tests/uninstall.test.js
const { uninstall, stripSpkMarkers } = require('../scripts/install/uninstall.cjs');
const fs = require('fs');
const path = require('path');
const os = require('os');

function makeInstalled() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-uni-'));
  fs.mkdirSync(path.join(dir, '.claude/agents'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude/commands'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude/hooks/PreToolUse'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'ai_context/wiki'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.spk'), { recursive: true });

  fs.writeFileSync(path.join(dir, '.spk/manifest.json'), JSON.stringify({
    agents: {
      orchestrators: [{ name: 'plan-orchestrator', model: 'claude-opus-4-7', color: 'green', phase: 'planning' }],
      specialists: [{ name: 'planner', model: 'claude-opus-4-7', color: 'green', phase: 'planning' }]
    },
    commands: [{ name: '/spk-plan' }]
  }));
  fs.writeFileSync(path.join(dir, '.claude/agents/plan-orchestrator.md'), 'agent');
  fs.writeFileSync(path.join(dir, '.claude/agents/planner.md'), 'agent');
  fs.writeFileSync(path.join(dir, '.claude/agents/user-custom.md'), 'user');
  fs.writeFileSync(path.join(dir, '.claude/commands/spk-plan.md'), 'cmd');
  fs.writeFileSync(path.join(dir, '.claude/commands/user-custom.md'), 'user');
  fs.writeFileSync(path.join(dir, '.claude/hooks/PreToolUse/wiki-secret-scan.cjs'), 'hook');
  fs.writeFileSync(path.join(dir, 'ai_context/wiki/page.md'), 'user data');

  return dir;
}

describe('stripSpkMarkers', () => {
  test('removes content between SPK markers', () => {
    const input = 'prefix\n<!-- SPK:start -->\nSPK CONTENT\n<!-- SPK:end -->\nsuffix';
    const output = stripSpkMarkers(input);
    expect(output).not.toContain('SPK CONTENT');
    expect(output).toContain('prefix');
    expect(output).toContain('suffix');
  });

  test('no-op when no markers', () => {
    const input = 'just plain content';
    expect(stripSpkMarkers(input)).toBe(input);
  });
});

describe('uninstall', () => {
  test('removes manifest agents but preserves user custom', () => {
    const dir = makeInstalled();
    uninstall(dir);
    expect(fs.existsSync(path.join(dir, '.claude/agents/plan-orchestrator.md'))).toBe(false);
    expect(fs.existsSync(path.join(dir, '.claude/agents/planner.md'))).toBe(false);
    expect(fs.existsSync(path.join(dir, '.claude/agents/user-custom.md'))).toBe(true);
  });

  test('removes spk-* commands but preserves user custom', () => {
    const dir = makeInstalled();
    uninstall(dir);
    expect(fs.existsSync(path.join(dir, '.claude/commands/spk-plan.md'))).toBe(false);
    expect(fs.existsSync(path.join(dir, '.claude/commands/user-custom.md'))).toBe(true);
  });

  test('removes .spk/ entirely', () => {
    const dir = makeInstalled();
    uninstall(dir);
    expect(fs.existsSync(path.join(dir, '.spk'))).toBe(false);
  });

  test('preserves ai_context/wiki/ (user data)', () => {
    const dir = makeInstalled();
    uninstall(dir);
    expect(fs.existsSync(path.join(dir, 'ai_context/wiki/page.md'))).toBe(true);
  });

  test('strips SPK block from CLAUDE.md if present', () => {
    const dir = makeInstalled();
    fs.writeFileSync(
      path.join(dir, 'CLAUDE.md'),
      'User content\n<!-- SPK:start -->\nSPK ref\n<!-- SPK:end -->\nMore user content'
    );
    uninstall(dir);
    const content = fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf-8');
    expect(content).not.toContain('SPK ref');
    expect(content).toContain('User content');
    expect(content).toContain('More user content');
  });

  test('no-op when no install detected', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spk-noinst-'));
    const result = uninstall(dir);
    expect(result.removed).toBe(0);
  });
});
