---
title: SPK Improvements from Helpline + Claude Code Large-Codebase Best Practices
type: plan
updated: 2026-06-10
sources: []
links: []
---

# SPK Improvements from Two Sources

Plan to evolve SPK (v3.2.0) by adopting genuinely-fitting patterns from:

1. **Helpline** — https://github.com/coleam00/helpline (a worked "AI layer" reference implementation).
2. **Claude Code in large codebases** — https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start (Anthropic best-practices article).

Scope is limited to the four maintainer-named candidates: (1) CLAUDE.md/AGENTS.md hierarchy, (2) self-improving Stop hook, (3) codebase-search MCP integration, (4) scoped-tests.

---

## Source Research (grounded, fetched 2026-06-10)

### What Helpline actually does
| Area | Helpline mechanism | File / config |
|---|---|---|
| Context hierarchy | Lean root `CLAUDE.md` + one `CLAUDE.md` per service/package (`services/api/CLAUDE.md`, `services/billing/CLAUDE.md`); `packages/core` + `packages/db` imported everywhere so per-service context prevents silent regressions | `CLAUDE.md`, `*/CLAUDE.md` |
| Self-improving Stop hook | `Stop` hook "reflects on the session and proposes concrete `CLAUDE.md` edits" so the layer "never silently rots"; paired with a `SessionStart` orientation hook | `.claude/hooks/` |
| Codebase-search MCP | AST-based MCP server exposing `where_is` / `find_references` / `outline`; companion pyright `pyright-langserver` for symbol nav | `tooling/mcp/`, `docs/lsp-setup.md` |
| Scoped tests | Generic reusable skill `scoped-tests` with a `paths:` field that runs only tests relevant to changed files | `.claude/skills/scoped-tests` |
| Validation | `tooling/validate/validate_all.py` proves "13/13" components work end-to-end | `tooling/validate/` |
| Subagent | Read-only `explorer.md` subagent maps subsystems and writes findings to files | `.claude/agents/explorer.md` |

### What the Anthropic article recommends
- **Hierarchy:** lean layered `CLAUDE.md`; root = "pointers and critical gotchas only"; subdirectory files for local conventions + the test/build commands that apply to that part; initialize in subdirectories, not just root. Claude walks up the tree loading each file.
- **Stop/Start hooks:** a Stop hook "can reflect on what happened during a session and propose `CLAUDE.md` updates" while context is fresh; Start hooks load team context dynamically; hooks enforce deterministic rules rather than relying on model recall.
- **Codebase search:** LSP integrations give symbol-level precision ("follow a call to its definition, trace references"); without it Claude "pattern-matches on text and can land on the wrong symbol." Sophisticated teams build MCP servers exposing structured search. Use `.claudeignore` to exclude generated/vendor code.
- **Scoped tests:** scope test+lint commands per subdirectory; running the full suite on a one-service change "causes timeouts and wastes context."
- **Subagents:** split exploration from editing — read-only recon subagents return only findings, protecting parent context.
- **Grounding:** "Claude's ability to help in a large codebase is bounded by its ability to find the right context"; the harness (CLAUDE.md, hooks, skills, LSP, MCP) matters as much as the model.

---

## Gap Analysis vs SPK Today

SPK already ships the structural backbone these sources advocate. The gaps are about **freshness, scoping, and discovery — not structure**.

| Candidate | SPK today | Genuine gap vs sources |
|---|---|---|
| **1. Context hierarchy** | `/spk:prime` + `primer` agent already create nested `AGENTS.md` per source subtree with `CLAUDE.md` as a `@AGENTS.md` pointer (better than Helpline's dual-file approach — eliminates drift). Root + 4 subtree files exist. | (a) Per-subtree AGENTS.md does not yet carry **scoped test/build commands** for that subtree (article's strongest point). (b) No `.claudeignore` guidance. (c) No staleness signal when source changes but AGENTS.md doesn't. Structure is done; **content discipline + scoping is the gap.** |
| **2. Self-improving Stop hook** | No `Stop` hook exists. Hooks layer has PreToolUse/PostToolUse/SessionStart only (`hooks.json`, 5 scripts). Wiki has a `learning` page type already defined in SCHEMA. | Entire mechanism missing. SPK has the ideal sink already (`learning` wiki pages + `log.md`), so a Stop hook should propose a `learning` page / AGENTS.md edit rather than blindly rewriting CLAUDE.md. |
| **3. Codebase-search MCP** | None. SPK relies on Read/Grep/Glob (guarded by `gitignore-guard`). It is a plugin author's repo (~small), not a giant polyglot codebase. | Real for SPK's *users'* large repos, but SPK is a plugin, not an app — it would have to ship/recommend an MCP server users install. High effort, indirect fit. |
| **4. Scoped tests** | 23 Jest suites run via `npm test` (full) and `npm run verify:release` (all gates + `--runInBand`). No path-to-test mapping. | Real and cheap: a `scoped-tests` skill that maps changed files → relevant Jest suites would speed the inner loop and is directly reusable by SPK users. Aligns with the `tester` agent + `/tdd`. |

---

## Value-to-Effort Ranking (SPK-specific)

> **Revised 2026-06-10 (rev 2).** The first-pass ranking rejected the codebase-search MCP on a wrong premise — that the MCP would search the *SPK repo itself* (small, Python AST server, heavy runtime). The maintainer corrected this: **SPK is a plugin installed INTO other projects, and those consumer codebases can be 100k+ files.** The blog source is literally about Claude Code *in large codebases*. Under the correct framing the MCP becomes high-value and — given Node >=20 is already required and ripgrep ships with Claude Code — low-runtime-cost. It is re-ranked #1.

| Rank | Candidate | Value | Effort | Verdict |
|---|---|---|---|---|
| **1** | **Codebase-search MCP** (Node + ripgrep, shipped to consumer projects) | **High** (for the target user: someone running `/spk:plan`,`/spk:code`,`/spk:query` inside a 100k+ file monorepo where grep-driven exploration burns context) | Med | **BUILD.** Biggest leverage on SPK's actual job: grounding subagents in large *consumer* repos. Zero new runtime (Node already required; rg ships with Claude Code). SPK currently ships **no** MCP server, so this is greenfield wiring via the plugin manifest. |
| **2** | **Context hierarchy upgrade** (scoped commands in each AGENTS.md + `.claudeignore` guidance + staleness check) | High | Low | **BUILD.** Pure refinement of an existing, working system. No new runtime surface. The `## Code Navigation` block now documents SPK's own MCP search tools (not a third party). |
| **3** | **Scoped-tests skill** | High | Low–Med | **BUILD.** Speeds the inner loop in any consumer project; integrates with `tester`/`/tdd`. |
| **4** | **Self-improving Stop hook** | Med–High | Med | **BUILD, conservatively.** Must *propose* (never auto-write) edits, route to the existing `learning` page type, and respect the secret-scan + non-blocking hook contract. |

### Build vs Integrate: BUILD a Node+ripgrep server (do NOT integrate Helpline's)
Evidence gathered (2026-06-10):
- **Helpline's MCP is Python** (`uv` + `pyproject.toml`, repo is 100% Python), AST-based, exposing `where_is` / `find_references` / `outline` under `tooling/mcp/`. It is *generalizable* ("layout-agnostic, walks the repo") but **not adoptable for SPK** — adopting it reintroduces the exact heavy non-Node runtime the maintainer's constraint forbids (Python interpreter + AST deps that each consumer would need). Its *design* validates the concept; its *implementation* is the wrong stack.
- **No existing Node OSS codebase-search MCP is a clean drop-in** at SPK's bar (zero-runtime, index-light, ships inside a plugin). Building a thin ripgrep wrapper is *less* code than vetting + pinning + supporting a third-party dependency, and keeps SPK's "no new runtimes, Node-only" promise intact.
- **ripgrep 14.1.1 is present and Claude Code itself ships `rg`**, so the server can shell out to `rg --json` with no install step for the common case (with a clear error + `SPK_RG_PATH` override when absent).
- **Plugins ship MCP via the manifest.** Claude Code resolves a `.mcp.json` at the plugin root (or an inline `mcpServers` block in `.claude-plugin/plugin.json`); `command` uses `${CLAUDE_PLUGIN_ROOT}`. SPK ships none today — confirmed: no `mcpServers` key anywhere in the repo. Sources: [Plugins reference](https://code.claude.com/docs/en/plugins-reference), [Plugins docs](https://code.claude.com/docs/en/plugins.md).

**Decision: BUILD a Node, ripgrep-backed, index-light MCP server** named `spk-codebase-search`, exposing three tools: `search_code` (rg-backed regex/literal search with file+line+context, capped result count), `find_symbol` (definition-oriented search using language-aware rg patterns for `function|class|def|const|type|interface <name>`), and `file_outline` (top-level declarations of one file via rg patterns). Index-light = no persisted index; every call is a fresh `rg` invocation scoped by `.gitignore` + an SPK ignore list, so it is correct on a moving codebase and has zero warm-up. Defer AST/LSP precision to a documented future enhancement.

---

## Goal
Make SPK's subagents measurably better-grounded and faster inside large *consumer* codebases by: (G0) shipping a Node+ripgrep `spk-codebase-search` MCP server so `/spk:plan`,`/spk:code`,`/spk:query` can do structured symbol/code search instead of context-burning grep; (G1) putting scoped test/build commands and a `## Code Navigation` block (now pointing at SPK's own search tools + `.claudeignore`) into every primed `AGENTS.md`; (G2) adding a reusable `scoped-tests` skill; (G3) adding a non-blocking self-improving `Stop` hook that proposes (never writes) a `learning` page + AGENTS.md edits at session end.

## Non-Goals
- Integrating Helpline's Python AST MCP, or adding any non-Node runtime (Python/pyright). The MCP we ship is Node-only and shells out to ripgrep.
- A persisted/warmed code index in v1 (index-light = fresh `rg` per call). Revisit if perf demands.
- True AST/LSP-grade symbol resolution in v1 — `find_symbol`/`file_outline` are pattern-based and explicitly labeled best-effort.
- Auto-writing/auto-committing any context file from the Stop hook (propose-only).
- Changing the AGENTS.md-as-source-of-truth / CLAUDE.md-pointer model — it already beats both sources.
- Reworking the 4-orchestrator / 21-agent topology.

## Assumptions
- A1: SPK keeps Node >=20, CommonJS, Jest. Hooks remain process-contract: blocking = stderr + exit 2; non-blocking message to model = `hookSpecificOutput.additionalContext` JSON on stdout + exit 0 (pinned by `tests/hook-output-contract.test.js`).
- A2: Every new skill needs paired files: `plugins/spk/skills/<name>/SKILL.md` (English) and `skills/spk-<name>/SKILL.md` (Thai, no forbidden tokens, Thai chars present) — enforced by `verify:native`.
- A3: Adding a `/scoped-tests` command requires a `manifest.json` `commands` entry and passing `verify:sync`, `regen:check`, `verify:descriptions`.
- A4: A `Stop` hook is wired in `plugins/spk/hooks/hooks.json` under a new `Stop` event and a new script `plugins/spk/scripts/session-reflect.cjs`.
- A5: The scoped-tests skill targets the consuming project's test runner via detection, but ships with a working Jest mapping usable on SPK itself.
- A6 (MCP): Claude Code starts a plugin's MCP server from a `.mcp.json` at the plugin root (`plugins/spk/.mcp.json`) with `command` = `node` and `args` = `["${CLAUDE_PLUGIN_ROOT}/mcp/codebase-search.cjs"]`, transport = stdio. The MCP runs in the *consumer project's* cwd. ripgrep is found via `rg` on PATH (Claude Code ships it) with a `SPK_RG_PATH` override; absence yields a structured error, not a crash. The server respects `.gitignore` (rg default) plus an SPK ignore list; honors `SPK_CODEBASE_SEARCH=off`.
- A7 (MCP discovery): when present, the server's tools surface to subagents (e.g. via ToolSearch as `mcp__spk-codebase-search__search_code`). Agents must prefer them when available and fall back to native Grep/Glob otherwise — never hard-depend.

## Architecture Approach
- **Codebase-search MCP (G0):** a single Node CJS entry `plugins/spk/mcp/codebase-search.cjs` implementing an MCP stdio server (via `@modelcontextprotocol/sdk`, the only new dep — pure JS, already common) with three tools. Each tool builds an `rg` argv, spawns `rg --json`, parses the JSON-lines stream, caps results (default 50, param-overridable), and returns compact `{file,line,col,text}` matches plus a truncation flag. Pure functions for argv-building + JSON-parsing live in a sibling `plugins/spk/mcp/rg.cjs` so they are unit-testable without spawning. Wired via NEW `plugins/spk/.mcp.json`. Kill switch `SPK_CODEBASE_SEARCH=off` makes the server start and report all tools disabled (so discovery degrades cleanly).
- **Hierarchy (G1):** extend the `primer` agent contract + `prime` SKILL.md so each generated `AGENTS.md` includes two new SPK-marked sections: `## Scoped Commands` (test/build/lint for THAT subtree) and `## Code Navigation` (recommend SPK's `search_code`/`find_symbol`/`file_outline` tools for large subtrees + the right `.claudeignore`/ignore entries). Add a staleness note to re-run `/spk:prime <scope>` after structural change. No runtime code; agent-instruction + template + tests.
- **Scoped tests (G2):** new skill `/scoped-tests` backed by the existing `tester` agent. A small Node helper `scripts/scoped-tests.cjs` maps changed files (from `git diff --name-only`) to candidate Jest suites via convention. Emits the focused `jest` invocation. Pure mapping logic, fully unit-testable.
- **Stop hook (G3):** new `Stop` event in `hooks.json` → `session-reflect.cjs`. Non-blocking, propose-only, kill switch `SPK_SESSION_REFLECT=off`. (Unchanged from rev 1.)
- **Agent usage (G0 cross-cutting):** `researcher`, `implementer`, and the orchestrators get a short contract line: *"If `mcp__spk-codebase-search__*` tools are available (discover via ToolSearch), prefer them over raw Grep for code/symbol lookup in large repos; fall back to Grep/Glob when absent."*

## Exact Source Areas
- `plugins/spk/.mcp.json` — NEW (declares the `spk-codebase-search` server; SPK's first MCP wiring).
- `plugins/spk/mcp/codebase-search.cjs` — NEW (MCP stdio server entry: `search_code`, `find_symbol`, `file_outline`).
- `plugins/spk/mcp/rg.cjs` — NEW (pure argv-builders + `rg --json` line parser; no spawning).
- `package.json` — add dependency `@modelcontextprotocol/sdk`; (lockfile updates).
- `manifest.json` — add `/scoped-tests` command entry; (optional) record the MCP server in a new `mcpServers` metadata block if the sync gate is extended (see Task M3).
- `plugins/spk/hooks/hooks.json` — add `Stop` event.
- `plugins/spk/scripts/session-reflect.cjs` — NEW.
- `scripts/scoped-tests.cjs` — NEW (repo-level helper, mirrors `scripts/verify-*.cjs`).
- `plugins/spk/skills/scoped-tests/SKILL.md` + `skills/spk-scoped-tests/SKILL.md` — NEW pair.
- `plugins/spk/agents/primer.md` and `plugins/spk/skills/prime/SKILL.md` — extend contract (G1).
- `plugins/spk/agents/{researcher,implementer,plan-orchestrator,build-orchestrator}.md` — add the prefer-MCP-search contract line (G0).
- `plugins/spk/agents/tester.md` — reference scoped-tests.
- Tests under `tests/`: `mcp-rg.test.js`, `mcp-server-contract.test.js`, `session-reflect.test.js`, `scoped-tests.test.js`, plus updates to `hook-output-contract.test.js`, `native-skills.test.js` (auto via manifest), `command-manifest-sync.test.js`, `skill-descriptions.test.js`, `agent-contracts.test.js`, and a NEW `mcp-manifest.test.js` pinning `.mcp.json` validity.
- Docs: `README.md`, `README-EN.md`, `AGENTS.md` (root + relevant subtrees), `CHANGELOG.md`, regenerated docs via `npm run regen`.

## Verification Gates (run before declaring done)
1. `npm test` — full Jest (must stay green; will be ~28 suites).
2. `npm run verify:release` — all gates + `--runInBand` (manifest validate, regen check, sync, refs, descriptions, agents, grep gates, native).
3. New focused suites pass RED→GREEN as specified per task.
4. Manual (MCP): from a sample large repo, start Claude Code with SPK enabled and confirm `mcp__spk-codebase-search__search_code` returns capped, file+line results; confirm `SPK_CODEBASE_SEARCH=off` disables tools gracefully; confirm a missing `rg` returns a structured error (set `SPK_RG_PATH=/nonexistent`).
5. Manual: run `node scripts/scoped-tests.cjs` on a dirty tree and confirm it emits a correct focused `jest` command.
6. Manual: trigger the `Stop` hook with `SPK_SESSION_REFLECT=off` and confirm zero output + exit 0.

---

## Tasks (bite-sized, TDD)

> **Build order (rev 2):** Tasks **M1–M4 (codebase-search MCP, new rank #1)** land first, then the original Tasks 1–9 (scoped-tests, Stop hook, hierarchy, docs). M-tasks and 1–9 have disjoint files except `manifest.json`/docs (Tasks 3, 8), which is sequenced last.

### Task M1 — ripgrep argv + JSON parser (pure, RED/GREEN)
**Objective:** Pure, spawn-free functions that build `rg` argv and parse `rg --json` output. This is the testable core of the MCP.
**Files:** create `plugins/spk/mcp/rg.cjs`; create `tests/mcp-rg.test.js`.
**RED test (`tests/mcp-rg.test.js`):**
```js
const { buildSearchArgs, parseRgJson } = require('../plugins/spk/mcp/rg.cjs');
test('buildSearchArgs uses --json and caps results', () => {
  const a = buildSearchArgs({ query: 'foo', maxResults: 50, path: 'src' });
  expect(a).toEqual(expect.arrayContaining(['--json', 'foo', 'src']));
});
test('parseRgJson extracts file/line/text from rg match lines', () => {
  const line = JSON.stringify({ type: 'match', data: {
    path: { text: 'src/a.js' }, line_number: 12,
    lines: { text: 'const foo = 1\n' },
    submatches: [{ start: 6, end: 9 }] } });
  const out = parseRgJson(line + '\n');
  expect(out[0]).toMatchObject({ file: 'src/a.js', line: 12, col: 6 });
  expect(out[0].text).toContain('const foo');
});
test('parseRgJson ignores non-match event types', () => {
  const begin = JSON.stringify({ type: 'begin', data: { path: { text: 'x' } } });
  expect(parseRgJson(begin + '\n')).toEqual([]);
});
```
**Verify RED:** `npx jest tests/mcp-rg.test.js` → expected: FAIL "Cannot find module '.../mcp/rg.cjs'".
**GREEN guidance:** implement `buildSearchArgs({query,path,maxResults,literal,glob})` → returns argv array (`--json`, `-m <maxResults>` per-file cap, `-F` when `literal`, `-g <glob>` when set, query, optional path); `buildSymbolArgs(name)` → argv with a regex like `\b(function|class|def|const|let|var|type|interface|struct|fn)\s+${escaped}\b`; `parseRgJson(stdout)` → split lines, JSON.parse each, keep `type==='match'`, map to `{file,line,col,text}` (col from first submatch start), truncate `text` to ~240 chars. No `child_process` import in this file.
**Verify GREEN:** `npx jest tests/mcp-rg.test.js` → expected: 3 passing.
**Docs:** none yet.
**Commit:** `feat(mcp): add pure ripgrep argv builder + json parser`

### Task M2 — MCP stdio server with three tools (RED/GREEN)
**Objective:** Wrap the pure core in an MCP stdio server exposing `search_code`, `find_symbol`, `file_outline`; spawn `rg`; honor kill switch + missing-rg error.
**Files:** create `plugins/spk/mcp/codebase-search.cjs`; create `tests/mcp-server-contract.test.js`; add dep `@modelcontextprotocol/sdk` to `package.json`.
**RED test (`tests/mcp-server-contract.test.js`):** assert the module exports a `createServer()` returning an object whose `listTools()` includes the three tool names, and a `runRg(args, env)` helper that returns `{error:'rg-not-found'}` when `SPK_RG_PATH` points at a nonexistent binary, and `{disabled:true}` for every tool when `SPK_CODEBASE_SEARCH==='off'`.
```js
const srv = require('../plugins/spk/mcp/codebase-search.cjs');
test('exposes the three tools', () => {
  expect(srv.listTools().map(t => t.name).sort())
    .toEqual(['file_outline','find_symbol','search_code']);
});
test('missing rg yields structured error, not a throw', () => {
  expect(srv.runRg(['--json','x'], { SPK_RG_PATH: '/no/such/rg' }))
    .toMatchObject({ error: 'rg-not-found' });
});
test('kill switch disables tools', () => {
  expect(srv.toolsEnabled({ SPK_CODEBASE_SEARCH: 'off' })).toBe(false);
});
```
**Verify RED:** `npx jest tests/mcp-server-contract.test.js` → expected: FAIL (module/exports missing).
**GREEN guidance:** import `@modelcontextprotocol/sdk` server + stdio transport; register three tools whose handlers call `buildSearchArgs`/`buildSymbolArgs` (M1) then `runRg` (spawnSync `rg` resolved from `SPK_RG_PATH||'rg'`, cwd = consumer project, timeout, capture stdout); on ENOENT return `{error:'rg-not-found', hint:'install ripgrep or set SPK_RG_PATH'}`; `file_outline` runs a symbol regex scoped to one file path; gate all handlers behind `toolsEnabled(env)`; export `createServer`, `listTools`, `runRg`, `toolsEnabled` for tests, and start the transport only when `require.main === module`.
**Verify GREEN:** `npx jest tests/mcp-server-contract.test.js` → expected: 3 passing. Then `npm install` to lock the new dep.
**Docs:** none yet.
**Commit:** `feat(mcp): add spk-codebase-search stdio server (search_code/find_symbol/file_outline)`

### Task M3 — Wire the server via plugin manifest (RED/GREEN)
**Objective:** Ship the server so Claude Code auto-starts it for consumer projects; pin `.mcp.json` validity.
**Files:** create `plugins/spk/.mcp.json`; create `tests/mcp-manifest.test.js`. (If `verify:sync`/`validate:manifest` are extended to know about MCP, also add an `mcpServers` note to `manifest.json` + `schemas/`.)
**RED test (`tests/mcp-manifest.test.js`):**
```js
const fs = require('fs'), path = require('path');
const mcp = JSON.parse(fs.readFileSync(
  path.join(__dirname,'..','plugins','spk','.mcp.json'),'utf-8'));
test('declares spk-codebase-search over stdio node entry', () => {
  const s = mcp.mcpServers['spk-codebase-search'];
  expect(s.command).toBe('node');
  expect(s.args[0]).toMatch(/\$\{CLAUDE_PLUGIN_ROOT\}\/mcp\/codebase-search\.cjs/);
});
test('entry file referenced by manifest exists', () => {
  expect(fs.existsSync(path.join(__dirname,'..','plugins','spk','mcp','codebase-search.cjs')))
    .toBe(true);
});
```
**Verify RED:** `npx jest tests/mcp-manifest.test.js` → expected: FAIL (`.mcp.json` missing).
**GREEN guidance:** write `plugins/spk/.mcp.json`:
```json
{ "mcpServers": { "spk-codebase-search": {
  "command": "node",
  "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/codebase-search.cjs"]
}}}
```
Confirm Claude Code resolves a plugin-root `.mcp.json` (per [plugins reference](https://code.claude.com/docs/en/plugins-reference)). Keep `manifest.json` as the source-of-truth version; only extend it/`verify:sync` if you want the MCP server listed there too (optional — defer unless the sync gate demands it).
**Verify GREEN:** `npx jest tests/mcp-manifest.test.js` → expected: 2 passing. Then `npm run verify:release` to confirm no existing gate regresses.
**Docs:** none yet (Task 8).
**Commit:** `feat(mcp): wire spk-codebase-search via plugin .mcp.json`

### Task M4 — Agents prefer MCP search, fall back to grep (RED/GREEN)
**Objective:** Make `researcher`, `implementer`, and orchestrators use the search tools when discoverable; never hard-depend.
**Files:** edit `plugins/spk/agents/researcher.md`, `plugins/spk/agents/implementer.md`, `plugins/spk/agents/plan-orchestrator.md`, `plugins/spk/agents/build-orchestrator.md`; extend `tests/agent-contracts.test.js`.
**RED test (add to `tests/agent-contracts.test.js`):**
```js
test('search-aware agents reference spk-codebase-search with grep fallback', () => {
  for (const f of ['researcher','implementer','plan-orchestrator','build-orchestrator']) {
    const t = fs.readFileSync(path.join(AGENTS_DIR, f + '.md'),'utf-8');
    expect(t).toMatch(/spk-codebase-search|codebase-search/i);
    expect(t).toMatch(/fall ?back|when (?:absent|unavailable)|Grep/i);
  }
});
```
**Verify RED:** `npx jest tests/agent-contracts.test.js` → expected: FAIL on the new assertion.
**GREEN guidance:** add one contract line to each agent: *"For code/symbol lookup in large repos, prefer the `mcp__spk-codebase-search__*` tools when available (discover via ToolSearch); fall back to Grep/Glob when absent. Never block on the MCP."* Preserve each agent's Completion Status Protocol block.
**Verify GREEN:** `npx jest tests/agent-contracts.test.js` → expected: pass.
**Docs:** none yet (Task 8).
**Commit:** `feat(agents): prefer spk-codebase-search with graceful grep fallback`

### Task 1 — Scoped-tests mapping helper (RED/GREEN)
**Objective:** Map changed files to relevant Jest suites; emit a focused `jest` command.
**Files:** create `scripts/scoped-tests.cjs`; create `tests/scoped-tests.test.js`.
**RED test (`tests/scoped-tests.test.js`):**
```js
const { mapToSuites } = require('../scripts/scoped-tests.cjs');
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
test('unknown path falls back to empty (caller runs full suite)', () => {
  expect(mapToSuites(['README.md'])).toEqual([]);
});
```
**Verify RED:** `npx jest tests/scoped-tests.test.js` → expected: FAIL "Cannot find module '../scripts/scoped-tests.cjs'".
**GREEN guidance:** implement `mapToSuites(changedPaths)` with rules: `scripts/<n>.cjs` → `tests/<n>.test.js` if it exists; `manifest.json` → the three manifest/sync suites; `plugins/spk/agents/*` → `tests/agent-*.test.js`; `plugins/spk/skills/*` or `skills/*` → `tests/native-skills.test.js` + `tests/skill-descriptions.test.js`; `plugins/spk/scripts/<n>.cjs` → `tests/<n>.test.js`. Export `mapToSuites` and a `main()` that prints `npx jest <suites...>` (or `echo "no scoped suites; run npm test"` when empty) from `git diff --name-only HEAD`.
**Verify GREEN:** `npx jest tests/scoped-tests.test.js` → expected: 3 passing.
**Docs:** none yet.
**Commit:** `feat(scripts): add scoped-tests change-to-suite mapper`

### Task 2 — Scoped-tests skill pair (English + Thai)
**Objective:** Ship `/scoped-tests` as a reusable skill backed by the `tester` agent.
**Files:** create `plugins/spk/skills/scoped-tests/SKILL.md` (English, frontmatter `description:` + `argument-hint:`); create `skills/spk-scoped-tests/SKILL.md` (Thai body, no forbidden tokens, contains Thai chars).
**RED test:** rely on existing `tests/native-skills.test.js` + `tests/skill-descriptions.test.js`. After Task 3 adds the manifest entry, run `npx jest tests/native-skills.test.js` → expected initially: FAIL `/scoped-tests has a native SKILL.md` (until both files exist). Create files to satisfy.
**GREEN guidance:** SKILL.md workflow: detect runner (Jest/pytest/go test) from manifests; for Jest projects, run `node scripts/scoped-tests.cjs` to get the focused command; if mapper returns empty, fall back to full suite; report which suites ran and why. Thai copy mirrors content with no `Task(`/`spk:`/`plugin` tokens.
**Verify GREEN:** `npx jest tests/native-skills.test.js tests/skill-descriptions.test.js` → expected: pass for `scoped-tests`.
**Docs:** none yet.
**Commit:** `feat(skills): add /scoped-tests skill (en + native)`

### Task 3 — Register /scoped-tests in manifest
**Objective:** Wire the command so sync gates and docs include it.
**Files:** edit `manifest.json` (`commands` array, `{"name":"/scoped-tests","agent":"tester"}`).
**RED:** `npx jest tests/command-manifest-sync.test.js` → expected: FAIL (skill present but manifest entry missing OR vice-versa, depending on order) — confirms the gate sees the mismatch.
**GREEN guidance:** add the command entry; run `npm run regen` to regenerate docs; ensure `skills/spk-scoped-tests` slug matches `spk-scoped-tests` expectation in `native-skills.test.js`.
**Verify GREEN:** `npm run verify:sync && npx jest tests/command-manifest-sync.test.js tests/native-skills.test.js` → expected: pass.
**Docs:** `npm run regen` updates generated docs.
**Commit:** `feat(manifest): register /scoped-tests command`

### Task 4 — Session-reflect Stop hook (RED/GREEN, non-blocking)
**Objective:** Propose-only session reflection on `Stop`; never writes context files; honors kill switch.
**Files:** create `plugins/spk/scripts/session-reflect.cjs`; create `tests/session-reflect.test.js`.
**RED test (`tests/session-reflect.test.js`):**
```js
const { spawnSync } = require('child_process');
const path = require('path');
const SCRIPT = path.join(__dirname,'..','plugins','spk','scripts','session-reflect.cjs');
function run(event, env={}) {
  return spawnSync('node',[SCRIPT],{input:JSON.stringify(event),encoding:'utf-8',
    env:{...process.env,...env}});
}
test('kill switch yields no output and exit 0', () => {
  const r = run({hook_event_name:'Stop'}, {SPK_SESSION_REFLECT:'off'});
  expect(r.status).toBe(0); expect(r.stdout).toBe(''); expect(r.stderr).toBe('');
});
test('emits additionalContext JSON on stdout, exit 0', () => {
  const r = run({hook_event_name:'Stop'});
  expect(r.status).toBe(0);
  const out = JSON.parse(r.stdout);
  expect(out.hookSpecificOutput.additionalContext).toMatch(/learning|AGENTS\.md|reflect/i);
});
```
**Verify RED:** `npx jest tests/session-reflect.test.js` → expected: FAIL (module missing).
**GREEN guidance:** read JSON event from stdin; if `SPK_SESSION_REFLECT==='off'` exit 0 silently; otherwise print `{"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"<short suggestion to capture a learning page + name any AGENTS.md that may be stale; propose-only, no writes>"}}` to stdout and exit 0. Never write context files. Optional: idempotent hash-guarded append to `ai_context/wiki/log.md` recording the offer (guard behind `CLAUDE_PROJECT_DIR` existing).
**Verify GREEN:** `npx jest tests/session-reflect.test.js` → expected: 2 passing.
**Docs:** none yet.
**Commit:** `feat(hooks): add propose-only session-reflect Stop hook`

### Task 5 — Wire Stop hook into hooks.json + pin contract
**Objective:** Register the `Stop` event and pin its process contract.
**Files:** edit `plugins/spk/hooks/hooks.json` (add `Stop` array → `node ${CLAUDE_PLUGIN_ROOT}/scripts/session-reflect.cjs`); edit `tests/hook-output-contract.test.js` (add a `Stop` case asserting stdout JSON + exit 0).
**RED:** add the contract test first → `npx jest tests/hook-output-contract.test.js` → expected: PASS only after Task 4 exists; if hooks.json wiring is asserted by a config test, run `npx jest tests/hook-output-contract.test.js` → expected: the new Stop assertion FAILS until the case/script align.
**GREEN guidance:** add the `Stop` block to `hooks.json`; confirm JSON validity; the contract test asserts non-blocking stdout shape.
**Verify GREEN:** `npx jest tests/hook-output-contract.test.js` → expected: all pass.
**Docs:** none yet.
**Commit:** `feat(hooks): wire Stop event for session-reflect`

### Task 6 — Primer: scoped commands + code-navigation sections
**Objective:** Make every primed `AGENTS.md` carry subtree-scoped test/build/lint commands and a `.claudeignore`/LSP recommendation block.
**Files:** edit `plugins/spk/agents/primer.md` (template + workflow); edit `plugins/spk/skills/prime/SKILL.md` (dispatch prompt); edit `skills/spk-prime/SKILL.md` (Thai mirror); create `tests/primer-contract.test.js` asserting the agent file mentions `## Scoped Commands` and `## Code Navigation` and `.claudeignore`.
**RED test:**
```js
const fs=require('fs'),path=require('path');
const primer=fs.readFileSync(path.join(__dirname,'..','plugins','spk','agents','primer.md'),'utf-8');
test('primer template includes scoped commands + code nav', () => {
  expect(primer).toMatch(/## Scoped Commands/);
  expect(primer).toMatch(/## Code Navigation/);
  expect(primer).toMatch(/\.claudeignore/);
});
```
**Verify RED:** `npx jest tests/primer-contract.test.js` → expected: FAIL (sections absent).
**GREEN guidance:** add the two sections to the primer's `## Context File Template`; instruct the agent to fill subtree-specific commands and, in `## Code Navigation`, point agents at SPK's own `mcp__spk-codebase-search__*` tools for large subtrees (with `.claudeignore`/ignore entries) rather than a third-party server; update both SKILL.md dispatch prompts to mention the new sections. Keep AGENTS.md 80–150 lines.
**Verify GREEN:** `npx jest tests/primer-contract.test.js` → expected: pass.
**Docs:** none yet (regen in Task 8).
**Commit:** `feat(primer): emit scoped commands + code-navigation in AGENTS.md`

### Task 7 — Tester agent references scoped-tests
**Objective:** Make the `tester` agent prefer scoped runs in the inner loop.
**Files:** edit `plugins/spk/agents/tester.md`; extend `tests/agent-contracts.test.js` (assert tester mentions scoped/focused tests).
**RED:** `npx jest tests/agent-contracts.test.js` → expected: FAIL on the new assertion.
**GREEN guidance:** add a line: prefer `/scoped-tests` (or `node scripts/scoped-tests.cjs`) for the inner loop; always run the full suite before sign-off. Keep the Completion Status Protocol intact.
**Verify GREEN:** `npx jest tests/agent-contracts.test.js` → expected: pass.
**Commit:** `feat(tester): prefer scoped tests in the inner loop`

### Task 8 — Docs sync, root AGENTS.md, changelog, regen
**Objective:** Bring all docs in line with shipped behavior.
**Files:** edit `README.md`, `README-EN.md` (document `/scoped-tests`, Stop hook, richer prime); edit root `AGENTS.md` + `tests/AGENTS.md` (add scoped-test command note); edit `CHANGELOG.md` (Unreleased section); run `npm run regen`.
**RED:** `npm run regen:check` → expected: FAIL "docs out of date" until regenerated.
**GREEN guidance:** update prose, then `npm run regen`; ensure `regen:check` is clean.
**Verify GREEN:** `npm run regen:check` → expected: pass (no diff).
**Commit:** `docs: document scoped-tests, session-reflect, and richer prime`

### Task 9 — Full release gate + manual verification
**Objective:** Prove the whole change set is green and contracts hold.
**Files:** none (verification only).
**Verify:** `npm run verify:release` → expected: all gates pass, all suites green. Then manual checks #4 and #5 from Verification Gates.
**Commit:** none (or a single `chore: pass full release gate` if a lockfile/regen touch is needed).

---

## Docs Updates
- `README.md` / `README-EN.md`: NEW `spk-codebase-search` MCP server (tools, when it activates, `SPK_CODEBASE_SEARCH`/`SPK_RG_PATH` env, ripgrep requirement); new `/scoped-tests` command; Stop-hook self-improvement loop; richer `/prime` output.
- Root `AGENTS.md` + `tests/AGENTS.md` + `plugins/spk/AGENTS.md`: document the new `plugins/spk/mcp/` subtree and `.mcp.json`; scoped-test command guidance (dogfood the hierarchy upgrade).
- `CHANGELOG.md`: Unreleased entry covering all four shipped improvements, including SPK's **first** shipped MCP server and the corrected build-vs-integrate decision (Node+ripgrep, not Helpline's Python AST server).
- Regenerated docs via `npm run regen` (the `regen:check` gate enforces freshness).

## Rollout / Rollback
- **Rollout:** ship as a minor release (v3.3.0) once `verify:release` passes; bump all synced version fields together (`manifest.json`, `package.json`, `package-lock.json`, `plugins/spk/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`). New runtime surfaces and their switches: the **MCP server** (default on; `SPK_CODEBASE_SEARCH=off` disables all tools; degrades to native Grep when `rg` is absent) and the **Stop hook** (`SPK_SESSION_REFLECT=off`, propose-only). The MCP server starts per consumer session; startup is cheap (no index), but if a consumer has issues they can disable it without uninstalling SPK. Consider gating the MCP behind its own patch follow-up if you want the smallest blast radius (see Open Questions Q4).
- **Rollback:** every new surface is independently reversible. MCP: set `SPK_CODEBASE_SEARCH=off` or remove `plugins/spk/.mcp.json` (server simply stops being advertised; agents fall back to Grep — Task M4 guarantees this). Stop hook: `SPK_SESSION_REFLECT=off` or remove the `Stop` block. Scoped-tests + primer changes are additive instructions; reverting the commits removes them with no migration. No persisted state anywhere, so no cleanup. The new `@modelcontextprotocol/sdk` dependency is the only `package.json` change to revert.

## Risks
- R1 (MCP startup / lifecycle): a per-session server that fails to start could degrade the SPK experience in consumer repos. Mitigation: pure-function core is unit-tested (M1); server returns structured errors instead of throwing (M2); agents never hard-depend (M4); kill switch `SPK_CODEBASE_SEARCH=off`.
- R2 (ripgrep dependency): consumers without `rg` on PATH get no search. Mitigation: Claude Code ships `rg`; `SPK_RG_PATH` override; missing-rg returns `{error:'rg-not-found', hint:...}`; agents fall back to native Grep.
- R3 (Windows / cross-platform): `rg --json` argv quoting and path separators differ on Windows. Mitigation: pass args as an array via spawnSync (no shell); normalize `path.text` separators in `parseRgJson`; add a Windows-path test case to `tests/mcp-rg.test.js` before release.
- R4 (Pattern-based symbol search false hits): `find_symbol`/`file_outline` are regex, not AST, so they can miss/over-match (the precision gap the article warns about). Mitigation: label tools "best-effort, pattern-based" in their MCP descriptions; document AST/LSP as a future enhancement; `search_code` (the precise one) covers the common case.
- R5 (New dependency supply chain): `@modelcontextprotocol/sdk` is a new third-party dep. Mitigation: pin exact version; it is the official MCP SDK; CSO/security gate before release.
- R6 (Stop-hook noise): reflection prompts could annoy users. Mitigation: propose-only, concise, only when source/AGENTS/skills changed; kill switch; idempotent log note.
- R7 (Scoped-test false-negatives): a too-narrow mapping skips a suite. Mitigation: empty map → caller runs full suite; `tester` runs full suite before sign-off; `verify:release` unchanged.
- R8 (Sync-gate breakage): adding a command + an MCP manifest touches synced files. Mitigation: Task 3 runs `verify:sync` + regen; Task M3 adds `tests/mcp-manifest.test.js`; native-skill gates covered by Task 2.
- R9 (Hook contract drift): Stop hook must match stdout-JSON-on-exit-0 or it is invisible. Mitigation: Task 5 pins it in `hook-output-contract.test.js`.
- R5 (Scope creep toward MCP): pressure to "just add the MCP server." Mitigation: documented rejection + cheaper `.claudeignore`/LSP-recommendation substitute.

## Open Questions
- Q-MCP-1 (RESOLVED — build vs integrate): **Build** a Node+ripgrep server, do **not** integrate Helpline's Python AST MCP (wrong runtime) and do not pull a third-party Node OSS server (support/supply-chain cost > thin rg wrapper). Rationale recorded in "Build vs Integrate" above.
- Q-MCP-2: Should `file_outline`/`find_symbol` graduate from regex to true AST/LSP precision in a later release (the article's strongest point), and if so via tree-sitter (Node bindings, still no extra runtime) rather than pyright? Plan ships regex v1; tree-sitter is the documented upgrade path.
- Q-MCP-3: Should the MCP also expose a `list_files`/`grep_count` helper for cheap repo-shape questions, or keep the surface to three tools in v1? Plan keeps three.
- Q-MCP-4: Default result cap (50) and per-file match cap — confirm with a maintainer sweep on a real 100k-file monorepo so we don't truncate usefully or flood context.
- Q1: Should `Stop` reflection ever write a *draft* `learning` page to `ai_context/wiki/learnings/` (still requiring user commit), or stay strictly stdout-suggestion-only? Plan assumes suggestion-only.
- Q2: For non-Jest user projects, should `scoped-tests.cjs` detect pytest/go and emit their focused commands in v1, or ship Jest-only first and broaden later? Plan ships Jest-first with a detection seam.
- Q4: Target release — fold the MCP, scoped-tests, hierarchy, and Stop hook into one v3.3.0, or split the two new *runtime* surfaces (MCP server + Stop hook) into their own patch for the smallest blast radius and cleanest rollback? Plan leans one v3.3.0 but flags the split option.
