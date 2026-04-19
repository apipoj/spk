# SPK — Agent Install

You are installing SPK (AI Sprint Kit) into the user's project.
Follow these steps IN ORDER. Ask the user questions where indicated.

<!-- SPK-COUNTS:start -->
**17 agents** (4 orchestrators + 13 specialists) · **9 commands**
<!-- SPK-COUNTS:end -->

## Step 0 — Environment Detection

**Not yet implemented — see Plan 4.**

Detect Claude Code version, git status, project type, existing v2 or v3 install.

## Step 1 — Setup Questions

**Not yet implemented — see Plan 4.**

Ask user about language, auto-ingest mode, browser-testing, Supermemory.

## Step 2 — Clone & Stage

**Not yet implemented — see Plan 4.**

Clone the spk repo into `.spk/`, pin to release tag.

## Step 3 — Copy Templates

**Not yet implemented — see Plan 4.**

Copy agents, commands, hooks into `.claude/`. Merge settings.json. Create wiki scaffold.

## Step 4 — CLAUDE.md (opt-in only)

**Not yet implemented — see Plan 4.**

Ask once whether to add a 5-line pointer section between `<!-- SPK:start -->` markers.

## Step 5 — v2 Migration (if detected)

**Not yet implemented — see Plan 4.**

Split old `ai_context/memory/` files into wiki pages. Remove ralph. Run wiki-lint.

## Step 6 — Smoke Test (MUST PASS)

**Not yet implemented — see Plan 4.**

Spawn planner, run wiki-lint, ingest README. All three must succeed.

## Step 7 — Summary Report

**Not yet implemented — see Plan 4.**

Report what was installed + what's enabled + how to upgrade and uninstall.
