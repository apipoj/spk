---
description: Implement from a plan — produce committed code, passing tests, and updated docs.
argument-hint: "[plan reference or feature description]"
---

# /code — Implement from Plan

Implement a feature from an existing plan. Execute bite-sized TDD tasks, commit verified work, and update docs.

## Context

- Run `git status --short` and `git log -3 --oneline`
- Locate the plan file (typically in `ai_context/wiki/plans/` or a referenced path)
- Identify project structure (package.json, tsconfig, pyproject.toml, etc.)

## Workflow

1. **Read the plan.** Load the plan file and extract: goal, non-goals, tasks, gates, and acceptance criteria.
2. **Pick the next task.** Choose the first incomplete task. If no plan exists, help the user decompose the feature into small verifiable tasks first.
3. **TDD per task.** For each task:
   - Write or identify the test that proves the behavior.
   - Run the test and confirm it fails (RED).
   - Implement the minimum code to pass (GREEN).
   - Run the relevant regression suite to verify no breakage.
   - Refactor only while green.
   - Commit with the plan's suggested commit message.
4. **Verify gates.** After each task, run the plan's verification commands. Stop if any gate fails.
5. **Update docs.** If the plan includes docs tasks, execute them as part of the workflow.
6. **Report progress.** Summarize what was done, what's next, and any deviations from the plan.

## Output Format

```markdown
## Implementation Progress
- Task completed: <task name>
- Files changed: <list>
- Tests: <pass/fail summary>
- Commit: <hash or message>
- Next task: <name or "done">
- Deviations: <none or description>
```

## Plan Quality Bar

If no plan exists yet, produce one with:
- Tasks are 2-5 minute actions where possible and independently verifiable.
- Every task has exact file paths or explicit discovery steps.
- Every behavior change includes TDD steps.
- The plan says what NOT to build.
- Acceptance criteria are observable and testable.

## Guardrails

- Do not skip tests. If a test harness is missing, flag `NEEDS_TEST_HARNESS`.
- Do not commit on red. Every commit must have passing tests.
- If a task is too large, split it before implementing.
- Do not modify files outside the plan's scope without asking.
