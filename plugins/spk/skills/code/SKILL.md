---
description: Implement from a plan via spk:build-orchestrator (spk:implementer → spk:tester → spk:docs).
argument-hint: "[plan reference or feature]"
---

# /spk:code

Delegate to `spk:build-orchestrator` for implementation.

## Pre-computed Context
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git status --short || true; else echo "Git status unavailable: not inside a git worktree."; fi`
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git log -3 --oneline || echo "Git history unavailable: no commits yet."; else echo "Git history unavailable: not inside a git worktree."; fi`

## Workflow

Dispatch: `Task(subagent_type="spk:build-orchestrator", prompt="Implement: $ARGUMENTS. Plan reference: ai_context/wiki/plans/ (latest matching)")`

Expect: committed code, passing tests, updated docs.
