# Changelog

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
