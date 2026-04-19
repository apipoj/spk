# SPK — Install

SPK v3.1+ is distributed as a **Claude Code plugin**. Install in two commands:

```
/plugin marketplace add apipoj/spk
/plugin install spk@spk
```

The plugin hot-reloads — no `claude` restart needed. On the next session start, SPK scaffolds `ai_context/wiki/` and `ai_context/sources/` into your project automatically.

## Skills (after install)

Type `/spk:` to see: `/spk:plan`, `/spk:code`, `/spk:review`, `/spk:deploy`, `/spk:ingest`, `/spk:query`, `/spk:wiki-lint`, `/spk:tdd`, `/spk:uninstall`.

Agents are auto-namespaced: `spk:planner`, `spk:architect`, etc.

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
