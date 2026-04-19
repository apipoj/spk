# AI Sprint Kit (SPK)

Autonomous development for Claude Code (subscription). Paste one line into your agent — it installs itself.

<!-- SPK-COUNTS:start -->
**17 agents** (4 orchestrators + 13 specialists) · **9 commands**
<!-- SPK-COUNTS:end -->

## Install

Paste this into your Claude Code agent:

```
Retrieve and follow the instructions at:
https://raw.githubusercontent.com/apipoj/spk/main/INSTALL_FOR_AGENTS.md
```

The agent clones the repo, asks a few setup questions, provisions `.claude/` in your project, and runs a smoke test. No npm, no CLI binary, no browser install.

## Agent Squad

<!-- SPK-AGENTS:start -->
| Name | Role | Model | Color | Phase |
|---|---|---|---|---|
| `spk-plan-orchestrator` | orchestrator | claude-opus-4-7 | green | planning |
| `spk-build-orchestrator` | orchestrator | claude-opus-4-7 | blue | building |
| `spk-audit-orchestrator` | orchestrator | claude-opus-4-7 | purple | auditing |
| `spk-deploy-orchestrator` | orchestrator | claude-opus-4-7 | orange | shipping |
| `spk-prd-writer` | specialist | claude-opus-4-7 | green | planning |
| `spk-business-analyst` | specialist | claude-opus-4-7 | green | planning |
| `spk-architect` | specialist | claude-opus-4-7 | green | planning |
| `spk-planner` | specialist | claude-opus-4-7 | green | planning |
| `spk-debugger` | specialist | claude-opus-4-7 | purple | auditing |
| `spk-code-auditor` | specialist | claude-opus-4-7 | purple | auditing |
| `spk-implementer` | specialist | claude-sonnet-4-6 | blue | building |
| `spk-tester` | specialist | claude-sonnet-4-6 | blue | building |
| `spk-docs` | specialist | claude-sonnet-4-6 | blue | building |
| `spk-researcher` | specialist | claude-sonnet-4-6 | blue | building |
| `spk-verifier` | specialist | claude-sonnet-4-6 | purple | auditing |
| `spk-deployment-smoke` | specialist | claude-sonnet-4-6 | orange | shipping |
| `spk-browser-tester` | specialist | claude-sonnet-4-6 | orange | shipping |
<!-- SPK-AGENTS:end -->

## Commands

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

## Memory

Every installed project gets a Karpathy-style LLM-wiki at `ai_context/wiki/`:
- `sources/` — raw files you drop in, immutable
- `wiki/` — LLM-maintained concept/entity/decision pages, cross-linked
- `index.md` — catalog of every wiki page
- `log.md` — append-only record of ingests, queries, lints

Drop a file in `ai_context/sources/` and it auto-ingests. Ask `/spk-query "..."` and the wiki answers before the web does.

## Security

5-layer defense for wiki: ingest-time secret scan, pre-write fail-closed hook, lint-time audit, `.gitignore`-gated sources directory, `.gitignore` respect during wiki-build. Secrets never land in wiki pages.

## Requirements

- Claude Code (subscription — Max or Pro)
- Git
- Node.js 20+ (one-time install only; agents don't need it at runtime)

## License

MIT
