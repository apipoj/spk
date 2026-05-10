---
description: Prime a repo for development by scanning source folders and creating/updating local context files.
argument-hint: "[scope: repo|frontend/|apps/api/|packages/*]"
---

# /prime — Repository Priming

Scan source-code folders and create or update local context files (CLAUDE.md, AGENTS.md) so downstream development work has accurate project knowledge.

## Context

- Run `git status --short` and `git log -3 --oneline`
- Identify meaningful source subtrees (package.json, pyproject.toml, go.mod, Cargo.toml, tsconfig, requirements.txt)

## Workflow

### 1. Scan Source Roots
- Walk the project tree and identify meaningful source directories.
- Skip node_modules, .git, dist, build, and other generated directories.
- Respect .gitignore patterns.

### 2. Analyze Each Subtree
- Identify: language, framework, test setup, build tool, entry points.
- Note dependencies, scripts, and configuration.
- Detect monorepo structure (workspaces, packages, apps).

### 3. Create or Update Context Files
- Write or update `CLAUDE.md` at the root and in relevant source subfolders.
- Write or update `AGENTS.md` where appropriate.
- Keep context files concise and factual.
- Preserve human-authored content — do not overwrite existing sections.

### 4. Verify
- Confirm no source code was modified.
- Confirm no secrets were written.
- Confirm .gitignore was respected.

## Output Format

```markdown
## Prime Report
- Scope: <repo or specific paths>
- Source trees found: <list>
- Context files created: <list>
- Context files updated: <list>
- Ignored directories: <list>
- Source code changed: <none>
- Secrets found: <none>
```

## Guardrails

- Never modify product source code.
- Never write secrets into context files.
- Respect .gitignore.
- Preserve human-authored content in existing CLAUDE.md/AGENTS.md files.
- Keep context files concise — prefer structure and commands over prose.
