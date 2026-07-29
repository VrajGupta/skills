---
name: profile-gated-delivery
version: 1.0.0
description: Run a multi-stage effort across the planner, coder, and debugger roles with an evidence gate between every stage, so no stage may start until the previous stage's proof exists and the maker of a change is never its grader. Use when driving an effort end to end through the pipeline, when coordinating role handoffs, or when the user wants the full idea → Done factory run rather than a single stage.
---

# profile-gated-delivery

The whole factory in one skill: **planner → coder → debugger**, with an evidence gate between each stage.

The point is not the stages. It is that **each stage's entry condition is the previous stage's proof** — and that the maker of a change is never its grader.

## The three roles

| Role | Queue | Loads | Produces | State effect |
|---|---|---|---|---|
| **planner** | Agent Ready | `linear-pipeline` → `part1` | plan doc, Coding children with gates | parent Agent Ready → Coding |
| **coder** | Coding (incl. bounce returns) | `linear-pipeline` → `part2` | code, tests, commit, evidence | child Coding → Debugger Ready |
| **debugger** | Debugger Ready | `linear-pipeline` → `part3` | verdict, small fix or bounce | Debugging → Done, or → Coding |

The human owns two things no agent may take: **promotion** (Planned → Agent Ready) and **cancel**. Spend, deploy, and purchase are separately authorized at any stage.

## The gates

Between every stage there is an artifact that must **exist and be checkable** before the next stage may start.

**Gate 1 — human promotion.** The parent is in Agent Ready. Nothing plans work the human hasn't decided deserves the burn.

**Gate 2 — plan is real.** Before any coder starts:
- [ ] Plan doc exists at `plans/<id>/PLAN.md`
- [ ] Invariants are measurable (numbers, not adjectives)
- [ ] Every child has a **runnable** Verification-command
- [ ] Every child has a priority
- [ ] Parent moved to Coding, **readback confirmed**

A child without a runnable gate does not enter the coder queue. Send it back to planning.

**Gate 3 — implementation is proven.** Before any debugger starts:
- [ ] Exactly one ticket was worked
- [ ] The locked gate was re-run **after the final edit**, output verbatim
- [ ] Commit carries `Refs: <id>`
- [ ] Unrelated dirty files untouched
- [ ] Child moved to Debugger Ready, **readback confirmed**

**Gate 4 — independent acceptance.** Before Done:
- [ ] The debugger re-ran the gate **itself**
- [ ] Broader verify proportional to the change
- [ ] Four nets swept (`part3`)
- [ ] Verdict: Done, small-fix + Done, or structured bounce

**Gate 5 — parent closure.** Parent goes Done only when **all children are Done** and the parent-level review passes.

## Maker ≠ checker

Whenever tooling allows, the author and the grader are **different contexts**:

- Different subagent / session, given only the ticket, the diff, and the gate — **not the maker's self-story**.
- The maker's summary is a claim. The checker's re-run is evidence.

A single agent "reviewing itself in the same breath" is a weak fallback, not the design. If you must do it, say so explicitly in the handoff and treat the result as lower-confidence.

## Running it

For each unit of work, in order:

1. Confirm the tracker identity (`linear-pipeline` step 0).
2. Confirm Gate 1. If the parent isn't promoted, **stop and ask** — don't self-promote.
3. Planner run → check Gate 2.
4. Coder run on the **oldest unblocked** Coding child → check Gate 3.
5. Debugger run → Gate 4. On bounce, return to step 4 with the bounce comment as the new top-priority spec.
6. Repeat 4–5 per child. Then Gate 5.

**One item per run** unless the user authorizes a batch — then `subagent-batch-implementation` with lanes, and the parent still holds every gate.

## The bounce loop

```
Debugger Ready → Debugging → bounce → Coding → coder → Debugger Ready → ...
```

Only the debugger reverses state, and only with:

```
bounce:
what is wrong:
evidence (command output):
what coder must change:
verification to re-run:
```

## When a gate fails

Do not proceed to the next stage. Comment the blocker with evidence, leave the state unchanged, and stop. **A stalled pipeline with honest state is recoverable; a moving pipeline with false state is not.**

If the pipeline is already thrashing, load `state-driven-pipeline-recovery`.

## Related

`linear-pipeline` · `part1` · `part2` · `part3` · `state-driven-pipeline-recovery` · `subagent-batch-implementation`
