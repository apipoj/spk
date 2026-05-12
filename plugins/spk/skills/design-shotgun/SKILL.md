---
description: "Run a design shotgun exploration: generate multiple distinct UI directions, compare them side-by-side, collect feedback, and lock an approved design direction before implementation."
argument-hint: "[screen, product area, URL, screenshot, or rough UI idea]"
---

# /spk:design-shotgun

Use this when the user wants to explore visual directions before committing to implementation: "show me design options", "I don't like this UI", "visual brainstorm", "ทำ design shotgun", "ขอหลายแบบให้เลือก", or "make this screen look better".

This is adapted from GStack's design-shotgun idea, but SPK keeps it local, lightweight, and codebase-aware: generate disposable variants, create a comparison board, collect structured feedback, then hand the approved direction to `/spk:code`.

## Pre-computed Context
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git status --short || true; else echo "Git status unavailable: not inside a git worktree."; fi`
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git log -3 --oneline || echo "Git history unavailable: no commits yet."; else echo "Git history unavailable: not inside a git worktree."; fi`
!`find . -maxdepth 3 \( -name DESIGN.md -o -name CLAUDE.md -o -name AGENTS.md -o -name package.json -o -name tsconfig.json -o -name vite.config.* -o -name next.config.* \) -not -path './node_modules/*' -not -path './.git/*' -not -path './dist/*' -not -path './build/*' | sort | head -100`
!`find .spk/design-shotgun -maxdepth 3 -name approved.json 2>/dev/null | sort | tail -10`

## Workflow

Dispatch: `Task(subagent_type="spk:designer", prompt="Run SPK design-shotgun for: $ARGUMENTS. Generate multiple distinct design variants before implementation. First inspect DESIGN.md if present, relevant app/routes/components, and prior .spk/design-shotgun approved.json files. Gather only missing context that materially changes the design: audience, job-to-be-done, current screen/URL/screenshot, constraints, and variant count (default 3). Then create 3 distinct concepts with different layout, typography, palette, density, and product emphasis. Produce disposable local artifacts under .spk/design-shotgun/<screen>-<date>/: variant HTML mockups or images when tools allow, README notes, and a board.html comparison page. Use realistic product copy and edge cases. If browser/screenshot tooling is available, visually QA each variant and fix obvious rendering bugs. Do not modify production source code. Return a head-to-head comparison, one opinionated recommendation, artifact paths, and ask the user to choose A/B/C, remix, or approve for implementation. After explicit user approval, save approved.json with variant, feedback, timestamp, and implementation notes.")`

Expect: variant artifacts, comparison board path, visual QA notes, and a recommended direction. No production source changes unless the user explicitly asks for implementation.

## Design Shotgun Loop

1. **Context.** Read `DESIGN.md`, current routes/components, existing screenshots/URLs, and previous approved designs.
2. **Concepts.** Produce 3 default directions, each with a different stance. Examples: compact operator console, editorial trust layer, playful onboarding, brutalist power tool, calm B2B dashboard.
3. **Variants.** Build self-contained mockups. Prefer HTML because it is inspectable and easy to promote later. Images are fine when image tooling exists.
4. **Board.** Create `board.html` so the user can compare all variants side-by-side.
5. **Feedback.** Ask for one of: choose A/B/C, remix parts, regenerate, or approve for implementation.
6. **Approval.** Write `approved.json` only after confirmation. `/spk:code` can then implement the approved direction.

## Anti-Convergence Rules

- Each variant must differ in **layout**, **typography**, **palette**, and **density**.
- If two variants look like siblings, regenerate the weaker one.
- Do not make three generic SaaS cards with different accent colors.
- Do not copy third-party UI wholesale. Translate references into principles.
- Do not ignore `DESIGN.md` unless the user asks to explore outside the design system.

## Artifact Convention

```text
.spk/design-shotgun/<screen>-YYYYMMDD-HHMM/
├── board.html
├── README.md
├── variant-a.html
├── variant-b.html
├── variant-c.html
├── screenshots/           # optional visual QA proof
└── approved.json          # only after user confirmation
```

`approved.json` shape:

```json
{
  "screen": "<screen>",
  "approved_variant": "A",
  "feedback": "<what the user liked and wants changed>",
  "implementation_notes": ["<specific guidance for /spk:code>"],
  "date": "<UTC timestamp>",
  "branch": "<git branch>"
}
```

## Output Format

```markdown
## Design Shotgun Results
- Artifact dir: `.spk/design-shotgun/<screen>-<date>/`
- Board: `.spk/design-shotgun/<screen>-<date>/board.html`
- Variants: A <name>, B <name>, C <name>

### Head-to-head
- A: <strength> / <weakness>
- B: <strength> / <weakness>
- C: <strength> / <weakness>

Recommendation: <one opinionated pick and why>
Next: pick A/B/C, ask for a remix, or approve for `/spk:code`.
```

## Guardrails

- This is exploration, not implementation.
- Keep artifacts local and disposable unless the user asks to commit design references.
- Use browser/vision QA when available, but do not block on missing design binaries.
- Prefer one strong recommendation over neutral option lists.
- If invoked from `/spk:plan`, return the approved design direction as planning input rather than writing source code.

## Attribution

Inspired by Garry Tan's GStack `design-shotgun` workflow: multiple visual variants, comparison board, structured feedback, and taste memory. This SPK version is intentionally lightweight and repo-local.
