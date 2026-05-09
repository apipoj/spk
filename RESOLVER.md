# SPK Resolver

Maps user intent → the right SPK skill. When the main-thread Claude is unsure which `/spk:*` skill fits, consult this file.

<!-- SPK-COMMANDS:start -->
| Skill | Dispatches to subagent |
|---|---|
| `/spk:plan` | plan-orchestrator |
| `/spk:code` | build-orchestrator |
| `/spk:review` | audit-orchestrator |
| `/spk:bala` | verifier |
| `/spk:sunzi` | planner |
| `/spk:design-shotgun` | designer |
| `/spk:debug` | debugger |
| `/spk:deploy` | deploy-orchestrator |
| `/spk:pr` | pr-manager |
| `/spk:ingest` | plan-orchestrator |
| `/spk:prime` | primer |
| `/spk:query` | researcher |
| `/spk:wiki-lint` | audit-orchestrator |
| `/spk:tdd` | build-orchestrator |
| `/spk:uninstall` | (no subagent) |
<!-- SPK-COMMANDS:end -->

## Intent → Skill Reference

### Planning

- "plan a feature" / "design X" / "what should we build" → `/spk:plan <feature>`
- "write a PRD" / "I need requirements" → `/spk:plan` (plan-orchestrator will dispatch prd-writer)
- "competitor research" / "how do others solve this" → `/spk:plan` (plan-orchestrator dispatches business-analyst)
- "architecture for X" → `/spk:plan` (plan-orchestrator dispatches architect)
- "show me design options" / "design shotgun" / "visual brainstorm" / "I don't like this UI" / "ขอหลายแบบให้เลือก" → `/spk:design-shotgun <screen|URL|rough idea>`

### Building

- "implement X" / "build the feature" / "code this up" → `/spk:code <plan ref>`
- "write tests first" / "TDD X" → `/spk:tdd <feature>`
- "update docs" / "document the API" → `/spk:code` (build-orchestrator dispatches docs)

### Auditing

- "review my changes" / "code review" / "ultrareview" → `/spk:review [diff]`
- "พละ 5" / "Bala 5" / "balance this plan" / "are we overbuilding" / "ช่วยเช็คสติ สมาธิ ปัญญา" → `/spk:bala <scope|plan|diff>`
- "ซุนวู" / "Sun Tzu" / "Sunzi" / "strategy lens" / "choose battle" / "competitive move" / "smallest winning move" → `/spk:sunzi <goal|plan|rollout>`
- "security audit" / "OWASP check" / "find secrets" → `/spk:review` (audit-orchestrator uses code-auditor with security lens)
- "lint the wiki" / "check wiki health" → `/spk:wiki-lint`
- "debug this error" / "why is X failing" / "root cause this" → `/spk:debug <error|repro>`
- "verify before commit" / "quality gate" → verifier runs as part of audit-orchestrator

### Shipping

- "prepare PR body" / "PR checklist" → `/spk:pr [title|scope]` (prepare-only by default; no push/write)
- "open a PR" / "create pull request" → `/spk:pr [title|scope]` (requires explicit confirmation before push or GitHub write)
- "deploy to staging" / "ship this" → `/spk:deploy staging`
- "deploy to production" → `/spk:deploy production` (requires user confirmation)
- "check deployment health" → deploy-orchestrator's deployment-smoke agent
- "UI smoke test" → deploy-orchestrator's browser-tester agent

### Memory / Wiki

- "ingest this file" / "add to wiki" / "save this for later" → `/spk:ingest <file|url>`
- "prime this repo" / "prepare subagents" / "scan source folders" → `/spk:prime [scope]`
- "what do we know about X" / "query the wiki" / "did we decide anything on Y" → `/spk:query <question>`

### Cleanup

- "remove SPK" / "uninstall" → `/spk:uninstall`

## Workflow Phases

Skills map to 4 phases, color-coded:

- Planning (green) → `/spk:plan`, `/spk:design-shotgun`, `/spk:prime`
- Building (blue) → `/spk:code`, `/spk:tdd`, `/spk:ingest` (when ingesting for implementation), `/spk:query`
- Auditing (purple) → `/spk:review`, `/spk:bala`, `/spk:sunzi`, `/spk:debug`, `/spk:wiki-lint`
- Shipping (orange) → `/spk:deploy`, `/spk:pr`

## When Main-Thread Should Dispatch Directly

Sometimes the main-thread Claude can dispatch a single specialist via `Task(subagent_type=...)` without going through an orchestrator — when the scope is narrow:

- Single file implementation → `Task(implementer, ...)`
- Quick docs update → `Task(docs, ...)`
- Visual design exploration → `Task(designer, ...)`
- One-off test run → `Task(verifier, ...)`

When scope is broader (multi-file, multi-step, cross-concern) → use the corresponding skill/orchestrator.
