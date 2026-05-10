---
description: Audit the project wiki for orphans, contradictions, stale claims, missing citations, dead links, and secrets.
---

# /wiki-lint — Wiki Health Audit

Run a health check on the project wiki. Find orphans, contradictions, stale claims, missing citations, dead links, and potential secrets.

## Context

- List all files in `ai_context/wiki/`
- Read `ai_context/wiki/index.md` for the catalog
- Read `ai_context/wiki/log.md` for recent activity

## Audit Checks

### 1. Orphan Detection
- Pages not linked from the index or any other page.
- Index entries pointing to non-existent pages.

### 2. Contradiction Check
- Claims on one page that contradict another.
- Outdated information that conflicts with recent changes.

### 3. Stale Claims
- Pages referencing deprecated APIs, old versions, or removed features.
- Temporal references that are now outdated (e.g., "upcoming" events that have passed).

### 4. Citation Audit
- Claims without source citations.
- External links that are dead or redirected.

### 5. Link Integrity
- Internal wiki links that point to non-existent pages.
- Broken cross-references.

### 6. Secret Scan
- Scan all wiki pages for potential secrets: API keys, tokens, credentials, passwords.
- Any match is a Critical finding.

## Output Format

```markdown
## Wiki Lint Report
- Pages scanned: <count>
- Index entries: <count>

### Findings

#### Critical
- <page> <issue>

#### Important
- <page> <issue>

#### Minor
- <page> <issue>

### Auto-fix Proposals
- <issue> → <proposed fix>
```

## Guardrails

- Do not modify wiki pages without user approval.
- Flag secrets as Critical regardless of context.
- Report findings ranked by severity.
