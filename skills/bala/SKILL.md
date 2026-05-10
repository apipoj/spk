---
description: Apply the Buddhist Five Powers (Bala 5) as a practical balance check before planning, coding, review, or recovery work.
argument-hint: "[scope, plan, diff, incident, or decision]"
---

# /bala — Five Powers Balance Check

Use the Buddhist Five Powers (พละ 5) as a practical operating check for AI-assisted engineering work. This skill is secular by default: it translates the five powers into observable engineering behavior, not religious instruction.

## Context

Gather current state before applying the lens:
- Run `git status --short` and `git log -3 --oneline`
- Identify project context files (CLAUDE.md, AGENTS.md, package.json, etc.)
- Review any supplied plan, diff, incident, or decision

## Five Powers Mapping

1. **Saddhā / Confidence (ศรัทธา)** — confidence is calibrated by evidence.
   - Good sign: goal, user value, and acceptance criteria are clear.
   - Bad sign: blind optimism, vague success, or acting because the agent sounds sure.
   - Ask: "What evidence makes this worth doing now?"

2. **Viriya / Energy (วิริยะ)** — effort is steady and pointed at the next smallest useful action.
   - Good sign: the next action is small, reversible, and verifiable.
   - Bad sign: thrashing, huge rewrites, or opening too many fronts.
   - Ask: "What is the smallest useful move that reduces uncertainty?"

3. **Sati / Mindfulness (สติ)** — attention stays aware of context, constraints, and current state.
   - Good sign: dirty files, assumptions, risks, and user constraints are visible.
   - Bad sign: forgetting prior decisions, overwriting human work, or ignoring safety boundaries.
   - Ask: "What must stay in awareness before touching anything?"

4. **Samādhi / Concentration (สมาธิ)** — focus is narrow enough to finish.
   - Good sign: one objective, one branch of work, minimal interruptions.
   - Bad sign: parallel tasks that touch the same files, context sprawl, or premature polish.
   - Ask: "What should we stop doing until this is verified?"

5. **Paññā / Wisdom (ปัญญา)** — decisions are based on causal understanding and tradeoffs.
   - Good sign: root cause, alternatives, risks, and rollback are explicit.
   - Bad sign: patching symptoms, copying patterns blindly, or hiding uncertainty.
   - Ask: "What do we know, what do we not know, and what would change the decision?"

## Workflow

1. Read the supplied context (plan, diff, incident, decision, or general scope).
2. Assess each of the five powers against the current state.
3. Identify the single most likely imbalance that could cause waste or harm.
4. Recommend one smallest next action.
5. Define what evidence would prove the next action worked.

## Output Format

```markdown
## Bala 5 Check
- Saddhā / Confidence: <green|yellow|red> - <evidence>
- Viriya / Energy: <green|yellow|red> - <evidence>
- Sati / Mindfulness: <green|yellow|red> - <evidence>
- Samādhi / Concentration: <green|yellow|red> - <evidence>
- Paññā / Wisdom: <green|yellow|red> - <evidence>

Most likely imbalance: <one sentence>
Smallest next action: <one concrete action>
Proof it worked: <test/log/review signal>
```

## Common Uses

- Before planning: check whether the ask is grounded enough to plan.
- Before coding: prevent overbuilding and pick the smallest implementation slice.
- Before review: separate confidence from evidence and focus the review lens.
- During debugging: slow down guessing and return to root-cause discipline.

## Guardrails

- Do not use Bala 5 as a motivational speech. Translate every point into observable engineering behavior.
- Do not shame the user or agent. Report imbalance as a workflow signal.
- Do not add extra process if the next action is already obvious and safe.
- Prefer one concrete next action over a long checklist.
- No source code changes unless the user explicitly asks for implementation.
