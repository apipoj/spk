---
description: Remove SPK from this project — clean up SPK-managed files, hooks, and markers while preserving user data.
---

# /uninstall — Remove SPK

Remove SPK-managed artifacts from this project. User data (wiki, sources) is preserved.

## Workflow

1. Remove `.claude/agents/` entries that came from SPK (any file whose frontmatter `name` matches an SPK-managed worker name).
2. Remove `.claude/commands/` entries matching SPK skill patterns (legacy namespaced skill files).
3. Remove `.claude/hooks/` entries SPK installed (documented in `.spk/installed.json` after install).
4. Remove `.spk/` directory entirely.
5. If CLAUDE.md has an `<!-- SPK:start -->` ... `<!-- SPK:end -->` block, remove only that block (preserve user content above/below).
6. **DO NOT touch `ai_context/wiki/` or `ai_context/sources/`** — that's user data.
7. Print summary: what was removed, what was preserved.

## Output Format

```markdown
## Uninstall Summary
- Removed:
  - <list of files/directories removed>
- Preserved:
  - `ai_context/wiki/` (user data)
  - `ai_context/sources/` (user data)
  - <any other preserved items>
```

## Guardrails

- Never delete `ai_context/wiki/` or `ai_context/sources/`.
- Never modify files outside of SPK-managed paths.
- Preserve all user-authored content.
