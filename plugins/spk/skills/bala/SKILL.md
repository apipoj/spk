---
description: Apply the Buddhist Five Powers (Bala 5) as a practical subagent balance check before planning, coding, review, or recovery work.
argument-hint: "[scope, plan, diff, incident, or decision]"
---

# /spk:bala

Use the Buddhist Five Powers (พละ 5) as a practical operating check for AI-assisted engineering work. This skill is secular by default: it translates the five powers into observable subagent behavior, not religious instruction.

## Pre-computed Context
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git status --short || true; else echo "Git status unavailable: not inside a git worktree."; fi`
!`if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git log -3 --oneline || echo "Git history unavailable: no commits yet."; else echo "Git history unavailable: not inside a git worktree."; fi`
!`find . -maxdepth 3 \( -name CLAUDE.md -o -name AGENTS.md -o -name package.json -o -name pyproject.toml -o -name README.md -o -name README-EN.md \) -not -path './node_modules/*' -not -path './.git/*' | sort | head -100`

## Workflow

Dispatch: `Task(subagent_type="spk:verifier", prompt="Apply the Buddhist Five Powers / Bala 5 as a practical subagent balance check for: $ARGUMENTS. Inspect the current repo context and any supplied plan/diff/incident. Return: (1) a five-part assessment using Saddha/Confidence, Viriya/Energy, Sati/Mindfulness, Samadhi/Concentration, and Panna/Wisdom; (2) one imbalance that is most likely to cause waste or harm; (3) the smallest next action; (4) what evidence would prove the next action worked. Do not moralize. Keep it practical, engineering-focused, and testable.")`

Expect: a concise balance report and one recommended next action. No source code changes unless the user explicitly asks for implementation.

## Five Powers Mapping

1. **Saddhā / Confidence (ศรัทธา)** - confidence is calibrated by evidence.
   - Good sign: goal, user value, and acceptance criteria are clear.
   - Bad sign: blind optimism, vague success, or acting because the agent sounds sure.
   - Ask: "What evidence makes this worth doing now?"

2. **Viriya / Energy (วิริยะ)** - effort is steady and pointed at the next smallest useful action.
   - Good sign: the next action is small, reversible, and verifiable.
   - Bad sign: thrashing, huge rewrites, or opening too many fronts.
   - Ask: "What is the smallest useful move that reduces uncertainty?"

3. **Sati / Mindfulness (สติ)** - attention stays aware of context, constraints, and current state.
   - Good sign: dirty files, assumptions, risks, and user constraints are visible.
   - Bad sign: forgetting prior decisions, overwriting human work, or ignoring safety boundaries.
   - Ask: "What must stay in awareness before touching anything?"

4. **Samādhi / Concentration (สมาธิ)** - focus is narrow enough to finish.
   - Good sign: one objective, one branch of work, minimal interruptions.
   - Bad sign: parallel tasks that touch the same files, context sprawl, or premature polish.
   - Ask: "What should we stop doing until this is verified?"

5. **Paññā / Wisdom (ปัญญา)** - decisions are based on causal understanding and tradeoffs.
   - Good sign: root cause, alternatives, risks, and rollback are explicit.
   - Bad sign: patching symptoms, copying patterns blindly, or hiding uncertainty.
   - Ask: "What do we know, what do we not know, and what would change the decision?"

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

- Before `/spk:plan`: check whether the ask is grounded enough to plan.
- Before `/spk:code`: prevent overbuilding and pick the smallest implementation slice.
- Before `/spk:review`: separate confidence from evidence and focus the review lens.
- During debugging: slow down guessing and return to root-cause discipline.
- During multi-subagent work: decide whether parallelism is safe or whether focus is needed.

## Guardrails

- Do not use Bala 5 as a motivational speech. Translate every point into observable engineering behavior.
- Do not shame the user or agent. Report imbalance as a workflow signal.
- Do not add extra process if the next action is already obvious and safe.
- Prefer one concrete next action over a long checklist.
