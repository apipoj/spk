# Changelog

## 3.1.0 — 2026-04-19

**Major pivot:** SPK now ships as a Claude Code plugin. Hot-reloads in your session; no restart.

### Install (new)

```
/plugin marketplace add apipoj/spk
/plugin install spk@spk
```

### Added
- `.claude-plugin/marketplace.json` at repo root + `plugins/spk/.claude-plugin/plugin.json`
- Correct `plugins/spk/hooks/hooks.json` format (matcher + command objects) — v3.0.x hook config used a deprecated flat-string-array format that never fired
- `plugins/spk/scripts/init-ai-context.cjs` — `SessionStart` hook scaffolds `ai_context/wiki/` + `sources/` into the user project (version-aware, idempotent)
- 18 agents relocated to `plugins/spk/agents/`; auto-namespaced as `spk:planner`, `spk:architect`, etc.
- 9 skills at `plugins/spk/skills/<name>/SKILL.md` (replacing flat `commands/`); invoked as `/spk:plan`, `/spk:code`, etc.

### Changed (breaking vs v3.0.x)
- **Install**: paste-install → `/plugin install spk@spk`. Legacy paste pinned at `v3.0.2`.
- **Agent names**: `spk-planner` → `planner` (plugin auto-prepends `spk:` namespace)
- **Command invocation**: `/spk-plan` → `/spk:plan`
- **Hook format**: flat `["./path.cjs"]` → `{matcher, hooks: [{type, command}]}` — this fixes a silent bug where v3.0.x hooks never actually ran

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
3. `ai_context/wiki/` + `ai_context/sources/` preserved — user data untouched.

## 3.0.2 — 2026-04-19

Patch: ship `spk-devops` agent that was previously referenced by `spk-deploy-orchestrator` but missing from the manifest.

### Added
- `spk-devops` — Sonnet 4.6 specialist for CI/CD setup, deployment scripts, infrastructure config. Shipping phase (orange).

### Fixed
- Install feedback reported `spk-deploy-orchestrator references a devops agent that isn't shipped` — gap closed.

## 3.0.1 — 2026-04-18

Patch: prefix all 17 SPK agents with `spk-` to prevent collisions with user-defined agents in target projects.

### Changed (breaking, but no known affected users)
- All 17 agent names prefixed: `planner` → `spk-planner`, `architect` → `spk-architect`, etc.
- Orchestrator prompts, command dispatches, RESOLVER updated to use new names.
- manifest.json `agents[].name` and `commands[].orchestrator`/`commands[].agent` updated.

### Rationale
Common unprefixed names (planner, architect, debugger, researcher, tester) are high collision risk with users' existing agents. Since v3.0.0 shipped with zero external installs, patching in v3.0.1 before adoption was cheaper than waiting for v3.1.

## 3.0.0 — 2026-04-19

First production release of SPK v3.

### Added (beyond alpha)
- Complete `INSTALL_FOR_AGENTS.md` — agent-directed paste install with v2 migration + smoke test
- `scripts/install/migrate-v2.cjs` — splits v2 memory files into wiki pages (8 tests)
- `scripts/install/smoke-test.cjs` — structural post-install verification (5 tests)
- `scripts/install/uninstall.cjs` — clean removal preserving user data (8 tests)

### Feature-complete
- Paste one line into any Claude Code project → full install < 5 min
- 17 agents + 9 commands tuned for Opus 4.7 + Sonnet 4.6
- Karpathy-style LLM-wiki memory on every installed project
- 5-layer wiki security (secret-scan, gitignore-respect, lint, sources-gitignore, wiki-build-isolation)
- Drop-to-ingest auto-ingest with SHA256 idempotency
- Clean v2 break — v2 users migrate; no legacy aliases

## 3.0.0-alpha.2 — 2026-04-19

Wiki + Security.

### Added
- `scripts/secret-scanner.cjs` — 11 pattern types
- `hooks/PreToolUse/wiki-secret-scan.cjs` — Layer 2 fail-closed
- `hooks/PreToolUse/gitignore-guard.cjs` — Layer 5 wiki-build-only
- `hooks/PostToolUse/auto-ingest.cjs` — drop-to-ingest notification, SHA256 idempotent
- Wiki templates: SCHEMA, index, log, sources/.gitkeep
- `templates/.claude/settings.json` registers hooks + env defaults

## 3.0.0-alpha.1 — 2026-04-19

Agent Squad.

### Added
- 17 agent .md files: 4 orchestrators (plan/build/audit/deploy) + 13 specialists
- 9 command .md files dispatching to orchestrators
- Complete RESOLVER.md with intent→command mapping
- Manifest↔file sync CI gate

## 3.0.0-alpha.0 — 2026-04-19

Foundation scaffold. Not yet usable.

### Added
- Fresh repo structure (`agents/`, `commands/`, `hooks/`, `skills/`, `templates/`, `scripts/`, `tests/`, `docs/`)
- `manifest.json` as single source of truth for agents and commands
- `scripts/regenerate-docs.cjs` — doc regen with marker-based replacement
- `scripts/validate-manifest.cjs` + JSON schema
- `scripts/verify-grep-gates.cjs` — CI gates (no-ralph, no-old-slug, no-alias-models)
- README, INSTALL_FOR_AGENTS (skeleton), RESOLVER (skeleton)
- `jest` test suite, `husky` pre-commit hook, GitHub Actions CI workflow

### Removed (vs v2)
- `packages/cli/` — no npm package, paste install only
- `packages/pro/` — flat repo structure at root
- `ralph` workflow — replaced by orchestrator-worker pattern in Plan 2
- `ai-sprint-*` slug — now `spk` (brand "AI Sprint Kit" unchanged)
- `tdd-developer` agent — now `/spk-tdd` command driving tester + implementer

### Notes
- v3 is a HARD BREAK from v2. No legacy aliases. v2 users see a migration report during install (Plan 4).
- No Haiku tier. Opus 4.7 + Sonnet 4.6 only.
- Install target: Claude Code subscription. No API, no Agent SDK, no Managed Agents.
