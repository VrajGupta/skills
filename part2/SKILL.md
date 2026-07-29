---
name: part2
version: 1.0.0
description: Implementation chain and the build stage of the fleet loop (part1 plan → part2 build → part3 debug → part4 grade) — read the project's docs, pick the next unblocked ticket from Agent Ready, move it to Coding, build it test-first against a machine-checkable gate, self-check the obvious corners, then hand the ticket to Debugger Ready and write and push a handoff. Reads the planning docs + handoffs + tracker, selects the lowest-numbered open ticket whose Blocked-by chain is satisfied, then runs tdd → self-check → handoff → push-handoff. Use when the user runs /part2, wants to pick up and implement the next ready ticket, or needs to build a ticket that /part4 bounced back for a missing acceptance criterion or a missing test.
---

# /part2 — Implementation chain (next ticket → TDD → pushed handoff)

Orchestrate the build-and-hand-off loop: figure out what to work on from the
docs, implement it test-first against a machine-checkable gate, self-check the
obvious corners, then pass it down the line. This is the counterpart to `/part1`
(which produces the tickets — and the invariants — this skill consumes).

## Your place in the fleet loop

The fleet is a pipeline on the project's board, one skill per stage, each stage
run by a **different model** so that no stage ever reviews its own work:

```
Planned → Agent Ready → Coding → Debugger Ready → Debugging → Grading Ready → Grading → Done
   └ /part1 ─┘  └──── /part2 ────┘   └──── /part3 ────┘   └──── /part4 ────┘
```

**Your board moves:** claim from **`Agent Ready`** → **`Coding`** before writing
any code → **`Debugger Ready`** when the gate is green. Each move sets the Linear
status, the matching Linear label, and the matching GitHub label — all three, old
state label removed — and applies to **only the one ticket you are building**;
the rest of `Agent Ready` stays untouched. Read
`~/.claude/skills/linear-pipeline/SKILL.md` for the exact mechanics — including
the GitHub Issues Sync safety check, the read-back-after-write rule, and the
**no-tracker fallback**.

**No Linear or GitHub? The build still runs in full.** Take the next ticket from
the project's local tracker or the newest handoff, build it test-first against the
same gate, self-check the same way, and record where it ended up in the handoff.
Say which mode you're in. A missing label is a bookkeeping gap; a skipped test is
a defect that ships.

You are the **maker**, and deliberately not the checker. `/part3` will attack what
you build and `/part4` will judge whether it may close — both on different models,
precisely so they don't inherit your blind spots. That division is the reason to
build honestly rather than defensively: you cannot talk the judge into a pass (it
never reads your handoff), and hiding a stub only wastes a downstream stage's
budget rediscovering it. Your job is a green gate and an honest report of what
isn't finished.

You may also be handed a ticket **bounced back from `/part4`** — routed to Agent
Ready because an acceptance criterion was unimplemented or an invariant had no
covering test. Read the grade comment on the ticket first: it names the exact
defect and the bounce count. Fix *that*, not the whole ticket again.

## Step 1 — Read the docs and pick the next ticket

Read, in roughly this order (use whatever the repo actually has):
1. The **newest handoff** doc — it usually records what's already done and names
   the next ticket to start.
2. The project's **glossary / domain docs** — use this vocabulary everywhere.
3. The **tracker / tickets** (`tickets.md` or GitHub issues) — in order; read each
   candidate's **Blocked by** section and **acceptance criteria**.
4. The relevant **spec / plans** and **ADRs** for the ticket's area.

**Selection rule:** pick the **lowest-numbered ticket in Agent Ready whose every
Blocked-by ticket is done.** Prefer a ticket carrying a `/part4` grade comment
(a bounce) over a fresh one — bounced work is already half-built and blocking a
close. **Move that one ticket to `Coding` before you write any code** — Linear
status + Linear label + GitHub label, with the `Agent Ready` label removed — so
the board shows what's in flight. A ticket being worked on while it still reads
`Agent Ready` is invisible, and a second run will claim it and build the same
thing twice. **Move only that ticket:** the rest of the `Agent Ready` queue stays
exactly where it is. Dragging the queue into `Coding` claims work nobody is doing
and hides the one ticket that's actually live. On a real tracker, prefer querying the
frontier (tickets whose blockers are all closed) directly over rebuilding it by
eye. Determine "done" from the newest handoff (what it reports complete) and the
git history. If the latest handoff explicitly names the next ticket, trust that
and verify its blockers are satisfied. If two tickets are equally ready, prefer
the one the spec marks as the critical path. **State which ticket you picked and
why before building.** If nothing is unblocked, say so and stop.

## Step 2 — Lock the gate, then build it test-first

**First, lock the done-condition gate.** Translate the ticket's acceptance criteria
+ the `/part1` invariants into **one command that must exit 0** — e.g. `npm test --
<ticket>.spec && tsc --noEmit && <lint/design-check>`. If `/part1` shipped the
ticket with a **Verification-command**, use that. "Done" is this command passing,
not a judgment call. Set an iteration **budget** (default 5); on exhaustion, stop
and report the blocking failure rather than thrashing.

5. **`tdd`** — implement the chosen ticket with the red-green loop (reference:
   `~/.claude/skills/tdd/SKILL.md`). Test at the highest meaningful seam with
   external dependencies **faked** (follow the project's established testing
   pattern); avoid testing vendor SDK internals or render details. Satisfy the
   ticket's acceptance criteria. **Keep the existing test suite green** and the
   type-check/lint clean. Respect the glossary + ADRs; do not fork or duplicate
   domain logic — the existing services are the source of truth. **Refactoring is
   not part of this step** — it's handled by Step 3's `/code-review` pass, so keep
   this loop to red→green only.

## Step 3 — Self-check, then hand the ticket down the line

6. **Self-check (cheap, scoped — not a full red-team).** The deep adversarial
   pass belongs to `/part3` and the verdict belongs to `/part4`, both on different
   models. Duplicating that work here wastes your budget on findings a fresh pair
   of eyes will make anyway, and — worse — a checker running in your own context
   inherits your blind spots and issues a confident all-clear. So keep this pass
   narrow and mechanical, covering only what's embarrassing to pass downstream:
   - **Every acceptance criterion, enumerated.** Walk them one at a time and name
     the line of code and the test that satisfies each. Missing one is the single
     most common reason `/part4` bounces a ticket back to you.
   - **Every named invariant has a test that would go red if it broke.** Not "the
     suite is green" — a specific test per invariant. An invariant with no
     covering test is an unfinished ticket, not a follow-up.
   - **The obvious corners** for what you touched: empty/null input, the external
     dependency erroring, the second identical call (idempotency). One test each.
   - **The gate is green** — the Step 2 command exits 0, suite and typecheck and
     lint included.

   Fix what this finds **test-first**, and re-run the gate after each fix so a
   corner-fix can't silently regress a neighbor. Do **not** start refactoring —
   `/part3` owns that pass, and a refactor riding along inside a feature diff
   makes the diff harder for it to review.

7. **Move the ticket to `Debugger Ready`** — status + Linear label + GitHub label,
   `Coding` label removed. This is what "done building" means at this stage — not
   `Done`, and not a judgment call you get to make. Leaving it in `Coding` after
   you finish is the same bug as never moving it there: the column stops meaning
   "an agent is on this right now." If something is
   genuinely stubbed, in-memory, or unwired, it still moves, but say so plainly in
   the handoff. Hiding it doesn't get it past the next stage; it just makes the
   next stage spend its budget finding out.

## Step 4 — Hand off and push (both required)

8. **`handoff`** — write a handoff doc (project's usual location + the `$TMPDIR`
   copy): what was built, which ticket it moved to Debugger Ready, the green-gate
   state, **what the self-check covered and what it found**, honest follow-ups
   (anything stubbed/in-memory/not-yet-wired), and the **next** ready ticket.
   Write this for the *human* and for `/part3` — `/part4` will never read it, by
   design, so nothing here can substitute for a criterion actually being met.
9. **`push-handoff`** — **always run this last.** Read and follow the
   **`push-handoff`** skill (`~/.claude/skills/push-handoff/SKILL.md`): stage the
   handoff doc + all changed code/CONTEXT artifacts, commit, and push to the
   configured remote. **`/part2` is not complete until push succeeds** (or you
   report an auth blocker with the skill's recovery steps). Never commit secrets.

## Rules

- Run the skills **sequentially**; finish each before the next — **build →
  self-check → move to Debugger Ready → `handoff` → `push-handoff`**, every time.
- **Move the ticket on the board**: `Agent Ready` → `Coding` when you start →
  `Debugger Ready` when the gate is green, updating Linear status + Linear label +
  GitHub label together every time. The board is the fleet's shared memory; work
  that doesn't move on it is invisible to the next stage. See
  `~/.claude/skills/linear-pipeline/SKILL.md`.
- **One ticket moves, not the queue.** Only the ticket you're actually building
  enters `Coding`; everything else stays idle where it is.
- **You never mark anything Done.** Only `/part4` closes tickets. A green suite is
  evidence, not a verdict.
- **Don't red-team or refactor your own diff.** Those passes belong to `/part3`
  and `/part4`, on other models, for a reason — a checker in your context shares
  your blind spots. Keep the Step 3 self-check narrow.
- Implement **one ticket per run** unless the user asks for more — thin slices
  keep handoffs clean and reviewable.
- Be honest in the handoff about partial work **and unfixed edge cases**, so the
  next session knows the true state.
- Defer project-specific conventions to the sub-skills; keep this orchestrator
  project-agnostic.
- End with a short summary: the ticket built and **the state you moved it to**,
  the gate result, the self-check findings, follow-ups, the **pushed commit
  hash**, and the remote branch — omitting the state move or the push means the
  run failed.
