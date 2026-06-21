# AI Sprint Kit (SPK)

![AI Sprint Kit repo banner](./assets/repo-banner.png)

Skills & subagent development for Claude Code. Ships as a plugin - hot-reloads in your session, no restart.

**Positioning:** Skills-first Subagents - subagents become more capable through reusable skills/playbooks, not just longer prompts.

<!-- SPK-COUNTS:start -->
**21 subagents** (4 orchestrators + 17 specialists) · **18 skills**
<!-- SPK-COUNTS:end -->

## Install

```
/plugin marketplace add apipoj/spk
/plugin install spk@spk
```

> **SSH errors?** The marketplace clones repos via SSH. If you don't have SSH keys set up on GitHub, use the full HTTPS URL instead:
>
> ```text
> /plugin marketplace add https://github.com/apipoj/spk.git
> /plugin install spk@spk
> ```

Done. The plugin hot-reloads. On next session start, SPK scaffolds `ai_context/wiki/` and `ai_context/sources/` into your project automatically.

Update an existing install with:

```text
/plugin update
```

Skills are auto-namespaced: type `/spk:` to see `/spk:jumpstart`, `/spk:plan`, `/spk:code`, `/spk:review`, `/spk:bala`, `/spk:sunzi`, `/spk:design-shotgun`, `/spk:debug`, `/spk:deploy`, `/spk:pr`, `/spk:ingest`, `/spk:prime`, `/spk:query`, `/spk:wiki-lint`, `/spk:tdd`, `/spk:uninstall`.

Subagents are auto-namespaced too: `spk:planner`, `spk:architect`, etc.

## Start in 60 seconds

Installed? Don't pick from 18 skills — run one command:

```text
/spk:jumpstart
```

Jumpstart prepares your repo (creates `AGENTS.md` if missing), asks one question about what you want to do (build a feature / fix a bug / improve UI), and walks you to a first win — a reviewable plan on your real project — always asking one confirmation before writing any code.

Already know your goal? Pass it directly: `/spk:jumpstart add a login page`

**Which subagents Jumpstart calls** (you never run these yourself — the wizard handles it):

| Step | Condition | Subagent / Workflow called |
|---|---|---|
| 1. Prime repo | when `AGENTS.md` is missing | `spk:primer` |
| 2. Route by goal | build a feature | `spk:plan-orchestrator` (same as `/spk:plan`) |
|  | fix a bug | `spk:debugger` (same as `/spk:debug`) |
|  | improve UI | `spk:designer` (same as `/spk:design-shotgun`) |
| 3. Implement | after your one "go ahead" confirmation | `spk:build-orchestrator` (same as `/spk:code`) |

Before the implement step (step 3), Jumpstart writes no source code and never pushes or opens a PR — that stays behind `/spk:pr`'s separate confirmation.

## Workflow Highlights

- `/spk:bala` applies the Buddhist Five Powers as a practical balance check before plan/code/review/debug: confidence, energy, mindfulness, concentration, and wisdom.
- `/spk:sunzi` applies Sun Tzu as a practical strategy lens before choosing battles, architecture, rollout, or competitive moves: know self, know constraints, choose terrain, and find the smallest winning move.
- `/spk:design-shotgun` runs GStack-style visual brainstorming: generate 3+ design directions, build a comparison board, collect feedback, and lock an approved direction before `/spk:code`.
- `/spk:debug` is for failing tests, unclear errors, regressions, and unexpected behavior: `spk:debugger` performs root-cause analysis before any fix and returns evidence + a regression-test recommendation.
- `/spk:pr` prepares PRs safely: default mode is prepare-only, producing a PR body/checklist/safety report first, and requiring explicit confirmation before any push or `gh pr create/edit`.
- `/spk:prime` prepares repo context for subagents by making `AGENTS.md` the source of truth and `CLAUDE.md` a `@AGENTS.md` pointer to avoid cross-tool drift.
- `/spk:tdd` enforces RED-GREEN-REFACTOR: tests must fail for the expected reason before implementation begins.
- Orchestrators share one subagent contract: self-contained specialist prompts, parallel dispatch only for non-overlapping work, one retry for `BLOCKED`, and verifier gate before saying done.
- WebFetch responses are cached per URL and served only after the origin confirms `304 Not Modified` via ETag/Last-Modified revalidation — repeat doc lookups in `/spk:query` and research flows get faster with zero staleness risk. Disable with `SPK_WEBFETCH_CACHE=off`.

## Subagent Squad

<!-- SPK-AGENTS:start -->
| Name | Role | Model | Color | Phase |
|---|---|---|---|---|
| `plan-orchestrator` | orchestrator | claude-opus-4-8 | green | planning |
| `build-orchestrator` | orchestrator | claude-opus-4-8 | blue | building |
| `audit-orchestrator` | orchestrator | claude-opus-4-8 | purple | auditing |
| `deploy-orchestrator` | orchestrator | claude-opus-4-8 | orange | shipping |
| `prd-writer` | specialist | claude-opus-4-8 | green | planning |
| `business-analyst` | specialist | claude-opus-4-8 | green | planning |
| `architect` | specialist | claude-opus-4-8 | green | planning |
| `planner` | specialist | claude-opus-4-8 | green | planning |
| `designer` | specialist | claude-sonnet-4-6 | green | planning |
| `primer` | specialist | claude-sonnet-4-6 | green | planning |
| `debugger` | specialist | claude-opus-4-8 | purple | auditing |
| `code-auditor` | specialist | claude-opus-4-8 | purple | auditing |
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
| `/spk:jumpstart` | plan-orchestrator |
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
| `/spk:release-check` | verifier |
| `/spk:scoped-tests` | tester |
| `/spk:uninstall` | (no subagent) |
<!-- SPK-COMMANDS:end -->

## Memory

Every installed project gets a Karpathy-style LLM-wiki at `ai_context/wiki/`:
- `sources/` - raw files you drop in, immutable
- `wiki/` - LLM-maintained concept/entity/decision pages, cross-linked
- `index.md` - catalog of every wiki page
- `log.md` - append-only record of ingests, queries, lints

Drop a file in `ai_context/sources/` and it auto-ingests. Ask `/spk:query "..."` and the wiki answers before the web does.

## Security

5-layer defense for wiki: ingest-time secret scan, pre-write fail-closed hook, lint-time audit, `.gitignore`-gated sources directory, `.gitignore` respect during wiki-build. Secrets never land in wiki pages.

## Hooks

SPK registers these hooks automatically. All of them fail open — any internal error lets the underlying tool call proceed:

| Hook | Event | What it does |
|---|---|---|
| `init-ai-context` | SessionStart | Scaffolds the `ai_context/` templates on first session (idempotent via a version marker) |
| `wiki-secret-scan` | PreToolUse (Write/Edit) | Blocks writes of secret-shaped strings into `ai_context/wiki/**` |
| `gitignore-guard` | PreToolUse (Read/Grep/Glob) | During wiki-build, blocks reads of `.gitignore`d files |
| `webfetch-cache` | PreToolUse + PostToolUse (WebFetch) | Per-URL cache served only after the origin confirms `304 Not Modified`; disable with `SPK_WEBFETCH_CACHE=off` |
| `auto-ingest` | PostToolUse (Write) | New files in `ai_context/sources/` trigger a nudge to run `/spk:ingest`; tune with `SPK_AUTO_INGEST` |

## Native Skills (Thai, No Plugin)

The `skills/` directory at the repo root contains native skill copies written in Thai that work without the Claude Code plugin - useful if you don't use the plugin system or want self-contained skill playbooks.

**Usage:** copy the full `skills/spk-<slug>/` directory into `.claude/skills/spk-<slug>/` for a project skill, or `~/.claude/skills/spk-<slug>/` for a personal skill available everywhere. Invoke with `/spk-bala`, `/spk-code`, `/spk-plan`, etc.

Native skills are written in Thai, prefixed with `spk-`, and run as main-thread workflows without subagents or plugins.

**Available skills:**
- `/spk-bala` - Five Powers balance check
- `/spk-code` - implement from plan with TDD
- `/spk-debug` - systematic root cause analysis
- `/spk-deploy` - deploy and verify
- `/spk-design-shotgun` - visual brainstorm with multiple directions
- `/spk-ingest` - ingest sources into wiki
- `/spk-plan` - feature planning
- `/spk-pr` - safe PR preparation
- `/spk-prime` - prime repo context
- `/spk-query` - wiki-first Q&A
- `/spk-review` - multi-pass code review
- `/spk-sunzi` - Sun Tzu strategy lens
- `/spk-tdd` - strict TDD loop
- `/spk-uninstall` - remove SPK
- `/spk-wiki-lint` - wiki health audit

**Differences from plugin skills:**
- Written in Thai
- No plugin install required
- No `Task()` dispatch to subagents
- Workflows run directly on the main thread
- No auto-scaffolding of wiki/hooks

Plugin skills (`/spk:plan`, `/spk:code`, etc.) continue to work as before after plugin install - native skills are an alternative path.

Verify native skills: `npm run verify:native`

## Requirements

- Claude Code (subscription - Max or Pro)
- Git
- Node.js 20+ (one-time install only; agents don't need it at runtime)

## License

MIT
