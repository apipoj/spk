---
description: Audit the wiki for orphans, contradictions, stale claims, missing citations, dead links, secrets.
---

# /spk-wiki-lint

Delegate to `audit-orchestrator` with wiki-lint lens.

## Pre-computed Context
!`ls ai_context/wiki/ 2>/dev/null`

## Workflow

Dispatch: `Task(subagent_type="audit-orchestrator", prompt="Wiki lint — run code-auditor with wiki-lint lens over ai_context/wiki/. Report issues + proposed auto-fixes.")`

Expect: lint report with severity-ranked findings + auto-fix proposals.
