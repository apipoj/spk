---
description: Run a design shotgun exploration — generate multiple distinct UI directions, compare side-by-side, collect feedback, and lock an approved design before implementation.
argument-hint: "[screen, product area, URL, screenshot, or rough UI idea]"
---

# /design-shotgun — Visual Brainstorm

Generate multiple distinct design directions before committing to implementation. Compare them, collect feedback, and lock an approved direction.

Use this when: "show me design options", "I don't like this UI", "visual brainstorm", "ขอหลายแบบให้เลือก", or "make this screen look better".

## Context

- Run `git status --short` and `git log -3 --oneline`
- Read DESIGN.md if present
- Inspect relevant app/routes/components
- Check prior approved designs in `.spk/design-shotgun/`

## Design Shotgun Loop

### 1. Context
Read DESIGN.md, current routes/components, existing screenshots/URLs, and previous approved designs. Gather only missing context that materially changes the design: audience, job-to-be-done, constraints, and variant count (default 3).

### 2. Concepts
Produce 3 distinct directions, each with a different stance. Examples: compact operator console, editorial trust layer, playful onboarding, brutalist power tool, calm B2B dashboard.

### 3. Variants
Build self-contained mockups for each concept. Prefer HTML (inspectable, easy to promote later). Each variant must differ in layout, typography, palette, and density.

### 4. Board
Create a comparison page so the user can evaluate all variants side-by-side.

### 5. Feedback
Ask the user to choose A/B/C, remix parts, regenerate, or approve for implementation.

### 6. Approval
Write an approval record only after explicit user confirmation.

## Anti-Convergence Rules

- Each variant must differ in **layout**, **typography**, **palette**, and **density**.
- If two variants look like siblings, regenerate the weaker one.
- Do not make three generic SaaS cards with different accent colors.
- Do not copy third-party UI wholesale. Translate references into principles.
- Do not ignore DESIGN.md unless the user asks to explore outside the design system.

## Artifact Convention

```text
.spk/design-shotgun/<screen>-YYYYMMDD-HHMM/
├── board.html
├── README.md
├── variant-a.html
├── variant-b.html
├── variant-c.html
└── approved.json          # only after user confirmation
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
```

## Guardrails

- Do not modify production source code unless the user explicitly asks for implementation.
- Variants are disposable artifacts — they exist only for evaluation.
- Approval requires explicit user confirmation (text response, not assumed).
