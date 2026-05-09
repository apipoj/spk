# SPK — Install

SPK v3.1+ is distributed as a **Claude Code plugin**. Install in two commands:

```
/plugin marketplace add apipoj/spk
/plugin install spk@spk
```

The plugin hot-reloads — no `claude` restart needed. On the next session start, SPK scaffolds `ai_context/wiki/` and `ai_context/sources/` into your project automatically.

## Skills (after install)

Type `/spk:` to see: `/spk:plan`, `/spk:code`, `/spk:review`, `/spk:bala`, `/spk:sunzi`, `/spk:debug`, `/spk:deploy`, `/spk:pr`, `/spk:ingest`, `/spk:prime`, `/spk:query`, `/spk:wiki-lint`, `/spk:tdd`, `/spk:uninstall`.

Subagents are auto-namespaced: `spk:planner`, `spk:architect`, etc.

## Common Workflows

- Bala 5 balance check: `/spk:bala <scope|plan|diff>` applies confidence, energy, mindfulness, concentration, and wisdom as an engineering workflow check.
- Sunzi strategy check: `/spk:sunzi <goal|plan|rollout>` applies know-self/know-constraint, terrain, leverage, and smallest-winning-move thinking.
- Debug/root cause: `/spk:debug <error or repro>` diagnoses first and does not patch source code.
- TDD build: `/spk:tdd <feature>` runs RED-GREEN-REFACTOR with focused verification.
- Safe PR prep: `/spk:pr <title or scope>` defaults to prepare-only. It must ask for explicit confirmation before any push or GitHub write.
- Repo priming: `/spk:prime [scope]` scans source roots and creates concise `CLAUDE.md` / `AGENTS.md` context files for downstream subagents.

## Uninstall

```
/plugin uninstall spk
```

Wiki data (`ai_context/wiki/`, `ai_context/sources/`) is preserved — that's user data.

## Still want the legacy paste-install?

v3.0.2 was the last version using the paste-install workflow. Pin to it:

```
https://raw.githubusercontent.com/apipoj/spk/v3.0.2/INSTALL_FOR_AGENTS.md
```

v3.0.x won't receive new features.
