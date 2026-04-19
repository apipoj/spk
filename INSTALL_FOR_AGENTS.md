# SPK — Agent Install

You are a Claude Code agent installing SPK (AI Sprint Kit) v3 into the user's project. Follow these steps IN ORDER. Ask the user only where indicated. Do not skip steps.

<!-- SPK-COUNTS:start -->
**18 agents** (4 orchestrators + 14 specialists) · **9 commands**
<!-- SPK-COUNTS:end -->

## Step 0 — Environment Detection (parallel)

Run these checks and report findings to the user BEFORE proceeding:

1. `claude --version` — confirm Claude Code is installed. If not, stop and tell the user.
2. `pwd` — get the project root. All subsequent paths are relative to this.
3. `git status` — capture git state for rollback on error.
4. Project type — check for `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, or none.
5. **Check for v3 install**: `test -f .spk/manifest.json`
6. **Check for v2 install**: `test -f ai_context/memory/learning.md || test -d ai_context/loop-tui`

Based on detection:
- v3 detected → jump to **Upgrade Flow** (Step 8)
- v2 detected → run Step 5 after Step 4
- clean slate → run Steps 1–7 only (skip Step 5)

## Step 1 — Setup Questions (one at a time)

Ask the user EXACTLY these questions, one per message. Default answers in brackets.

1. Primary language? [a] TypeScript [b] Python [c] Go [d] Rust [e] Other
2. Auto-ingest mode? [a] Manual only [b] Drop-to-ingest (recommended) [c] Full auto — default: B
3. Add a 5-line SPK section to your CLAUDE.md so main-thread Claude suggests /spk-* commands? [y/N] — default: N
4. Supermemory plugin installed? Run `/plugin list | grep supermemory`. If yes, enable cross-session memory layer? [y/N] — default: Y

Record answers. They inform Steps 3, 4, and 6.

## Step 2 — Clone & Stage

1. Determine install location: `.spk/` inside the project root.
2. Clone: `git clone --depth 1 --branch main https://github.com/apipoj/spk.git .spk/`
3. Check out the release tag matching this INSTALL_FOR_AGENTS.md version: read `.spk/manifest.json` → `version`, then `git -C .spk checkout v<version>` if it's a tagged version, else stay on main.
4. Verify `.spk/manifest.json` exists and `node -e "JSON.parse(require('fs').readFileSync('.spk/manifest.json'))"` succeeds.

## Step 3 — Copy Templates

Copy from the cloned repo into the user project:

```
mkdir -p .claude/agents
cp .spk/agents/*.md .claude/agents/

mkdir -p .claude/commands
cp .spk/commands/*.md .claude/commands/

mkdir -p .claude/hooks/PreToolUse .claude/hooks/PostToolUse
cp .spk/hooks/PreToolUse/*.cjs .claude/hooks/PreToolUse/
cp .spk/hooks/PostToolUse/*.cjs .claude/hooks/PostToolUse/
cp .spk/scripts/secret-scanner.cjs .claude/hooks/
```

Merge `.spk/templates/.claude/settings.json` into any existing `.claude/settings.json`:
- If no existing settings.json → just copy it.
- If existing → merge `hooks` arrays (append), merge `env` keys (SPK keys take precedence if absent).

Create wiki scaffold:

```
mkdir -p ai_context/wiki ai_context/sources
cp .spk/templates/ai_context/wiki/SCHEMA.md ai_context/wiki/
cp .spk/templates/ai_context/wiki/index.md ai_context/wiki/
cp .spk/templates/ai_context/wiki/log.md ai_context/wiki/
touch ai_context/sources/.gitkeep
```

Apply Layer 4 of security: append `ai_context/sources/` to `.gitignore` (create `.gitignore` if missing, skip if already present).

## Step 4 — CLAUDE.md (opt-in from Step 1 question 3)

If user answered YES to question 3:
- Read existing CLAUDE.md (or create if absent).
- Append between markers:

```
<!-- SPK:start -->
## AI Sprint Kit (SPK)
- Wiki: `ai_context/wiki/` (index.md is the catalog)
- Sources: drop files in `ai_context/sources/` to auto-ingest
- Commands: /spk-plan, /spk-code, /spk-review, /spk-deploy, /spk-ingest, /spk-query, /spk-wiki-lint, /spk-tdd, /spk-uninstall
- Uninstall: /spk-uninstall
<!-- SPK:end -->
```

If user answered NO → skip this step entirely.

## Step 5 — v2 Migration (only if v2 detected at Step 0)

Run the migration helper:

```
node .spk/scripts/install/migrate-v2.cjs "$(pwd)"
```

This:
- Backs up `ai_context/memory/*` to `ai_context/memory.v2.backup/`
- Splits `learning.md` by `###` headers → `ai_context/wiki/learnings/<slug>.md`
- Splits `decisions.md` → `ai_context/wiki/decisions/<slug>.md`
- Drops `active.md` (ephemeral, not wiki-shape)
- Moves `ai_context/reports/*` → `ai_context/sources/reports/`

Then remove v2 legacy-loop artifacts if present:

```
rm -rf ai_context/loop-tui scripts/setup-loop-tui.sh docs/loop-*.md 2>/dev/null
```

Report what was migrated.

## Step 6 — Smoke Test (MUST PASS — stop install if it fails)

Run the structural smoke test:

```
node .spk/scripts/install/smoke-test.cjs "$(pwd)"
```

Expected: `SPK smoke test PASS (N checks)`. On failure, print the per-check failures and offer the user to rollback (delete `.spk/`, `.claude/agents/spk-*`, etc.).

Then run a live agent probe (only if smoke test passed):

Spawn: `Task(subagent_type="planner", prompt="One-paragraph plan for adding a /hello route. Return only the plan.")`

Expected: non-empty response with actionable steps. If the agent fails to spawn, the install succeeded but the Claude Code config may need a reload (`claude` restart).

## Step 7 — Summary Report

Tell the user:
- Installed X agents (from manifest.json), Y commands
- Enabled: auto-ingest mode (from Step 1), CLAUDE.md pointer section (yes/no), Supermemory layer (yes/no)
- Security: 5-layer wiki protection active
- Wiki seeded at `ai_context/wiki/` — drop files in `ai_context/sources/` to start ingesting
- To upgrade: re-paste the install command (idempotent)
- To uninstall: `/spk-uninstall`

Suggest a first command for the user to try (e.g. `/spk-query "what does this project do"` or `/spk-plan "add a hello endpoint"`).

## Step 8 — Upgrade Flow (if v3 already installed)

1. Read `.spk/manifest.json` → `version` (installed).
2. Pull latest: `git -C .spk fetch origin && git -C .spk checkout main && git -C .spk pull`.
3. Read new version from `.spk/manifest.json`.
4. If same → tell user "Already on v$VERSION — nothing to do" and exit.
5. If newer → show changelog. Ask: "Upgrade to $NEW? [y/N]".
6. On yes: re-run Step 3 (copy templates) — but this time diff against existing files and prompt on conflicts (3-way merge or "keep yours / take new").
7. Re-run Step 6 (smoke test) after upgrade.
8. Append upgrade entry to `ai_context/wiki/log.md`.

## Rollback (on any failure)

If any step after Step 2 fails:
1. Delete `.spk/`.
2. Remove `.claude/agents/<name>.md` for each name in the manifest.
3. Remove `.claude/commands/spk-*.md`.
4. Remove `.claude/hooks/*/wiki-secret-scan.cjs`, `gitignore-guard.cjs`, `auto-ingest.cjs`, `secret-scanner.cjs`.
5. Strip SPK section from `.claude/settings.json` (if present).
6. Report what was rolled back.

## Notes for the Agent

- DO NOT skip smoke test. A silent failure is worse than no install.
- DO NOT overwrite user-edited files without asking. Detect modifications via hash comparison with the repo originals.
- DO NOT touch `ai_context/wiki/` or `ai_context/sources/` content the user created.
- If the user cancels (Ctrl-C) mid-install, run rollback.
- If Git network fails, retry once, then tell the user to check connectivity.

You are now installing SPK. Start at Step 0.
