# Changelog

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
