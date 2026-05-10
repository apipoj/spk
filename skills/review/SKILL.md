---
description: Multi-pass pre-merge review — correctness, security, maintainability, tests, docs, and ship-readiness.
argument-hint: "[diff range, branch, PR, 'wiki', or working tree]"
---

# /review — Code Review

Run a deep multi-pass review covering correctness, security, maintainability, tests, docs, and ship-readiness.

## Context

- Run `git status --short --branch --untracked-files=all`
- Run `git diff --stat` and `git diff --name-status`
- Run `git log -5 --oneline`

## Review Passes

Run each pass in isolation. Deduplicate findings before reporting.

### Pass 1: Correctness & Edge Cases
- Logic errors, off-by-one, null/undefined handling.
- Edge cases: empty inputs, boundary values, concurrent access.
- Error handling: are errors caught, logged, and surfaced properly?

### Pass 2: Security & Secrets
- Hardcoded secrets, API keys, tokens, credentials.
- Authorization checks on sensitive endpoints.
- Input validation and sanitization.
- Any secret-shaped added line is fail-closed until proven safe.

### Pass 3: Maintainability & Scope
- Does the change match the stated goal?
- Scope creep: unrelated changes mixed in?
- Code duplication that should be extracted.
- Naming clarity and consistency.

### Pass 4: Tests & Docs
- Are new behaviors covered by tests?
- Do existing tests still pass?
- Is the change documented (API docs, README, inline comments)?
- Docs drift: if behavior, commands, manifests, or public workflow changed, docs must be updated.

### Pass 5: Ship-Readiness Gate
- Final quality gate: would you ship this?
- Any Critical or Important issues mean HOLD.

## Output Format

```markdown
## Review Report
- Scope: <what was reviewed>
- Files: <count and list>

### Findings

#### Critical (blocks merge)
- <file:line> <issue> — <why it matters> — <fix>

#### Important (should fix in this PR)
- <file:line> <issue> — <why it matters> — <fix>

#### Minor (safe follow-up)
- <file:line> <issue> — <suggestion>

### Verdict
<APPROVE | HOLD | REQUEST_CHANGES>
```

## Review Contract

- Critical: security/data loss/broken build/wrong behavior; blocks merge.
- Important: should fix in this PR before merge.
- Minor: safe follow-up or style suggestion.
- Suggestions are not blockers unless tied to concrete risk.
- Any secret-shaped added line is fail-closed until proven safe.
- Verify docs drift when behavior, commands, manifests, or public workflow changes.
