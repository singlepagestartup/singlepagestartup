---
name: "oneshot"
description: "Legacy shortcut: run research then plan for an issue."
---

# oneshot

Legacy orchestration alias. Canonical source: `.agents/workflows/engineering/oneshot.md`.

## Required Behavior

1. Read `.agents/workflows/engineering/oneshot.md` completely and execute its process: research phase, the explicit status advancement to `Ready for Plan`, then the planning phase.
2. Keep both phases in one Codex context (no detached slash-context spawning).
3. Preserve each phase gate, artifact contract, and issue comment exactly as the canonical files describe.
4. Stop after planning — the plan still requires human review (`Plan in Review`).

## Final editorial pass

When this skill writes or returns prose intended for a person, load the project
`unslop` skill and apply `.agents/contracts/editorial-pass.md` after the
canonical workflow is complete. Preserve exact facts, evidence, identifiers,
paths, commands, required structure, and approval state.
