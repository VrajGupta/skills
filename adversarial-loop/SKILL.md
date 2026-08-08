---
name: adversarial-loop
description: Run the same coding task through the orchestrator plus 3 model/provider subagents in isolated git worktrees, relay each round's diffs and critiques hub-and-spoke, and stop on unanimous sign-off or a 6-round cap. Ends with every final diff rated side by side, no auto-merge — you pick. Use when the user says adversarial-loop, wants a task independently attempted by several models and cross-examined, or wants competing implementations judged before choosing one.
---

# Adversarial Loop

Same task, several models, no one merges anyone else's work. Every participant
builds in its own worktree; the orchestrator only relays and, at the end, rates.

## Step 0 — Decide the orchestrator's role

Check the current session's model against this tier list (edit it here when new
models ship — this is the one place to update):

- **Good tier** (also attempts the task, becomes a 4th participant): Sonnet 5,
  Opus 5, Fable 5, GPT-5.6 Sol, Kimi K3, GLM 5.2, Grok 4.5.
- **Not-good tier** (pure orchestrator, no attempt of its own — 3 participants
  total): Haiku 4.5, GPT-5.6 Luna, DeepSeek V4 (Flash or full), Gemini 3 Pro,
  Qwen3 Max, MiniMax M2, and **anything not on the good-tier list** (unknown
  models default here).

State which role you're in before continuing.

## Step 1 — Pick the 3 subagent slots

Ask, every run, via `AskUserQuestion`: which model/provider fills each of the 3
slots. Never assume a default trio.

For each chosen model, decide how it will actually run:

- **Claude family** (sonnet/opus/haiku/fable) → the native `Agent` tool.
- **Anything else** (Kimi, GLM, GPT, Grok, DeepSeek, Gemini, Qwen, MiniMax...)
  → a headless/non-interactive invocation of whatever CLI the current harness
  has wired to that provider (e.g. `codex exec`, a Pi/OpenRouter run command),
  driven with `Bash`, `cd`'d into that participant's worktree. Check the CLI is
  present and authenticated before Step 2; if it isn't, tell the user this slot
  can't run and ask them to swap the model or skip the slot — don't silently
  drop a participant.

## Step 2 — Set up isolated worktrees

One worktree per participant, including the orchestrator's own attempt when it
has one — every entrant needs to be symmetric so the final diffs are fairly
comparable. See `superpowers:using-git-worktrees` for the mechanics; branch
names like `adversarial-loop/<slot>-<model-slug>` off the current HEAD.

## Step 3 — Round 1: independent attempts

Give every participant the identical task brief. Each works alone in its own
worktree and produces a diff. Every brief must say, explicitly:

```
NO SUBAGENTS — you may not call Agent, Workflow, or spawn any other agent.
If you cannot finish without delegating, stop and report your progress,
blockers, and recommended next step instead.
```

(This mirrors the standing depth-1 rule: the orchestrator is the only one
allowed to fan out.)

## Step 4 — Relay rounds (hub-and-spoke, up to 6 total)

For each subsequent round, every participant receives:

- The original task.
- Every *other* participant's current diff.
- Every other participant's critique from the prior round.

Each participant returns: its revised diff (or "unchanged"), a critique of the
others, and an explicit `SIGN-OFF: yes` / `SIGN-OFF: no — <reason>` line.

Stop as soon as every active participant signs off in the same round, or after
round 6, whichever comes first. Round 6 ending without unanimity is not a
failure — report it as an open disagreement, not a forced consensus.

## Step 5 — Report, don't merge

No synthesis, no auto-picked winner. For each participant, present:

- Its final diff (files touched, and a plain-language summary of what the
  change actually does).
- The orchestrator's own rating and rationale — the orchestrator rates every
  entry itself, including its own attempt if it has one; there is no separate
  judge pass.
- Its final sign-off status (agreed / still objecting, and why).

Then ask which one to keep. The chosen branch still needs to be merged or
cherry-picked into the working branch by hand — this skill never does that
silently.

## Cleanup

Once the user picks, remove the losing worktrees (`git worktree remove`) unless
they ask to keep them for reference.

## Related

`shared-worktree-delegation` (lane/gatekeeper mechanics this borrows from),
`superpowers:using-git-worktrees` (worktree setup), `push-handoff` (once the
chosen diff is merged and ready to ship), `grilling` (for scoping the task
brief itself before a run, if it's still fuzzy).
