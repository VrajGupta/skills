---
name: parallel-subagent-implementation
version: 1.0.0
description: Implement several independent tickets at once using lane-assigned subagents, with the parent holding the gate and performing all commits and tracker writes. Use ONLY when the user has explicitly authorized batch work and the tickets have provably disjoint file lanes. Default remains one ticket per run — this skill exists to make the authorized exception safe.
---

# parallel-subagent-implementation

The pipeline default is **one ticket per run**. This skill is the authorized exception. It does not relax any other rule.

## Preconditions — all must hold

- [ ] The user **explicitly authorized** parallel/batch work.
- [ ] Each ticket has its own **runnable Verification-command**.
- [ ] Lanes are **provably disjoint** — you have checked the files, not assumed.
- [ ] No ticket in the batch is **blocked by** another in the batch.
- [ ] A **baseline green** is recorded before dispatch.

Fail any precondition → do not parallelize. Serialize instead, or go back to one ticket.

## Step 1 — Baseline

```powershell
git status -sb; git log --oneline -3
```

Run the project's broad verify **once** and record the result. This is your `BASELINE GREEN` and your `OUT OF SCOPE FAILURES` list. Without it, workers will chase pre-existing red tests.

## Step 2 — Draw lanes

For each ticket, list the files/dirs it owns. Then check for overlap **explicitly**:

- Overlapping lanes → serialize those tickets, or merge them into one.
- A shared interface/type file that several tickets need → **land that change first, alone, verified**, then fan out.
- At most **one** shared test file across the batch, and say so in every brief.

## Step 3 — Dispatch with full lane briefs

Every worker gets the complete brief (see `shared-worktree-delegation`):

```
TICKET: LUL-###
GOAL: <one sentence>
YOUR LANE: <paths>
DO NOT EDIT: <sibling lanes, listed explicitly>
SHARED OK (≤1): <path or none>
NO COMMIT / PUSH / STAGE
GATE: `<exact command>`
BASELINE GREEN: <summary>
OUT OF SCOPE FAILURES: <list — do not fix>
KNOWN INVARIANTS: <from plan>
METHOD: test-first (red → green), smallest correct change
RETURN: paths changed, gate output verbatim, invariants touched, blockers
```

Workers implement and verify. **Workers never commit, push, stage, or write to the tracker.** All external writes belong to the parent.

## Step 4 — Parent gate (the part that cannot be skipped)

Subagent summaries are **claims**. For each returned ticket, the parent independently:

1. `git status -sb` — confirm what actually landed.
2. Re-runs **that ticket's gate**.
3. Then, once for the whole batch: typecheck + broad suite.

Any ticket whose gate fails under the parent is **not done**, regardless of what its worker reported.

## Step 5 — Sequential external writes

Even though implementation was parallel, external writes are **serial and per-ticket**:

For each verified ticket, one at a time:
1. Stage only that ticket's paths.
2. Commit `type(scope): subject` + `Refs: LUL-###`.
3. Comment evidence on the ticket (gate output verbatim, commit SHA).
4. Move that ticket Coding → Debugger Ready. **Re-read the state.**

Never one giant commit spanning the batch. It destroys per-ticket traceability and makes bounces unrevertable.

## Step 6 — Report honestly

Report per ticket: verified / failed parent gate / partial. **Never report a batch as "all green" from worker claims.** If 3 of 5 passed, that is the report.

## Failure handling

| Situation | Action |
|---|---|
| Worker times out | Assess on-disk state; finish by hand. Never blind re-dispatch. |
| Two workers touched the same file | Stop the batch. Untangle manually. Record the lane error. |
| Parent gate fails for one ticket | That ticket stays in Coding with an honest comment. The others still ship. |
| Broad suite red after merge | Bisect by ticket. Do not commit anything until you know which lane broke it. |

## Related

`shared-worktree-delegation` · `shared-worktree-safety` · `subagent-batch-implementation` · `controlled-ticket-delivery` · `part2`
