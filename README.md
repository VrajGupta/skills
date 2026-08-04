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
planner/           planning chain     (batch design grill -> spec -> tickets -> handoff)
coder/           implementation     (next ticket -> TDD -> self-check -> handoff)
debugger/           debug/harden       (four-net audit -> red-team the corners -> fix -> handoff)
reviewer/           review/gate to Done (blind judge -> PASS/FAIL -> route or escalate)
push-handoff/    verified, explicitly authorized git commit/push closeout
loop-engineer/   maker/checker loop engineering (closed-loop task runner)
pipeline/        the delivery-factory skills: tracker stage protocol, the four roles,
                 stage-parent harness profile, shared-worktree safety, gated batch delivery,
                 audit/recovery
mattpocock/      Matt Pocock's skills (github.com/mattpocock/skills), mirrored by category
                 (including in-progress/batch-grill-me)
```

## pipeline/ — running work as a factory

`planner/2/3/4` are the chains you run, one per pipeline stage, each on a different
model so no stage ever reviews its own work:

```
Planned -> Agent Ready -> Coding -> Debugger Ready -> Debugging -> Review Ready -> Reviewing -> Done
   planner        |          coder         |             debugger          |            reviewer
```

`reviewer` is the only stage that may set `Done`. It judges **blind** — diff, ticket and
invariants only, never the author's handoff — because a confident rationale from the
author is the strongest thing that corrupts a review. A failed review routes by *kind*
(correctness -> Debugger Ready, missing scope or tests -> Agent Ready, unbuildable ticket ->
Planned), and a third failed review escalates to a human instead of looping forever.

### Stage-parent harness profile

The fleet runs as a serial four-stage workflow. GPT-5.6 Luna is the overall
coordinator; it may dispatch Opus 5 in the Claude Code harness for planning after
planning decisions are supplied. Kimi, Codex, and Grok run as independent top-level
stage-parent sessions for `/coder`, `/debugger`, and `/reviewer`. A stage parent is the
chat/session running its stage; it may coordinate one level of helpers when its
harness supports that. A native child launched from another session must not spawn
nested children.

| Stage | Stage parent | Harness / route | Effort |
|---|---|---|---|
| `/planner` | Opus 5, Luna-dispatched or visible | Claude Code harness using the Claude subscription | medium/high |
| `/coder` | Kimi K3 | Pi harness via OpenRouter | high |
| `/debugger` | GPT-5.6 Luna | Codex harness using the Codex subscription | **max** |
| `/reviewer` | Grok 4.5 | Pi harness via OpenRouter | high/xhigh |

Coder may use Kimi K2.7 Code helpers and debugger may use auditor helpers, but only
inside their independent top-level stage-parent sessions. Reviewer's final reviewer must
remain blind and may receive only the ticket, diff, gate, and invariant docs. The
GitHub Project item, GitHub issue, git, and handoffs—not chat history—connect the
stage parents. `max` is a reasoning
setting, not part of a model name. A headless Opus child cannot conduct the
interactive grill; use a visible Claude session or pass all decisions in advance.

**Runtime choice:** super.engineering is the managed-workspace authority for
worktrees, target/base branches, sessions, and reviews. Herdr is an optional local
terminal multiplexer for visible, persistent agent panes. Herdr can run the separate
stage-parent processes, but it does not replace GitHub Projects or git/GitHub, and
it should not independently mutate a worktree managed by super.engineering. The two tools can
coexist: super.engineering owns the workspace; Herdr provides process visibility.

The stage protocol itself lives in [`pipeline/github-projects-pipeline`](pipeline/github-projects-pipeline/SKILL.md):
exact Project `Status` options, who may move what, re-read after every write, how to
use `gh project`, and how to run every stage with no project at all.

`planner/2/3/4` are the chains you run. `pipeline/` is the machinery around them: how a
ticket moves between stages, who is allowed to move it, and what counts as proof.

| Skill | Use when |
|---|---|
| `github-projects-pipeline` | Stage protocol — GitHub Project `Status` is canonical; issues hold tickets and evidence |
| `profile-gated-delivery` | Run an effort end to end with an evidence gate between every stage |
| `specialist-profiles` | Build/verify the planner, coder, debugger roles so maker != checker is structural |
| `state-driven-pipeline-recovery` | The pipeline is thrashing or reporting false greens |
| `controlled-ticket-delivery` | Budget caps, live migrations, restricted git or tracker access |
| `ticket-implementation-tdd` | The detailed one-ticket TDD loop `coder` invokes |
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

## planner / coder / debugger / loop-engineer — use as a workflow

These four are meant to be run **as a pipeline**, in order, on the same repo:

1. **`/planner`** — take a new idea/feature/ADR from grilling through a locked spec
   and dependency-ordered tickets, then push a handoff.
2. **`/coder`** — pick up the next unblocked ticket, build it test-first, red-team
   it against the invariants `/planner` locked, then push a handoff.
3. **`/debugger`** — the loop-closer. The Codex Luna stage parent audits the directory
   for bugs/weak tests, fixes them test-first, may use a fresh-eyes helper inside its
   own top-level session, and pushes a handoff.
4. **`/loop-engineer`** — wraps any of the above (or any coding task) in a closed
   maker -> checker loop with an explicit done-condition, so the agent iterates
   until the goal is verifiably met instead of stopping after one pass.

You don't have to run them together — each is a standalone skill and works fine
on its own. But `planner -> coder -> debugger` is the intended round trip: plan it,
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
