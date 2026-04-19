# SPK Resolver

Maps user intent → the right orchestrator, agent, or command.

**Not yet implemented — see Plan 2.** This file is an intent-routing reference that Claude reads when the main-thread isn't sure which `/spk-*` command fits a user's request.

<!-- SPK-COMMANDS:start -->
| Command | Dispatches to |
|---|---|
| `/spk-plan` | plan-orchestrator |
| `/spk-code` | build-orchestrator |
| `/spk-review` | audit-orchestrator |
| `/spk-deploy` | deploy-orchestrator |
| `/spk-ingest` | plan-orchestrator |
| `/spk-query` | researcher |
| `/spk-wiki-lint` | audit-orchestrator |
| `/spk-tdd` | build-orchestrator |
| `/spk-uninstall` | (no agent) |
<!-- SPK-COMMANDS:end -->

## Intent → Command

(filled in Plan 2)

- "plan a feature" → /spk-plan
- "implement X" → /spk-code
- "review my changes" → /spk-review
- "deploy this" → /spk-deploy
- "what does this project do" → /spk-query
- "I have a new spec to add" → /spk-ingest
- "audit the wiki" → /spk-wiki-lint
- "write tests first for X" → /spk-tdd
