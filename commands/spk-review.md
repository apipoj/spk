---
description: Multi-pass code + security + maintainability review via audit-orchestrator.
argument-hint: "[diff range or 'wiki']"
---

# /spk-review

Delegate to `audit-orchestrator` for deep review.

## Pre-computed Context
!`git diff HEAD~1 --stat`
!`git log -3 --oneline`

## Workflow

Dispatch: `Task(subagent_type="audit-orchestrator", prompt="Audit: $ARGUMENTS. Use all 3 passes (correctness, security, maintainability) unless scope narrower.")`

Expect: ranked findings in `ai_context/wiki/audits/<date>-<slug>.md` + summary.
