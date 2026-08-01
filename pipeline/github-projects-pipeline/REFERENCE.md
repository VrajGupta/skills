# GitHub Projects workflow reference

Verified 2026-08-01 against the official GitHub documentation and the installed
GitHub CLI. This is the evidence behind `SKILL.md`; it is not a second tracker.

## Decisions

- GitHub Projects is a flexible table/board/roadmap integrated with GitHub issues
  and pull requests.
- Project fields carry project metadata. This workflow uses one single-select
  `Status` field as the canonical stage; labels are taxonomy only.
- Project items can be added from issue URLs and edited by project/item/field node
  IDs. Writes require the CLI `project` scope.
- GitHub's built-in workflows default closed issues and merged pull requests to
  `Done`. That automation must be reviewed or disabled when only the independent
  grader is allowed to set `Done`.
- Project views can filter by status, assignee, labels, repository, and other
  project fields; saved views are useful for each stage queue.

## Official sources

- [About Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)
- [Adding items to your project](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-items-in-your-project/adding-items-to-your-project)
- [Filtering projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/filtering-projects)
- [Using the built-in automations](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations)
- [Using the API to manage Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects)
- [`gh project item-edit`](https://cli.github.com/manual/gh_project_item-edit)
- [`gh project item-list`](https://cli.github.com/manual/gh_project_item-list)
- [`gh project field-list`](https://cli.github.com/manual/gh_project_field-list)
- [`gh project field-create`](https://cli.github.com/manual/gh_project_field-create)

## Local CLI verification

The installed CLI exposes the machine-safe node-ID form used by the workflow:

```text
gh project item-edit \
  --id <item-id> \
  --project-id <project-id> \
  --field-id <field-id> \
  --single-select-option-id <option-id>
```

It also confirms that project writes require the `project` scope:

```text
gh auth refresh -s project
gh project field-list <number> --owner <owner> --format json
gh project item-list <number> --owner <owner> --format json
gh project item-add <number> --owner <owner> --url <issue-url> --format json
```

The authoritative source of IDs is always the live project's `field-list` and
`item-list` output. Do not copy IDs between projects.
