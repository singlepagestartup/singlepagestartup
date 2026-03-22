---
name: "core-20-plan"
description: "Runs planning phase and produces implementation plan artifact."
---

# core-20-plan

Primary workflow skill. Canonical source: `.claude/commands/core/20-plan.md`.

## Required Behavior

1. Read `.claude/commands/core/20-plan.md` completely.
2. Enforce the same GitHub Project status gate and transitions.
3. Preserve all required comments/checkpoints described by the source command.
4. Write/update artifacts in the exact same repository paths.
5. Use `.claude/helpers/*.sh` for status operations.

## Codex Adaptation Rules

- If the source references Claude `SlashCommand()`, continue in the same Codex context by executing the referenced command logic directly.
- For parallel research/planning tasks, use Codex subagents from `.codex/agents/*.toml`.
- Keep failure handling and human-review gates equivalent to source behavior.

## Inputs

- Accept the same inputs as `.claude/commands/core/20-plan.md` (issue number and optional flags/paths).

## Notes

Plan output must remain compatible with downstream `core-30-implement`.
