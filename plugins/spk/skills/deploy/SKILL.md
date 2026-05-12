---
description: Deploy + smoke test + UI verify via spk:deploy-orchestrator.
argument-hint: "[env: staging|production]"
---

# /spk:deploy

Delegate to `spk:deploy-orchestrator` for full deployment cycle.

## Pre-computed Context
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git log -1 --format='%H %s' || echo "Git history unavailable: no commits yet."; else echo "Git history unavailable: not inside a git worktree."; fi`
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git branch --show-current || true; else echo "Git branch unavailable: not inside a git worktree."; fi`

## Workflow

Dispatch: `Task(subagent_type="spk:deploy-orchestrator", prompt="Deploy current HEAD to: $ARGUMENTS")`

Expect: deployment result, smoke test verdict, UI check verdict. Paused for user confirmation if production.
