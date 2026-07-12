# Skills Repo

This repo holds the user's skill library (own skills at root, a vendored Matt Pocock
pack under `mattpocock/`) plus `vskills`, a CLI that installs/updates that library onto
a machine.

## Language

**Install root**:
The on-disk directory holding canonical skill content, one subfolder per skill (`~/.agents/skills/<name>`). `vskills` writes here; nothing else does.
_Avoid_: skills folder, agents dir

**Agent target**:
A directory a coding agent reads skills from (e.g. `~/.claude/skills`). Populated by `vskills` as symlinks pointing into the **install root** — never real files.
_Avoid_: claude folder, skills dir

**Manifest**:
`vskills`'s own record of what it installed and when — one entry per skill with a content hash, kept at `~/.agents/skills/.vskills-manifest.json`. Not a skill file itself; never read by an agent.
_Avoid_: lockfile, state file

**Drift**:
A gap between a skill's content on disk and the hash recorded for it in the **manifest** — meaning the user (or something else) edited it after install. `vskills update` detects drift and refuses to overwrite it silently.
_Avoid_: local changes, dirty skill

**Dependency closure**:
The full set of skills that must be installed together, computed by following each skill's declared `dependencies` frontmatter field transitively. `vskills add`/`init` install the whole closure, not just the named skill.
_Avoid_: dep tree, requirements
