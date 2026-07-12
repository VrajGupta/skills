# Spec: `vskills` — skills installer CLI

See [`docs/invariants.md`](./invariants.md) for the constraints this spec must
honor, and [`CONTEXT.md`](../CONTEXT.md) for the vocabulary used below (**install
root**, **agent target**, **manifest**, **drift**, **dependency closure**).

## Problem Statement

The user maintains a personal library of Claude Code skills — some their own,
some vendored from Matt Pocock's pack — spread across a GitHub repo and a local
machine. Getting skills from the repo onto a machine, and keeping them updated,
is currently manual: clone/diff/copy files by hand, and hope you don't clobber a
skill you've locally customized. This doesn't scale to a second machine, a second
agent, or a skill that depends on another skill being present.

## Solution

A CLI, `vskills`, distributed as `npx github:VrajGupta/skills <command>` (no npm
publish — see [ADR-0001](./adr/0001-npx-github-distribution.md)), that installs
and updates skills from this repo into the local **install root**
(`~/.agents/skills/`) and symlinks them into an **agent target**
(`~/.claude/skills/`), tracking what it installed via a **manifest** so it can
detect **drift** and never silently overwrite a locally modified skill.

## User Stories

1. As a new user, I want to run `npx github:VrajGupta/skills init`, so that every
   skill in the repo gets installed onto my machine in one step.
2. As a user, I want `vskills init` to skip skills I already have installed and
   unmodified, so that re-running it is safe and fast.
3. As a user, I want `vskills list` to show me every skill in the repo plus its local
   status (not installed / installed / drifted), so that I know what I have
   without reading the filesystem by hand.
4. As a user, I want `vskills add <skill>` to install just one skill (plus whatever it
   depends on), so that I don't have to pull the whole library for one thing I
   want.
5. As a user, I want `vskills add <skill>` to also install any skill named in that
   skill's `dependencies` frontmatter, so that I never end up with a skill
   installed that's silently missing something it needs.
6. As a user, I want `vskills add <skill>` on an already-installed, unmodified skill
   to update it to the latest version, so that `add` doubles as a single-skill
   refresh without a separate command.
7. As a user who edited an installed skill's `SKILL.md` by hand, I want
   `vskills update` to leave that skill alone and tell me it's drifted, so that my
   edits are never silently overwritten.
8. As a user, I want `vskills update --force <skill>` to overwrite a drifted skill
   with the upstream version when I explicitly ask for it, so that I have an
   escape hatch when I want to discard my local edit.
9. As a user, I want `vskills update` with no arguments to update every installed,
   undrifted skill in one pass, so that keeping my whole library current is a
   single command.
10. As a user, I want a clear error (not a silent no-op) when the repo can't be
    reached, so that I know to check my network instead of assuming the command
    succeeded.
11. As a user, I want a skill with a malformed `SKILL.md` to be skipped with a
    named warning rather than crashing the whole `init`/`update`/`add` run, so
    that one bad skill doesn't block installing every other skill.
12. As a user, I want `vskills` to refuse to touch a file at the agent-target path
    that isn't a symlink `vskills` created, so that it never clobbers something I put
    there myself.
13. As a user, I want skill folders nested under `mattpocock/<category>/<name>`
    to be addressable by their plain `<name>` (not the full nested path), so that
    `vskills add scaffold-exercises` works the same regardless of where in the repo
    the skill physically lives.
14. As a future user of a second coding agent, I want the agent-target directory
    to be configurable, so that adding Codex or another agent later doesn't
    require re-architecting the install root.

## Implementation Decisions

- Distribution: `npx github:VrajGupta/skills <command>` — see
  [ADR-0001](./adr/0001-npx-github-distribution.md).
- Commands: `init`, `update [skill...] [--force]`, `list`, `add <skill...>`. `add`
  on an already-installed, undrifted skill behaves like `update` for that skill
  (story 6) — it is not a separate code path, both route through the same
  install-or-refresh routine.
- Install root: `~/.agents/skills/<name>/` — real files, one folder per skill,
  named by the skill's frontmatter `name`, not by its repo path. Skills nested
  under `mattpocock/<category>/<name>/` are flattened to `<name>` at install
  time — see [ADR-0002](./adr/0002-skills-cli-architecture.md).
- Agent target: `~/.claude/skills/<name>` — a symlink to the install-root folder.
  Configurable (story 14) via a `targets` list in the CLI's own config so a
  second agent target can be added without code changes, though only one target
  ships populated in v1.
- Manifest: `~/.agents/skills/.vskills-manifest.json`, one entry per installed skill:
  `{ name, sourcePath, contentHash, installedAt }`. Written/updated after every
  successful install; read (never written) by `list`/`update`'s drift check.
- Dependency closure: `dependencies: [name, ...]` field in SKILL.md frontmatter,
  resolved transitively before install; a cycle is detected and reported by the
  full cycle path, not silently truncated.
- Drift detection: content hash (sha256 of the installed skill folder's file
  contents) computed at install time and stored in the manifest; recomputed at
  update time and compared. Mismatch = drift.
- Atomic writes and untouched-foreign-file checks per
  [`docs/invariants.md`](./invariants.md).

## Testing Decisions

- Test only external behavior: given a fixture repo checkout and a fixture
  install root, assert the resulting filesystem state (files present, symlinks
  present and pointing correctly, manifest contents) — not internal function
  calls.
- Cover: fresh init; re-running init (no-op); add with a dependency closure; add
  with a dependency cycle (errors, names the cycle); update with no drift
  (fast-forwards); update with drift (skips, reports, `--force` overrides);
  malformed frontmatter (skipped, named, run continues); foreign file at agent
  target (refused, named).
- Prior art: none yet in this repo — this is the first tested code in it. No
  existing test runner to match; the tickets will pick one (Node's built-in
  `node:test` is the natural default for a small no-dependency CLI).

## Out of Scope

- Per-agent skill variants (`/claude-handoff` vs `/codex-handoff`) as a first-class
  concept — v1 just installs distinct skill folders as-is (see ADR-0002).
- Three-way merge / auto-resolving drift — v1 only detects and skips or
  force-overwrites.
- npm registry publish.
- A second populated agent target (Codex etc.) — the config supports it, nothing
  ships wired to it yet.
- Uninstall command.

## Further Notes

This repo has no existing test runner or `package.json` yet — the first ticket
must establish both before any CLI logic ticket can land.
