---
description: Systematic root-cause debugging. Diagnose first, no fixes until evidence proves the cause.
argument-hint: "[bug, failing test, error output, or reproduction steps]"
---

# /spk:debug

Run a systematic root-cause investigation before any fix is attempted.

Use this for failing tests, production bugs, build errors, regressions, unexpected behavior, or any situation where guessing would waste time.

## Pre-computed Context
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git status --short || true; else echo "Git status unavailable: not inside a git worktree."; fi`
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git log -5 --oneline || echo "Git history unavailable: no commits yet."; else echo "Git history unavailable: not inside a git worktree."; fi`
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git diff --stat || true; else echo "Git diff unavailable: not inside a git worktree."; fi`

## Workflow

Dispatch: `Task(subagent_type="spk:debugger", prompt="Systematically debug this issue: $ARGUMENTS. Follow the 4-phase RCA process: (1) read errors and reproduce, (2) compare working patterns, (3) form and test one hypothesis at a time, (4) recommend the smallest fix and regression test. Do not modify source code. Return evidence, root cause, affected file:line locations, and recommended next action.")`

Expect: a diagnosis, not a patch.

## Guardrails

- No fixes before root cause evidence.
- If reproduction is impossible, return `NEEDS_REPRO` with exact missing information.
- If 3 attempted fixes have already failed, flag `POSSIBLE_ARCHITECTURE_ISSUE` instead of proposing a fourth patch.
- For production data, credentials, destructive actions, or external services, stop and ask for operator confirmation.
