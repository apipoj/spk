---
description: Plan a feature — produce a developer-ready plan with PRD, architecture, bite-sized TDD tasks, gates, and rollout notes.
argument-hint: "[feature description]"
---

# /plan — Feature Planning

Produce a developer-ready plan with goal, non-goals, architecture, bite-sized TDD tasks, verification gates, and rollout notes.

## Context

- Run `git status --short` and `git log -3 --oneline`
- Identify project structure (CLAUDE.md, AGENTS.md, package.json, tsconfig, pyproject.toml, go.mod, Cargo.toml, etc.)
- Review existing plans in `ai_context/wiki/plans/` if available

## Workflow

### 1. Clarify
- Parse the feature description from the user's request.
- Identify the goal, non-goals, assumptions, and open questions.
- If critical information is missing, ask one focused question instead of guessing.

### 2. Architecture
- Propose an architecture approach with exact source areas.
- Identify affected files, modules, and interfaces.
- Note dependencies, risks, and migration concerns.

### 3. Task Decomposition
- Break the feature into bite-sized tasks (2-5 minute actions where possible).
- Each task must include: files to touch, expected change, TDD steps (RED/GREEN), verification commands, and commit message.
- Tasks must be independently verifiable.

### 4. Verification Gates
- Define verification gates between task groups.
- Include regression test commands.
- Include docs update tasks.

### 5. Rollout and Rollback
- Document rollout steps and order.
- Document rollback plan.
- Note risks and mitigations.

### 6. Save Plan
- Save to `ai_context/wiki/plans/YYYY-MM-DD-<slug>.md`.
- Update wiki index and log.

## Output Format

```markdown
## Plan: <feature name>
- Goal: <one sentence>
- Non-goals: <list>
- Assumptions: <list>
- Architecture: <approach>
- Tasks: <numbered list with file paths, TDD steps, verification>
- Gates: <verification checkpoints>
- Rollout: <steps>
- Rollback: <plan>
- Risks: <list>
- Open questions: <list>
```

## Plan Quality Bar

- Tasks are 2-5 minute actions where possible and independently verifiable.
- Every task has exact file paths or explicit discovery steps.
- Every behavior change includes TDD steps.
- The plan says what NOT to build.
- Acceptance criteria are observable and testable.
- If uncertainty changes architecture, ask one focused question instead of guessing.
