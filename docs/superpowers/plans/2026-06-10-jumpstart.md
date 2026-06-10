# /spk:jumpstart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One command (`/spk:jumpstart`) takes a new user from fresh install to a first win (a reviewed plan) on their real project, with one question and one confirmation before any code is written.

**Architecture:** A new 17th plugin skill that acts as a main-thread wizard: detect repo state → prime via `spk:primer` if needed → one goal question → route to `spk:plan-orchestrator` / `spk:debugger` / `spk:designer` → present first win → one confirmation gates the build step. A native Thai standalone copy mirrors the flow without subagent dispatch. Spec: `docs/superpowers/specs/2026-06-10-jumpstart-design.md`.

**Tech Stack:** Markdown skills (Claude Code plugin), `manifest.json` as source of truth, Node verify scripts + Jest gates, `npm run regen` for README tables.

**Constraints discovered during planning (read before starting):**
- The repo's **pre-commit hook runs regen + grep gates + manifest validation + sync check on every commit**. Between "manifest entry added" and "both skill files exist," sync is broken — so Tasks 1–4 land as **one commit** at the end of Task 5. Do not try to commit mid-way.
- `verify:sync` requires every manifest command to have BOTH `plugins/spk/skills/<name>/SKILL.md` AND `skills/spk-<name>/SKILL.md` (native).
- Native skills must contain Thai characters and must NOT contain any of: `Task(`, `subagent`, `spk:` (with colon), `plugin` (see `scripts/verify-native-skills.cjs` FORBIDDEN_TOKENS). `/spk-plan` (hyphen, no colon) is safe.
- Plugin skill `description:` frontmatter: 50–220 chars, must not start with "Use this when/skill/for/to", must be quoted (the 3.1.4 incident was an unquoted frontmatter string).
- Manifest command name must match `^/[a-z][a-z-]+$` — `/jumpstart` fits.
- `manifest-command-target-sync` only checks the declared orchestrator/agent EXISTS in the manifest agents — the skill body may dispatch additional agents freely.

---

### Task 1: Register `/jumpstart` in manifest.json

**Files:**
- Modify: `manifest.json` (commands array, line ~34)

- [ ] **Step 1: Add the command entry as the FIRST element of `commands`** (it is the entry point; the README command table regenerates in manifest order):

```json
  "commands": [
    { "name": "/jumpstart", "orchestrator": "plan-orchestrator" },
    { "name": "/plan",      "orchestrator": "plan-orchestrator" },
```

(Leave every other entry untouched.)

- [ ] **Step 2: Verify the gates go RED for the right reason**

Run: `npm run verify:sync`
Expected: FAIL listing missing `plugins/spk/skills/jumpstart/SKILL.md` and/or missing native `skills/spk-jumpstart/SKILL.md`. If it fails for any OTHER reason, stop and fix that first.

Run: `npm run validate:manifest`
Expected: PASS (`/jumpstart` matches the schema pattern; `plan-orchestrator` is a registered orchestrator).

---

### Task 2: Create the plugin skill (the wizard)

**Files:**
- Create: `plugins/spk/skills/jumpstart/SKILL.md`

- [ ] **Step 1: Write the file with exactly this content:**

````markdown
---
description: "One-command onboarding wizard: primes the repo if needed, asks one question, routes to the right SPK workflow, and reaches a first win (a reviewed plan) with one confirmation before any code is written."
argument-hint: "[goal (optional), e.g. เพิ่มหน้า login]"
---

# /spk:jumpstart

The fastest path from a fresh install to a first win on the user's real project: one question, one confirmation, and no source-code writes before explicit approval. Use when the user is new to SPK, asks "เริ่มยังไง", "start here", or wants a guided first run.

## Pre-computed Context
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git status --short | head -20 || true; else echo "Git status unavailable: not inside a git worktree."; fi`
!`ls AGENTS.md CLAUDE.md 2>/dev/null || echo "No AGENTS.md / CLAUDE.md yet - repo not primed."`
!`cat ai_context/.spk-version 2>/dev/null || echo "ai_context not scaffolded yet."`

## Workflow

1. **Detect state.** If the pre-computed context shows `AGENTS.md` is missing, tell the user in one line that you are priming the repo first, then dispatch:
   `Task(subagent_type="spk:primer", prompt="Prime this repository for subagents: scan the source roots and create or update AGENTS.md as the canonical agent context file, with CLAUDE.md as a one-line @AGENTS.md pointer. Keep AGENTS.md concise and factual. Report what you created or updated in one short list.")`
   Narrate the result in one line. If `AGENTS.md` already exists, skip this step silently.

2. **Get the goal.** If `$ARGUMENTS` is non-empty, treat it as the goal and skip the question. Otherwise ask exactly ONE question (AskUserQuestion when available, plain text otherwise): "วันนี้อยากทำอะไรกับ repo นี้?" with options (ก) สร้าง feature ใหม่ (ข) แก้ bug (ค) ปรับ UI — and let the user state the specific goal in one sentence. Do not ask anything else.

3. **Route to the right workflow** (substitute the user's goal for `<goal>`):
   - **Feature** → `Task(subagent_type="spk:plan-orchestrator", prompt="Plan this feature: <goal>. Produce a developer-ready plan with: goal, non-goals, assumptions, architecture approach, exact source areas, bite-sized TDD tasks, verification gates, docs updates, rollout/rollback notes, risks, and open questions. Each task must include files, RED/GREEN verification commands, expected output, and commit message. Save to ai_context/wiki/plans/YYYY-MM-DD-<slug>.md and update index/log.")`
   - **Bug** → `Task(subagent_type="spk:debugger", prompt="Root-cause this issue: <goal>. Reproduce first, compare working vs broken paths, test one hypothesis at a time, and return evidence, the root cause, the smallest fix, and a regression-test recommendation. Do not patch source code.")`
   - **UI** → `Task(subagent_type="spk:designer", prompt="Run SPK design-shotgun for: <goal>. Generate 3 distinct design variants with different layout, typography, palette, and density. Produce disposable artifacts under .spk/design-shotgun/<screen>-<date>/ including board.html, run the anti-slop gates, and return a head-to-head comparison with one recommendation. Do not modify production source code.")`

4. **First win.** Present the result concisely: the plan summary, the root-cause + smallest fix, or the design board path + recommendation. This is the deliverable of the wizard.

5. **One confirmation.** Ask exactly once: "ไปต่อให้ implement เลยไหม? (/spk:code)". Only after an explicit yes, dispatch `Task(subagent_type="spk:build-orchestrator", prompt="Implement the approved plan/fix/design from this jumpstart session: <reference the artifact from step 4>. Follow TDD: failing test first, minimal implementation, verify, then docs. Stage only related files and report verification evidence.")`. A hedged answer ("ก็ได้มั้ง", "maybe") is NOT a yes — stop and summarize next steps instead.

## Guardrails

- Never write source code before the step-5 confirmation. Never push or create PRs — that stays behind `/spk:pr`'s explicit-confirmation contract.
- Works outside git worktrees: all git probes above are guarded; report unavailable git context instead of failing.
- Empty repo: the primer creates a minimal AGENTS.md; suggest planning the first feature as the goal.
- If the user aborts at any step, nothing has been written except prime artifacts (`AGENTS.md`, `ai_context/`), which are independently useful. Say so in one line.
````

- [ ] **Step 2: Verify description passes the lint**

Run: `npm run verify:descriptions`
Expected: PASS (description is 199 chars, quoted, not instruction-prefixed).

---

### Task 3: Create the native Thai skill

**Files:**
- Create: `skills/spk-jumpstart/SKILL.md`

- [ ] **Step 1: Write the file with exactly this content** (standalone main-thread workflow — no agent dispatch, no forbidden tokens):

````markdown
---
description: เริ่มต้นใช้งานครั้งแรกแบบ jumpstart - ตรวจ repo, สร้าง AGENTS.md ถ้ายังไม่มี, ถาม 1 คำถาม, พาไปถึง first win (plan ที่รีวิวแล้ว) และยืนยัน 1 ครั้งก่อนเขียนโค้ด
argument-hint: "[เป้าหมาย (ไม่บังคับ) เช่น เพิ่มหน้า login]"
---

# spk-jumpstart

เส้นทางที่เร็วที่สุดจากติดตั้งเสร็จไปถึง first win บน project จริงของคุณ: ถาม 1 คำถาม ยืนยัน 1 ครั้ง และไม่แตะ source code ก่อนได้รับอนุมัติ

ใช้ตอน: เพิ่งเริ่มใช้ครั้งแรก, "เริ่มยังไง", "start here", หรืออยากได้ guided first run

## รวบรวม Context

ตรวจสอบสถานะ repo ก่อนเริ่ม:
- มี `AGENTS.md` หรือ `CLAUDE.md` หรือยัง
- เป็น git worktree หรือไม่ (ถ้าไม่ใช่ ให้ทำงานต่อได้ แค่รายงานว่าไม่มี git context)
- โครงสร้าง project: ไฟล์ config หลัก (package.json, pyproject.toml, go.mod ฯลฯ)

## Workflow

1. **ตรวจสถานะ.** ถ้ายังไม่มี `AGENTS.md`: บอก user 1 บรรทัดว่ากำลังเตรียม repo ก่อน แล้วสแกน source roots เพื่อสร้าง `AGENTS.md` เป็นไฟล์ context หลัก (กระชับ ตรงข้อเท็จจริง) และสร้าง `CLAUDE.md` เป็น pointer บรรทัดเดียว `@AGENTS.md` ถ้ามีอยู่แล้วให้ข้ามขั้นนี้เงียบ ๆ

2. **ถามเป้าหมาย.** ถ้า user พิมพ์เป้าหมายมาแล้ว ($ARGUMENTS) ให้ข้ามคำถาม ถ้ายัง ให้ถาม 1 คำถามเท่านั้น: "วันนี้อยากทำอะไรกับ repo นี้?" — (ก) สร้าง feature ใหม่ (ข) แก้ bug (ค) ปรับ UI พร้อมให้ระบุเป้าหมายสั้น ๆ 1 ประโยค ห้ามถามคำถามอื่นเพิ่ม

3. **เลือกเส้นทาง:**
   - **Feature** → ทำตามแนวทาง `/spk-plan`: เขียน plan ที่มี goal, สถาปัตยกรรม, งานย่อยแบบ TDD, verification gates และ rollout notes
   - **Bug** → ทำตามแนวทาง `/spk-debug`: reproduce ก่อน, ทดสอบทีละสมมติฐาน, สรุป root cause + smallest fix + regression test ห้าม patch โค้ดในขั้นนี้
   - **UI** → ทำตามแนวทาง `/spk-design-shotgun`: สร้าง design variants หลายทิศทาง + comparison board ห้ามแก้ production code

4. **First win.** นำเสนอผลลัพธ์กระชับ: สรุป plan / root cause + วิธีแก้ที่เล็กที่สุด / design board พร้อมคำแนะนำ — นี่คือ deliverable ของ jumpstart

5. **ยืนยัน 1 ครั้ง.** ถามครั้งเดียว: "ไปต่อให้ implement เลยไหม?" เริ่มเขียนโค้ดได้เฉพาะเมื่อ user ตอบรับชัดเจนเท่านั้น (ทำตามแนวทาง `/spk-code`: test ต้อง fail ก่อน แล้วค่อย implement) คำตอบกำกวม เช่น "ก็ได้มั้ง" ไม่นับเป็นการยืนยัน — ให้หยุดและสรุป next steps แทน

## Guardrails

- ห้ามเขียน source code ก่อนการยืนยันในขั้นที่ 5 และห้าม push หรือสร้าง PR (ต้องผ่านขั้นตอนยืนยันของ `/spk-pr` เสมอ)
- Repo ว่างเปล่า: สร้าง `AGENTS.md` แบบ minimal แล้วชวนวาง plan ของ feature แรก
- ถ้า user ยกเลิกกลางทาง: มีแค่ `AGENTS.md` / `CLAUDE.md` ที่ถูกสร้าง ซึ่งมีประโยชน์ในตัวเองอยู่แล้ว บอก user 1 บรรทัด
````

- [ ] **Step 2: Verify the native gate passes**

Run: `npm run verify:native`
Expected: PASS — 17 native skills, no forbidden tokens, Thai signal present. If it reports a forbidden token in `skills/spk-jumpstart/SKILL.md`, the file deviated from the content above — fix to match.

---

### Task 4: Regenerate docs + manual README/INSTALL edits

**Files:**
- Modify: `README.md` (install section ~line 39 skills list; new section after install)
- Modify: `README-EN.md` (same two places)
- Modify: `INSTALL_FOR_AGENTS.md` (skills list line 20; Common Workflows list)
- Regenerated: README count markers + command tables via `npm run regen`

- [ ] **Step 1: Regenerate manifest-driven blocks**

Run: `npm run regen`
Expected: `Regenerated: README.md` and `Regenerated: README-EN.md`; counts become **17 skills** and `/spk:jumpstart | plan-orchestrator` appears first in both command tables.

- [ ] **Step 2: Add the jumpstart section to `README.md`** — insert immediately after the line `Subagents ก็ namespace ``spk:`` ให้เหมือนกัน: ``spk:planner``, ``spk:architect``, ฯลฯ` and before `## Workflow Highlights`:

```markdown
## เริ่มใน 60 วินาที

ติดตั้งเสร็จแล้ว ไม่ต้องเลือกจาก 17 skills เอง — รันคำสั่งเดียว:

```text
/spk:jumpstart
```

Jumpstart จะเตรียม repo ให้ (สร้าง `AGENTS.md` ถ้ายังไม่มี) ถาม 1 คำถามว่าอยากทำอะไร (สร้าง feature / แก้ bug / ปรับ UI) แล้วพาไปถึง first win — plan ที่รีวิวได้จริงบน project ของคุณ — โดยถามยืนยัน 1 ครั้งก่อนเขียนโค้ดเสมอ

มีเป้าหมายอยู่แล้วก็พิมพ์ไปเลย: `/spk:jumpstart เพิ่มหน้า login`
```

- [ ] **Step 3: Add the matching section to `README-EN.md`** — insert immediately after the line `Subagents are auto-namespaced too: ``spk:planner``, ``spk:architect``, etc.` and before `## Workflow Highlights`:

```markdown
## Start in 60 seconds

Installed? Don't pick from 17 skills — run one command:

```text
/spk:jumpstart
```

Jumpstart prepares your repo (creates `AGENTS.md` if missing), asks one question about what you want to do (build a feature / fix a bug / improve UI), and walks you to a first win — a reviewable plan on your real project — always asking one confirmation before writing any code.

Already know your goal? Pass it directly: `/spk:jumpstart add a login page`
```

- [ ] **Step 4: Add `/spk:jumpstart` to the manual skills list lines** (regen does not touch these):
  - `README.md` install section: change `พิมพ์ /spk: แล้วจะเห็น /spk:plan, ...` to start with `/spk:jumpstart, /spk:plan, ...`
  - `README-EN.md` install section: same change in the English sentence.
  - `INSTALL_FOR_AGENTS.md` line 20: add `/spk:jumpstart` at the start of the list, and add this line at the TOP of "## Common Workflows": `- First run / onboarding: /spk:jumpstart [goal] primes the repo, asks one question, routes to the right workflow, and reaches a reviewed plan with one confirmation before any code.`

- [ ] **Step 5: Verify docs are in sync**

Run: `npm run regen:check`
Expected: PASS (`All docs in sync with manifest.json`).

---

### Task 5: Full gate + single feature commit

**Files:** none new (verification + commit of Tasks 1–4)

- [ ] **Step 1: Run the full release gate**

Run: `npm run verify:release`
Expected: all verifiers PASS, 22 test suites / 228+ tests PASS.

- [ ] **Step 2: Validate with the real CLI**

Run: `claude plugin validate .`
Expected: `✔ Validation passed`.

- [ ] **Step 3: Commit everything from Tasks 1–4 as one commit** (pre-commit hook re-runs regen + gates; it must be green):

```bash
git add manifest.json plugins/spk/skills/jumpstart/ skills/spk-jumpstart/ README.md README-EN.md INSTALL_FOR_AGENTS.md
git commit -m "feat: add /spk:jumpstart onboarding wizard

One command from fresh install to first win on the user's real
project: prime via spk:primer if AGENTS.md is missing, ask one
question (feature/bug/UI), route to plan-orchestrator/debugger/
designer, present the plan, and require one explicit confirmation
before any code is written. Ships with a native Thai standalone
copy and a 'start in 60 seconds' section in both READMEs.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Manual end-to-end smoke test

**Files:** none (scratch repo outside this repo)

- [ ] **Step 1: Reload the local plugin** — in Claude Code run `/plugin` (install/update from local marketplace) then `/reload-plugins`, or test via `claude --plugin-dir /Users/apipoj/Code/spk/plugins/spk` in a scratch directory.

- [ ] **Step 2: Feature route (the primary path)** — in a scratch repo with a few source files and NO `AGENTS.md`: run `/spk:jumpstart`. Verify in order: (1) it announces priming and `AGENTS.md` + pointer `CLAUDE.md` appear; (2) it asks exactly one question; (3) choosing "สร้าง feature ใหม่" with a one-line goal produces a plan; (4) it asks the single confirmation; (5) answering "ไม่" stops with a summary and NO source files were touched (`git status` shows only AGENTS.md/CLAUDE.md/ai_context).

- [ ] **Step 3: Argument skip + already-primed** — run `/spk:jumpstart add a health endpoint` in the same repo. Verify: no prime step (silent skip), no question asked, goes straight to planning.

- [ ] **Step 4: Bug and UI routes** — run `/spk:jumpstart` choosing (ข) แก้ bug, verify it routes to root-cause analysis and does not patch code; run again choosing (ค) ปรับ UI, verify design variants + board with no production code changes.

- [ ] **Step 5: Record results** — if any step fails, fix the SKILL.md wording, re-run `npm run verify:release`, and amend the feature commit before release.

---

### Task 7: Release v3.2.0

**Files:**
- Modify: `package.json`, `package-lock.json`, `manifest.json` (version + released date), `plugins/spk/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `CHANGELOG.md`

- [ ] **Step 1: Bump version in all six gated locations**

```bash
npm version 3.2.0 --no-git-tag-version
node -e "
const fs = require('fs');
for (const [file, mutate] of [
  ['manifest.json', j => { j.version = '3.2.0'; j.released = new Date().toISOString().slice(0,10); }],
  ['plugins/spk/.claude-plugin/plugin.json', j => { j.version = '3.2.0'; }],
  ['.claude-plugin/marketplace.json', j => { j.plugins[0].version = '3.2.0'; }],
]) {
  const j = JSON.parse(fs.readFileSync(file, 'utf-8'));
  mutate(j);
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n');
}"
```

- [ ] **Step 2: Add the CHANGELOG section** under `## Unreleased`:

```markdown
## 3.2.0 - <today's date>

One-command onboarding: `/spk:jumpstart` takes a new user from install to a reviewed plan on their real project with one question and one confirmation.

### Added
- `/spk:jumpstart` wizard: primes the repo via `spk:primer` when `AGENTS.md` is missing, asks one goal question (feature/bug/UI), routes to `spk:plan-orchestrator` / `spk:debugger` / `spk:designer`, presents the first win, and requires one explicit confirmation before any code is written. Goal can be passed inline (`/spk:jumpstart <goal>`).
- Native Thai standalone copy `skills/spk-jumpstart/`.
- "เริ่มใน 60 วินาที / Start in 60 seconds" section in both READMEs and an onboarding entry in INSTALL_FOR_AGENTS.md.

### Release
- Bumped `manifest.json`, `.claude-plugin/marketplace.json`, `plugins/spk/.claude-plugin/plugin.json`, `package.json`, and `package-lock.json` to `3.2.0` so `/plugin update` delivers the wizard.
```

- [ ] **Step 3: Gate, commit, push**

```bash
npm run verify:release && claude plugin validate .
git add package.json package-lock.json manifest.json plugins/spk/.claude-plugin/plugin.json .claude-plugin/marketplace.json CHANGELOG.md README.md README-EN.md
git commit -m "release: 3.2.0

/spk:jumpstart onboarding wizard with native Thai copy and
start-in-60-seconds documentation.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push origin main
```

Expected: pre-commit green; push succeeds.

- [ ] **Step 4: Watch CI** — `gh run watch` the run for the pushed commit. Expected: both `verify` and `Plugin install smoke test` succeed (the smoke test asserts `Version: 3.2.0`).

- [ ] **Step 5: Tag and GitHub release**

```bash
git tag -a v3.2.0 -m "SPK v3.2.0 — /spk:jumpstart onboarding wizard

One command from fresh install to a reviewed plan on the user's real
project: prime if needed, one question, route to the right workflow,
one confirmation before any code."
git push origin v3.2.0
gh release create v3.2.0 --repo apipoj/spk --latest --title "v3.2.0 — /spk:jumpstart onboarding wizard" --notes-from-tag
```

Expected: tag pushed; release visible and marked Latest.

---

## Self-review notes

- **Spec coverage:** flow steps 1–5 → Task 2 (plugin) and Task 3 (native); manifest + README/INSTALL → Tasks 1 and 4; gates → Tasks 1/2/3/5; manual E2E → Task 6; v3.2.0 release → Task 7. The spec's `manifest-command-target-sync` risk is resolved in the constraints block (the check is manifest-internal only).
- **Placeholder scan:** all file contents are complete verbatim; commands have expected outputs.
- **Consistency:** `/jumpstart` ↔ `plugins/spk/skills/jumpstart/` ↔ `skills/spk-jumpstart/` naming matches the `spk-<slug>` convention; dispatch targets (`spk:primer`, `spk:plan-orchestrator`, `spk:debugger`, `spk:designer`, `spk:build-orchestrator`) all exist in the manifest.
