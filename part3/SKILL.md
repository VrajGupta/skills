---
name: part3
version: 1.1.0
description: Audit an existing codebase, frame confirmed defects as gated tickets, fix them test-first, and independently grade the result. Use for a systematic debug or quality pass.
---

# /part3 — review and loop-closure chain

Find real defects, prove them, and close the loop without letting the maker approve itself. The leading word is **four-net audit**: failing tests, static checks, invariant violations, and weak coverage.

## 1. Set the audit boundary

Confirm the repository and scope if absent. Read the newest handoff, project/domain docs, invariants, relevant specs/ADRs, current git state, and established test/type/lint commands.

State what is in scope and what evidence will count. Keep unrelated working-tree changes out of scope.

**Complete when:** the audit boundary and validation commands are explicit.

## 2. Hunt with four nets

Run and inspect the available checks, then list confirmed candidates before fixing anything:

1. failing tests;
2. static/type/lint errors;
3. code paths that violate documented performance, failure, privacy, security, or permission invariants;
4. weak, missing, tautological, or over-mocked tests for important behavior.

For each candidate, collect reproducible evidence. A suspicion without evidence is a review note, not a defect to “fix.” Prioritize by user harm, security/data risk, and likelihood.

**Complete when:** every in-scope finding is classified as confirmed defect, follow-up, or clean—with evidence.

## 3. Frame and repair one defect at a time

For every confirmed defect, use the `/part1` ticket shape: violated invariant or behavior, acceptance criteria, and a runnable `Verification-command`. Create or modify an external tracker only after explicit user authorization; otherwise record the ticket locally in the audit handoff.

Use `/part2` discipline to fix it: reproduce first, add the failing test, make the smallest safe change, and run the defect gate plus relevant project checks. Use a bounded repair budget; record blockers honestly instead of thrashing.

**Complete when:** each repaired defect has a green gate and a traceable ticket/audit record.

## 4. Grade with fresh eyes

Use a separate Hermes `delegate_task` reviewer when permitted, or a clean independent `code-review` pass. The checker receives the diff, ticket, invariants, and gate output—not the maker’s reasoning or self-grade.

It must test the changed edges, verify the stated invariants, inspect test quality, and return either **clean** or evidence-backed **findings** with severity and a required repair/follow-up.

A material finding returns to step 3. After repair, re-run the relevant gate and obtain a fresh grade. Stop at the budget with a clear list of remaining risks.

**Complete when:** every repaired defect has a clean independent grade or an explicit unresolved finding.

## 5. Hand off and optionally push

Use `handoff` to record scope, four-net results, confirmed defects, gates, grade, unresolved risks, and the next recommended audit target.

Use `push-handoff` only after explicit user authorization. Do not create Claude-specific agent files; use Hermes skills and fresh contexts directly.

## Non-negotiables

- Evidence before repair; a green happy path alone is not evidence.
- Maker and checker are separate contexts whenever tooling permits.
- Do not regenerate a generic agent file or hide new work outside the audit trail.
- Never claim a gate, commit, push, PR, or deployment succeeded without verification.

End with: audit scope, findings by net, defects fixed, exact gate results, independent grade, follow-ups, handoff location, and commit/push status.
