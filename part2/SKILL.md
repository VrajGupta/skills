---
name: part2
version: 1.1.0
description: Implement one ready ticket with a locked verification gate, test-first work, independent review, and a handoff. Use for the next unblocked planned ticket.
---

# /part2 — implementation chain

Build one thin slice to a green, independently reviewed gate. The leading word is **gate**: passing the ticket’s verification command is the evidence of done.

## 1. Select one ready ticket

Read the newest handoff, domain docs, spec/ADRs, tracker, and git state. Choose the lowest-numbered open ticket whose blockers are complete; trust an explicit handoff recommendation only after verifying its blockers.

State the ticket and why it is ready. If no ticket is ready, stop with the blocker instead of inventing work.

**Complete when:** one ticket, its acceptance criteria, relevant invariants, and its dependencies are understood.

## 2. Lock the gate before editing

Use the ticket’s `Verification-command`. If it is missing or insufficient, derive one from the acceptance criteria, invariants, and project checks, then get agreement before treating it as the done condition.

Run the gate once before making changes when possible. Keep unrelated working-tree changes out of scope. Set a bounded repair budget (default five meaningful attempts); on exhaustion, report the current evidence and blocker.

**Complete when:** a concrete command will prove the ticket complete.

## 3. Build test-first

Use `tdd` for a red → green loop at the highest meaningful seam. Add or improve tests for the ticket’s observable behavior and invariants; fake external dependencies according to the project’s testing pattern.

Keep scope to one ticket. Preserve project vocabulary and existing domain boundaries; do not combine opportunistic rewrites with the feature.

**Complete when:** the ticket’s behavior is implemented and the locked gate is green.

## 4. Run a fresh-eyes challenge

Use a separate-context reviewer when available, or begin a clean `code-review` pass that has not authored the change. Give it the diff, ticket, gate, and invariants—not the maker’s conclusion.

The reviewer must challenge malformed, empty, oversized, duplicate, concurrent, and hostile inputs; named dependency failures and recovery paths; authorization, privacy, and tenant/trust boundaries; invariant coverage, weak tests, and avoidable design/refactor smells.

For each valid finding: reproduce it with a failing test or clear evidence, fix it test-first, re-run the gate, then re-review the changed risk area. Record genuine out-of-scope findings as follow-ups.

**Complete when:** the gate is green after review and every unresolved finding is explicit.

## 5. Hand off and optionally push

Use `handoff` to record the completed ticket, gate output, review findings/fixes, known limitations, and next ready ticket.

Use `push-handoff` only after explicit user authorization. Otherwise leave a clean handoff and state that the work has not been committed or pushed.

## Non-negotiables

- One ticket per run unless the user asks otherwise.
- The gate—not confidence—is the completion criterion.
- Maker and reviewer must be separate contexts whenever tooling permits.
- Never claim a test, commit, push, or deployment succeeded without checking it.

End with: ticket completed, exact gate result, review findings, follow-ups, handoff location, and commit/push status.
