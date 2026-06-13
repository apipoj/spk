# plugins/spk Agent Context

## Purpose
- The installable plugin payload shipped to end-users via `claude plugin install spk@spk`.
- Contains: agent system-prompt files (`agents/`), slash skill files (`skills/`), runtime hook config (`hooks/hooks.json`), runtime scripts (`scripts/`), and the `templates/ai_context/` scaffold written to new projects.

## Entry Points
- `hooks/hooks.json` — declares PreToolUse / PostToolUse / SessionStart hooks; loaded by Claude Code at install time.
- `agents/*.md` — one file per subagent; each file is the system prompt for that agent role.
- `skills/<name>/SKILL.md` — skill frontmatter + workflow; invoked as `/spk:<name>`.
- `scripts/` — Node.js runtime scripts executed by hooks (not build-time gates).
- `.claude-plugin/plugin.json` — plugin metadata; version must match root `manifest.json`.

## Commands
- No standalone commands; this folder is a distribution payload, not a standalone package.
- Validate payload: `npm run validate:manifest` from repo root.
- Version sync check: `npm run verify:sync` from repo root.

## Conventions
- Skill files are English (Thai originals live in `skills/spk-*/SKILL.md` at repo root).
- Each skill folder name matches the command name (e.g. `skills/plan/` → `/spk:plan`).
- Agent filenames match the `name` field in `manifest.json` agents array.
- `templates/ai_context/` must not contain real secrets or project-specific data — it is generic scaffold.

## Guardrails
- Do not add executable scripts to `scripts/` without a corresponding Jest test in `tests/`.
- Do not change `hooks/hooks.json` hook matchers without updating `tests/hook-output-contract.test.js`.
- `scripts/secret-scanner.cjs` and `scripts/wiki-secret-scan.cjs` run on every Write via hooks — do not remove or weaken them.
- `templates/ai_context/sources/` is excluded from scanning — never write private data there.

## When Editing Here
1. After adding or renaming a skill folder, update `manifest.json` commands array and run `npm run verify:sync`.
2. After editing an agent `.md`, run `npm run verify:agents` to check contracts.
3. After any hook or script change, run `npm test` to catch regressions.
