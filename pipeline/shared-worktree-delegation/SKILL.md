---
name: shared-worktree-delegation
version: 1.0.0
description: Safely fan out subagent tasks into one shared git checkout — assign explicit file lanes, forbid subagent commits/pushes by default, and have the parent re-run every gate because subagent summaries are claims not evidence. Use when delegating implementation work to subagents that share a worktree, when writing a subagent brief, or when a parent agent must grade returned work. Prefer separate worktrees when the work genuinely conflicts.
---

# shared-worktree-delegation

Delegating into a shared checkout is safe **only** with lanes and a gatekeeper parent. Without both, parallel agents overwrite each other and then gaslight the parent with partial greens.

## Decide first: shared tree or isolated worktrees?

| Use a shared tree | Use isolated worktrees (`isolation: "worktree"`) |
|---|---|
| Lanes are cleanly separable by directory/file | Agents must edit the same files |
| Work is small and fast | Long refactors that churn shared modules |
| You need one coherent tree at the end | You'll merge/cherry-pick results deliberately |

Isolated worktrees cost real setup time and disk. They are the right answer when lanes cannot be drawn — not the default.

## The lane brief (mandatory for every worker)

Every concurrent worker's brief **must** contain all of these:

```
YOUR LANE: <files / dirs you may edit>
DO NOT EDIT: <sibling-owned paths, explicitly listed>
SHARED OK (≤1): <optional single shared test file, if unavoidable>
NO COMMIT / PUSH / STAGE (unless the parent explicitly ordered otherwise)
GATE: `<exact command>`
BASELINE GREEN: <current suite summary — what already passes>
OUT OF SCOPE FAILURES: <known-red items — do NOT "fix" these>
KNOWN INVARIANTS: <from the plan>
```

Why each line exists:

- **YOUR LANE / DO NOT EDIT** — without both, workers infer scope from the task text and overlap.
- **SHARED OK (≤1)** — one shared file is survivable; two is a merge conflict machine.
- **NO COMMIT/PUSH/STAGE** — subagents committing concurrently into one tree interleaves unrelated work into each other's commits. The parent commits.
- **BASELINE GREEN + OUT OF SCOPE FAILURES** — without these, a worker sees an unrelated red test, "helpfully" fixes it, and blows its lane.
- **GATE** — the worker's done-condition must be machine-checkable, same as any ticket.

## Parent is the gatekeeper

**A subagent summary is a claim.** It is not evidence, no matter how confident or detailed.

After every worker returns, the parent must:

1. `git status -sb` — see what actually landed on disk.
2. Re-run **the worker's ticket gate** itself.
3. Re-run a **proportional project verify** (typecheck + broader suite).
4. Only then accept the work and perform the external writes (commit, tracker moves).

If the parent skips this, "3 of 3 agents reported success" can coexist with a broken tree.

## Sequencing

- Workers whose lanes touch the same module → **run them in series**, not parallel.
- Workers with genuinely disjoint lanes → parallel is fine.
- Any worker that must edit a shared interface → do that first, alone, verify, then fan out.

## Timeouts and partial returns

A timed-out worker usually left most of its edits on disk. Assess before reacting:

```powershell
git status -sb; git diff --stat
```

Typecheck, run the gate, and finish the remainder by hand. **Do not blind re-dispatch** into a dirty half-refactor — see `shared-worktree-safety`.

## Verification

```
- [ ] Every worker brief contains all eight lane-brief lines
- [ ] Lanes are provably disjoint (or overlapping workers serialized)
- [ ] No subagent committed, pushed, or staged
- [ ] Parent re-ran every worker's gate itself
- [ ] Parent ran a proportional project verify before any external write
- [ ] Out-of-scope failures listed up front and still out of scope afterward
```

## Related

`shared-worktree-safety` · `parallel-subagent-implementation` · `subagent-batch-implementation` · `controlled-ticket-delivery`
