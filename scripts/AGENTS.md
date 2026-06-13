# scripts/ Agent Context

## Purpose
- Node.js CJS scripts that enforce release integrity and repo invariants.
- Run as npm scripts during development, pre-commit, and CI — not as runtime hooks inside the plugin.

## Entry Points
| Script | What it checks |
|---|---|
| `validate-manifest.cjs` | manifest.json schema validity |
| `verify-manifest-sync.cjs` | Version parity across all version-bearing files |
| `regenerate-docs.cjs` | Keeps generated docs in sync with manifest |
| `verify-reference-integrity.cjs` | Internal cross-references (agents ↔ skills ↔ commands) |
| `verify-skill-descriptions.cjs` | All skill SKILL.md files have non-empty `description:` |
| `verify-agent-contracts.cjs` | Agent markdown files meet structural contracts |
| `verify-grep-gates.cjs` | Grep-based checks for forbidden patterns |
| `verify-native-skills.cjs` | Native Thai skills align with manifest command list |

## Commands
- Run any script directly: `node scripts/<name>.cjs`
- Run all gates: `npm run verify:release`

## Conventions
- All scripts are CommonJS (`.cjs`) with no external runtime dependencies beyond Node built-ins and `ajv`/`ajv-formats`.
- Scripts export their core logic functions for Jest to import and test in isolation.
- `REPO_ROOT` is derived from `__dirname` — do not hardcode absolute paths.

## Guardrails
- Do not add scripts that require network access or write to `plugins/spk/`.
- Every new script must have a matching test file in `tests/`.
- Scripts must exit non-zero on failure; CI depends on this.

## When Editing Here
1. Export the validation logic as a named function so `tests/*.test.js` can import it.
2. Add the script as an npm script in `package.json` and wire it into `verify:release`.
3. Add to `.husky/pre-commit` only if it is fast (<2s) and checks commit-blocking invariants.
