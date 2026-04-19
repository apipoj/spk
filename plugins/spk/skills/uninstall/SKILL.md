---
description: Remove SPK from this project. Deletes .claude/{agents,commands,hooks}/, .spk/, and SPK-marked section of CLAUDE.md.
---

# /spk:uninstall

Remove SPK without an orchestrator — this is a direct cleanup.

## Workflow

1. Remove `.claude/agents/` entries that came from SPK (any file whose frontmatter `name` matches a manifest agent).
2. Remove `.claude/commands/spk:*.md` (or plugin-installed skill entries).
3. Remove `.claude/hooks/` entries SPK installed (documented in `.spk/installed.json` after install).
4. Remove `.spk/` directory entirely.
5. If CLAUDE.md has an `<!-- SPK:start -->` ... `<!-- SPK:end -->` block, remove only that block (preserve user content above/below).
6. DO NOT touch `ai_context/wiki/` or `ai_context/sources/` — that's user data.
7. Print summary: what was removed, what was preserved.
