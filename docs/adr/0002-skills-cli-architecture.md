# Installer CLI architecture: single agent target, frontmatter deps, hash-based drift

Four related decisions made together for `vkg` v1:

- **Single agent target for v1.** `vkg` writes real content into the **install
  root** and symlinks it into one **agent target** (Claude Code's `~/.claude/skills`).
  Per-agent variants (`/claude-handoff` vs `/codex-handoff`) are deferred to
  ordinary distinct skill folders for now, not a variant-resolution engine —
  there's no second agent target consuming this repo yet, so building selection
  machinery for it is speculative. Adding a second target later means adding a
  second symlink destination, not restructuring the install root.
- **Dependencies declared in SKILL.md frontmatter** (`dependencies: [name, ...]`)
  rather than a separate manifest file, so a skill's requirements live next to the
  skill itself and can't drift out of sync with it.
- **Drift detected by content hash, not git.** The **manifest** records a hash per
  installed skill at install time; `update` recomputes and compares. This works
  whether or not the install root is itself a git repo, and avoids the complexity
  of a real three-way merge for v1 — on drift, `vkg` skips and warns rather than
  merging. Users who want the upstream version back can re-run `add` to force it.

Considered and rejected: git-tracking the install root itself to detect drift via
`git diff` — rejected because it forces the install root to be a git repo the user
never asked for, and doesn't compose with skills that were hand-copied in before
`vkg` existed (exactly the state this repo was in prior to building this tool).
