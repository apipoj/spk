---
description: Apply Sun Tzu strategy as a practical subagent planning lens before choosing battles, architecture, rollout, or competitive moves.
argument-hint: "[goal, plan, competitor, incident, architecture choice, or rollout]"
---

# /spk:sunzi

Use Sun Tzu (ซุนวู) as a practical strategy lens for AI-assisted engineering and product work. This skill translates classic strategy into observable planning behavior: know the situation, choose the right battle, shape conditions before acting, and avoid wasteful direct fights.

## Pre-computed Context
!`git status --short`
!`git log -3 --oneline`
!`find . -maxdepth 3 \( -name CLAUDE.md -o -name AGENTS.md -o -name package.json -o -name pyproject.toml -o -name README.md -o -name README-EN.md \) -not -path './node_modules/*' -not -path './.git/*' | sort | head -100`

## Workflow

Dispatch: `Task(subagent_type="spk:planner", prompt="Apply Sun Tzu / ซุนวู as a practical strategy lens for: $ARGUMENTS. Inspect the current repo context and any supplied plan, diff, competitor, incident, architecture choice, or rollout. Return: (1) strategic objective; (2) terrain; (3) self assessment; (4) opponent/constraint assessment; (5) leverage points; (6) battles to avoid; (7) smallest winning move; (8) verification signal. Keep it secular, practical, engineering/product-focused, and testable. Do not romanticize conflict or recommend harmful deception.")`

Expect: a short strategy brief and one recommended move. No source code changes unless the user explicitly asks for implementation.

## Sun Tzu Mapping for Subagents

1. **Know self, know the other**
   - Self: current capability, repo state, team bandwidth, available tests, deploy confidence.
   - Other: customer need, competitor, broken system behavior, constraints, budget, time, platform limits.
   - Ask: "What do we know about ourselves and the situation that changes the move?"

2. **Win before fighting**
   - Shape conditions before writing code: clarify acceptance, reduce uncertainty, add diagnostics, isolate blast radius.
   - Good sign: the implementation is almost obvious after discovery.
   - Bad sign: coding begins while the real objective is still vague.
   - Ask: "What condition can we improve first so the work becomes easy?"

3. **Choose terrain**
   - Terrain is code ownership, architecture boundaries, dependencies, CI, deployment paths, customer context, and timing.
   - Good sign: the plan works with existing seams.
   - Bad sign: the plan fights the repo, framework, or release calendar.
   - Ask: "Where is the easiest path through the system?"

4. **Avoid costly direct assaults**
   - Prefer leverage: small adapter, config fix, test harness, staged rollout, or documentation change over a risky rewrite.
   - Good sign: fewer touched files, clearer rollback, faster proof.
   - Bad sign: heroic refactor because the agent wants a clean slate.
   - Ask: "What battle should we not fight?"

5. **Use timing and surprise responsibly**
   - Timing: sequence work so each step creates better information for the next.
   - Surprise, in engineering terms: find a non-obvious simpler path, not deception against people.
   - Good sign: the next move changes the option set.
   - Bad sign: big-bang changes with no intermediate signal.
   - Ask: "What move creates maximum information or leverage now?"

6. **Discipline beats force**
   - Strong operations beat raw effort: gates, ownership, rollback, logs, and clear communication.
   - Good sign: every action has proof and an exit path.
   - Bad sign: adding more subagents to compensate for unclear command.
   - Ask: "What discipline prevents chaos as we scale action?"

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

- Before `/spk:plan`: pick the strategy before task decomposition.
- Before `/spk:code`: decide the smallest winning implementation path.
- Before `/spk:deploy`: choose rollout, smoke tests, rollback, and timing.
- During competitive/product decisions: focus on terrain, differentiation, and leverage.
- During incidents: avoid random fixes and choose the fastest path to verified stability.

## Guardrails

- Do not turn strategy into aggression. In SPK, "enemy" means constraint, bug, uncertainty, competition, or wasted motion.
- Do not recommend manipulation or harmful deception. Reinterpret surprise as simplicity, sequencing, or non-obvious leverage.
- Do not produce a long essay. Return a brief that changes the next action.
- Prefer avoiding a bad battle over winning an unnecessary one.
