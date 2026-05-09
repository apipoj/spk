# AI Sprint Kit (SPK)

![AI Sprint Kit repo banner](./assets/repo-banner.png)

Skills & subagent development for Claude Code. Ships as a plugin — hot-reloads in your session, no restart.

**Positioning:** Skills-first Subagents — subagents become more capable through reusable skills/playbooks, not just longer prompts.

<!-- SPK-COUNTS:start -->
**20 subagents** (4 orchestrators + 16 specialists) · **12 skills**
<!-- SPK-COUNTS:end -->

## Install

```
/plugin marketplace add apipoj/spk
/plugin install spk@spk
```

Done. The plugin hot-reloads. On next session start, SPK scaffolds `ai_context/wiki/` and `ai_context/sources/` into your project automatically.

Skills are auto-namespaced: type `/spk:` to see `/spk:plan`, `/spk:code`, `/spk:review`, `/spk:debug`, `/spk:deploy`, `/spk:pr`, `/spk:ingest`, `/spk:prime`, `/spk:query`, `/spk:wiki-lint`, `/spk:tdd`, `/spk:uninstall`.

Subagents are auto-namespaced too: `spk:planner`, `spk:architect`, etc.

## Workflow Highlights

- `/spk:debug` is for failing tests, unclear errors, regressions, and unexpected behavior: `spk:debugger` performs root-cause analysis before any fix and returns evidence + a regression-test recommendation.
- `/spk:pr` prepares PRs safely: default mode is prepare-only, producing a PR body/checklist/safety report first, and requiring explicit confirmation before any push or `gh pr create/edit`.
- `/spk:tdd` enforces RED-GREEN-REFACTOR: tests must fail for the expected reason before implementation begins.
- Orchestrators share one subagent contract: self-contained specialist prompts, parallel dispatch only for non-overlapping work, one retry for `BLOCKED`, and verifier gate before saying done.

## Subagent Squad

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
| `primer` | specialist | claude-sonnet-4-6 | green | planning |
| `debugger` | specialist | claude-opus-4-7 | purple | auditing |
| `code-auditor` | specialist | claude-opus-4-7 | purple | auditing |
| `implementer` | specialist | claude-sonnet-4-6 | blue | building |
| `tester` | specialist | claude-sonnet-4-6 | blue | building |
| `docs` | specialist | claude-sonnet-4-6 | blue | building |
| `researcher` | specialist | claude-sonnet-4-6 | blue | building |
| `verifier` | specialist | claude-sonnet-4-6 | purple | auditing |
| `pr-manager` | specialist | claude-sonnet-4-6 | orange | shipping |
| `devops` | specialist | claude-sonnet-4-6 | orange | shipping |
| `deployment-smoke` | specialist | claude-sonnet-4-6 | orange | shipping |
| `browser-tester` | specialist | claude-sonnet-4-6 | orange | shipping |
<!-- SPK-AGENTS:end -->

## Skills / Slash Commands

<!-- SPK-COMMANDS:start -->
| Skill | Dispatches to subagent |
|---|---|
| `/spk:plan` | plan-orchestrator |
| `/spk:code` | build-orchestrator |
| `/spk:review` | audit-orchestrator |
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
