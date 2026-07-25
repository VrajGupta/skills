---
name: shared-worktree-safety
version: 1.0.0
description: Invariants for working in a git checkout that another agent or human may be writing to at the same time â€” capture a baseline, preserve dirty paths you do not own, treat mid-run file changes as a concurrency signal, stage narrowly, and re-check ownership before every external write. Use whenever parallel agents, background tasks, or a human share one worktree, before any commit/push/tracker write in a shared tree, or when files change underneath you mid-run.
---

# shared-worktree-safety

Most multi-agent disasters are not reasoning failures. They are **two writers in one checkout**.

## The six invariants

### 1. Capture a baseline before touching anything

```powershell
git rev-parse --abbrev-ref HEAD
git status -sb
git log --oneline -5
```

Plus, if tracked: the ticket's current state and latest comments. Write this down. Everything later is judged against it.

**List explicitly which dirty paths are NOT yours.** That list is a contract with yourself.

### 2. Preserve dirty paths you do not own

Files dirty at baseline that your ticket doesn't own are **sacred**:

- Don't stage them.
- Don't revert them.
- Don't "clean up" them.
- Don't stash them. A stash is a silent theft from whoever was mid-edit.

If your change genuinely requires touching one, **stop and report the collision** rather than resolving it unilaterally.

### 3. Mid-run file changes are a concurrency signal

A file that changed since you read it means **someone else is working**. Do not blindly apply your edit over a stale read.

```
detect change â†’ re-read the file â†’ re-evaluate whether your edit still applies
```

If your edit no longer makes sense against the new content, that's a collision. Report it.

### 4. Stage narrowly, always

```powershell
git add <explicit paths>     # yes
git add -A                   # never
git add .                    # never
git commit -a                # never
```

In a shared tree, `-A` commits someone else's half-finished work under your ticket number.

### 5. Re-check ownership before every external write

External writes = commit, push, tracker comment, tracker state move, PR, deploy.

Before each one, re-verify the world hasn't moved:

- Is the ticket still in the state you think?
- Did someone else already commit this work?
- Is the branch still what you started on?

External writes are the ones you cannot undo cheaply. Check immediately before, not at the start of the run.

### 6. If someone else already finished it â€” verify, do not duplicate

Discovering the work is already done is a **success**, not a race to redo it.

1. Verify their result â€” run the gate yourself.
2. If it passes: comment your independent confirmation. **Do not repeat the external writes** (no duplicate state moves, no duplicate commits).
3. If it fails: that's a finding. Report it; don't quietly rewrite over them.

## Timeout â‰  lost work

When a subagent or long task times out, **80â€“95% of its edits are usually already on disk.**

Do this:

```powershell
git status -sb
git diff --stat
```

Then typecheck and run the gate. Assess what actually landed, finish the remainder **by hand**, and record what you found.

**Never blind re-dispatch the same task into a dirty half-refactor.** That produces duplicated code, conflicting edits, and a tree nobody can reason about.

## Red flags

| Signal | Meaning |
|---|---|
| File mtime changed since your read | Another writer is active |
| `git status` grew paths you didn't touch | Concurrent agent or human |
| Your commit contains files you don't recognize | You staged too broadly â€” reset and redo |
| Ticket state changed under you | Someone else claimed it |
| Gate passes but your change isn't in HEAD | You committed the wrong tree |

## Verification

```
- [ ] Baseline captured (branch, status, log) and out-of-scope dirty paths listed
- [ ] No unrelated file staged, reverted, or stashed
- [ ] Files re-read after any detected mid-run change
- [ ] Ownership re-checked immediately before each external write
- [ ] Post-timeout: assessed on-disk state before any re-dispatch
```

## Related

`shared-worktree-delegation` Â· `parallel-subagent-implementation` Â· `subagent-batch-implementation`
