'use strict';

// spk-codebase-search: a zero-dependency, index-light MCP stdio server.
//
// Why no @modelcontextprotocol/sdk: the MCP stdio surface needed here is small
// and stable — newline-delimited JSON-RPC 2.0 with `initialize`, `tools/list`,
// `tools/call`, and the `notifications/initialized` notification. Hand-rolling
// it keeps SPK's "Node-only, no new runtime dependencies" promise, avoids the
// supply-chain/version-lock surface of a third-party dep (plan risk R5), and is
// less code to vet than pinning + supporting the SDK.
//
// Every tool call shells out to ripgrep (`rg --json`) in the consumer project's
// cwd. No persisted index: correct on a moving codebase, zero warm-up.

const { spawnSync } = require('child_process');
const {
  buildSearchArgs,
  buildSymbolArgs,
  buildOutlineArgs,
  parseRgJson,
  clampMax,
} = require('./rg.cjs');

const SERVER_NAME = 'spk-codebase-search';
const SERVER_VERSION = '0.1.0';
const PROTOCOL_VERSION = '2025-06-18';
const RG_TIMEOUT_MS = 15000;
const DEFAULT_MAX_RESULTS = 50;

// ---- Kill switch -----------------------------------------------------------
function toolsEnabled(env = process.env) {
  return String(env.SPK_CODEBASE_SEARCH || '').toLowerCase() !== 'off';
}

// ---- ripgrep invocation ----------------------------------------------------
// Returns { matches } on success, { error } on failure — never throws.
function runRg(args, env = process.env) {
  const rg = env.SPK_RG_PATH || 'rg';
  let res;
  try {
    res = spawnSync(rg, args, {
      encoding: 'utf-8',
      timeout: RG_TIMEOUT_MS,
      maxBuffer: 16 * 1024 * 1024,
      cwd: env.CLAUDE_PROJECT_DIR || process.cwd(),
    });
  } catch (e) {
    return { error: 'rg-spawn-failed', hint: String((e && e.message) || e) };
  }
  if (res.error) {
    if (res.error.code === 'ENOENT') {
      return { error: 'rg-not-found', hint: 'install ripgrep or set SPK_RG_PATH to its absolute path' };
    }
    return { error: 'rg-spawn-failed', hint: String(res.error.message || res.error) };
  }
  // rg exit 1 = no matches (not an error); >1 = real error.
  if (res.status && res.status > 1) {
    return { error: 'rg-failed', status: res.status, hint: (res.stderr || '').trim().slice(0, 240) };
  }
  return { matches: parseRgJson(res.stdout || '') };
}

// ---- Tool definitions ------------------------------------------------------
const TOOLS = [
  {
    name: 'search_code',
    description:
      'Search code across the project with ripgrep (regex by default, literal optional). ' +
      'Returns capped file/line/col matches. Precise — prefer this over raw grep in large repos.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Pattern to search for' },
        path: { type: 'string', description: 'Optional path/dir to scope the search' },
        glob: { type: 'string', description: 'Optional rg glob filter, e.g. "*.ts"' },
        literal: { type: 'boolean', description: 'Treat query as a literal string (rg -F)' },
        maxResults: { type: 'number', description: 'Cap on matches (default 50)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_symbol',
    description:
      'Best-effort, pattern-based symbol definition lookup (function/class/def/const/type/...). ' +
      'Not AST-accurate; may miss or over-match. Use search_code for precise text search.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Symbol name to locate a declaration for' },
        path: { type: 'string', description: 'Optional path/dir to scope the search' },
        maxResults: { type: 'number', description: 'Cap on matches (default 50)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'file_outline',
    description:
      'Best-effort, pattern-based outline of top-level declarations in a single file. ' +
      'Not AST-accurate. Use to get a quick map of a file before reading it fully.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to outline' },
        maxResults: { type: 'number', description: 'Cap on declarations (default 50)' },
      },
      required: ['path'],
    },
  },
];

function listTools() {
  return TOOLS;
}

// ---- Tool dispatch ---------------------------------------------------------
function dispatch(name, args = {}, env = process.env) {
  if (!toolsEnabled(env)) {
    return { disabled: true, reason: 'SPK_CODEBASE_SEARCH=off' };
  }
  const max = Number.isFinite(Number(args.maxResults)) ? Number(args.maxResults) : DEFAULT_MAX_RESULTS;
  // Project root = the same cwd ripgrep runs in (see runRg). Used to confine
  // model-controlled positional paths so they cannot escape the project.
  const root = env.CLAUDE_PROJECT_DIR || process.cwd();
  let rgArgs;
  try {
    if (name === 'search_code') {
      rgArgs = buildSearchArgs({
        query: args.query,
        path: args.path,
        glob: args.glob,
        literal: args.literal,
        maxResults: max,
        root,
      });
    } else if (name === 'find_symbol') {
      rgArgs = buildSymbolArgs(args.name, { path: args.path, maxResults: max, root });
    } else if (name === 'file_outline') {
      rgArgs = buildOutlineArgs(args.path, { maxResults: max, root });
    } else {
      return { error: 'unknown-tool', hint: name };
    }
  } catch (e) {
    // Containment / flag-injection rejections surface as a structured error,
    // never an uncaught throw across the JSON-RPC boundary.
    return { error: 'invalid-argument', hint: String((e && e.message) || e) };
  }
  const out = runRg(rgArgs, env);
  if (out.error) return out;
  // rg -m caps PER FILE; enforce the authoritative GLOBAL cap here.
  return applyGlobalCap(out.matches, clampMax(max));
}

// Enforce a global result cap and report truncation against the true total.
function applyGlobalCap(matches, max) {
  const list = Array.isArray(matches) ? matches : [];
  const capped = list.slice(0, max);
  return { matches: capped, count: capped.length, truncated: list.length > max };
}

// ---- Server object (for tests + reuse) -------------------------------------
function createServer(env = process.env) {
  return {
    listTools,
    callTool(name, args) {
      return dispatch(name, args || {}, env);
    },
  };
}

// ---- JSON-RPC over stdio ---------------------------------------------------
function handleRequest(msg, env) {
  const { id, method, params } = msg;
  // Notifications (no id) get no response.
  if (id === undefined || id === null) return null;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: (params && params.protocolVersion) || PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      },
    };
  }
  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: listTools() } };
  }
  if (method === 'tools/call') {
    const name = params && params.name;
    const args = (params && params.arguments) || {};
    const result = dispatch(name, args, env);
    const isError = Boolean(result && (result.error || result.disabled));
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        isError,
      },
    };
  }
  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
}

function startStdio(env = process.env) {
  let buffer = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk) => {
    buffer += chunk;
    let nl;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        continue; // ignore malformed lines per stdio contract
      }
      let response;
      try {
        response = handleRequest(msg, env);
      } catch (e) {
        response = msg && msg.id != null
          ? { jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: String(e.message || e) } }
          : null;
      }
      if (response) process.stdout.write(JSON.stringify(response) + '\n');
    }
  });
  process.stdin.on('end', () => process.exit(0));
}

module.exports = {
  SERVER_NAME,
  SERVER_VERSION,
  PROTOCOL_VERSION,
  toolsEnabled,
  runRg,
  listTools,
  dispatch,
  applyGlobalCap,
  createServer,
  handleRequest,
  startStdio,
};

if (require.main === module) {
  startStdio(process.env);
}
