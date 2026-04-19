---
description: Implement from a plan via build-orchestrator (implementer → tester → docs).
argument-hint: "[plan reference or feature]"
---

# /spk:code

Delegate to `build-orchestrator` for implementation.

## Pre-computed Context
!`git status --short`
!`git log -3 --oneline`

## Workflow

Dispatch: `Task(subagent_type="build-orchestrator", prompt="Implement: $ARGUMENTS. Plan reference: ai_context/wiki/plans/ (latest matching)")`

Expect: committed code, passing tests, updated docs.
