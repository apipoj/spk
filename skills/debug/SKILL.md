---
description: Systematic root-cause debugging. Diagnose first, no fixes until evidence proves the cause.
argument-hint: "[bug, failing test, error output, or reproduction steps]"
---

# /debug — Root Cause Analysis

Run a systematic root-cause investigation before any fix is attempted.

Use this for failing tests, production bugs, build errors, regressions, unexpected behavior, or any situation where guessing would waste time.

## Context

- Run `git status --short`, `git log -5 --oneline`, and `git diff --stat`
- Capture the exact error output, test failure, or unexpected behavior

## 4-Phase RCA Process

### Phase 1: Read Errors and Reproduce
- Capture the exact error message, stack trace, or failing assertion.
- Identify the minimal reproduction steps.
- If reproduction is impossible, return `NEEDS_REPRO` with exact missing information.

### Phase 2: Compare Working Patterns
- Find a similar working code path or passing test.
- Diff the working vs. failing path to isolate the divergence.
- Check recent commits for the change that introduced the issue.

### Phase 3: Form and Test Hypotheses
- Write down one hypothesis at a time.
- Test each hypothesis with a targeted experiment (log, breakpoint, unit test).
- Discard falsified hypotheses before forming the next one.
- If 3 hypotheses have failed, flag `POSSIBLE_ARCHITECTURE_ISSUE`.

### Phase 4: Recommend Fix
- State the root cause with evidence.
- Identify affected file:line locations.
- Recommend the smallest fix.
- Recommend a regression test that would have caught this.

## Output Format

```markdown
## Debug Report
- Error: <exact error or behavior>
- Root cause: <evidence-backed explanation>
- Affected locations: <file:line list>
- Recommended fix: <smallest change>
- Regression test: <test that would catch this>
- Status: <FIX_READY | NEEDS_REPRO | POSSIBLE_ARCHITECTURE_ISSUE>
```

## Guardrails

- No fixes before root cause evidence.
- If reproduction is impossible, return `NEEDS_REPRO` with exact missing information.
- If 3 attempted fixes have already failed, flag `POSSIBLE_ARCHITECTURE_ISSUE` instead of proposing a fourth patch.
- Do not modify source code. Return the diagnosis and recommended next action.
- For production data, credentials, destructive actions, or external services, stop and ask for operator confirmation.
