---
description: Wiki-first Q&A. researcher answers from wiki; only hits external sources if wiki is silent.
argument-hint: "[question]"
---

# /spk:query

Delegate to `researcher` for wiki-first lookup.

## Pre-computed Context
!`ls ai_context/wiki/ 2>/dev/null`

## Workflow

Dispatch: `Task(subagent_type="researcher", prompt="Query (wiki-first): $ARGUMENTS. Check ai_context/wiki/index.md before any external call.")`

Expect: answer, citations to wiki pages or external sources. Answer may be saved back to wiki as a new page.
