'use strict';

// Pure, spawn-free helpers for the spk-codebase-search MCP server.
// This module MUST NOT import child_process — it only builds argv arrays and
// parses ripgrep `--json` output so the logic is unit-testable in isolation.

const DEFAULT_MAX_RESULTS = 50;
const MAX_TEXT_LEN = 240;

// Escape a string so it is safe to embed inside a ripgrep regex.
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clampMax(maxResults) {
  const n = Number(maxResults);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_MAX_RESULTS;
  return Math.floor(n);
}

// Reject a value that ripgrep would interpret as a flag. Used for positional
// inputs (paths, globs) that come from model-controlled tool arguments.
function rejectFlagLike(value, label) {
  const v = String(value);
  if (v.startsWith('-')) {
    throw new Error(`buildArgs: ${label} may not start with "-" (got ${JSON.stringify(v)})`);
  }
  return v;
}

// Base flags shared by every rg invocation.
//   --no-config disables rc-file loading so a malicious .ripgreprc / RIPGREP_CONFIG_PATH
//   cannot inject --pre or other dangerous flags.
function baseArgs(maxResults) {
  return ['--json', '--no-config', '-m', String(clampMax(maxResults))];
}

// Build argv for a code search. All flags come first; the query and any
// positional path are pushed AFTER a "--" sentinel so model-controlled inputs
// (e.g. "--pre=<cmd>") can never be parsed by ripgrep as flags.
function buildSearchArgs({ query, path, maxResults, literal, glob } = {}) {
  if (typeof query !== 'string' || query.length === 0) {
    throw new Error('buildSearchArgs: query is required');
  }
  const args = baseArgs(maxResults);
  if (literal) args.push('-F');
  if (glob) args.push('-g', rejectFlagLike(glob, 'glob'));
  args.push('--', query);
  if (path) args.push(rejectFlagLike(path, 'path'));
  return args;
}

// Declaration keywords across common languages — best-effort, pattern-based.
const DECL_KEYWORDS = 'function|class|def|const|let|var|type|interface|struct|fn|enum|trait|module';

// Build argv for a symbol-definition search (best-effort, regex not AST).
function buildSymbolArgs(name, { path, maxResults } = {}) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('buildSymbolArgs: name is required');
  }
  const escaped = escapeRegex(name);
  const pattern = `\\b(${DECL_KEYWORDS})\\s+${escaped}\\b`;
  const args = baseArgs(maxResults);
  args.push('--', pattern);
  if (path) args.push(rejectFlagLike(path, 'path'));
  return args;
}

// Build argv for a file outline: all top-level declarations in one file.
function buildOutlineArgs(filePath, { maxResults } = {}) {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new Error('buildOutlineArgs: filePath is required');
  }
  const safePath = rejectFlagLike(filePath, 'path');
  const pattern = `\\b(${DECL_KEYWORDS})\\s+[A-Za-z_$][\\w$]*`;
  const args = baseArgs(maxResults);
  args.push('--', pattern, safePath);
  return args;
}

function normalizePath(p) {
  return String(p).replace(/\\/g, '/');
}

function truncate(text) {
  const t = String(text).replace(/\r?\n$/, '');
  return t.length > MAX_TEXT_LEN ? t.slice(0, MAX_TEXT_LEN) : t;
}

// Parse ripgrep `--json` line-delimited output into compact match objects.
function parseRgJson(stdout) {
  if (!stdout) return [];
  const out = [];
  for (const raw of String(stdout).split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    let evt;
    try {
      evt = JSON.parse(line);
    } catch {
      continue; // tolerate non-JSON / partial lines
    }
    if (!evt || evt.type !== 'match' || !evt.data) continue;
    const d = evt.data;
    const file = normalizePath((d.path && d.path.text) || '');
    const line_number = d.line_number || 0;
    const sub = Array.isArray(d.submatches) && d.submatches[0];
    const col = sub && Number.isFinite(sub.start) ? sub.start : 0;
    const text = truncate((d.lines && d.lines.text) || '');
    out.push({ file, line: line_number, col, text });
  }
  return out;
}

module.exports = {
  DEFAULT_MAX_RESULTS,
  MAX_TEXT_LEN,
  escapeRegex,
  buildSearchArgs,
  buildSymbolArgs,
  buildOutlineArgs,
  parseRgJson,
};
