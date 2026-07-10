# skills

My Claude Code skills.

## Layout

```
part1/           planning chain     (idea -> spec -> tickets -> pushed handoff)
part2/           implementation     (next ticket -> TDD -> pushed handoff)
part3/           review/loop-closer (audit -> fix -> grade -> pushed handoff)
loop-engineer/   maker/checker loop engineering (closed-loop task runner)
mattpocock/      Matt Pocock's skills (github.com/mattpocock/skills), mirrored by category
```

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
