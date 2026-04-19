---
description: Implement from a plan via spk:build-orchestrator (spk:implementer → spk:tester → spk:docs).
argument-hint: "[plan reference or feature]"
---

# /spk:code

Delegate to `spk:build-orchestrator` for implementation.

## Pre-computed Context
!`git status --short`
!`git log -3 --oneline`

## Workflow

Dispatch: `Task(subagent_type="spk:build-orchestrator", prompt="Implement: $ARGUMENTS. Plan reference: ai_context/wiki/plans/ (latest matching)")`

Expect: committed code, passing tests, updated docs.
