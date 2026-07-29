---
name: codebase-audit
version: 1.0.0
description: Full-stack audit methodology for a whole codebase or app rather than a single diff â€” establish the boundary and baseline, sweep layer by layer (entry points, domain, data, integrations, auth, tests, ops), rank findings by blast radius, and emit each finding as a ready-to-implement ticket with a Verification-command. Use when asked to audit an app or codebase, assess a project's health, review before a launch, or produce a prioritized defect backlog.
---

# codebase-audit

`part3` audits a diff. This audits **a system**. The output is a ranked, ticketed backlog â€” not an essay.

## Step 1 â€” Boundary and baseline

Before reading code, write down:

- Repo, branch, commit SHA under audit
- What's in scope (packages, apps, services) and what's explicitly out
- What evidence will count â€” the commands you'll run
- Baseline: does it build? do tests pass? how long does the suite take?

```powershell
git log --oneline -5; git status -sb
```

Run build + typecheck + full suite **once**, up front, and record the real output. An audit that starts without a baseline can't tell pre-existing rot from new damage.

## Step 2 â€” Map before judging

Produce a one-screen map: entry points, major modules, data stores, external providers, auth boundary, deploy target. You cannot rank blast radius without knowing what's downstream of what.

## Step 3 â€” Sweep layer by layer

For each layer, look for the specific things that layer gets wrong:

**Entry points** (routes, handlers, CLI, jobs, webhooks) â€” unvalidated input; missing authz at the *real* entry rather than the UI; no timeout; unbounded payloads.

**Domain / business logic** â€” logic leaking into controllers or UI; vocabulary drift from the glossary/ADRs; invariants asserted in comments instead of code; primitive obsession where a type would prevent a class of bug.

**Data layer** â€” missing constraints/indexes; N+1 queries; transactions that don't wrap what they claim; migrations that aren't reversible; no tenancy filter on a shared table.

**Integrations** â€” see `provider-integration-tdd`: replay, ordering, idempotency, signature verification, cost exposure.

**Auth & permissions** â€” the boundary enforced in one path but not another; wrong-tenant access untested; secrets in code, logs, or committed env files.

**Tests** â€” coverage of the *production* seam vs parallel fake paths; over-mocking; tautologies; substring assertions; happy-path-only; `.only` left in; suite runtime that discourages running it.

**Ops** â€” no signal for the failure modes that matter; unstructured logs; PII in logs; no way to tell if an invariant regressed.

**Hygiene** â€” duplicate `file 2.ts` artifacts, dead code, TODOs older than the feature, dependencies pinned nowhere.

## Step 4 â€” Rank by blast radius, not by ease

| Severity | Definition |
|---|---|
| **P0** | Data loss, security/tenancy breach, money loss, or the app is broken in production |
| **P1** | Launch-blocking; a documented invariant is demonstrably violated |
| **P2** | Real defect with a workaround; significant test weakness |
| **P3** | Hygiene, clarity, minor duplication |

Rank on impact Ã— likelihood. A trivially-fixable typo is not P0 because it's easy, and a hard refactor is not P3 because it's hard.

## Step 5 â€” Every finding becomes a ticket

```
Title: [audit] <short defect>
Severity: P0..P3
Evidence: <file:line, or command + verbatim output>
Impact: <what breaks, for whom>
Invariant violated: <if any>
Proposed fix: <smallest correct change>
Verification-command: `<exact command that proves the fix>`
Blocked-by: <if any>
```

A finding without a Verification-command isn't ready for a coder. A finding without evidence isn't a finding â€” it's an opinion.

## Step 6 â€” Report

```
Audit of <repo> @ <sha>
Baseline: build âœ… typecheck âŒ (3 errors) suite 412 pass / 7 fail / 1m48s
Scope: <in> / <out>

P0 (n): ...
P1 (n): ...
P2 (n): ...
P3 (n): ...

Tickets emitted: <range or list>
Not investigated: <honest list â€” what you did not have time or access to check>
```

The **"not investigated"** section is mandatory. An audit that implies total coverage it didn't achieve is worse than a narrow honest one.

## Non-negotiables

- Evidence for every claim â€” file:line or command output.
- Do not fix while sweeping. Sweep, rank, then fix (or ticket) deliberately.
- Do not rewrite architecture under the banner of an audit.
- State what you didn't cover.
- Secrets found: report the location and that rotation is needed â€” **never paste the secret**.

## Related

`part3` Â· `invariant-evidence-review` Â· `provider-integration-tdd` Â· `to-issues` Â· `improve-codebase-architecture`
