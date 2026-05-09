---
description: Plan a feature via spk:plan-orchestrator with PRD, architecture, bite-sized TDD tasks, gates, and rollout notes.
argument-hint: "[feature description]"
---

# /spk:plan

Delegate to `spk:plan-orchestrator` with the user's feature description.

## Pre-computed Context
!`git status --short`
!`git log -3 --oneline`
!`find . -maxdepth 3 \( -name CLAUDE.md -o -name AGENTS.md -o -name package.json -o -name pyproject.toml -o -name go.mod -o -name Cargo.toml -o -name tsconfig.json \) -not -path './node_modules/*' -not -path './.git/*' | sort | head -100`

## Workflow

Dispatch: `Task(subagent_type="spk:plan-orchestrator", prompt="Plan this feature: $ARGUMENTS. Produce a developer-ready plan with: goal, non-goals, assumptions, architecture approach, exact source areas, bite-sized TDD tasks, verification gates, docs updates, rollout/rollback notes, risks, and open questions. Each task must include files, RED/GREEN verification commands, expected output, and commit message. Save to ai_context/wiki/plans/YYYY-MM-DD-<slug>.md and update index/log.")`

Expect: a written plan saved to `ai_context/wiki/plans/<date>-<slug>.md` + a concise summary.

## Plan Quality Bar

- Tasks are 2-5 minute actions where possible and independently verifiable.
- Every task has exact file paths or explicit discovery steps.
- Every behavior change includes TDD steps.
- The plan says what NOT to build.
- Acceptance criteria are observable and testable.
- If uncertainty changes architecture, ask one focused question instead of guessing.
