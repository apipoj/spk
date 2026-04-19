---
description: Ingest a source file into the wiki. plan-orchestrator extracts entities + concepts and writes pages.
argument-hint: "[file path or URL]"
---

# /spk-ingest

Delegate to `plan-orchestrator` for wiki ingest.

## Pre-computed Context
!`ls ai_context/sources/ 2>/dev/null | head -5`

## Workflow

Dispatch: `Task(subagent_type="plan-orchestrator", prompt="Ingest into wiki: $ARGUMENTS")`

Expect: source copied to `ai_context/sources/`, wiki pages created/updated, `log.md` appended.
