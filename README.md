# skills

My Claude Code skills.

## Installing with V's Skills (`vskills`)

```
npx github:VrajGupta/skills init     # install every skill onto this machine
npx github:VrajGupta/skills list     # see what's installed / drifted
npx github:VrajGupta/skills add <skill>       # install one skill + its dependencies
npx github:VrajGupta/skills update [skill...] # refresh installed skills (skips local edits)
```

Installs real content into `~/.agents/skills/<name>` and symlinks it into
`~/.claude/skills/<name>`. If you've hand-edited an installed skill, `update`
detects the drift and leaves it alone instead of overwriting it — pass
`--force` to overwrite anyway. See [`docs/spec-vskills-cli.md`](docs/spec-vskills-cli.md)
for the full design and [`docs/invariants.md`](docs/invariants.md) for the
guarantees it holds itself to.

## Layout

```
bin/vskills.js       the vskills CLI entrypoint (see "Installing with vskills" above)
src/             vskills's implementation
test/            vskills's test suite (node --test)
part1/           planning chain     (batch design grill -> spec -> tickets -> handoff)
part2/           implementation     (next ticket -> TDD -> self-check -> handoff)
part3/           debug/harden       (four-net audit -> red-team the corners -> fix -> handoff)
part4/           grade/gate to Done (blind judge -> PASS/FAIL -> route or escalate)
push-handoff/    verified, explicitly authorized git commit/push closeout
loop-engineer/   maker/checker loop engineering (closed-loop task runner)
pipeline/        the delivery-factory skills: tracker stage protocol, the three roles,
                 shared-worktree safety, gated batch delivery, audit/recovery
mattpocock/      Matt Pocock's skills (github.com/mattpocock/skills), mirrored by category
                 (including in-progress/batch-grill-me)
```

## pipeline/ — running work as a factory

`part1/2/3/4` are the chains you run, one per pipeline stage, each on a different
model so no stage ever reviews its own work:

```
Planned -> Agent Ready -> Coding -> Debugger Ready -> Debugging -> Grading Ready -> Grading -> Done
   part1        |          part2         |             part3          |            part4
```

`part4` is the only stage that may set `Done`. It judges **blind** — diff, ticket and
invariants only, never the author's handoff — because a confident rationale from the
author is the strongest thing that corrupts a review. A failed grade routes by *kind*
(correctness -> Debugger Ready, missing scope or tests -> Coding, unbuildable ticket ->
Planned), and a third failed grade escalates to a human instead of looping forever.

The stage protocol itself lives in [`pipeline/linear-pipeline`](pipeline/linear-pipeline/SKILL.md):
exact state names, who may move what, re-read after every write, whether GitHub stage
labels are safe on a given repo, and how to run every stage with no tracker at all.

`part1/2/3/4` are the chains you run. `pipeline/` is the machinery around them: how a
ticket moves between stages, who is allowed to move it, and what counts as proof.

| Skill | Use when |
|---|---|
| `linear-pipeline` | Stage protocol — Linear is the write surface, GitHub issues read-only |
| `linear-label-pipeline` | Operator manual: why a ticket didn't move, duplicates, label-vs-state |
| `profile-gated-delivery` | Run an effort end to end with an evidence gate between every stage |
| `specialist-profiles` | Build/verify the planner, coder, debugger roles so maker != checker is structural |
| `state-driven-pipeline-recovery` | The pipeline is thrashing or reporting false greens |
| `controlled-ticket-delivery` | Budget caps, live migrations, restricted git or tracker access |
| `ticket-implementation-tdd` | The detailed one-ticket TDD loop `part2` invokes |
| `provider-integration-tdd` | Queues, signed webhooks, idempotent billing, owned artifacts |
| `invariant-evidence-review` | Is an invariant actually enforced, or only documented? |
| `codebase-audit` | Audit a whole system rather than one diff |
| `shared-worktree-safety` | Anything else is writing to the same checkout |
| `shared-worktree-delegation` | Fanning subagents into one tree with explicit file lanes |
| `parallel-subagent-implementation` | Authorized parallel tickets with disjoint lanes |
| `subagent-batch-implementation` | An authorized ticket *range* delivered in dependency waves |
| `ai-subscription-unit-economics` | Pricing and usage caps when inference is your cost of goods |

The load-bearing rule across all of them: **done is a locked verification command that was
actually run after the final change**, plus an independent checker for non-trivial work,
plus truthful tracker state.

## part1 / part2 / part3 / loop-engineer — use as a workflow

These four are meant to be run **as a pipeline**, in order, on the same repo:

1. **`/part1`** — take a new idea/feature/ADR from grilling through a locked spec
   and dependency-ordered tickets, then push a handoff.
2. **`/part2`** — pick up the next unblocked ticket, build it test-first, red-team
   it against the invariants `/part1` locked, then push a handoff.
3. **`/part3`** — the loop-closer. Audits the directory for bugs/weak tests, fixes
   them test-first, grades the fix with a fresh-eyes sub-agent, pushes a handoff.
4. **`/loop-engineer`** — wraps any of the above (or any coding task) in a closed
   maker -> checker loop with an explicit done-condition, so the agent iterates
   until the goal is verifiably met instead of stopping after one pass.

You don't have to run them together — each is a standalone skill and works fine
on its own. But `part1 -> part2 -> part3` is the intended round trip: plan it,
build it, close the loop. Drop `loop-engineer` around any stage where you want
iteration to continue until a checker says done.

## mattpocock/ — use separately

Matt Pocock's skills ([mattpocock/skills](https://github.com/mattpocock/skills),
MIT licensed — see `mattpocock/LICENSE`) are mirrored here by his own category
structure (`engineering/`, `productivity/`, `personal/`, `misc/`, `in-progress/`,
`deprecated/`). Each is independent — invoke whichever one fits the moment
(`/grill-me`, `/tdd`, `/diagnosing-bugs`, `/handoff`, etc.). See
`mattpocock/UPSTREAM-README.md` for his full reference and the philosophy
behind them.

Run `mattpocock/engineering/setup-matt-pocock-skills` once per repo before using
his other engineering skills — it configures the issue tracker, triage labels,
and domain-doc layout they assume.
