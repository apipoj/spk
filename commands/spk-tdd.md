---
description: TDD loop — tester writes failing test, implementer makes it pass, iterate. Driven by spk-build-orchestrator.
argument-hint: "[feature or function name]"
---

# /spk-tdd

Delegate to `spk-build-orchestrator` in TDD mode.

## Pre-computed Context
!`git status --short`

## Workflow

Dispatch: `Task(subagent_type="spk-build-orchestrator", prompt="TDD loop for: $ARGUMENTS. tester writes failing test first, implementer makes green, commit per cycle.")`

Expect: commits in red→green→refactor pattern, each with passing tests.
