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
| `plan-orchestrator` | orchestrator | claude-opus-4-7 | green | planning |
| `build-orchestrator` | orchestrator | claude-opus-4-7 | blue | building |
| `audit-orchestrator` | orchestrator | claude-opus-4-7 | purple | auditing |
| `deploy-orchestrator` | orchestrator | claude-opus-4-7 | orange | shipping |
| `prd-writer` | specialist | claude-opus-4-7 | green | planning |
| `business-analyst` | specialist | claude-opus-4-7 | green | planning |
| `architect` | specialist | claude-opus-4-7 | green | planning |
| `planner` | specialist | claude-opus-4-7 | green | planning |
| `debugger` | specialist | claude-opus-4-7 | purple | auditing |
| `code-auditor` | specialist | claude-opus-4-7 | purple | auditing |
| `implementer` | specialist | claude-sonnet-4-6 | blue | building |
| `tester` | specialist | claude-sonnet-4-6 | blue | building |
| `docs` | specialist | claude-sonnet-4-6 | blue | building |
| `researcher` | specialist | claude-sonnet-4-6 | blue | building |
| `verifier` | specialist | claude-sonnet-4-6 | purple | auditing |
| `deployment-smoke` | specialist | claude-sonnet-4-6 | orange | shipping |
| `browser-tester` | specialist | claude-sonnet-4-6 | orange | shipping |
<!-- SPK-AGENTS:end -->

## Commands

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
