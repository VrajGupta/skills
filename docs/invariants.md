# Invariants — `vkg` CLI

Named, testable constraints that `to-spec`/`to-tickets` and `/part2`'s red-team
pass must honor. These aren't goals — they're gates. If a change violates one,
that's a bug, not a trade-off.

## Latency / performance budgets

- `vkg list` completes in **< 1s** with no network call — it reads only the local
  install root + manifest.
- `vkg init` / `vkg update` / `vkg add` complete in **< 5s** for the current repo
  size (~20 skills), excluding first-time `git clone` network time. A shallow
  clone/fetch (`--depth 1`) is used, not a full-history clone.
- No command blocks longer than **10s** without printing progress — a silent CLI
  reads as hung.

## Failure modes (per external dependency)

- **Network / GitHub unreachable** (clone or fetch fails): print a clear error
  naming the failed operation and exit non-zero. Never partially install a skill
  (write must be all-or-nothing per skill — see below).
- **Malformed SKILL.md frontmatter** (missing `name`, bad YAML, circular
  `dependencies`): skip that one skill with a named warning; do not abort the
  whole run. Circular dependency closure is detected and reported by name, not a
  stack overflow or infinite loop.
- **Drift detected mid-update**: never overwrite the locally modified file. Skip
  it, report it by name in the summary, and exit 0 (drift is expected steady
  state, not a hard failure) unless `--force` is passed.
- **Partial write interrupted** (process killed mid-copy): a skill install is
  written to a temp path and renamed into place atomically, so the install root
  never contains a half-written skill folder.
- **Existing agent-target file that isn't `vkg`'s symlink** (user has a real file
  or a symlink to somewhere else at e.g. `~/.claude/skills/foo`): refuse to
  overwrite it, warn, and tell the user to remove it manually. Never silently
  clobber content `vkg` didn't create.

## Security / permission boundaries

- `vkg` only ever writes inside the **install root** (`~/.agents/skills/`) and
  creates symlinks inside the configured **agent target(s)** (e.g.
  `~/.claude/skills/`). It never writes anywhere else on disk.
- `vkg` never executes any script or code found inside a skill folder
  (`scripts/*.sh` etc.) as part of install/update/list/add — those scripts are
  for the agent to run later, not for the installer. Installing a skill must not
  execute attacker-controlled content from a compromised skill folder.
- `vkg` never reads or transmits anything outside the repo it's cloning/pulling
  from and the two directories above — no credential scraping, no telemetry.
