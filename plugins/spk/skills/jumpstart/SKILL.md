---
description: "One-command onboarding wizard: primes the repo if needed, asks one question, routes to the right SPK workflow, and reaches a first win (a reviewed plan) with one confirmation before any code is written."
argument-hint: "[goal (optional), e.g. เพิ่มหน้า login]"
---

# /spk:jumpstart

The fastest path from a fresh install to a first win on the user's real project: one question, one confirmation, and no source-code writes before explicit approval. Use when the user is new to SPK, asks "เริ่มยังไง", "start here", or wants a guided first run.

## Pre-computed Context
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git status --short | head -20 || true; else echo "Git status unavailable: not inside a git worktree."; fi`
!`test -f AGENTS.md && echo "AGENTS.md: present" || echo "AGENTS.md: MISSING - repo not primed"`
!`test -f CLAUDE.md && echo "CLAUDE.md: present" || echo "CLAUDE.md: missing"`
!`cat ai_context/.spk-version 2>/dev/null || echo "ai_context not scaffolded yet."`

## Workflow

1. **Detect state.** If the pre-computed context shows `AGENTS.md` is missing, tell the user in one line that you are priming the repo first, then dispatch:
   `Task(subagent_type="spk:primer", prompt="Prime this repository for subagents: scan the source roots and create or update AGENTS.md as the canonical agent context file, with CLAUDE.md as a one-line @AGENTS.md pointer. Keep AGENTS.md concise and factual. Report what you created or updated in one short list.")`
   Narrate the result in one line. If `AGENTS.md` already exists, skip this step silently.

2. **Get the goal.** If `$ARGUMENTS` is non-empty, treat it as the goal and skip the question. Otherwise ask exactly ONE question (AskUserQuestion when available, plain text otherwise): "วันนี้อยากทำอะไรกับ repo นี้?" with options (ก) สร้าง feature ใหม่ (ข) แก้ bug (ค) ปรับ UI — and let the user state the specific goal in one sentence. If the user picks only a category without stating a specific goal, asking them for that one goal sentence counts as part of the SAME single question, not a second question. Do not ask anything else.

3. **Route to the right workflow** (substitute the user's goal for `<goal>`):
   - **Feature** → `Task(subagent_type="spk:plan-orchestrator", prompt="Plan this feature: <goal>. Produce a developer-ready plan with: goal, non-goals, assumptions, architecture approach, exact source areas, bite-sized TDD tasks, verification gates, docs updates, rollout/rollback notes, risks, and open questions. Each task must include files, RED/GREEN verification commands, expected output, and commit message. Save to ai_context/wiki/plans/YYYY-MM-DD-<slug>.md and update index/log.")`
   - **Bug** → `Task(subagent_type="spk:debugger", prompt="Root-cause this issue: <goal>. Reproduce first, compare working vs broken paths, test one hypothesis at a time, and return evidence, the root cause, the smallest fix, and a regression-test recommendation. Do not patch source code.")`
   - **UI** → `Task(subagent_type="spk:designer", prompt="Run SPK design-shotgun for: <goal>. Generate 3 distinct design variants with different layout, typography, palette, and density. Produce disposable artifacts under .spk/design-shotgun/<screen>-<date>/ including board.html, run the anti-slop gates, and return a head-to-head comparison with one recommendation. Do not modify production source code.")`
   - **Anything else** (the goal fits none of the three options) → treat it as a Feature and use the plan dispatch above.

4. **First win.** Present the result concisely: the plan summary, the root-cause + smallest fix, or the design board path + recommendation. This is the deliverable of the wizard.

5. **One confirmation.** Ask exactly once: "ไปต่อให้ implement เลยไหม?" — make clear the wizard continues automatically after a yes; the user does not run any command themselves. Only after an explicit yes, dispatch `Task(subagent_type="spk:build-orchestrator", prompt="Implement the approved plan/fix/design from this jumpstart session: <artifact>. Follow TDD: failing test first, minimal implementation, verify, then docs. Stage only related files and report verification evidence.")` where `<artifact>` must make the prompt self-contained: for Feature pass the saved plan file path (`ai_context/wiki/plans/...`), for UI pass the design board path plus the approved direction, and for Bug paste the full root cause and smallest-fix description into the prompt text (the debugger leaves no on-disk artifact). A hedged answer ("ก็ได้มั้ง", "maybe") is NOT a yes — stop and summarize next steps instead.

## Guardrails

- Never write source code before the step-5 confirmation. Never push or create PRs — that stays behind `/spk:pr`'s explicit-confirmation contract.
- Works outside git worktrees: all git probes above are guarded; report unavailable git context instead of failing.
- Empty repo: the primer creates a minimal AGENTS.md; suggest planning the first feature as the goal.
- If the user aborts at any step, nothing has been written except prime artifacts (`AGENTS.md`, `ai_context/`), which are independently useful. Say so in one line.
