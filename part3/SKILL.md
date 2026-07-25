---
name: part3
version: 2.0.0
description: Audit and close the loop on work a coder claims is finished â€” set an audit boundary, hunt with four nets (failing tests, static/type/lint, invariant violations, weak tests) before fixing anything, repair one framed defect at a time test-first, then grade independently and either accept or bounce. Use when the user runs /part3, when a ticket sits in Debugger Ready, when asked to verify/audit/grade someone else's work, or when you need an independent check that a change is actually done. This is the checker half of makerâ‰ checker.
---

# part3 â€” Audit & loop closure

**Leading word: four-net audit.**

You are the checker. The maker's narrative is a **claim**, not evidence. Nothing the coder wrote in a comment counts until you re-ran it yourself.

If the tracker is Linear, load `linear-pipeline` first: your queue is **Debugger Ready**, and your first act is moving the ticket to **Debugging**.

## Step 1 â€” Set the audit boundary

Before reading any code, write down:

- **Repo + branch + commit range** under review
- **Scope** â€” this ticket's diff, or a wider surface if asked
- **What evidence will count** â€” the exact commands whose output you will accept as proof
- **Baseline** â€” `git status -sb`, and which dirty paths are not yours

Capture the ticket's locked `Verification-command`. If the ticket has none, that is itself a finding: the work was never gated.

## Step 2 â€” Hunt with four nets BEFORE fixing anything

Resist the urge to repair the first thing you see. Sweep all four nets first, then triage. Fixing while hunting means you stop hunting.

**Net 1 â€” Failing tests.** Run the ticket gate. Then run a broader suite proportional to the change. Record real output.

**Net 2 â€” Static analysis.** Typecheck, lint, build. Type errors hiding behind a green unit test are common.

**Net 3 â€” Documented invariant violations.** Take the invariants from the plan / ticket and check each is actually *enforced and measured*, not merely mentioned. Cover: performance budgets, dependency failure and recovery, security/authz boundaries, privacy, permissions, data integrity. See `invariant-evidence-review` for the deeper method.

**Net 4 â€” Weak, missing, tautological, or over-mocked tests.** The dangerous case is not a red test; it's a green one that proves nothing:
- assertions that mock the thing under test
- `expect(true).toBe(true)` in disguise
- substring assertions (`not.toContain("9.99")` passes/fails wrongly when `"119.99"` exists â€” anchor the token)
- happy path only, no malformed / empty / oversized / concurrent / hostile input
- the production entry point bypasses the seam the test exercises

**Happy-path green alone is insufficient.** A diff that passes only its own new test has not been audited.

## Step 3 â€” Frame, then repair one defect at a time

For each finding worth acting on, write it in ticket shape before touching code:

```
Defect: <what is wrong>
Evidence: <command + real output>
Invariant/criterion violated: <which one>
Verification-command: <exact command that will prove the fix>
```

Then: reproduce â†’ write the failing test â†’ smallest correct fix â†’ green gate. One defect at a time. Do not batch repairs into one heroic commit.

**Scope discipline:** you may make small, self-contained fixes. Structural problems â€” wrong architecture, missing prerequisite, a ticket that cannot land as specified â€” are **not yours to fix**. They bounce.

## Step 4 â€” Independent grade

Decide one of three verdicts:

**A. Holds.** Gate re-run passes, broader suite passes, review clean.
â†’ Comment the proof â†’ Debugging â†’ **Done**.

**B. Small gaps.** You fixed them yourself, test-first, and re-gated.
â†’ Comment what you changed and why it was in-scope â†’ Debugging â†’ **Done**.

**C. Structural / too big.** â†’ **Bounce.** Comment with the bounce template, then Debugging â†’ **Coding**.

```
bounce:
what is wrong:
evidence (command output):
what coder must change:
verification to re-run:
```

The coder treats a bounce as the new top-priority spec for that ticket.

Parent issues go Done only when **all children are Done** *and* the parent-level review passes.

## Step 5 â€” Handoff, and optional push

Produce a handoff with the mandatory fields (ticket ID, paths, verification command, **verbatim** output, invariants proven/unproven, commit SHAs, next owner + intended state, follow-ups). Push only under explicit authority â€” see `push-handoff`.

## Non-negotiables

- **Evidence before repair.** Never fix a thing you cannot first demonstrate is broken.
- **Never trust the maker's narrative** as evidence for anything.
- Do not lower priority silently.
- Do not reverse state to Coding without the bounce structure.
- Maker â‰  checker: if you wrote the code, you are not a valid grader for it. Get a fresh context.
- Re-read the ticket state after every write.

## Verification

```
- [ ] Entered from Debugger Ready; marked Debugging while working
- [ ] All four nets swept before any repair
- [ ] Gate re-run independently, output pasted verbatim
- [ ] Broader verify proportional to the change
- [ ] Verdict is exactly one of: Done / small fix + Done / bounce
- [ ] Bounce (if any) used the four-field structure
- [ ] Parent Done only if children Done + parent review clean
```
