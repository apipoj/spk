---
description: Run the complete SPK release checklist: manifest, docs, references, native skills, tests, secrets, and git readiness.
argument-hint: "[release scope or version]"
---

# /spk:release-check

Run a release-readiness checklist before tagging, committing, pushing, or publishing SPK-related work.

## Pre-computed Context
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git status --short --branch || true; else echo "Git status unavailable: not inside a git worktree."; fi`
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git log -3 --oneline || echo "Git history unavailable: no commits yet."; else echo "Git history unavailable: not inside a git worktree."; fi`

## Workflow

Dispatch: `Task(subagent_type="spk:verifier", prompt="Run SPK release check for: $ARGUMENTS. Verify manifest schema, generated docs sync, manifest/plugin/reference sync, native skills, grep gates, full tests, staged-diff secret scan, and git readiness. Do not tag, commit, push, publish, deploy, or call GitHub write APIs. Return exact commands run, pass/fail status, blockers, and next safe action.")`

## Required Gates

Run or explicitly justify skipping each gate:

```bash
npm run validate:manifest
npm run regen:check
npm run verify:sync
npm run verify:refs
npm run verify:descriptions
npm run verify:agents
npm run verify:gates
npm run verify:native
npm test -- --runInBand
```

Also check:
- `git status --short --branch`
- outgoing commits with `git log --oneline origin/main..HEAD` when on `main`
- staged added-line secret scan before any commit recommendation

## Safety

- Prepare-only by default.
- Never commit, push, tag, publish, or deploy without explicit user confirmation.
- Report blockers before suggesting release.
