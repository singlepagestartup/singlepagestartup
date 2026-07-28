---
name: "oneshot-plan"
description: "Legacy shortcut: run plan then implementation for an issue."
---

# oneshot-plan

Legacy orchestration alias. Canonical source: `.claude/commands/oneshot_plan.md`.

## Required Behavior

1. Read `.claude/commands/oneshot_plan.md` completely and execute its process: planning phase, the explicit status advancement to `Ready for Dev`, then the implementation phase.
2. Keep both phases in one Codex context (no detached slash-context spawning).
3. Preserve each phase gate, artifact contract, and issue comment exactly as the canonical files describe.
4. Respect the canonical command's caution: this flow skips the human plan-review gate and is only appropriate for `size:xs` / `size:small` issues.
