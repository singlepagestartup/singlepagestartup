---
name: "oneshot_plan"
description: "Legacy shortcut: run plan then implementation for an issue."
---

# oneshot_plan

Legacy orchestration alias.

## Behavior

1. Run `core-20-plan` logic for the target issue.
2. Run `core-30-implement` logic for the same issue.

## Rules

- Keep both phases in one Codex context (no detached slash-context spawning).
- Preserve each phase gate and artifact contract.

## Source Compatibility

- `.claude/commands/oneshot_plan.md`
