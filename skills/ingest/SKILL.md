---
description: Ingest a source file into the project wiki — extract entities, concepts, and decisions into cross-linked pages.
argument-hint: "[file path or URL]"
---

# /ingest — Wiki Ingest

Ingest a source file into the wiki. Extract entities, concepts, and decisions and write them as cross-linked wiki pages.

## Context

- Check existing sources in `ai_context/sources/`
- Check existing wiki index at `ai_context/wiki/index.md`

## Workflow

### 1. Acquire Source
- If a file path: copy it to `ai_context/sources/` (immutable).
- If a URL: fetch the content and save to `ai_context/sources/`.
- Compute SHA256 for idempotency — skip if already ingested.

### 2. Extract Entities
- Read the source content and identify: concepts, entities, decisions, people, projects, technologies, relationships.
- Note dates, version numbers, and temporal references.

### 3. Create or Update Wiki Pages
- Create individual wiki pages for significant entities/concepts.
- Cross-link related pages.
- Update `ai_context/wiki/index.md` with new entries.
- Append an entry to `ai_context/wiki/log.md`.

### 4. Verify
- Confirm no secrets leaked into wiki pages (scan for keys, tokens, credentials).
- Confirm .gitignore rules are respected.
- Verify cross-links resolve.

## Output Format

```markdown
## Ingest Report
- Source: <file path or URL>
- Saved to: `ai_context/sources/<filename>`
- Wiki pages created/updated: <list>
- Index updated: <yes/no>
- Log appended: <yes/no>
- Secrets found: <none or count>
```

## Guardrails

- Sources are immutable — never modify files in `ai_context/sources/`.
- Never write secrets into wiki pages.
- Respect .gitignore when scanning the project.
- Skip if source SHA256 matches an already-ingested file.
