---
description: Prepare, verify, push, and open a GitHub PR with a conventional PR body and CI follow-up.
argument-hint: "[title or scope; optional: draft|ready]"
---

# /pr — PR Preparation

Prepare a GitHub pull request. Default mode is **prepare-only**: produce the PR body and safety report without staging, committing, pushing, or creating a PR.

## Context

- Run `git status --short --branch --untracked-files=all`
- Run `git remote get-url origin` and `git rev-list --left-right --count HEAD...origin/main`
- Run `git log --oneline --decorate -8` and `git diff --stat`
- Check `gh auth status`

## Workflow

### Prepare-Only Mode (default)

1. **Branch hygiene.** Check branch name, dirty files, untracked files.
2. **Diff review.** Summarize what changed: files, lines, scope.
3. **Conventional PR body.** Generate a structured PR body with:
   - Title (conventional commit format)
   - Summary of changes
   - Type (feat/fix/docs/refactor/etc.)
   - Breaking changes (if any)
   - Testing notes
   - Checklist
4. **Safety report.** Flag: secrets in diff, large binary files, missing tests, docs drift.
5. **Output.** Print the PR body and safety report. Do NOT push or create PR.

### Open/Update Mode (explicit request only)

1. Complete all prepare-only steps.
2. Stage only reviewed paths. Do not `git add .` when untracked/generated files exist.
3. Run a secret scan on the exact staged diff.
4. Commit with a conventional message.
5. Pause for explicit user confirmation before any push or GitHub write.
6. Push (use `--force-with-lease` only if explicitly instructed).
7. Create or update the PR via `gh pr create/update`.

## Output Format

```markdown
## PR Report
- Mode: <prepare-only|open|update>
- Branch: <name>
- Status: <ready|blocked>
- PR body: <full body text>
- Safety: <issues found or "clean">
- Next step: <manual command or auto-done>
```

## Safety Rules

- Default to prepare-only: do not stage, commit, push, or create/update a PR unless explicitly requested.
- Never force-push unless explicitly instructed and using `--force-with-lease`.
- Pause for explicit operator confirmation before any `git push`, `git push --force-with-lease`, or `gh pr create/update`.
- Never push from dirty `main` without listing every outgoing commit.
- Stage reviewed paths only. Do not `git add .` when untracked/generated/operator files exist.
- Secret-scan the exact staged diff before commit.
- If GitHub auth is missing, prepare the PR body locally and report setup steps.
