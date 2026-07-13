---
name: part2
version: 1.0.0
description: Implementation chain — read the project's docs, pick the next unblocked ticket, build it test-first, red-team it, then write and push a handoff. Reads the planning docs + handoffs + tracker, selects the lowest-numbered open ticket whose Blocked-by chain is satisfied, then runs tdd → red-team pass (which also covers refactor smells) → handoff → push-handoff. The red-team pass attacks weird inputs, failure modes, and permission edges and verifies the /part1 invariants before handoff. Use when the user runs /part2, or wants to pick up and implement the next ready ticket and push a handoff.
---

# /part2 — Implementation chain (next ticket → TDD → pushed handoff)

Orchestrate the build-and-hand-off loop: figure out what to work on from the
docs, implement it test-first, **red-team it against the corners**, then hand off.
This is the counterpart to `/part1` (which produces the tickets — and the
invariants — this skill consumes and must verify).

## Step 1 — Read the docs and pick the next ticket

Read, in roughly this order (use whatever the repo actually has):
1. The **newest handoff** doc — it usually records what's already done and names
   the next ticket to start.
2. The project's **glossary / domain docs** — use this vocabulary everywhere.
3. The **tracker / tickets** (`tickets.md` or GitHub issues) — in order; read each
   candidate's **Blocked by** section and **acceptance criteria**.
4. The relevant **spec / plans** and **ADRs** for the ticket's area.

**Selection rule:** pick the **lowest-numbered ticket that is not yet done and
whose every Blocked-by ticket *is* done.** On a real tracker, prefer querying the
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

## Step 3 — Red-team the build (the "adult in the room" pass)

6. **Red-team pass (fresh eyes — separate context).** **before** handing off,
   deliberately try to break what you just built. Run this pass as a **separate
   checker that did not write the code** — spawn an `Explore`/`general-purpose`
   sub-agent or run `/code-review` over the diff — so the judge can't inherit the
   author's blind spots and rubber-stamp its own work (maker ≠ checker). This is
   also where **refactoring** happens now (deferred out of the TDD loop per
   Step 2): have the checker flag refactor smells — mysterious names, duplicated
   code, feature envy, data clumps, primitive obsession, repeated switches,
   divergent change, speculative generality, message chains, middleman — alongside
   correctness. Do **not** re-run the happy path; attack the corners that
   agent-written code usually fails in:
   - **Weird inputs** — empty, null, oversized, wrong-type, malformed, duplicate,
     unicode/injection, out-of-range, and concurrent/racing requests.
   - **Failure modes** — exactly the ones named in the ticket's invariants: each
     dependency down, slow, rate-limited, or returning garbage. Confirm the code
     degrades/retries/surfaces as specified instead of crashing or hanging.
   - **Permission & boundary edges** — wrong user, missing/expired/forged token,
     privilege escalation, accessing another tenant's data, the trust edges the
     `/part1` invariants drew.
   Then **verify the `/part1` invariants actually hold** (latency budget,
   failure-mode behavior, security boundaries) — don't assume the happy-path tests
   covered them. Fix what breaks **test-first** (add the failing case, then the fix,
   keep the suite green); apply refactor findings directly. **After every fix,
   re-run the Step 2 gate command and re-run this checker pass** — a fix is not
   accepted until the full gate passes again, so a corner-fix can't silently
   regress a neighbor. Loop maker→checker until the gate is green or the budget is
   exhausted. If a gap is genuinely out of scope for this ticket, record it
   **honestly** as a follow-up in the handoff rather than hiding it. This is the
   step where you are the skeptic, not the author.

## Step 4 — Hand off and push (both required)

7. **`handoff`** — write a handoff doc (project's usual location + the `$TMPDIR`
   copy): what was built, which ticket it completed, the green-test state, **what
   the red-team pass tried and what it found** (including any unfixed edge cases
   and refactor findings), honest follow-ups (anything stubbed/in-memory/not-yet-
   wired), and the **next** ready ticket.
8. **`push-handoff`** — **always run this last.** Read and follow the
   **`push-handoff`** skill (`~/.claude/skills/push-handoff/SKILL.md`): stage the
   handoff doc + all changed code/CONTEXT artifacts, commit, and push to the
   configured remote. **`/part2` is not complete until push succeeds** (or you
   report an auth blocker with the skill's recovery steps). Never commit secrets.

## Rules

- Run the skills **sequentially**; finish each before the next — **build →
  red-team → `handoff` → `push-handoff`**, every time.
- **Never skip the red-team pass to save time.** A green happy-path suite is not
  "done" — corners, invariants, and refactor smells are where agent-written code
  fails. No handoff before the red-team pass has run.
- Implement **one ticket per run** unless the user asks for more — thin slices
  keep handoffs clean and reviewable.
- Be honest in the handoff about partial work **and unfixed edge cases**, so the
  next session knows the true state.
- Defer project-specific conventions to the sub-skills; keep this orchestrator
  project-agnostic.
- End with a short summary: the ticket completed, the test state, **the red-team
  findings (including refactors applied)**, follow-ups, the **pushed commit
  hash**, and the remote branch — omitting push means the run failed.
