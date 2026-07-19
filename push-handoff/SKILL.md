---
name: push-handoff
version: 1.0.0
description: Finish a verified handoff by committing and pushing only the intended changes after explicit user authorization.
---

# Push handoff

Use this only after the user explicitly authorizes a commit and push.

1. **Check the repository state.** Confirm the current branch, remote, `git status`, and the exact files intended for the handoff. Stop and ask when unrelated changes, generated files, merge conflicts, or possible secrets are present.
2. **Verify the change.** Run the ticket's `Verification-command` or the project’s stated test/type/lint gate. A failing or absent gate is a blocker; report it rather than creating a misleading commit.
3. **Review before staging.** Inspect the diff and stage only the intended source, test, documentation, ticket, and handoff files. Never stage secrets, credentials, or unrelated user changes.
4. **Commit.** Use the project’s commit convention. State the commit hash and the files included.
5. **Push and verify.** Push the intended branch, then verify the remote branch and clean/expected local status. Do not open, merge, or modify a pull request unless the user explicitly asks.

Completion requires a verified push. If authorization, a clean scope, a green gate, or remote authentication is missing, leave the working tree intact and report the exact blocker plus the next safe action.
