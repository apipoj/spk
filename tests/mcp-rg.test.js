// tests/mcp-rg.test.js
const {
  buildSearchArgs,
  buildSymbolArgs,
  buildOutlineArgs,
  parseRgJson,
} = require('../plugins/spk/mcp/rg.cjs');

describe('buildSearchArgs', () => {
  test('uses --json and caps results', () => {
    const a = buildSearchArgs({ query: 'foo', maxResults: 50, path: 'src' });
    expect(a).toEqual(expect.arrayContaining(['--json', 'foo', 'src']));
  });

  test('adds literal flag and glob when requested', () => {
    const a = buildSearchArgs({ query: 'a.b', literal: true, glob: '*.js' });
    expect(a).toEqual(expect.arrayContaining(['-F', '-g', '*.js', 'a.b']));
  });

  test('query comes after flags and before optional path', () => {
    const a = buildSearchArgs({ query: 'needle' });
    expect(a[a.length - 1]).toBe('needle');
    expect(a).toContain('--json');
  });
});

describe('buildSymbolArgs', () => {
  test('builds a word-bounded declaration regex for the symbol name', () => {
    const a = buildSymbolArgs('Widget');
    const pattern = a.find((x) => /Widget/.test(x) && /function|class|def/.test(x));
    expect(pattern).toBeTruthy();
    expect(pattern).toMatch(/\\b/);
    expect(a).toContain('--json');
  });

  test('escapes regex metacharacters in the symbol name', () => {
    const a = buildSymbolArgs('foo.bar');
    const pattern = a.find((x) => /foo/.test(x));
    expect(pattern).toContain('foo\\.bar');
  });
});

describe('buildOutlineArgs', () => {
  test('scopes a declaration search to a single file path', () => {
    const a = buildOutlineArgs('src/a.js');
    expect(a).toContain('--json');
    expect(a[a.length - 1]).toBe('src/a.js');
  });
});

describe('parseRgJson', () => {
  test('extracts file/line/col/text from rg match lines', () => {
    const line = JSON.stringify({
      type: 'match',
      data: {
        path: { text: 'src/a.js' },
        line_number: 12,
        lines: { text: 'const foo = 1\n' },
        submatches: [{ start: 6, end: 9 }],
      },
    });
    const out = parseRgJson(line + '\n');
    expect(out[0]).toMatchObject({ file: 'src/a.js', line: 12, col: 6 });
    expect(out[0].text).toContain('const foo');
  });

  test('ignores non-match event types', () => {
    const begin = JSON.stringify({ type: 'begin', data: { path: { text: 'x' } } });
    expect(parseRgJson(begin + '\n')).toEqual([]);
  });

  test('truncates long match text to a bounded length', () => {
    const long = 'x'.repeat(1000);
    const line = JSON.stringify({
      type: 'match',
      data: {
        path: { text: 'src/b.js' },
        line_number: 1,
        lines: { text: long + '\n' },
        submatches: [{ start: 0, end: 1 }],
      },
    });
    const out = parseRgJson(line + '\n');
    expect(out[0].text.length).toBeLessThanOrEqual(240);
  });

  test('normalizes windows path separators to forward slashes', () => {
    const line = JSON.stringify({
      type: 'match',
      data: {
        path: { text: 'src\\win\\a.js' },
        line_number: 3,
        lines: { text: 'const z = 1\n' },
        submatches: [{ start: 6, end: 7 }],
      },
    });
    const out = parseRgJson(line + '\n');
    expect(out[0].file).toBe('src/win/a.js');
  });

  test('tolerates blank lines and malformed json lines', () => {
    const good = JSON.stringify({
      type: 'match',
      data: {
        path: { text: 'src/a.js' },
        line_number: 1,
        lines: { text: 'ok\n' },
        submatches: [{ start: 0, end: 1 }],
      },
    });
    const out = parseRgJson('\nnot-json\n' + good + '\n');
    expect(out).toHaveLength(1);
    expect(out[0].file).toBe('src/a.js');
  });
});
