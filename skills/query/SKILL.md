---
description: Wiki-first Q&A — check the project wiki first, then external sources only if the wiki is silent.
argument-hint: "[question]"
---

# /query — Wiki-First Q&A

Answer questions by checking the project wiki first. Only consult external sources if the wiki has no relevant information.

## Context

- Check `ai_context/wiki/index.md` for available pages
- Check `ai_context/wiki/log.md` for recent activity

## Workflow

### 1. Wiki Lookup
- Search the wiki index and relevant pages for the answer.
- Check concept pages, decision pages, and entity pages.
- Cross-reference related pages.

### 2. External Fallback
- If the wiki has no relevant information, search external sources.
- Prefer official documentation over blog posts.
- Cite all external sources.

### 3. Answer
- Provide a clear, concise answer.
- Cite wiki pages or external sources.
- If the answer would benefit the wiki, offer to save it as a new page.

### 4. Optional Wiki Update
- If the answer fills a gap in the wiki, create or update the relevant page.
- Update the wiki index and log.

## Output Format

```markdown
## Answer
<personalized answer to the question>

### Sources
- <wiki page or external URL>

### Wiki updated
<yes/no — if yes, which pages>
```

## Guardrails

- Always check the wiki first before external sources.
- Cite sources for every factual claim.
- Do not fabricate answers — say "I don't know" and suggest where to look.
- Do not modify wiki pages unless the user agrees.
