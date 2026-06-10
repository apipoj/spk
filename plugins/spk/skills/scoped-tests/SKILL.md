---
description: "Runs only the test suites a change can affect by mapping changed files to relevant suites, falling back to the full suite when a file cannot be confidently scoped."
argument-hint: "[optional: explicit changed paths; defaults to git diff vs HEAD]"
---

# /spk:scoped-tests

Speed the inner loop by running only the test suites that the current changes can affect, instead of the full suite on every edit. Use during TDD or iterative implementation when the full run is slow; always fall back to the full suite before sign-off.

## Pre-computed Context
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git diff --name-only HEAD || true; else echo "Not inside a git worktree; pass changed paths explicitly."; fi`
!`test -f scripts/scoped-tests.cjs && echo "mapper: present" || echo "mapper: absent (this is an SPK-style repo helper)"`
!`test -f package.json && grep -q '"jest"' package.json 2>/dev/null && echo "runner: jest detected" || echo "runner: jest not detected — detect the project's runner"`

## Workflow

1. **Detect the runner.** From the project manifests: `package.json` with `jest` → Jest; `pyproject.toml`/`pytest.ini` → pytest; `go.mod` → `go test`. This skill ships a working Jest mapping; for other runners, scope by the same file→test convention and emit that runner's focused command.

2. **Collect changed files.** Use `$ARGUMENTS` when the user passes explicit paths; otherwise `git diff --name-only HEAD`. Outside a git worktree, require explicit paths.

3. **Map to suites (Jest).** Run `node scripts/scoped-tests.cjs` when that helper exists; it prints the focused `npx jest <suites...>` command (or `npm test` when nothing maps). Otherwise apply the convention directly: a source file maps to its sibling test, a manifest/config file maps to the gates that read it.

4. **Run the focused command.** Execute the emitted `npx jest <suites>`.

5. **Report scope honestly.** State which suites ran AND which changed files were NOT scoped. If the mapper returned empty (nothing confidently mapped), say so and run the full suite — never present a partial run as full coverage.

6. **Full suite before sign-off.** A scoped run is for the inner loop only. Run `npm test` (or the project's full command) before declaring the change done.

## Dispatch

For a thorough scoped run that also strengthens coverage on the changed modules, the main thread may hand off to the `tester` agent: ``Task(subagent_type="spk:tester", prompt="Run scoped tests for the current changes: map changed files to relevant suites via `node scripts/scoped-tests.cjs` (fall back to the full suite when nothing maps), run them, then report which suites ran and which changed files were not scoped. Run the full suite before sign-off.")``

## Guardrails

- Never silently run a subset that skips coverage. Empty map → full suite.
- A scoped pass is not a release gate; `npm run verify:release` still runs everything.
- Works outside git worktrees only with explicit changed paths.
