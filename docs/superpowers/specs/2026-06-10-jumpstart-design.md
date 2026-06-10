# SPK Jumpstart — Design

Date: 2026-06-10
Status: approved (design discussion in session; approach A chosen)
Target release: v3.2.0

## Problem

After `/plugin install spk@spk`, a new user faces 16 skills with no obvious first move. GitHub traffic shows visitors land on the repo root, peek at one SKILL.md, and leave. The strategy review (sunzi, 2026-06-10) identified adoption — not features — as the binding constraint, and "one obvious start-here path" as a top leverage point.

## Goal

One command — `/spk:jumpstart` — takes a user from fresh install to a first win on **their real project** in a single session, with one question and one confirmation. Both audiences are served: GitHub visitors see a 3-line "start in 60 seconds" path in the README; installed users get a clear entry point in the `/spk:` menu.

## Decisions (from design discussion)

| Question | Decision |
|---|---|
| Target user | Both: post-install users and GitHub visitors |
| First run operates on | The user's real project (no demo sandbox) |
| Depth | Wizard to first win, not just a recommendation |
| First win boundary | Plan first; one explicit confirmation before any code is written |
| Approach | A — new `/spk:jumpstart` skill + README "start in 60 seconds" section |

## Flow

```
/spk:jumpstart [goal (optional)]
  1. Detect repo state: AGENTS.md / ai_context present?
     └─ missing → dispatch spk:primer to prime the repo first (narrate this)
  2. Goal supplied as $ARGUMENTS → skip the question.
     Otherwise ask exactly ONE question: "วันนี้อยากทำอะไร?"
     (a) สร้าง feature ใหม่  (b) แก้ bug  (c) ปรับ UI
  3. Route:
     feature → spk:plan-orchestrator   (primary path; declared in manifest)
     bug     → spk:debugger
     UI      → spk:designer (design-shotgun flow)
  4. First win: present the plan / root-cause analysis / design board.
  5. Ask ONE confirmation: continue to /spk:code?
     No source-code writes before this point. No push/PR ever without
     the /spk:pr confirmation contract.
```

## Components

New files:
- `plugins/spk/skills/jumpstart/SKILL.md` — the wizard (plugin skill). Frontmatter: quoted description + argument-hint. Pre-computed context: git status (git-optional guards), AGENTS.md / `ai_context/.spk-version` presence.
- `skills/spk-jumpstart/SKILL.md` — native Thai standalone copy. Main-thread workflow; no `Task()`, no `subagent_type`, no `spk:` dispatch tokens (native-skill gate forbids them). The prime step becomes "read the repo and create AGENTS.md directly".

Modified files:
- `manifest.json` — add `{ "name": "/jumpstart", "orchestrator": "plan-orchestrator" }` (primary path target).
- `README.md` / `README-EN.md` — new "เริ่มใน 60 วินาที / Start in 60 seconds" section directly after install: 2 install commands + `/spk:jumpstart`. Counts and command tables regenerate (16→17 skills).
- `INSTALL_FOR_AGENTS.md` — mention `/spk:jumpstart` as the post-install entry point.
- `CHANGELOG.md` — 3.2.0 entry at release time.

No new agents. Reuses `spk:primer`, `spk:plan-orchestrator`, `spk:debugger`, `spk:designer`.

## Error handling & safety

- Not a git repo → works; all git probes guarded with `git rev-parse --is-inside-work-tree` (convention since v3.1.3).
- Empty repo → primer produces a minimal AGENTS.md; wizard suggests planning the first feature.
- Abort mid-wizard → nothing written except prime artifacts (AGENTS.md, `ai_context/`), which are independently useful.
- The wizard never writes source code before the step-5 confirmation, and never pushes or opens PRs (that remains `/spk:pr`'s explicit-confirmation contract).

## Testing & gates

- Existing gates cover the new surface: `validate:manifest`, `regen:check`, `verify:sync` (17 skills), `verify:native` (Thai signal, forbidden-token scan, orphan detection), `verify:descriptions`.
- `manifest-command-target-sync` requires the SKILL.md dispatch to match the manifest target — jumpstart declares `plan-orchestrator` (the primary path) and the skill body contains that dispatch; verify the test accepts a skill with additional secondary dispatches (debugger, designer) before merging.
- Manual end-to-end test in a scratch repo (all three routes) before release.
- Release as **v3.2.0** (new skill = minor), with version sync across the six gated files and a GitHub release.

## Out of scope

- Demo GIF / asciinema for the README proof block (separate follow-up; the README section ships with text only first).
- Any change to existing skills' contracts (`/spk:plan` behavior is untouched).
- Multi-language wizard beyond the existing Thai/English convention.
