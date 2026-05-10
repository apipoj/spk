---
description: Deploy, smoke test, and verify a deployment to staging or production.
argument-hint: "[env: staging|production]"
---

# /deploy — Deploy and Verify

Deploy the current HEAD to the specified environment, run smoke tests, and verify health.

## Context

- Run `git log -1 --format='%H %s'` and `git branch --show-current`
- Verify the working tree is clean (no uncommitted changes)

## Workflow

### Pre-deploy Checks
1. Verify working tree is clean.
2. Confirm the target environment (staging or production).
3. If production: pause for explicit user confirmation before proceeding.
4. Check CI status on the branch if possible.

### Deploy
1. Execute the deployment command or pipeline for the target environment.
2. Capture the deployment output and result.

### Smoke Tests
1. Run deployment smoke tests (health checks, API pings, critical user flows).
2. If UI smoke tests are available, run those too.
3. Capture pass/fail results.

### Report
Summarize deployment result, smoke test verdict, and any issues found.

## Output Format

```markdown
## Deployment Report
- Environment: <staging|production>
- Commit: <hash message>
- Deploy status: <success|failed>
- Smoke tests: <pass/fail summary>
- UI checks: <pass/fail/skipped>
- Issues: <none or list>
- Rollback needed: <yes/no>
```

## Guardrails

- Never deploy from dirty working tree without listing every outgoing commit.
- Production deployments require explicit user confirmation.
- If deployment fails, provide exact error and recommended recovery steps.
- If smoke tests fail, do not proceed to further steps — report and recommend rollback.
