# AI Sprint Kit (SPK)

Autonomous development for Claude Code. Ships as a plugin — hot-reloads in your session, no restart.

<!-- SPK-COUNTS:start -->
**18 agents** (4 orchestrators + 14 specialists) · **9 commands**
<!-- SPK-COUNTS:end -->

## Install

```
/plugin marketplace add apipoj/spk
/plugin install spk@spk
```

Done. The plugin hot-reloads. On next session start, SPK scaffolds `ai_context/wiki/` and `ai_context/sources/` into your project automatically.

Skills are auto-namespaced: type `/spk:` to see `/spk:plan`, `/spk:code`, `/spk:review`, `/spk:deploy`, `/spk:ingest`, `/spk:query`, `/spk:wiki-lint`, `/spk:tdd`, `/spk:uninstall`.

Agents are auto-namespaced too: `spk:planner`, `spk:architect`, etc.

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
| `devops` | specialist | claude-sonnet-4-6 | orange | shipping |
| `deployment-smoke` | specialist | claude-sonnet-4-6 | orange | shipping |
| `browser-tester` | specialist | claude-sonnet-4-6 | orange | shipping |
<!-- SPK-AGENTS:end -->

## Commands

<!-- SPK-COMMANDS:start -->
| Command | Dispatches to |
|---|---|
| `/plan` | plan-orchestrator |
| `/code` | build-orchestrator |
| `/review` | audit-orchestrator |
| `/deploy` | deploy-orchestrator |
| `/ingest` | plan-orchestrator |
| `/query` | researcher |
| `/wiki-lint` | audit-orchestrator |
| `/tdd` | build-orchestrator |
| `/uninstall` | (no agent) |
<!-- SPK-COMMANDS:end -->

## Memory

Every installed project gets a Karpathy-style LLM-wiki at `ai_context/wiki/`:
- `sources/` — raw files you drop in, immutable
- `wiki/` — LLM-maintained concept/entity/decision pages, cross-linked
- `index.md` — catalog of every wiki page
- `log.md` — append-only record of ingests, queries, lints

Drop a file in `ai_context/sources/` and it auto-ingests. Ask `/spk:query "..."` and the wiki answers before the web does.

## Security

5-layer defense for wiki: ingest-time secret scan, pre-write fail-closed hook, lint-time audit, `.gitignore`-gated sources directory, `.gitignore` respect during wiki-build. Secrets never land in wiki pages.

## Requirements

- Claude Code (subscription — Max or Pro)
- Git
- Node.js 20+ (one-time install only; agents don't need it at runtime)

## License

MIT
