# Issue tracker: GitHub Projects

GitHub Projects is the workflow board for this repo. GitHub Issues and pull requests
are the durable ticket/code artifacts; the project's single-select `Status` field is
the canonical workflow state. Use the `gh` CLI for all operations.

## Configuration

Record these values in `docs/agents/issue-tracker.md` for the repo:

```text
Repository: <owner>/<repo>
Project owner: <user-or-organization>
Project number: <number from the project URL>
Status field: Status
```

Verify the project and auth before writing:

```bash
gh repo view --json nameWithOwner
gh project view <project-number> --owner <project-owner> --format json
gh auth status
```

Project writes require the CLI `project` scope:

```bash
gh auth refresh -s project
```

Never place tokens in this file, issue bodies, or handoffs.

## Workflow state

The project must have one `Status` single-select field with these options:

```text
Planned, Agent Ready, Coding, Debugger Ready, Debugging,
Grading Ready, Grading, Done, Canceled, Duplicate
```

Labels remain useful for category and triage (`bug`, `enhancement`,
`needs-triage`, `ready-for-agent`), but labels are not a second stage machine.
Issue open/closed state is not the pipeline stage. Review built-in project workflows:
GitHub can set `Done` when an issue closes or a pull request merges, which must be
disabled or constrained when only the independent grader may set `Done`.

Inspect live field and option IDs before scripting a mutation:

```bash
gh project field-list <project-number> --owner <project-owner> --format json
```

## Issue operations

- **Create a ticket:** `gh issue create --repo <owner>/<repo> --title "..." --body-file <file>`
- **Add it to the project:** `gh project item-add <project-number> --owner <project-owner> --url <issue-url> --format json`
- **Read an issue:** `gh issue view <number> --repo <owner>/<repo> --comments`
- **List project items:** `gh project item-list <project-number> --owner <project-owner> --format json --limit 100`
- **Comment:** `gh issue comment <number> --repo <owner>/<repo> --body-file <file>`
- **Edit issue metadata:** `gh issue edit <number> --repo <owner>/<repo> --add-label "..."` / `--remove-label "..."`
- **Close:** only after the appropriate workflow decision; closing is not a substitute for setting Project `Status`.

To move a project item, use the live GraphQL node IDs returned by `field-list` and
`item-list`:

```bash
gh project item-edit \
  --id <project-item-id> \
  --project-id <project-node-id> \
  --field-id <status-field-id> \
  --single-select-option-id <status-option-id> \
  --format json
```

Read the project item back after every mutation and compare the issue URL, item ID,
and Status option with the intended result. A successful CLI exit is not evidence
that the field changed.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same triage labels and project Status field
as issues, using the `gh pr` equivalents:

- **Read a PR:** `gh pr view <number> --repo <owner>/<repo> --comments` and `gh pr diff <number>`
- **List external PRs:** `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`, then keep only `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE`
- **Comment / label / close:** `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`

GitHub shares one number space across issues and PRs, so resolve a bare `#42` with
`gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says “publish to the issue tracker”

Create a GitHub issue, add it to the configured GitHub Project, set its Project
`Status`, and read the item back. Do not leave a ticket only in a local markdown
mirror.

## When a skill says “fetch the relevant ticket”

Run `gh issue view <number> --repo <owner>/<repo> --comments`, then fetch its project
item with `gh project item-list` when stage matters.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single GitHub issue added to the configured
Project; its child issues are tickets.

- **Map:** create an issue titled for the effort, add it to the Project, and apply the `wayfinder:map` label. Its body holds Destination / Notes / Decisions-so-far / Fog / Out-of-scope.
- **Child ticket:** create an issue, add it to the Project, link it as a GitHub sub-issue where supported, and use `wayfinder:<type>` labels (`research`, `prototype`, `grilling`, `task`) for taxonomy. Set its Project `Status` to `Planned` until it is claimable.
- **Blocking:** use GitHub's native issue dependency relationship where available. Otherwise add `Blocked by: #<n>` to the child body. The Project `Status` changes only after blocker verification.
- **Frontier query:** list Project items with `gh project item-list`, filter for `status:"Agent Ready"` or the configured equivalent, and verify blockers, assignee, repository, and issue state from the returned data.
- **Claim:** assign the issue with `gh issue edit <n> --add-assignee @me`, then move its project item to the active Status in one mutation and read it back.
- **Resolve:** post the resolution comment, move the project item to its resolved status, close only when the workflow allows it, and append a context pointer to the map's Decisions-so-far.
