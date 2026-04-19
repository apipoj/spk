# SPK Resolver

Maps user intent → the right SPK command. When the main-thread Claude is unsure which `/spk-*` command fits, consult this file.

<!-- SPK-COMMANDS:start -->
| Command | Dispatches to |
|---|---|
| `/spk-plan` | spk-plan-orchestrator |
| `/spk-code` | spk-build-orchestrator |
| `/spk-review` | spk-audit-orchestrator |
| `/spk-deploy` | spk-deploy-orchestrator |
| `/spk-ingest` | spk-plan-orchestrator |
| `/spk-query` | spk-researcher |
| `/spk-wiki-lint` | spk-audit-orchestrator |
| `/spk-tdd` | spk-build-orchestrator |
| `/spk-uninstall` | (no agent) |
<!-- SPK-COMMANDS:end -->

## Intent → Command Reference

### Planning

- "plan a feature" / "design X" / "what should we build" → `/spk-plan <feature>`
- "write a PRD" / "I need requirements" → `/spk-plan` (plan-orchestrator will dispatch prd-writer)
- "competitor research" / "how do others solve this" → `/spk-plan` (plan-orchestrator dispatches business-analyst)
- "architecture for X" → `/spk-plan` (plan-orchestrator dispatches architect)

### Building

- "implement X" / "build the feature" / "code this up" → `/spk-code <plan ref>`
- "write tests first" / "TDD X" → `/spk-tdd <feature>`
- "update docs" / "document the API" → `/spk-code` (build-orchestrator dispatches docs)

### Auditing

- "review my changes" / "code review" / "ultrareview" → `/spk-review [diff]`
- "security audit" / "OWASP check" / "find secrets" → `/spk-review` (audit-orchestrator uses code-auditor with security lens)
- "lint the wiki" / "check wiki health" → `/spk-wiki-lint`
- "debug this error" / "why is X failing" → `/spk-review` (audit-orchestrator dispatches debugger)
- "verify before commit" / "quality gate" → verifier runs as part of audit-orchestrator

### Shipping

- "deploy to staging" / "ship this" → `/spk-deploy staging`
- "deploy to production" → `/spk-deploy production` (requires user confirmation)
- "check deployment health" → deploy-orchestrator's deployment-smoke agent
- "UI smoke test" → deploy-orchestrator's browser-tester agent

### Memory / Wiki

- "ingest this file" / "add to wiki" / "save this for later" → `/spk-ingest <file|url>`
- "what do we know about X" / "query the wiki" / "did we decide anything on Y" → `/spk-query <question>`

### Cleanup

- "remove SPK" / "uninstall" → `/spk-uninstall`

## Workflow Phases

Commands map to 4 phases, color-coded:

- Planning (green) → `/spk-plan`
- Building (blue) → `/spk-code`, `/spk-tdd`, `/spk-ingest` (when ingesting for implementation), `/spk-query`
- Auditing (purple) → `/spk-review`, `/spk-wiki-lint`
- Shipping (orange) → `/spk-deploy`

## When Main-Thread Should Dispatch Directly

Sometimes the main-thread Claude can dispatch a single specialist via `Task(subagent_type=...)` without going through an orchestrator — when the scope is narrow:

- Single file implementation → `Task(implementer, ...)`
- Quick docs update → `Task(docs, ...)`
- One-off test run → `Task(verifier, ...)`

When scope is broader (multi-file, multi-step, cross-concern) → use the corresponding command.
