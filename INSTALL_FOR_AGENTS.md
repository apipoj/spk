# SPK - Install

SPK v3.1+ is distributed as a **Claude Code plugin**. Install in two commands:

```
/plugin marketplace add apipoj/spk
/plugin install spk@spk
```

The plugin hot-reloads - no `claude` restart needed. On the next session start, SPK scaffolds `ai_context/wiki/` and `ai_context/sources/` into your project automatically.

Update an existing install with:

```text
/plugin update
```

## Skills (after install)

Type `/spk:` to see: `/spk:plan`, `/spk:code`, `/spk:review`, `/spk:bala`, `/spk:sunzi`, `/spk:design-shotgun`, `/spk:debug`, `/spk:deploy`, `/spk:pr`, `/spk:ingest`, `/spk:prime`, `/spk:query`, `/spk:wiki-lint`, `/spk:tdd`, `/spk:uninstall`.

Subagents are auto-namespaced: `spk:planner`, `spk:architect`, etc.

## Common Workflows

- Bala 5 balance check: `/spk:bala <scope|plan|diff>` applies confidence, energy, mindfulness, concentration, and wisdom as an engineering workflow check.
- Sunzi strategy check: `/spk:sunzi <goal|plan|rollout>` applies know-self/know-constraint, terrain, leverage, and smallest-winning-move thinking.
- Design shotgun: `/spk:design-shotgun <screen|URL|rough idea>` generates multiple UI directions, a comparison board, feedback notes, and an approved direction before implementation.
- Debug/root cause: `/spk:debug <error or repro>` diagnoses first and does not patch source code.
- TDD build: `/spk:tdd <feature>` runs RED-GREEN-REFACTOR with focused verification.
- Safe PR prep: `/spk:pr <title or scope>` defaults to prepare-only. It must ask for explicit confirmation before any push or GitHub write.
- Repo priming: `/spk:prime [scope]` scans source roots and creates concise `CLAUDE.md` / `AGENTS.md` context files for downstream subagents.

## Uninstall

```
/plugin uninstall spk
```

Wiki data (`ai_context/wiki/`, `ai_context/sources/`) is preserved - that's user data.

## Native Skills (Thai, No Plugin Required)

If you prefer not to use the Claude Code plugin system, the `skills/` directory at the repo root contains self-contained native skill copies written in Thai. These are standalone playbooks that run as main-thread workflows without subagents, `Task()` dispatch, or plugin dependencies.

**How to use:**
1. Clone or download the repo.
2. For a project-local skill, copy the whole directory: `skills/spk-<slug>/` → `.claude/skills/spk-<slug>/`.
3. For a personal skill available in every project, copy it to `~/.claude/skills/spk-<slug>/`.
4. Invoke with `/spk-<slug>` in Claude Code (e.g. `/spk-bala`, `/spk-code`, `/spk-plan`).

**Available skills:** spk-bala, spk-code, spk-debug, spk-deploy, spk-design-shotgun, spk-ingest, spk-plan, spk-pr, spk-prime, spk-query, spk-review, spk-sunzi, spk-tdd, spk-uninstall, spk-wiki-lint.

**Differences from plugin skills:**
- Written in Thai.
- No plugin install needed.
- No `Task()` subagent dispatch - all workflows run on the main thread.
- No auto-scaffolding (wiki/hooks are not created automatically).
- No `/spk:` namespace - skills use `/spk-<slug>` directly.

Verify native skills: `npm run verify:native`

## Still want the legacy paste-install?

v3.0.2 was the last version using the paste-install workflow. Pin to it:

```
https://raw.githubusercontent.com/apipoj/spk/v3.0.2/INSTALL_FOR_AGENTS.md
```

v3.0.x won't receive new features.
