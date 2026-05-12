---
description: "Multi-pass pre-merge review: correctness, security, maintainability, tests, docs, and ship-readiness via spk:audit-orchestrator."
argument-hint: "[diff range, branch, PR, 'wiki', or working tree]"
---

# /spk:review

Delegate to `spk:audit-orchestrator` for deep review.

## Pre-computed Context
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git status --short --branch --untracked-files=all || true; else echo "Git status unavailable: not inside a git worktree."; fi`
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git diff --stat || true; else echo "Git diff unavailable: not inside a git worktree."; fi`
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git diff --name-status || true; else echo "Git diff unavailable: not inside a git worktree."; fi`
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git log -5 --oneline || echo "Git history unavailable: no commits yet."; else echo "Git history unavailable: not inside a git worktree."; fi`

## Workflow

Dispatch: `Task(subagent_type="spk:audit-orchestrator", prompt="Audit: $ARGUMENTS. Run isolated passes for correctness/edge cases, security/secrets/authz, maintainability/scope creep, tests/docs, and final quality gate. Review only the requested scope unless the scope is unsafe. Rank findings as Critical, Important, or Minor. Critical or Important issues mean HOLD. Include file:line, evidence, why it matters, and a specific fix. Deduplicate before reporting.")`

Expect: ranked findings in `ai_context/wiki/audits/<date>-<slug>.md` + summary.

## Review Contract

- Critical: security/data loss/broken build/wrong behavior; blocks merge.
- Important: should fix in this PR before merge.
- Minor: safe follow-up or style suggestion.
- Suggestions are not blockers unless tied to concrete risk.
- Any secret-shaped added line is fail-closed until proven safe.
- Verify docs drift when behavior, commands, manifests, or public workflow changes.
