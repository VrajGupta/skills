---
name: part1
version: 1.0.0
description: Planning chain and the first stage of the fleet loop (part1 plan → part2 build → part3 debug → part4 grade) — first size the effort and decide whether it needs a /wayfinder investigation pass before it can be grilled, then grill it against the project's docs, lock its invariants (latency budgets, failure modes, security boundaries), turn it into a spec, break it into dependency-ordered tickets that land on the board in Agent Ready, then write and push a handoff. Runs a sizing gate → grill-with-docs → lock-invariants → to-spec → to-tickets → handoff → push-handoff in sequence. Use when the user runs /part1, wants to take a new effort/idea/feature/ADR all the way from grilling through a spec, tickets, and a pushed handoff in one pass, or needs to repair a ticket that /part4 bounced back as unbuildable.
---

# /part1 — Planning chain (idea → spec → tickets → pushed handoff)

Orchestrate the planning skills **in order**, carrying context forward through
each, with an explicit invariants gate before the spec. This is the repeatable
"plan the next effort and hand it off" loop. Do **not** write any application code
in this skill — it produces planning artifacts only.

## Your place in the fleet loop

The fleet is a pipeline on the project's board, one skill per stage, each stage
run by a **different model** so that no stage ever reviews its own work:

```
Planned → Agent Ready → Coding → Debugger Ready → Debugging → Grading Ready → Grading → Done
   └ /part1 ─┘  └──── /part2 ────┘   └──── /part3 ────┘   └──── /part4 ────┘
```

**Your board moves:** create tickets in **`Planned`**, then move each to
**`Agent Ready`** the moment its blockers are satisfied. Every move sets the
Linear status, the matching Linear label, and the matching GitHub label — all
three, old state label removed. Read
`~/.claude/skills/linear-pipeline/SKILL.md` for the exact mechanics; it is the
shared state machine all four stages obey — including the GitHub label-mirror
canary, the read-back-after-write rule, and the **no-tracker fallback**.

**No Linear or GitHub? The chain still runs in full.** The trackers are where
state is *recorded*, not what makes the planning correct. With neither available,
grill, lock invariants, and write tickets exactly as below — into the project's
local tracker (`tickets.md`) or the handoff — and just say which mode you're in.
Never skip planning work because a label couldn't be written.

`/part1` **opens** the loop. Everything downstream — the gate `/part2` builds
against, the invariants `/part3` attacks, the criteria `/part4` grades — comes
from the tickets you write here. A vague ticket doesn't fail at planning time; it
fails three stages later as a ticket that bounces forever because no one can tell
whether it's satisfied. Write for those three readers.

`/part4` can also send work **back** here: a ticket it judges unbuildable (contra-
dictory criteria, no runnable `Verification-command`, an unsatisfiable invariant)
returns to **Planned** with its reason. When you pick up such a ticket, repair the
ticket itself — re-grill the ambiguous decision if you must — and return it to
**Agent Ready**. Don't just re-word it and send it back into the loop unchanged.

### Draining the queue — repairing bounced tickets

Planning an effort is one run. But `/part4` also routes unbuildable tickets back
to **`Planned`**, and those form a queue you can drain: if the user asks you to
fix the bounced tickets, handle them **one at a time** — repair the ticket, return
it to `Agent Ready`, then re-query the board and take the next. Re-query rather
than caching, since a grader may add to that queue while you work. Report each
ticket and its new state, one line each.

## Before you start

Confirm what effort you're planning. If the user named it (a feature, an ADR, a
spec, a one-shot prompt), use that as the subject. If not, ask one question:
"What effort am I grilling?" Then read the project's existing planning docs
(whatever the repo uses — e.g. a glossary/`CONTEXT.md`, the newest handoff,
related plans and ADRs) so the grill is grounded in current decisions.

## Step 0 — Size the effort (the `/wayfinder` gate)

Before grilling anything, decide **whether this effort is even grillable yet.**
`grill-with-docs` assumes you already know roughly what the questions are — it
interviews to *resolve* open decisions on a single effort that fits in one
planning session. `/wayfinder` operates one level up: it's for a chunk of work
too big to hold in a single agent session, where you don't yet know the
questions, so it maps the territory into a burn-down list of investigation
tickets on the issue tracker and resolves them until the path to the goal is
clear.

Look at the effort you just confirmed and the docs you just read, then judge:

- **Grillable now → skip wayfinder, go straight to the chain.** The effort is one
  coherent feature/ADR/spec, the open decisions are *nameable* (you could list the
  forks the grill needs to settle), and the whole thing plausibly fits in one
  planning + build pass. This is the common case. Proceed to step 1.
- **Too big / too foggy → recommend `/wayfinder` first.** Any of: it spans several
  features or subsystems; you can't yet enumerate the open questions (the unknowns
  are unknown); it obviously exceeds one agent session; or grilling would just
  surface "we need to go investigate X, Y, Z first" instead of decisions. Here the
  honest move is **not** to force a grill on fog. Tell the user plainly:

  > "This looks bigger than one grilling session — I'd run `/wayfinder` first to
  > map it into investigation tickets, resolve those until the path is clear, then
  > run `/part1` on each resulting chunk. Want me to do that instead?"

  Say *why* (which of the above signals tripped). If the user agrees, hand off to
  `/wayfinder` and stop the chain here — you'll re-enter `/part1` per resolved
  chunk once the map exists. If the user would rather grill anyway (e.g. they only
  want to plan one slice of it now), narrow the subject to that slice and continue.

Don't over-trigger this gate: a normal next-feature effort with nameable open
questions should go straight to grilling. `/wayfinder` is for genuine mountains,
not for ordinary uncertainty that a grill is built to resolve. When it's a close
call, ask the user rather than silently picking.

## The chain (run each to completion, then pass its output to the next)

1. **`grill-with-docs`** — interview the user to resolve every open decision for
   the effort, challenging against the project's documented language and prior
   decisions. Update those docs inline as terms/decisions resolve. This step is
   **interactive** — finish it only when the load-bearing forks are all decided.
   Carry the locked decisions forward.
2. **Lock invariants** — **before** synthesizing the PRD, make the non-functional
   constraints explicit and write them into the project's docs as named, testable
   invariants. At minimum cover three categories:
   - **Latency / performance budgets** — concrete numbers (e.g. p95 < 300ms, cold
     start < 2s, payload < N KB), not "fast."
   - **Failure modes** — for each external dependency, what happens when it's down,
     slow, rate-limited, or returns garbage; what the user sees; what's retried vs.
     surfaced vs. degraded.
   - **Security / permission boundaries** — authz rules, trust edges, what data is
     exposed to whom, and the blast radius if a boundary is crossed.
   This is the "adult in the room" step: without it the plan optimizes for "finish,"
   not "safe." Carry these invariants forward so `to-spec` and `to-tickets` both honor
   them and so **`/part3`'s red-team pass has concrete targets to attack** and so `/part4` has something falsifiable to grade against.
3. **`to-spec`** — synthesize the grilled decisions **and the locked invariants** into
   a spec (do **not** re-interview). The spec must state the invariants as explicit
   acceptance constraints, not leave them implicit. Publish it to wherever the project
   keeps specs / its issue tracker, with the project's "ready for agent" triage
   label/convention.
4. **`to-tickets`** — break the spec into dependency-ordered vertical tracer-bullet
   tickets, continuing the project's existing numbering/tracker. Each ticket that
   touches an invariant must restate the relevant budget/failure-mode/boundary in its
   acceptance criteria. **Each ticket must also ship a machine-checkable
   done-condition — a `Verification-command` (e.g. `npm test -- <ticket>.spec &&
   tsc --noEmit`) that exits 0 exactly when the ticket is complete** — so `/part2`
   has a concrete gate to loop its maker→checker pass against instead of judging
   "done" by eye. Quiz the user on the breakdown, then publish each ticket with
   What-to-build / Acceptance-criteria / **Verification-command** / Blocked-by,
   then set its board state: create it in **`Planned`** (status + `Planned` label
   on both Linear and GitHub), and move it to **`Agent Ready`** — swapping the
   label on both trackers — if every Blocked-by ticket is already done. A ticket
   with unsatisfied blockers **stays in `Planned`**; that queue is exactly the set
   of work that isn't claimable yet, and putting blocked tickets in `Agent Ready`
   makes `/part2` pick up work it can't finish.
   **Write acceptance criteria so a blind grader can check them.** `/part4` judges
   the diff against this ticket *without* reading the author's handoff or
   rationale, so each criterion must be checkable from code and tests alone.
   "Handles errors gracefully" gives the grader nothing to verify and guarantees a
   bounce; "on provider 5xx, retries twice then marks the Brief `failed` with
   reason `provider_unavailable`" is checkable. One observable behavior per
   criterion — no compound "and"s that can be half-satisfied and argued about.
   **On a real tracker (e.g. GitHub), publish for real, always** — creating a local
   ticket file is not publishing, and where the tracker supports it, set
   "Blocked-by" as a **native blocking link** so the frontier (tickets whose
   blockers are all done) is queryable, not just readable text. For every slice on
   GitHub, run `gh issue create --label <the project's ready-for-agent label>
   --body-file <the ticket file>` (mirrored by whatever local `tickets.md`/`issues/`
   file the project keeps), in dependency order so "Blocked-by" can name real
   tickets. On a **local-file tracker**, append each ticket to `tickets.md` with its
   "Blocked by" edge written as text, in dependency order, so the team can work it
   top-to-bottom by hand. Tickets that live only as unpublished on-disk drafts are
   **not** done; the run must report the created ticket numbers/URLs (or the
   `tickets.md` location, for the local-file case). If `gh` is unauthenticated on a
   GitHub-tracked project, surface that as a blocker with the fix (`gh auth login`)
   — do not silently fall back to local-only.
5. **`handoff`** — compact this session into a handoff doc (in the project's usual
   handoff location, plus the skill's `$TMPDIR` copy) as a pointer map: the locked
   decisions, **the invariants**, the slice order, and "next agent starts at ticket NN".
6. **`push-handoff`** — **always run this last.** Read and follow the
   **`push-handoff`** skill (`~/.claude/skills/push-handoff/SKILL.md`): stage the
   handoff doc + all planning artifacts (spec, tickets, CONTEXT updates), commit,
   and push to the configured remote. **`/part1` is not complete until push
   succeeds** (or you report an auth blocker with the skill's recovery steps).
   Never commit secrets.

## Rules

- **Do the sizing gate (step 0) first.** Don't grill fog: if the effort is too big
  or too foggy to name its open questions, recommend `/wayfinder` before the chain
  and stop, rather than forcing `grill-with-docs` on work it can't resolve.
- Run the skills **sequentially**; let each finish before starting the next —
  **`handoff` then `push-handoff`**, every time.
- Pass real context between steps — the spec reflects the grill **and the
  invariants**, the tickets reflect the spec, the handoff points at the tickets.
- **Don't skip the invariants gate.** If the grill couldn't pin down a latency
  budget, failure mode, or security boundary, that's an open decision — resolve it
  with the user before `to-spec`, don't let the spec paper over it.
- Stop and surface to the user if grilling reveals the effort needs a new ADR, or
  if `to-tickets` granularity isn't approved — don't push half-baked artifacts.
- **Plan for `/part2`'s gated loop.** Every ticket ships a runnable
  `Verification-command` (its machine-checkable done-condition) so `/part2` can
  loop maker→checker against a real gate, not a judgment call. A ticket with no
  runnable done-condition isn't ready — resolve it before publishing.
- Defer project-specific conventions (tracker format, repo, labels, doc paths) to
  the sub-skills, which already know them — keep this orchestrator project-agnostic.
- **Tickets land on the real tracker, not just on disk.** On a GitHub-backed
  project, `to-tickets` is not complete until every slice exists as a real GitHub
  issue (`gh issue create`) with native Blocked-by links where supported; a local
  markdown mirror alone does not count as published. On a local-file-tracker
  project, `tickets.md` **is** the tracker, so writing it there is publishing.
- **State lives in three places** — Linear status, Linear label, GitHub label —
  and they must agree; move all three or none. See
  `~/.claude/skills/linear-pipeline/SKILL.md`.
- End with a short summary: the spec location, the **ticket numbers/URLs (or
  `tickets.md` location)**, **which tickets landed in `Planned` vs `Agent Ready`**,
  the **pushed commit hash**, and the remote branch — omitting the tickets, their
  states, or the push means the run failed.
