---
description: Strict TDD loop — RED test first, GREEN minimal implementation, REFACTOR after green, with verification gates.
argument-hint: "[feature, behavior, bug, or plan reference]"
---

# /tdd — Test-Driven Development

Run a strict TDD loop: write a failing test, confirm it fails, implement the minimum to pass, refactor, repeat.

## Context

- Run `git status --short` and `git log -3 --oneline`
- Identify test setup (package.json, pyproject.toml, pytest.ini, jest.config, vitest.config)

## TDD Cycle

### RED: Write a Failing Test
1. Write one minimal behavior test that defines the expected behavior.
2. The test must be specific and focused on one behavior.

### Verify RED
3. Run the focused test and confirm it fails **for the expected reason**.
4. If the test passes immediately, fix the test before coding (it's not testing the right thing).

### GREEN: Minimal Implementation
5. Write the smallest implementation that makes the test pass.
6. Do not add extra features, optimizations, or refactoring yet.

### Verify GREEN
7. Run the focused test — it must pass.
8. Run the relevant regression suite — nothing should break.

### REFACTOR
9. Clean up code only while tests are green.
10. Rerun all relevant tests after refactoring.

### Commit
11. Commit the verified cycle with a descriptive message.
12. Repeat for the next behavior.

## Output Format

```markdown
## TDD Cycle Report
- Behavior: <what was implemented>
- Test file: <path>
- RED: <confirmed — test fails for expected reason>
- GREEN: <confirmed — test passes>
- REFACTOR: <what was cleaned up>
- Regression suite: <pass/fail>
- Commit: <hash or message>
- Remaining behaviors: <list or "none">
```

## Hard Stops

- If the first test passes immediately, fix the test before coding.
- If no practical test harness exists, return `NEEDS_TEST_HARNESS` with the smallest harness to add.
- If fixing a bug, include a regression test that fails before the fix.
- Never commit on red. Every commit must have passing tests.

## Guardrails

- Do not accept tests that pass before implementation.
- Do not skip tests.
- Do not batch multiple behaviors in one cycle — one behavior per cycle.
- Do not refactor on red.
- Commit only verified cycles.
