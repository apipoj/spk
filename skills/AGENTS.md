# skills/ Agent Context

## Purpose
- Native Thai source copies of every SPK skill.
- Each subfolder `spk-<name>/SKILL.md` is the authoritative Thai-language version; the English plugin payload mirrors it at `plugins/spk/skills/<name>/SKILL.md`.
- Used for human review, translation maintenance, and as the canonical authoring source.

## Entry Points
- `skills/spk-<name>/SKILL.md` — one file per skill; frontmatter + Thai workflow instructions.

## Conventions
- Folder naming: `spk-<command>` (e.g. `spk-plan`, `spk-code`).
- Frontmatter must include `description:` (Thai) and `argument-hint:`.
- Workflow sections written in Thai; technical identifiers (file paths, commands, JSON keys) stay in English.
- The plugin's English `SKILL.md` and this Thai version must remain functionally equivalent.

## Guardrails
- Do not delete a skill folder here without also removing it from `plugins/spk/skills/` and `manifest.json`.
- Do not write credentials, API keys, or `.env` values into any `SKILL.md`.
- `npm run verify:native` checks that native skill names align with manifest; run it after any rename.

## When Editing Here
1. Edit the Thai `SKILL.md` here first; then propagate the equivalent change to `plugins/spk/skills/<name>/SKILL.md`.
2. Run `npm run verify:native` to confirm alignment with manifest.
3. Run `npm run verify:descriptions` to confirm `description:` fields are populated.
