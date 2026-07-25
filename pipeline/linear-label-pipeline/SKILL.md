---
name: linear-label-pipeline
version: 1.0.0
description: Operator manual and paid-lessons list for the Linear pipeline â€” the GitHub Issues Sync duplicate disaster, silent state no-ops, exact-name requirements, state-vs-label confusion, and how the older GitHub triage label vocabulary (needs-triage, ready-for-agent, wontfix) maps onto Linear states. Use when diagnosing why a ticket did not move, when duplicates appear, when deciding whether a repo uses Linear states or GitHub labels, or when onboarding a new repo into the pipeline.
---

# linear-label-pipeline â€” operator manual & pitfalls

Companion to `linear-pipeline`. That skill is the procedure; this is the **scar tissue**.

## 1. The duplicate disaster (why GH stage labels are banned)

Timeline:

1. Linear â†” GitHub Issues Sync was enabled workspace-wide.
2. Agents, following older GitHub-era triage habits, applied `ready-for-agent` labels to GitHub issues **#161â€“168**.
3. Sync interpreted the GitHub-side edits as new work and created **LUL-121â€“128** in Planned.
4. All eight had to be manually canceled.

Root cause: **dual-writing stage into two synced systems.** The label was not wrong as vocabulary â€” it was wrong as a *second write surface*.

Rule that came out of it: on a synced repo, stage lives in **Linear state only**. GitHub is read-only for issues.

## 2. Silent no-op writes

Linear state mutations can return a **200 with full issue JSON** and change nothing â€” most often because:

- the state name doesn't exactly match a configured workflow state
- the state belongs to a different team
- the issue is in a project/team the token can't transition

There is no error. The only defense is **re-read after write**. If you skipped the readback, you do not know the state changed, and any comment claiming it is a fabrication.

## 3. Exact names

`Agent Ready` â‰  `agent-ready` â‰  `Agent-Ready` â‰  `Ready for Agent`.
`Debugger Ready` â‰  `Debug Ready` â‰  `In Review`.

Fetch the team's workflow states and match the string before writing. Never guess a state name from memory.

## 4. State vs. labels

Linear has both. They are not interchangeable:

- **Workflow state** â€” canonical for pipeline stage. Drives the queues each role reads.
- **Labels** â€” descriptive tags (`bug`, `enhancement`, area tags). Useful, never authoritative for stage.

An agent that filters its queue by label instead of state will pick up the wrong work.

## 5. Mapping the older GitHub triage vocabulary onto Linear

The engineering pack still speaks GitHub/label dialect. That dialect is **not obsolete** â€” it's the general tracker language for non-synced repos. On Linear-synced repos, overlay it:

| Triage label | Meaning | Linear analogue |
|---|---|---|
| `needs-triage` | Not yet evaluated | Planned (or awaiting human) |
| `needs-info` | Blocked on reporter | Leave state; comment the questions. Do **not** fake progress |
| `ready-for-agent` | Fully specified for autonomous work | Agent Ready (parent), or a Coding child with a Verification-command |
| `ready-for-human` | Needs human implementation/merge judgment | Stays human-owned; don't pretend it's agent-ready |
| `wontfix` | Will not action | Canceled |

Category labels are timeless and safe on either system: `bug`, `enhancement`.

## 6. Classic GitHub-era path (non-synced repos only)

```
qa            â†’ conversational bug capture â†’ issue
triage        â†’ categorize / verify / grill / brief â†’ ready-for-agent
to-prd        â†’ structure the work as a spec
to-issues     â†’ tracer-bullet tickets with blockers
part2         â†’ build
part3         â†’ check
```

Refactor variant: `request-refactor-plan` â†’ tiny-commit plan as an issue.
Fog variant: `wayfinder` â†’ investigation map until `part1` is sane.

Setup once per repo: `setup-matt-pocock-skills` wires tracker config, label vocabulary, and domain doc layout. If it was never run, **local markdown tickets are the safe fallback** â€” never invent a tracker.

## 7. Diagnostic table â€” "the ticket didn't move"

| Symptom | Likely cause | Fix |
|---|---|---|
| Write returned OK, state unchanged | Name mismatch / wrong team | Fetch real state list, retry with exact string |
| Duplicate Linear issues in Planned | Something wrote GitHub issues | Cancel dupes; find and stop the GH writer |
| GitHub issue closed unexpectedly | Linear cancel propagated via sync | Expected; not a bug |
| Agent picked wrong ticket | Queue filtered by label, not state | Filter by workflow state |
| Comment claims a move that didn't happen | Missing readback | Add readback; correct the comment |
| OAuth failures mid-run | Token expired | Re-auth once, then stop â€” don't thrash |

## 8. Model / tooling notes

- Pin the model per role deliberately; a cheap model on the debugger defeats makerâ‰ checker.
- MCP Linear tools and `gh` are different authorities â€” never let a `gh` convenience call substitute for a Linear write.
- `gh issue create` has **no `--json` flag**. If you're on a genuinely non-synced repo where GH create is allowed, parse the URL from stdout.

## Verification

```
- [ ] Repo's tracker identity established (synced Linear vs plain GH vs local md)
- [ ] Every state string matched against the live workflow state list
- [ ] Readback performed on every mutation
- [ ] No GitHub issue writes on a synced repo
```
