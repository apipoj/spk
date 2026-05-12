---
description: Prime a repo for subagents by scanning source folders and creating/updating local CLAUDE.md + AGENTS.md context files.
argument-hint: "[scope: repo|frontend/|apps/api/|packages/*]"
---

# /spk:prime

Prime this repository for downstream subagents. Use this before large multi-agent work, onboarding a new repo, or after major folder/architecture changes.

## Pre-computed Context
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git status --short || true; else echo "Git status unavailable: not inside a git worktree."; fi`
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git log -3 --oneline || echo "Git history unavailable: no commits yet."; else echo "Git history unavailable: not inside a git worktree."; fi`
!`find . -maxdepth 3 \( -name package.json -o -name pyproject.toml -o -name go.mod -o -name Cargo.toml -o -name tsconfig.json -o -name requirements.txt \) -not -path './node_modules/*' -not -path './.git/*' -not -path './dist/*' -not -path './build/*' | sort | head -80`

## Workflow

Dispatch: `Task(subagent_type="spk:primer", prompt="Prime this repository for subagents. Scope: $ARGUMENTS. Scan source-code folders, identify meaningful source subtrees, then create or update CLAUDE.md and AGENTS.md in the root and relevant source subfolders. Keep context files concise, preserve human-authored content, respect .gitignore, never write secrets, and do not change product source code.")`

For very large monorepos, the main thread may dispatch multiple `spk:primer` tasks in parallel only when source roots do not overlap, for example one task for `frontend/` and one task for `backend/`.

Expect: a source map, list of context files created/updated, ignored folders, and verification that no source code or secrets were changed.
