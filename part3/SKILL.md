---
name: part3
version: 1.0.0
description: Debugging and hardening chain — the third stage of the fleet loop (part1 plan → part2 build → part3 debug → part4 grade). Takes a ticket from Debugger Ready, moves it to Debugging, and red-teams what /part2 built: attacks weird inputs, failure modes, permission and tenant boundaries, verifies the /part1 invariants actually hold, audits test quality, and applies refactors — fixing everything test-first against the ticket's Verification-command, then moving the ticket to Grading Ready for /part4 to judge. Also runs in sweep mode over a whole directory to hunt bugs nobody filed and turn them into tickets. Creates or reuses a personalized part3 reviewer agent for the repo (idempotent). Use when the user runs /part3, wants agent-written code attacked before it can close, wants a ticket in Debugger Ready hardened, or wants an autonomous audit that finds and fixes its own bugs.
---

# /part3 — Debugging chain (Debugger Ready → attacked → Grading Ready)

The **skeptic** of the fleet. Where `/part1` plans and `/part2` builds, `/part3`
deliberately tries to break what was built — on a different model from the one that
wrote it, which is the whole point: the misreading that produced a bug also produces a
confident review of that bug, and only an outside context breaks that correlation.
It makes sure the repo has a **personalized reviewer agent** (creating it if absent,
reusing it if present), then runs that agent as a **systematic debugger**: read the
context, hunt bugs through four nets, fix them test-first, move the ticket on. It
**composes** `/part1` and `/part2` rather than reinventing them — bugs are framed with
`/part1`'s ticket format (invariant + `Verification-command`) and fixed with `/part2`'s
test-first loop. The ticket trail is the audit log.

## Your place in the fleet loop

```
Planned → Agent Ready → Coding → Debugger Ready → Debugging → Grading Ready → Grading → Done
   └ /part1 ─┘  └──── /part2 ────┘   └──── /part3 ────┘   └──── /part4 ────┘
```

**Your board moves:** claim from **`Debugger Ready`** → **`Debugging`** before you
touch anything → **`Grading Ready`** when the gate is green and the corners are
covered. Each move sets the Linear status, the matching Linear label, and the
matching GitHub label — all three, old state label removed — for **only the
ticket you are working**; the rest of `Debugger Ready` stays idle. Read
`~/.claude/skills/linear-pipeline/SKILL.md` for the exact mechanics — including
the GitHub Issues Sync safety check, the read-back-after-write rule, and the
**no-tracker fallback**.

**No Linear or GitHub? The debugging pass still runs in full.** Attack the same
corners, verify the same invariants, fix test-first against the same gate, and
record the findings and the resulting stage in the project's local tracker or the
handoff. Say which mode you're in. The audit is the value here; the label is only
the receipt.

You are the **hardener**, not the judge. You may fix anything you find — that's the
difference between you and `/part4`, which only ever writes findings down. But you do
**not** close tickets: when you're satisfied, the ticket moves to **Grading Ready** and
an independent grader on yet another model decides whether it may close. Don't grade
your own repairs; you just became an author of them.

Two modes, same machinery:

- **Ticket mode (the default).** A ticket sits in `Debugger Ready` — take the
  lowest-numbered one, move it to `Debugging`, attack *its* diff, fix what breaks,
  move it to `Grading Ready`. Prefer tickets `/part4` bounced back as correctness
  failures: read the grade comment, which names the exact defect and the bounce count.
- **Sweep mode.** No ticket named, or the user points at a directory — hunt the whole
  scope for bugs nobody filed. Fixes that are small and in-scope get made directly;
  anything larger gets **filed as a new ticket in `Agent Ready`** (or `Planned` if it
  needs grilling) rather than smuggled into an unrelated diff.

> **Models are not this skill's concern.** The fleet's per-skill model map lives in the
> project's CONTEXT docs. `/part3` runs on whatever model it's invoked with; do not
> encode or pin models here. What *is* your concern: you should not be the same model
> that wrote the code you're attacking. If you can't confirm that, say so.

## Before you start

Confirm the ticket (ticket mode) or the directory / scope (sweep mode) — if the user
didn't name either, take the oldest ticket in `Debugger Ready`, and say which you
picked. Read
the project's **CONTEXT / invariant docs** (glossary/`CONTEXT.md`, release-scope /
invariants planning docs, ADRs) and the **newest handoff**, so the audit is grounded
in the project's real constraints — not guesses. Note the project's **test command**,
**test globs**, and the **gate command** shape it already uses (defer tracker / label /
doc conventions to the sub-skills — keep this orchestrator project-agnostic).

## Step 0 — Ensure the personalized agent (idempotent; mini /part1 + /part2)

Check for **`.claude/agents/part3-<slug>.md`** (`<slug>` = the repo / project name):

- **It exists** → **reuse it verbatim.** Do not recreate or regenerate it — that's the
  whole point of idempotent. Skip to Step 1. (If its pins are genuinely stale, *edit*
  the file, don't overwrite it wholesale.)
- **It's missing** → **create it now, in this same run**, via a mini `/part1` + `/part2`:
  - **mini `/part1` (plan):** inspect the repo and lock what the agent reviews — stack,
    test framework, test globs, gate-command shape, the CONTEXT/invariant docs to
    attack, and the tracker + `/part1` ticket format.
  - **mini `/part2` (build):** write `.claude/agents/part3-<slug>.md` from
    `AGENT-TEMPLATE.md` (in this skill folder) with those pins. It's the personalized,
    git-committable **maker**.

  Then continue straight into Step 1 — no stopping.

## Step 1 — Audit & fix (four nets)

In ticket mode, move **that one ticket** to **`Debugging`** first — Linear status +
Linear label + GitHub label, `Debugger Ready` label removed — so the board shows it's
in flight. Move nothing else: if seven tickets sit in `Debugger Ready` and you're
debugging one, six stay put. A column full of tickets nobody is working destroys the
only thing an in-flight column is for. Then spawn the `part3-<slug>` agent (via the Agent tool). It executes its
pinned loop:
1. **Read the CONTEXT / invariant docs first** so the audit is grounded.
2. **Run the tests** it discovers via its globs; record every red (failing) test.
3. **Audit for bugs — four nets** (the absorbed auditor is nets 3–4). **State the full
   list before fixing anything:**
   - **failing tests** (from step 2);
   - **static errors** — the type-checker + linter from the gate command;
   - **invariant violations** — check the *code* actually honors each latency budget,
     failure-mode contract, and security/consent boundary in the docs. Needs real
     reading, not a grep;
   - **weak / uncovered tests** — invariants with no real covering test, and
     tautological / over-mocked tests that assert nothing. A missing test for an
     invariant is itself a bug — the fix is to write it.
4. **Per bug — frame then fix:** frame it as a `/part1` ticket (name the violated
   invariant + write the `Verification-command` gate), record it in the tracker as the
   audit trail, then fix it **test-first** (`/part2` tdd — red→green only; leave
   refactoring to Step 2's checker pass) until the gate exits 0.
   **Budget 5** attempts per bug; on exhaustion, record it as an unfixed follow-up
   rather than thrashing.

The maker returns the bug list, the fixes (gates green), and every unfixed follow-up.

## Step 2 — Red-team the corners (the pass `/part2` deliberately didn't run)

The four nets catch what's already visibly wrong. This pass hunts what's *latently*
wrong — the corners agent-written code fails in, which a green happy-path suite says
nothing about. Do **not** re-run the happy path; the suite already covers it, and
re-verifying it is how a debugger spends its whole budget confirming what was known.

- **Weird inputs** — empty, null, zero, negative, oversized, wrong-type, malformed,
  duplicate, unicode/emoji, injection-shaped, out-of-range dates, timezone boundaries.
- **Failure modes** — exactly the ones the ticket's invariants name: each dependency
  down, slow, rate-limited, or returning garbage. Confirm the code degrades, retries,
  or surfaces **as specified** rather than crashing, hanging, or swallowing the error
  into a fake success. A `try/catch` that logs and continues is usually a broken
  failure mode wearing the costume of a handled one; code with no timeout doesn't
  fail, it hangs.
- **Sequences & crash-safety** — two calls racing, retry after partial success, the
  same webhook twice (idempotency), a crash between the write and the publish.
- **Permission & boundary edges** — wrong user, missing/expired/forged token, privilege
  escalation, another tenant's identifier, the trust edges the `/part1` invariants drew.
  On row-level-security projects, confirm the query runs under the constrained role and
  not a service client that bypasses the policy.

Then **verify each named invariant actually holds** — don't assume the happy-path tests
covered it. This is also where **refactoring** happens (`/part2` defers it here on
purpose, so feature diffs stay reviewable): fix the smells you find — mysterious names,
duplicated code, feature envy, data clumps, primitive obsession, repeated switches,
divergent change, speculative generality, message chains, middleman.

Fix everything **test-first** — add the failing case, then the fix. **After each fix,
re-run the gate command**, so a corner-fix can't silently regress a neighbor. Budget 5
attempts per defect; on exhaustion, record it as an honest follow-up on the ticket
rather than thrashing.

## Step 3 — Move the ticket to Grading Ready

When the gate is green and the corners are covered, move the ticket to **`Grading
Ready`** — status + Linear label + GitHub label, `Debugging` label removed — and stop.
Leaving it parked in `Debugging` after you finish is the same failure as never moving
it: the column stops meaning "live right now." Do not grade your own work and do not close it — `/part4` decides
that, blind, on another model, and it will read the diff without your explanation of
it. Anything you left unfixed goes **on the ticket** as a named follow-up, not only in
the handoff: `/part4` never reads handoffs, so an undisclosed gap simply reappears as a
bounce.

In sweep mode there may be no single ticket to move. File what you found instead —
fixed items as closed tickets in the trail, unfixed ones in `Agent Ready` (or `Planned`
if they need grilling), labelled to match on both trackers — and say where each landed.
If a sweep does work several existing tickets, move each into `Debugging` **as you
reach it** and out again as you finish, never claiming the batch up front.

## Step 4 — Hand off and push (both required)

1. **`handoff`** — write a handoff doc (the project's usual location + the `$TMPDIR`
   copy): which tests were red, what the four-net audit found, **what the red-team pass
   attacked and what broke**, what was fixed (gates green), refactors applied, honest
   follow-ups, which ticket you moved to `Grading Ready` (or where swept findings were
   filed), and the next thing to review.
2. **`push-handoff`** — **always run this last.** Read and follow the `push-handoff`
   skill (`~/.claude/skills/push-handoff/SKILL.md`): stage the changed code + ticket
   trail + agent file + handoff, commit, push a **feature branch**, open/update a **PR
   into main**. **`/part3` is not complete until push succeeds** (or you report an auth
   blocker with the skill's recovery steps). Never commit secrets, never merge the PR.

## Rules

- **Idempotent bootstrap, one invocation.** Create the personalized agent once (via
  mini `/part1` + `/part2`) only if it's missing; reuse it verbatim if it exists; never
  regenerate. Bootstrap **and** run happen in the same `/part3` — no stop-and-rerun.
- **The gate is "done," not a judgment call.** A bug is fixed when its
  `Verification-command` exits 0 — same discipline as `/part2`.
- **Move the ticket on the board**: `Debugger Ready` → `Debugging` when you start →
  `Grading Ready` when the gate is green, updating Linear status + Linear label +
  GitHub label together every time — and **only for the ticket you're working**, never
  the queue. See `~/.claude/skills/linear-pipeline/SKILL.md`.
- **Never grade your own fixes.** You repaired this code, so you are its author now —
  `/part4` judges it, blind and on another model. Move the ticket to `Grading Ready`;
  never to `Done`.
- **Disclose unfixed gaps on the ticket, not just in the handoff.** `/part4` never
  reads handoffs by design, so an undisclosed gap comes straight back as a bounce.
- **Attack corners, don't re-run the happy path.** The suite already covers it;
  re-verifying it burns the budget that should go to the failure modes.
- **Compose, don't reinvent.** Frame bugs with `/part1`'s ticket format and fix them
  with `/part2`'s tdd loop; the existing services / ADRs are the source of truth. The
  ticket trail is the audit log, not a second planning system.
- End with a short summary: whether the agent was created or reused, bugs found (by
  net), **what the red-team pass broke**, bugs fixed, follow-ups, **the ticket you moved
  to `Grading Ready`** (or where swept findings were filed), the **pushed commit hash**,
  and the remote branch — omitting the state move or the push means the run failed.
