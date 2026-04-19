---
description: Deploy + smoke test + UI verify via deploy-orchestrator.
argument-hint: "[env: staging|production]"
---

# /spk-deploy

Delegate to `deploy-orchestrator` for full deployment cycle.

## Pre-computed Context
!`git log -1 --format='%H %s'`
!`git branch --show-current`

## Workflow

Dispatch: `Task(subagent_type="deploy-orchestrator", prompt="Deploy current HEAD to: $ARGUMENTS")`

Expect: deployment result, smoke test verdict, UI check verdict. Paused for user confirmation if production.
