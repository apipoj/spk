---
description: Plan a feature via plan-orchestrator (PRD → BA → architect → planner).
argument-hint: "[feature description]"
---

# /spk-plan

Delegate to `plan-orchestrator` with the user's feature description.

## Pre-computed Context
!`git status --short`
!`git log -3 --oneline`

## Workflow

Dispatch: `Task(subagent_type="plan-orchestrator", prompt="Plan this feature: $ARGUMENTS")`

Expect: a written plan saved to `ai_context/wiki/plans/<date>-<slug>.md` + a concise summary.
