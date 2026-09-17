---
name: "ralph-research"
description: "Legacy alias: delegates to core-10-research behavior."
---

# ralph-research

Thin compatibility alias.

Canonical source: `.agents/workflows/engineering/ralph_research.md`.

## Behavior

- Execute the same logic as `core-10-research`.
- Preserve all status-gate and artifact semantics.
- Do not introduce legacy-only branches.

## Source Compatibility

- `.agents/workflows/engineering/ralph_research.md`
- `.agents/workflows/engineering/core/10-research.md`

## Final editorial pass

When this skill writes or returns prose intended for a person, load the project
`unslop` skill and apply `.agents/contracts/editorial-pass.md` after the
canonical workflow is complete. Preserve exact facts, evidence, identifiers,
paths, commands, required structure, and approval state.
