---
name: "oneshot"
description: "Legacy shortcut: run research then plan for an issue."
---

# oneshot

Legacy orchestration alias.

## Behavior

1. Run `core-10-research` logic for the target issue.
2. Run `core-20-plan` logic for the same issue.

## Rules

- Keep both phases in one Codex context (no detached slash-context spawning).
- Preserve each phase gate and artifact contract.

## Source Compatibility

- `.claude/commands/oneshot.md`
