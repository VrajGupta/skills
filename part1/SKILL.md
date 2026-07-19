---
name: part1
version: 1.1.0
description: Plan one scoped effort into a shared design, explicit invariants, ready tickets, and a handoff. Use for a new feature, product idea, or ADR that needs decisions before implementation.
---

# /part1 — planning chain

Turn an idea into buildable work without silently guessing. The leading word is **frontier**: only ask decisions whose prerequisites are settled; find facts yourself.

## 1. Ground and size the effort

1. If no effort is named, ask exactly: **“What effort are we planning?”**
2. Read the newest handoff, relevant project/domain docs, existing specs or ADRs, tracker, and current repository state.
3. Decide whether the effort is **grillable**:
   - A coherent slice with nameable decisions → continue.
   - Several subsystems, unknown unknowns, or work too large for one plan → use `wayfinder` first. Explain why, map the investigation work, and stop this chain until one slice is clear.

**Complete when:** the scope is a single effort and its open decisions are named, or `wayfinder` has been chosen.

## 2. Batch-grill the design

Load `batch-grill-me` and use it as the interview engine. Also use `domain-modeling` and project docs when they clarify vocabulary or boundaries.

- Build a design tree from the named effort.
- In each round, ask the entire decision **frontier**: numbered questions, each with a recommended default and concise trade-off.
- Research facts from the codebase, tracker, documentation, or tools yourself; never ask the user for information you can retrieve.
- Wait for the user’s answers, record settled decisions, then recompute the next frontier. Do not mix dependent questions into the same round.
- Finish only when the frontier is empty **and** the user confirms the shared understanding.

**Complete when:** every material decision, assumption, and unresolved dependency is recorded; none is silently assumed.

## 3. Lock executable invariants

Before writing the spec, state only the constraints that apply and make each testable:

- performance or resource budgets;
- failure and recovery behavior for dependencies;
- security, privacy, and permission boundaries;
- data integrity, UX, compatibility, or operational constraints where relevant.

For a category that truly does not apply, record `N/A` with a reason. Do not substitute vague words such as “fast” or “secure” for a measurable rule.

**Complete when:** each applicable invariant has an owner, observable condition, and verification approach.

## 4. Publish the plan as buildable artifacts

1. Use `to-spec` to write a decision-complete spec. It must contain scope, non-goals, design choices, invariants, acceptance criteria, and open follow-ups.
2. Use `to-tickets` to create thin, dependency-ordered vertical slices. Every ticket must include what to build, acceptance criteria, relevant invariants, a runnable `Verification-command`, blockers, and the next handoff target.
3. Before creating or changing an external tracker, ask once for confirmation of the target and scope. If not authorized, prepare local drafts and state what remains unpublished.

**Complete when:** the spec and each ticket are traceable back to a settled decision and have a machine-checkable done condition.

## 5. Hand off cleanly

Use `handoff` to leave a pointer map: decision summary, invariant list, artifact locations, ticket order, explicit open questions, and the next ready ticket for `/part2`.

If the user explicitly authorizes a commit and push, use `push-handoff`. Otherwise, do not push; say exactly what is ready and what authorization is needed.

## Non-negotiables

- Planning produces no application code.
- Preserve decisions and invariants through spec, tickets, and handoff.
- Ask decisions in batch frontiers, not one-at-a-time, and never ask the user to discover facts for you.
- Do not create tracker items, commits, or pushes without explicit user authorization.

End with: spec location, published/draft ticket IDs or locations, every verification command, unresolved decisions, and the recommended next ticket.
