// tests/webfetch-cache.test.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  cacheKey,
  cacheFile,
  extractContent,
  preCheck,
  postStore
} = require('../plugins/spk/scripts/webfetch-cache.cjs');

const URL = 'https://example.com/docs/api';

function makeCacheDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spk-wfc-'));
}

function mockFetch(status, headers = {}) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    return {
      status,
      headers: { get: name => headers[name.toLowerCase()] || null }
    };
  };
  impl.calls = calls;
  return impl;
}

function fetchEvent(overrides = {}) {
  return {
    tool_input: { url: URL, prompt: 'summarize the auth section' },
    tool_response: { result: 'Auth uses bearer tokens.', bytes: 123, code: 200 },
    ...overrides
  };
}

describe('webfetch-cache', () => {
  describe('cacheKey', () => {
    test('is a stable 32-char hex digest of the URL', () => {
      expect(cacheKey(URL)).toMatch(/^[0-9a-f]{32}$/);
      expect(cacheKey(URL)).toBe(cacheKey(URL));
      expect(cacheKey(URL)).not.toBe(cacheKey(URL + '?v=2'));
    });
  });

  describe('extractContent', () => {
    test('reads .result from the current WebFetch response shape', () => {
      expect(extractContent({ result: 'body', bytes: 4 })).toBe('body');
    });

    test('falls back through defensive keys and string responses', () => {
      expect(extractContent({ output: 'o' })).toBe('o');
      expect(extractContent({ text: 't' })).toBe('t');
      expect(extractContent('plain string')).toBe('plain string');
      expect(extractContent({ code: 200 })).toBeNull();
      expect(extractContent(undefined)).toBeNull();
    });
  });

  describe('postStore', () => {
    test('caches content when origin provides validators', async () => {
      const dir = makeCacheDir();
      const env = { SPK_WEBFETCH_CACHE_DIR: dir };
      const result = await postStore(fetchEvent(), {
        env,
        fetchImpl: mockFetch(200, { etag: '"abc123"', 'last-modified': 'Tue, 09 Jun 2026 00:00:00 GMT' })
      });
      expect(result.stored).toBe(true);

      const entry = JSON.parse(fs.readFileSync(cacheFile(URL, env), 'utf-8'));
      expect(entry.url).toBe(URL);
      expect(entry.prompt).toBe('summarize the auth section');
      expect(entry.etag).toBe('"abc123"');
      expect(entry.content).toBe('Auth uses bearer tokens.');
      expect(entry.fetched_at).toBeGreaterThan(0);
    });

    test('does not cache and removes stale entry when origin has no validators', async () => {
      const dir = makeCacheDir();
      const env = { SPK_WEBFETCH_CACHE_DIR: dir };
      const file = cacheFile(URL, env);
      fs.writeFileSync(file, JSON.stringify({ url: URL, etag: '"old"', content: 'stale' }));

      const result = await postStore(fetchEvent(), { env, fetchImpl: mockFetch(200, {}) });
      expect(result.stored).toBe(false);
      expect(result.removed).toBe(true);
      expect(fs.existsSync(file)).toBe(false);
    });

    test('no-ops without url or content', async () => {
      const env = { SPK_WEBFETCH_CACHE_DIR: makeCacheDir() };
      const noUrl = await postStore(fetchEvent({ tool_input: {} }), { env, fetchImpl: mockFetch(200) });
      expect(noUrl.stored).toBe(false);

      const noContent = await postStore(fetchEvent({ tool_response: { code: 200 } }), { env, fetchImpl: mockFetch(200) });
      expect(noContent.stored).toBe(false);
    });

    test('no-ops when the HEAD request fails', async () => {
      const env = { SPK_WEBFETCH_CACHE_DIR: makeCacheDir() };
      const failingFetch = async () => { throw new Error('network down'); };
      const result = await postStore(fetchEvent(), { env, fetchImpl: failingFetch });
      expect(result.stored).toBe(false);
    });

    test('respects the SPK_WEBFETCH_CACHE=off kill switch', async () => {
      const env = { SPK_WEBFETCH_CACHE_DIR: makeCacheDir(), SPK_WEBFETCH_CACHE: 'off' };
      const result = await postStore(fetchEvent(), { env, fetchImpl: mockFetch(200, { etag: '"x"' }) });
      expect(result.stored).toBe(false);
      expect(result.reason).toBe('disabled');
    });
  });

  describe('preCheck', () => {
    async function storedEnv(headers = { etag: '"abc123"' }) {
      const env = { SPK_WEBFETCH_CACHE_DIR: makeCacheDir() };
      await postStore(fetchEvent(), { env, fetchImpl: mockFetch(200, headers) });
      return env;
    }

    test('serves cached content only on 304, sending conditional headers', async () => {
      const env = await storedEnv();
      const revalidate = mockFetch(304);
      const result = await preCheck(fetchEvent(), { env, fetchImpl: revalidate });

      expect(result.hit).toBe(true);
      expect(result.payload).toContain('Cache hit for ' + URL);
      expect(result.payload).toContain('Auth uses bearer tokens.');
      expect(result.payload).toContain('summarize the auth section');
      expect(revalidate.calls[0].init.headers['If-None-Match']).toBe('"abc123"');
    });

    test('bypasses cache when origin returns 200 (content changed)', async () => {
      const env = await storedEnv();
      const result = await preCheck(fetchEvent(), { env, fetchImpl: mockFetch(200) });
      expect(result.hit).toBe(false);
    });

    test('bypasses when there is no cache entry', async () => {
      const env = { SPK_WEBFETCH_CACHE_DIR: makeCacheDir() };
      const result = await preCheck(fetchEvent(), { env, fetchImpl: mockFetch(304) });
      expect(result.hit).toBe(false);
    });

    test('never revalidates an entry without validators', async () => {
      const env = { SPK_WEBFETCH_CACHE_DIR: makeCacheDir() };
      fs.writeFileSync(cacheFile(URL, env), JSON.stringify({ url: URL, content: 'orphan' }));
      const revalidate = mockFetch(304);
      const result = await preCheck(fetchEvent(), { env, fetchImpl: revalidate });
      expect(result.hit).toBe(false);
      expect(revalidate.calls).toHaveLength(0);
    });

    test('bypasses when revalidation request fails', async () => {
      const env = await storedEnv();
      const failingFetch = async () => { throw new Error('timeout'); };
      const result = await preCheck(fetchEvent(), { env, fetchImpl: failingFetch });
      expect(result.hit).toBe(false);
    });

    test('bypasses on corrupt cache file', async () => {
      const env = { SPK_WEBFETCH_CACHE_DIR: makeCacheDir() };
      fs.writeFileSync(cacheFile(URL, env), 'not json{');
      const result = await preCheck(fetchEvent(), { env, fetchImpl: mockFetch(304) });
      expect(result.hit).toBe(false);
    });

    test('respects the SPK_WEBFETCH_CACHE=off kill switch', async () => {
      const env = await storedEnv();
      env.SPK_WEBFETCH_CACHE = 'off';
      const result = await preCheck(fetchEvent(), { env, fetchImpl: mockFetch(304) });
      expect(result.hit).toBe(false);
    });
  });
});
