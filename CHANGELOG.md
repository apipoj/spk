# Changelog

## Unreleased

## 3.3.2 - 2026-06-10

Patch: fix `/spk:prime` trusting stale context files instead of reading the source.

### Fixed
- `spk:primer` / `/spk:prime` no longer carries claims forward from a pre-existing `AGENTS.md`/`CLAUDE.md`/`README` as if true. It now **grounds every claim in source read this run** — existing context files are treated as unverified hints, each fact is re-derived from the code/`manifest.json`/tree, the source wins on any conflict, and unverifiable claims are dropped rather than propagated. This was producing wrong context (e.g. stale version/skill counts) on repos that already had a context file.
- The primer no longer bakes volatile facts (version, skill/agent/command counts) into `AGENTS.md` prose; it points at `manifest.json` (the source of truth) instead, so the file can't go stale on the next release.

### Added
- The prime report now includes a **Corrections** list naming every stale claim the source contradicted (`corrected <topic>: file said "<A>", source shows "<B>"` / `dropped <claim>: could not verify`), so overrides are visible instead of silent.

### Release
- Bumped `manifest.json`, `.claude-plugin/marketplace.json`, `plugins/spk/.claude-plugin/plugin.json`, `package.json`, and `package-lock.json` to `3.3.2`.

## 3.3.1 - 2026-06-10

Patch: fix a functional regression in the codebase-search MCP found by live dogfooding right after 3.3.0.

### Fixed
- `spk-codebase-search`: `search_code` and `find_symbol` called **without** a `path` argument returned zero matches. With no positional path ripgrep reads stdin, and the MCP server's stdin is the JSON-RPC channel (a non-tty pipe), so it searched 0 bytes. The builders now default the positional to the project root (`.`, escape-safe via the existing containment check) so pathless queries recurse the repo, and `runRg` passes an empty stdin defensively. New tests reproduce the exact empty-stdin server condition (and the previously env-skipped live-search test now runs — 0 skipped).

### Release
- Bumped `manifest.json`, `.claude-plugin/marketplace.json`, `plugins/spk/.claude-plugin/plugin.json`, `package.json`, and `package-lock.json` to `3.3.1`.

## 3.3.0 - 2026-06-10

Large-codebase support: SPK ships its own `spk-codebase-search` MCP server so subagents navigate big consumer repos without burning context on grep, plus a scoped-test inner loop, a richer prime, and a propose-only session-reflect hook. Learned from coleam00/helpline and Anthropic's "Claude Code in large codebases" guide.

### Added
- **`spk-codebase-search` MCP server** (`plugins/spk/mcp/`, wired via `plugins/spk/.mcp.json`): a zero-dependency, ripgrep-backed stdio server shipped to consumer projects, exposing `search_code`, `find_symbol`, and `file_outline`. Index-light (no build step), bounded output (global result cap), and disabled with `SPK_CODEBASE_SEARCH=off`. `spk:researcher`, `spk:implementer`, and the orchestrators prefer it when present and fall back to Grep/Glob otherwise.
- `/spk:scoped-tests` command (backed by the `tester` agent) plus `scripts/scoped-tests.cjs`: maps changed files to the relevant Jest suites for a fast inner loop, falls back to the full suite when a file cannot be confidently scoped, and reports which suites ran vs which changes were skipped. Native Thai copy `skills/spk-scoped-tests/`.
- `session-reflect` Stop hook: at session end it reflects while context is fresh and **proposes** (never writes) capturing a `learning` wiki page and re-priming any `AGENTS.md` whose subtree changed. Non-blocking, read-only, propose-only; disable with `SPK_SESSION_REFLECT=off`.

### Changed
- `spk:primer` + `/spk:prime` now emit richer `AGENTS.md`: a `## Scoped Commands` section (subtree-scoped test/build/lint), a `## Code Navigation` section pointing at the `spk-codebase-search` tools with a Grep/Glob fallback, a root `.claudeignore` for search-noise reduction, and a staleness re-prime note.
- The `tester` agent prefers a scoped run in the inner loop and always runs the full suite before sign-off.

### Security
- The codebase-search MCP receives model-controlled input, so it is hardened against four classes of attack, each with regression tests and verified by live exploit attempts: ripgrep argument injection (`--`/`--no-config`/flag-like rejection blocking `--pre` RCE), arbitrary file read via absolute/`../` path arguments (project-root containment), in-root symlinks escaping the root (realpath containment), and unbounded output (per-file + authoritative global result cap).

### Release
- Bumped `manifest.json`, `.claude-plugin/marketplace.json`, `plugins/spk/.claude-plugin/plugin.json`, `package.json`, and `package-lock.json` to `3.3.0` so `/plugin update` delivers the MCP server and scoped-test loop.

## 3.2.0 - 2026-06-10

One-command onboarding: `/spk:jumpstart` takes a new user from install to a reviewed plan on their real project with one question and one confirmation.

### Added
- `/spk:jumpstart` wizard: primes the repo via `spk:primer` when `AGENTS.md` is missing, asks one goal question (feature/bug/UI, with a default route for anything else), routes to `spk:plan-orchestrator` / `spk:debugger` / `spk:designer`, presents the first win, and requires one explicit confirmation before any code is written. Goal can be passed inline (`/spk:jumpstart <goal>`).
- Native Thai standalone copy `skills/spk-jumpstart/`.
- "เริ่มใน 60 วินาที / Start in 60 seconds" section in both READMEs and an onboarding entry in INSTALL_FOR_AGENTS.md.

### Release
- Bumped `manifest.json`, `.claude-plugin/marketplace.json`, `plugins/spk/.claude-plugin/plugin.json`, `package.json`, and `package-lock.json` to `3.2.0` so `/plugin update` delivers the wizard.

## 3.1.6 - 2026-06-10

Opus agents move to `claude-opus-4-8`, hooks now speak Claude Code's output contract, and a new HTTP-revalidated WebFetch cache speeds up research flows.

### Added
- `webfetch-cache` hook: WebFetch responses are cached per URL and served only after the origin confirms `304 Not Modified` via ETag/Last-Modified revalidation. Entries without validators are never cached; disable with `SPK_WEBFETCH_CACHE=off`.
- Anti-slop design gates in `spk:designer` and the native `spk-design-shotgun` skill, distilled from Together AI's MIT-licensed hallmark skill.
- Hooks section and SSH-clone install fallback documented in both READMEs.
- CI: plugin-install smoke test that validates, installs, and version-checks `spk@spk` with the real Claude Code CLI; weekly scheduled run plus manual dispatch.

### Changed
- All 10 Opus agents (4 orchestrators plus prd-writer, business-analyst, architect, planner, debugger, code-auditor) upgraded from `claude-opus-4-7` to `claude-opus-4-8`; the manifest schema enum now rejects the old ID.
- CI actions bumped to `actions/checkout@v6` and `actions/setup-node@v6` (Node 24-ready).

### Fixed
- `wiki-secret-scan` and `gitignore-guard` block reasons now reach the model (stderr on exit 2 instead of stdout JSON, which Claude Code ignores on exit 2).
- `auto-ingest`'s `/spk:ingest` nudge now uses `hookSpecificOutput.additionalContext`, so the model actually sees it instead of it landing in verbose-only stderr.

### Release
- Bumped `manifest.json`, `.claude-plugin/marketplace.json`, `plugins/spk/.claude-plugin/plugin.json`, `package.json`, and `package-lock.json` to `3.1.6` so `/plugin update` delivers the model upgrade and hook fixes.

## 3.1.5 - 2026-05-19

Prime context-file behavior now avoids drift between Claude Code and other agent tools by making `AGENTS.md` canonical and `CLAUDE.md` a one-line pointer.

### Changed
- Updated `/spk:prime` dispatch and `spk:primer` instructions so repo priming creates or updates `AGENTS.md` as the single source of truth.
- `CLAUDE.md` files generated next to `AGENTS.md` must now contain only `@AGENTS.md`, with migration guidance for existing substantive `CLAUDE.md` content.
- Updated the native `/spk-prime` skill and README highlights to document the same canonical context-file pattern.

### Release
- Bumped `manifest.json`, `.claude-plugin/marketplace.json`, `plugins/spk/.claude-plugin/plugin.json`, `package.json`, and `package-lock.json` to `3.1.5` so `/plugin update` receives the primer behavior change.

## 3.1.4 - 2026-05-12

Packaging hotfix: quote `/spk:design-shotgun` frontmatter so Claude Code plugin validation can parse the skill metadata during release tagging.

### Release
- Bumped `manifest.json`, `.claude-plugin/marketplace.json`, and `plugins/spk/.claude-plugin/plugin.json` to `3.1.4` because `3.1.3` briefly reached `main`; this guarantees `/plugin update` sees a newer version even for users who updated during that window.

## 3.1.3 - 2026-05-12

Hotfix: make git pre-computed context optional so SPK skills still run outside git worktrees.

### Fixed
- Guarded all plugin skill pre-compute git probes with `git rev-parse --is-inside-work-tree` checks, so `/spk:bala`, `/spk:plan`, `/spk:code`, `/spk:review`, `/spk:debug`, `/spk:pr`, `/spk:deploy`, and related skills report unavailable git context instead of failing before the workflow starts.
- Updated native Thai skill playbooks to treat git context as optional.
- Added a regression test that executes every git-related plugin pre-compute command from a temporary non-git directory.

### Release
- Bumped `manifest.json`, `.claude-plugin/marketplace.json`, and `plugins/spk/.claude-plugin/plugin.json` to `3.1.3` so Claude Code users can receive the fix through `/plugin update`.

### Added
- Native standalone skill copies under `skills/spk-<slug>/SKILL.md` for all 15 manifest skills - self-contained playbooks written in Thai that work without the Claude Code plugin, subagents, or `Task()` dispatch. Each native skill runs as a direct main-thread workflow and is invoked as `/spk-bala`, `/spk-code`, etc.
- `scripts/verify-native-skills.cjs` - verifies native skills exist (spk-prefixed), have valid frontmatter, contain Thai content signal, and contain no forbidden plugin/subagent dependency tokens (`Task(`, `subagent_type`, `spk:`, etc.).
- `npm run verify:native` - convenience script for native skill verification.
- `tests/native-skills.test.js` - Jest test suite covering native skill existence (spk-prefixed), frontmatter validity, Thai content signal, forbidden token checks, and orphan directory detection.
- Native skills renamed from `skills/<slug>/` to `skills/spk-<slug>/` with `/spk-*` command names and Thai-language descriptions and workflows.
- `/spk:design-shotgun` skill + `spk:designer` specialist for GStack-style visual brainstorming: multiple distinct UI variants, local comparison board, structured feedback, and approved design direction before implementation.
- `/spk:sunzi` skill that adapts Sun Tzu (ซุนวู) into a practical strategy lens for choosing battles, terrain, leverage, and the smallest winning move.
- `/spk:bala` skill that adapts the Buddhist Five Powers (พละ 5) into a practical subagent balance check: confidence, energy, mindfulness, concentration, and wisdom.
- Skills-first/subagent repo banner image at `assets/repo-banner.png` and README embeds for Thai/English READMEs.
- `/spk:debug` command that routes directly to `spk:debugger` with a systematic root-cause workflow: reproduce, compare patterns, test one hypothesis at a time, then recommend the smallest fix + regression test.
- `/spk:pr` command + `spk:pr-manager` Sonnet specialist for safe GitHub PR lifecycle: prepare-only default, branch hygiene, reviewed staging, staged-diff secret scan, conventional PR body, explicit confirmation before push/GitHub writes, and CI follow-up.
- Strengthened `/spk:plan`, `/spk:tdd`, and `/spk:review` with imported SPK-style playbooks for bite-sized plans, RED-GREEN-REFACTOR, severity-ranked review, docs drift, and verification gates.
- Shared subagent orchestration contract across plan/build/audit/deploy orchestrators: self-contained prompts, safe parallelism, BLOCKED retry rules, aggregation discipline, and verifier gate before done.
- `/spk:prime` command + `spk:primer` Sonnet specialist to scan source-code roots and create/update local `CLAUDE.md` and `AGENTS.md` context files for downstream subagents.

## 3.1.2 - 2026-04-19

Hotfix (part 2): prefix `spk:` to ALL agent-name references inside plugin files, not just `Task()` dispatches.

### Fixed
- v3.1.1 fixed the programmatic dispatches. But prose mentions like "Delegate to `plan-orchestrator`" and skill descriptions like "Plan a feature via plan-orchestrator" still used bare names. Claude Code's main-thread reads these to pick agents and may dispatch with the literal bare name → fail.
- Now every backtick-quoted agent name + every description-field mention + every arrow-chain ("prd-writer → business-analyst → ...") uses the `spk:` namespace.

### Lesson (saved to memory)
The auto-namespace prefix must appear in ALL agent references inside plugin files, not just programmatic `Task()` calls. Prose in `description:` frontmatter and workflow text gets read for routing, not just display.

## 3.1.1 - 2026-04-19

Hotfix: prefix all `Task(subagent_type=...)` dispatches with `spk:` namespace.

### Fixed
- Install reported `Agent type 'plan-orchestrator' not found` - plugin agents are auto-namespaced as `spk:<name>`, so skills and orchestrators must dispatch with the namespaced form. All 8 skills + 4 orchestrators updated.

### Lesson
Auto-namespacing applies to the dispatch lookup, not just the UI label. When referencing plugin agents from within plugin skills/agents, always use the fully qualified `spk:<name>`.

## 3.1.0 - 2026-04-19

**Major pivot:** SPK now ships as a Claude Code plugin. Hot-reloads in your session; no restart.

### Install (new)

```
/plugin marketplace add apipoj/spk
/plugin install spk@spk
```

### Added
- `.claude-plugin/marketplace.json` at repo root + `plugins/spk/.claude-plugin/plugin.json`
- Correct `plugins/spk/hooks/hooks.json` format (matcher + command objects) - v3.0.x hook config used a deprecated flat-string-array format that never fired
- `plugins/spk/scripts/init-ai-context.cjs` - `SessionStart` hook scaffolds `ai_context/wiki/` + `sources/` into the user project (version-aware, idempotent)
- 18 agents relocated to `plugins/spk/agents/`; auto-namespaced as `spk:planner`, `spk:architect`, etc.
- 9 skills at `plugins/spk/skills/<name>/SKILL.md` (replacing flat `commands/`); invoked as `/spk:plan`, `/spk:code`, etc.

### Changed (breaking vs v3.0.x)
- **Install**: paste-install → `/plugin install spk@spk`. Legacy paste pinned at `v3.0.2`.
- **Agent names**: `spk-planner` → `planner` (plugin auto-prepends `spk:` namespace)
- **Command invocation**: `/spk-plan` → `/spk:plan`
- **Hook format**: flat `["./path.cjs"]` → `{matcher, hooks: [{type, command}]}` - this fixes a silent bug where v3.0.x hooks never actually ran

### Fixed
- Hooks now actually fire (v3.0.x bug: flat-string-array format was ignored by Claude Code)
- Reload-after-install friction gone (plugin hot-reloads)
- Agent-name collisions with user-defined agents (handled via plugin's `spk:` namespace)

### Migration from v3.0.x

1. Remove old files: `rm -rf .claude/agents/spk-* .claude/commands/spk-* .claude/hooks/*/wiki-* .claude/hooks/*/gitignore-* .claude/hooks/*/auto-ingest*`
2. Install the plugin:
   ```
   /plugin marketplace add apipoj/spk
   /plugin install spk@spk
   ```
3. `ai_context/wiki/` + `ai_context/sources/` preserved - user data untouched.

## 3.0.2 - 2026-04-19

Patch: ship `spk-devops` agent that was previously referenced by `spk-deploy-orchestrator` but missing from the manifest.

### Added
- `spk-devops` - Sonnet 4.6 specialist for CI/CD setup, deployment scripts, infrastructure config. Shipping phase (orange).

### Fixed
- Install feedback reported `spk-deploy-orchestrator references a devops agent that isn't shipped` - gap closed.

## 3.0.1 - 2026-04-18

Patch: prefix all 17 SPK agents with `spk-` to prevent collisions with user-defined agents in target projects.

### Changed (breaking, but no known affected users)
- All 17 agent names prefixed: `planner` → `spk-planner`, `architect` → `spk-architect`, etc.
- Orchestrator prompts, command dispatches, RESOLVER updated to use new names.
- manifest.json `agents[].name` and `commands[].orchestrator`/`commands[].agent` updated.

### Rationale
Common unprefixed names (planner, architect, debugger, researcher, tester) are high collision risk with users' existing agents. Since v3.0.0 shipped with zero external installs, patching in v3.0.1 before adoption was cheaper than waiting for v3.1.

## 3.0.0 - 2026-04-19

First production release of SPK v3.

### Added (beyond alpha)
- Complete `INSTALL_FOR_AGENTS.md` - agent-directed paste install with v2 migration + smoke test
- `scripts/install/migrate-v2.cjs` - splits v2 memory files into wiki pages (8 tests)
- `scripts/install/smoke-test.cjs` - structural post-install verification (5 tests)
- `scripts/install/uninstall.cjs` - clean removal preserving user data (8 tests)

### Feature-complete
- Paste one line into any Claude Code project → full install < 5 min
- 17 agents + 9 commands tuned for Opus 4.7 + Sonnet 4.6
- Karpathy-style LLM-wiki memory on every installed project
- 5-layer wiki security (secret-scan, gitignore-respect, lint, sources-gitignore, wiki-build-isolation)
- Drop-to-ingest auto-ingest with SHA256 idempotency
- Clean v2 break - v2 users migrate; no legacy aliases

## 3.0.0-alpha.2 - 2026-04-19

Wiki + Security.

### Added
- `scripts/secret-scanner.cjs` - 11 pattern types
- `hooks/PreToolUse/wiki-secret-scan.cjs` - Layer 2 fail-closed
- `hooks/PreToolUse/gitignore-guard.cjs` - Layer 5 wiki-build-only
- `hooks/PostToolUse/auto-ingest.cjs` - drop-to-ingest notification, SHA256 idempotent
- Wiki templates: SCHEMA, index, log, sources/.gitkeep
- `templates/.claude/settings.json` registers hooks + env defaults

## 3.0.0-alpha.1 - 2026-04-19

Agent Squad.

### Added
- 17 agent .md files: 4 orchestrators (plan/build/audit/deploy) + 13 specialists
- 9 command .md files dispatching to orchestrators
- Complete RESOLVER.md with intent→command mapping
- Manifest↔file sync CI gate

## 3.0.0-alpha.0 - 2026-04-19

Foundation scaffold. Not yet usable.

### Added
- Fresh repo structure (`agents/`, `commands/`, `hooks/`, `skills/`, `templates/`, `scripts/`, `tests/`, `docs/`)
- `manifest.json` as single source of truth for agents and commands
- `scripts/regenerate-docs.cjs` - doc regen with marker-based replacement
- `scripts/validate-manifest.cjs` + JSON schema
- `scripts/verify-grep-gates.cjs` - CI gates (no-ralph, no-old-slug, no-alias-models)
- README, INSTALL_FOR_AGENTS (skeleton), RESOLVER (skeleton)
- `jest` test suite, `husky` pre-commit hook, GitHub Actions CI workflow

### Removed (vs v2)
- `packages/cli/` - no npm package, paste install only
- `packages/pro/` - flat repo structure at root
- `ralph` workflow - replaced by orchestrator-worker pattern in Plan 2
- `ai-sprint-*` slug - now `spk` (brand "AI Sprint Kit" unchanged)
- `tdd-developer` agent - now `/spk-tdd` command driving tester + implementer

### Notes
- v3 is a HARD BREAK from v2. No legacy aliases. v2 users see a migration report during install (Plan 4).
- No Haiku tier. Opus 4.7 + Sonnet 4.6 only.
- Install target: Claude Code subscription. No API, no Agent SDK, no Managed Agents.
