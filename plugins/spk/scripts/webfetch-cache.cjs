// hooks/PreToolUse+PostToolUse/webfetch-cache.cjs
// HTTP resource cache for WebFetch, keyed by URL. Freshness is delegated to
// the origin via HTTP validators: a cached body is served ONLY when the
// server answers a conditional request with 304 Not Modified — a fresh
// verification, not a memory read. Entries without ETag or Last-Modified
// are never cached (nothing to revalidate against), and there is no TTL.
//
// pre  mode: on 304, writes the cached body to stderr and exits 2 so
//            Claude Code delivers it in place of the WebFetch result.
// post mode: after WebFetch, HEADs the URL for validators and stores the
//            response body in .claude/spk-webfetch-cache/<sha>.json.
//
// Cached bodies are prompt-shaped (WebFetch post-processes through a model),
// so the key is URL-only and the original prompt is stored as metadata and
// surfaced on a hit so the next agent can judge if the reading still applies.
//
// Kill switch: SPK_WEBFETCH_CACHE=off bypasses both modes.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REQUEST_TIMEOUT_MS = 5000;

function cacheKey(url) {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 32);
}

function cacheDir(env) {
  env = env || process.env;
  if (env.SPK_WEBFETCH_CACHE_DIR) return env.SPK_WEBFETCH_CACHE_DIR;
  return path.join(env.CLAUDE_PROJECT_DIR || process.cwd(), '.claude', 'spk-webfetch-cache');
}

function cacheFile(url, env) {
  return path.join(cacheDir(env), cacheKey(url) + '.json');
}

function disabled(env) {
  env = env || process.env;
  return env.SPK_WEBFETCH_CACHE === 'off';
}

// Extract the model-readable body from a WebFetch tool_response.
// Shape as of Claude Code 2026-04: object with content at .result; the
// other keys are defensive fallbacks. String handles older integrations.
function extractContent(toolResponse) {
  if (typeof toolResponse === 'string') return toolResponse || null;
  if (toolResponse && typeof toolResponse === 'object') {
    return toolResponse.result
      || toolResponse.output
      || toolResponse.text
      || toolResponse.content
      || toolResponse.body
      || null;
  }
  return null;
}

async function headRequest(url, headers, fetchImpl) {
  const doFetch = fetchImpl || fetch;
  return doFetch(url, {
    method: 'HEAD',
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
}

// pre mode: returns { hit: false } or { hit: true, payload }.
// Never throws — any failure means "let WebFetch proceed".
async function preCheck(event, opts) {
  opts = opts || {};
  const env = opts.env || process.env;
  if (disabled(env)) return { hit: false };

  const url = event && event.tool_input && event.tool_input.url;
  if (!url) return { hit: false };

  const file = cacheFile(url, env);
  let entry;
  try { entry = JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return { hit: false }; }

  // No validator means freshness cannot be verified — never serve from cache.
  if ((!entry.etag && !entry.last_modified) || !entry.content) return { hit: false };

  const headers = {};
  if (entry.etag) headers['If-None-Match'] = entry.etag;
  if (entry.last_modified) headers['If-Modified-Since'] = entry.last_modified;

  let status;
  try {
    const res = await headRequest(url, headers, opts.fetchImpl);
    status = res.status;
  } catch { return { hit: false }; }

  if (status !== 304) return { hit: false };

  const verifiedAt = entry.fetched_at
    ? new Date(entry.fetched_at * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z')
    : 'unknown';

  const lines = [
    `[spk-webfetch-cache] Cache hit for ${url}`,
    '',
    `Revalidated via HTTP 304; unchanged since ${verifiedAt}. Use the cached`,
    'content below as if WebFetch had just returned it.',
    ''
  ];
  if (entry.prompt) {
    lines.push(
      `Original WebFetch prompt: "${entry.prompt}". If your angle differs, judge`,
      'whether this reading still covers it.',
      ''
    );
  }
  lines.push(
    '----- BEGIN CACHED CONTENT -----',
    entry.content,
    '----- END CACHED CONTENT -----'
  );
  return { hit: true, payload: lines.join('\n') };
}

// post mode: returns { stored, removed, reason } for tests/debugging.
// Never throws — caching is best-effort.
async function postStore(event, opts) {
  opts = opts || {};
  const env = opts.env || process.env;
  if (disabled(env)) return { stored: false, reason: 'disabled' };

  const url = event && event.tool_input && event.tool_input.url;
  if (!url) return { stored: false, reason: 'no url' };

  const content = extractContent(event.tool_response);
  if (!content) return { stored: false, reason: 'no content in tool_response' };

  // fetch follows redirects and exposes the FINAL response's headers, so
  // validators always match the URL the agent actually landed on.
  let etag = '';
  let lastModified = '';
  try {
    const res = await headRequest(url, {}, opts.fetchImpl);
    etag = res.headers.get('etag') || '';
    lastModified = res.headers.get('last-modified') || '';
  } catch { return { stored: false, reason: 'HEAD request failed' }; }

  const file = cacheFile(url, env);

  if (!etag && !lastModified) {
    // Origin offers no validator: remove any stale entry so the pre hook
    // can never serve content we have no way to revalidate.
    try { fs.unlinkSync(file); } catch { /* may not exist */ }
    return { stored: false, removed: true, reason: 'no validator from origin' };
  }

  const entry = {
    url,
    prompt: (event.tool_input && event.tool_input.prompt) || '',
    etag,
    last_modified: lastModified,
    content,
    fetched_at: Math.floor((opts.now || Date.now()) / 1000)
  };

  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(entry));
    fs.renameSync(tmp, file);
  } catch { return { stored: false, reason: 'write failed' }; }

  return { stored: true, reason: 'cached with validators' };
}

function main() {
  const mode = process.argv[2];
  let raw = '';
  process.stdin.on('data', chunk => { raw += chunk; });
  process.stdin.on('end', async () => {
    let event;
    try { event = JSON.parse(raw || '{}'); } catch { process.exit(0); }

    if (mode === 'pre') {
      const result = await preCheck(event);
      if (result.hit) {
        process.stderr.write(result.payload + '\n');
        process.exit(2);
      }
      process.exit(0);
    }

    if (mode === 'post') {
      await postStore(event);
      process.exit(0);
    }

    process.exit(0);
  });
}

if (require.main === module) main();

module.exports = { cacheKey, cacheDir, cacheFile, extractContent, preCheck, postStore };
