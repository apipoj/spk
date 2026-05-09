---
description: Strict TDD loop — RED test first, GREEN minimal implementation, REFACTOR after green, with verification gates.
argument-hint: "[feature, behavior, bug, or plan reference]"
---

# /spk:tdd

Delegate to `spk:build-orchestrator` in strict TDD mode.

## Pre-computed Context
!`git status --short`
!`git log -3 --oneline`
!`find . -maxdepth 3 \( -name package.json -o -name pyproject.toml -o -name pytest.ini -o -name jest.config.* -o -name vitest.config.* \) -not -path './node_modules/*' -not -path './.git/*' | sort | head -80`

## Workflow

Dispatch: `Task(subagent_type="spk:build-orchestrator", prompt="Run a strict TDD loop for: $ARGUMENTS. Enforce RED-GREEN-REFACTOR: write one failing test first, run it and confirm the expected failure, implement the minimum code to pass, run the focused test, run the relevant regression suite, refactor only while green, and repeat per behavior. Do not accept tests that pass before implementation. Do not skip tests. Commit only verified cycles.")`

Expect: documented RED/GREEN evidence, changed files, tests run, and any remaining behaviors not covered.

## TDD Contract

1. RED: write one minimal behavior test.
2. Verify RED: run the focused test and confirm it fails for the expected reason.
3. GREEN: write the smallest implementation that passes.
4. Verify GREEN: run the focused test and relevant suite.
5. REFACTOR: clean only after green; rerun tests.
6. Commit per coherent cycle when verification passes.

## Hard Stops

- If the first test passes immediately, fix the test before coding.
- If no practical test harness exists, return `NEEDS_TEST_HARNESS` with the smallest harness to add.
- If fixing a bug, include a regression test that fails before the fix.
