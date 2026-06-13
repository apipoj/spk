# SPK Repository Agent Context

## Purpose
- Source repo for the **AI Sprint Kit (SPK)** Claude Code plugin.
- Delivers slash skills, subagent definitions, runtime hooks, and LLM-wiki memory scaffolding.
- `manifest.json` is the single source of truth for the version and the command/agent roster — read it for the authoritative version and counts; all other version strings must match it.
- Native Thai skill variants live in `skills/`; the plugin payload distributed to users lives in `plugins/spk/`.

## Source Map
| Folder | Role |
|---|---|
| `manifest.json` | Version + command/agent registry (source of truth) |
| `plugins/spk/` | Installable plugin payload (agents, hooks, scripts, skills, templates) |
| `skills/` | Native Thai source copies of each skill (one subfolder per skill) |
| `scripts/` | Verify/release gate scripts (Node.js CJS) |
| `tests/` | Jest test suites |
| `docs/` | Specs, plans, and design docs |
| `schemas/` | JSON Schema for manifest validation |
| `.github/workflows/` | CI: `verify.yml` runs all gates + plugin-install smoke test |

## Commands
- **Test:** `npm test`
- **Full release gate:** `npm run verify:release`
- **Regenerate docs:** `npm run regen`
- **Validate manifest:** `npm run validate:manifest`
- **Check sync:** `npm run verify:sync`
- **Check refs:** `npm run verify:refs`
- **Native skills check:** `npm run verify:native`

## Conventions
- Node.js >=20, CommonJS (`"type": "commonjs"`), Jest for tests.
- Every skill lives in two places: `plugins/spk/skills/<name>/SKILL.md` (plugin payload, English) and `skills/spk-<name>/SKILL.md` (native Thai source).
- Skill frontmatter must include `description:` and `argument-hint:`.
- All version fields (`package.json`, `package-lock.json`, `plugins/spk/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`) must equal `manifest.json`.version.
- Pre-commit hook runs: `regen → verify:gates → validate:manifest → verify:sync`.

## Guardrails
- Never edit `manifest.json` version fields without bumping all synced version sources listed above.
- Do not modify files under `node_modules/`, `.git/`, or `plugins/spk/templates/ai_context/sources/`.
- Do not commit `.env*` or credential files.
- `plugins/spk/hooks/hooks.json` governs runtime hook wiring — changes affect all installed users.
- `scripts/secret-scanner.cjs` and `wiki-secret-scan.cjs` run on every Write; do not suppress them.

## When Editing Here
1. Run `npm run validate:manifest` after any change to `manifest.json`.
2. Run `npm run regen` to regenerate docs; pre-commit hook does this automatically.
3. Run `npm run verify:release` before tagging a release (covers all gates + tests).
4. Adding a new skill requires entries in: `manifest.json` commands array, `plugins/spk/skills/<name>/SKILL.md`, `skills/spk-<name>/SKILL.md`, and `plugins/spk/agents/<agent>.md` if a new agent is defined.

## Subtree Context Files
- `plugins/spk/` → see `plugins/spk/AGENTS.md`
- `skills/` → see `skills/AGENTS.md`
- `scripts/` → see `scripts/AGENTS.md`
- `tests/` → see `tests/AGENTS.md`
