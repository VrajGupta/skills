---
name: part3
description: Code-review chain and loop-closer — in ONE run: if the repo has no personalized part3 reviewer agent yet, create one via a mini /part1 + /part2 (idempotent — reuse it if it exists), then run it to audit the directory for bugs (failing tests + type/lint errors + invariant violations + weak/uncovered tests), frame each as a /part1-format ticket, fix it test-first like /part2, and get the diff graded by a fresh-eyes sub-agent (maker ≠ checker) — looping until the grade is clean — before writing and pushing a handoff. Composes /part1 (ticket framing) + /part2 (tdd + red-team, including refactor-smell review) on self-discovered bugs and absorbs the old test-auditor as its hunt phase. Use when the user runs /part3, or wants an autonomous review-and-fix pass that finds its own bugs, fixes them, grades the fix, and pushes a handoff.
---

# /part3 — Code-review chain (ensure agent → audit → fix → grade → pushed handoff)

The **loop-closer** of the fleet. Where `/part1` plans a named effort and `/part2`
builds a named ticket, `/part3` turns the crank on an existing directory. In one run it
first makes sure the repo has a **personalized reviewer agent** — creating it if
absent, reusing it if present — then runs that agent as a **systematic debugger**:
read the context, audit for bugs, fix them, get the fix **graded** by fresh eyes, hand
off. It **composes** `/part1` and `/part2` rather than reinventing them — each bug is
framed with `/part1`'s ticket format (invariant + `Verification-command`) and fixed with
`/part2`'s test-first loop — and it **absorbs the old test-auditor**: auditing test
*quality* (not just green) is one of its hunt nets. The checker is a **fresh-eyes
sub-agent spawned in the same session** — maker ≠ checker, never the same context. The
ticket trail is the audit log.

> **Models are not this skill's concern.** The fleet's per-skill model map (`/part1`
> on one model, `/part2` on another, `/part3` on another) lives in the project's
> CONTEXT docs. `/part3` runs on whatever model it's invoked with; do not encode or
> pin models here.

## Before you start

Confirm the directory / scope to review (if the user didn't name it, ask once). Read
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

## Step 1 — Maker: audit & fix

Spawn the `part3-<slug>` agent (via the Agent tool). It executes its pinned loop:
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

## Step 2 — Checker: grade with fresh eyes (maker ≠ checker)

**Before** handing off, spawn a **separate** reviewer that did **not** write the fixes
— a fresh `Explore` / `general-purpose` sub-agent, or run `/code-review` over the diff,
**in this same session**. Give it **only the diff + the CONTEXT/invariant docs**, not
the maker's reasoning, so it can't inherit the maker's blind spots and rubber-stamp the
work. It attacks the corners agent-written fixes fail in (weird / empty / oversized /
unicode inputs, the named failure modes, permission & tenant-boundary edges),
**verifies the invariants actually hold**, flags **refactor smells** (mysterious
names, duplicated code, feature envy, data clumps, primitive obsession, repeated
switches, divergent change, speculative generality, message chains, middleman), and
returns a **grade** on the diff.

**If the grade flags problems, send them back to the maker to revisit** — fix
test-first, re-run the gate, then **re-grade** with fresh eyes. Loop maker→checker until
the grade is clean and the gate is green, or the budget is exhausted (then record the
remainder as honest follow-ups). Only a clean grade earns a handoff.

## Step 3 — Hand off and push (both required)

1. **`handoff`** — write a handoff doc (the project's usual location + the `$TMPDIR`
   copy): which tests were red, what the four-net audit found, what was fixed (gates
   green), **the checker's grade and what it caught** (including any unfixed edges and
   refactor findings), honest follow-ups, and the next thing to review.
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
- **Never let the maker grade its own fix.** The fresh-eyes checker is a *separate
  context*, every run — this is the whole point of the skill. A dirty grade sends the
  code back; no handoff before the grade is clean.
- **Compose, don't reinvent.** Frame bugs with `/part1`'s ticket format and fix them
  with `/part2`'s tdd loop; the existing services / ADRs are the source of truth. The
  ticket trail is the audit log, not a second planning system.
- End with a short summary: whether the agent was created or reused, bugs found (by
  net), bugs fixed, **the checker's grade and findings**, follow-ups, the **pushed
  commit hash**, and the remote branch — omitting push means the run failed.
