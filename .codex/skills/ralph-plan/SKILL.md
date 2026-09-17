---
name: "ralph-plan"
description: "Legacy alias: delegates to core-20-plan behavior."
---

# ralph-plan

Thin compatibility alias.

Canonical source: `.agents/workflows/engineering/ralph_plan.md`.

## Behavior

- Execute the same logic as `core-20-plan`.
- Preserve all status-gate and artifact semantics.
- Do not introduce legacy-only branches.

## Source Compatibility

- `.agents/workflows/engineering/ralph_plan.md`
- `.agents/workflows/engineering/core/20-plan.md`

## Final editorial pass

When this skill writes or returns prose intended for a person, load the project
`unslop` skill and apply `.agents/contracts/editorial-pass.md` after the
canonical workflow is complete. Preserve exact facts, evidence, identifiers,
paths, commands, required structure, and approval state.
