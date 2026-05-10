---
description: Apply Sun Tzu strategy as a practical planning lens before choosing battles, architecture, rollout, or competitive moves.
argument-hint: "[goal, plan, competitor, incident, architecture choice, or rollout]"
---

# /sunzi — Strategy Lens

Use Sun Tzu (ซุนวู) as a practical strategy lens for AI-assisted engineering and product work. Translate classic strategy into observable planning behavior: know the situation, choose the right battle, shape conditions before acting, and avoid wasteful direct fights.

## Context

- Run `git status --short` and `git log -3 --oneline`
- Identify project context (CLAUDE.md, AGENTS.md, package.json, README, etc.)
- Review any supplied plan, diff, competitor, incident, or architecture choice

## Sun Tzu Mapping for Engineering

### 1. Know Self, Know the Other
- Self: current capability, repo state, team bandwidth, available tests, deploy confidence.
- Other: customer need, competitor, broken system behavior, constraints, budget, time, platform limits.
- Ask: "What do we know about ourselves and the situation that changes the move?"

### 2. Win Before Fighting
- Shape conditions before writing code: clarify acceptance, reduce uncertainty, add diagnostics, isolate blast radius.
- Good sign: the implementation is almost obvious after discovery.
- Bad sign: coding begins while the real objective is still vague.
- Ask: "What condition can we improve first so the work becomes easy?"

### 3. Choose Terrain
- Terrain is code ownership, architecture boundaries, dependencies, CI, deployment paths, customer context, and timing.
- Good sign: the plan works with existing seams.
- Bad sign: the plan fights the repo, framework, or release calendar.
- Ask: "Where is the easiest path through the system?"

### 4. Avoid Costly Direct Assaults
- Prefer leverage: small adapter, config fix, test harness, staged rollout, or documentation change over a risky rewrite.
- Good sign: fewer touched files, clearer rollback, faster proof.
- Bad sign: heroic refactor because the agent wants a clean slate.
- Ask: "What battle should we not fight?"

### 5. Use Timing and Surprise Responsibly
- Timing: sequence work so each step creates better information for the next.
- Surprise, in engineering terms: find a non-obvious simpler path, not deception against people.
- Good sign: the next move changes the option set.
- Bad sign: big-bang changes with no intermediate signal.
- Ask: "What move creates maximum information or leverage now?"

### 6. Discipline Beats Force
- Strong operations beat raw effort: gates, ownership, rollback, logs, and clear communication.
- Good sign: every action has proof and an exit path.
- Bad sign: adding more work to compensate for unclear direction.
- Ask: "What discipline prevents chaos as we scale action?"

## Workflow

1. Read the supplied context (plan, diff, competitor, incident, architecture choice, or rollout).
2. Assess each strategic dimension.
3. Identify leverage points.
4. Identify battles to avoid.
5. Recommend the smallest winning move.
6. Define the verification signal.

## Output Format

```markdown
## Sunzi Strategy Brief
- Objective: <what winning means>
- Terrain: <repo/product/customer/context constraints>
- Self: <capabilities and limits>
- Other/Constraint: <external pressure, competitor, bug, platform, or risk>
- Leverage: <1-3 leverage points>
- Avoid: <battle not worth fighting>
- Smallest winning move: <one concrete action>
- Proof: <test, metric, customer signal, log, or review signal>
```

## Common Uses

- Before planning: pick the strategy before task decomposition.
- Before coding: decide the smallest winning implementation path.
- Before deploying: choose rollout, smoke tests, rollback, and timing.
- During competitive/product decisions: focus on terrain, differentiation, and leverage.
- During incidents: avoid random fixes and choose the fastest path to verified stability.

## Guardrails

- Keep it secular, practical, engineering/product-focused, and testable.
- Do not romanticize conflict or recommend harmful deception.
- No source code changes unless the user explicitly asks for implementation.
