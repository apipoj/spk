---
description: Prepare, verify, push, and open a GitHub PR with a conventional PR body and CI follow-up.
argument-hint: "[title or scope; optional: draft|ready]"
---

# /spk:pr

Prepare a GitHub pull request for the current branch or reviewed local changes. Default mode is **prepare-only**: produce the PR body/checklist and safety report without staging, committing, pushing, or creating/updating a PR.

Use this after `/spk:review` passes, or when the user asks to open a PR, prepare a PR body, monitor CI, or repair a PR branch.

## Pre-computed Context
!`git status --short --branch --untracked-files=all`
!`git remote get-url origin 2>/dev/null || true`
!`git rev-list --left-right --count HEAD...origin/main 2>/dev/null || true`
!`git log --oneline --decorate -8`
!`git diff --stat`
!`gh auth status 2>/dev/null || true`

## Workflow

Dispatch: `Task(subagent_type="spk:pr-manager", prompt="Prepare a GitHub PR workflow for: $ARGUMENTS. Default to PREPARE_ONLY unless the user explicitly asked to push/open/update a PR. Inspect branch state, dirty files, diff stat, commit history, and gh auth. Verify local gates when needed, stage only reviewed files if commit mode is explicitly requested, run a secret scan before commit, create or update a conventional PR body, and pause for explicit operator confirmation before any git push, force-with-lease, or gh pr create/update. If pushing/creating PR is unsafe or auth is missing, stop with BLOCKED and exact next commands.")`

Expect: PR body/checklist in prepare-only mode, PR URL after explicit approval in open/update mode, or a safe `BLOCKED` report with exact reason.

## Safety Rules

- Default to prepare-only: do not stage, commit, push, or create/update a PR unless the user explicitly requested that mode.
- Never force-push unless explicitly instructed and using `--force-with-lease`.
- Pause for explicit operator confirmation before any `git push`, `git push --force-with-lease`, or `gh pr create/update`.
- Never push from dirty `main` without listing every outgoing commit.
- Stage reviewed paths only. Do not `git add .` when untracked/generated/operator files exist.
- Secret-scan the exact staged diff before commit.
- If GitHub auth is missing, prepare the PR body locally and report setup steps.
