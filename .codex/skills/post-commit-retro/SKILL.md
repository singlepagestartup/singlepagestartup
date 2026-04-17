---
name: "post-commit-retro"
description: "Analyzes recent commit or session context to find workflow problems in shared .claude and .codex agent tooling, then records fixes that would make future tasks faster and more reliable."
---

# post-commit-retro

Codex wrapper for `.claude/commands/utilities/post_commit_retro.md`.

## Execution Contract

1. Read `.claude/commands/utilities/post_commit_retro.md` fully before executing.
2. Execute the same workflow semantics and output structure.
3. Write retrospective artifacts under `thoughts/shared/retrospectives/*` exactly as the source command specifies.
4. Prefer fixes that are portable across `.claude` and `.codex` unless the evidence points to a runtime-specific problem.

## Codex Adaptation Rules

- When the source mentions Claude slash-command mechanics, execute the workflow directly in the current Codex thread.
- Use Codex subagents only for bounded analysis tasks when delegation is explicitly desired by the user.
- Keep the retrospective evidence-based; do not turn it into a speculative brainstorming session.
- When recommending future acceleration mechanisms, prefer command/skill refactors and git hooks before time-based automations.

## Inputs

- Accept the same inputs as `.claude/commands/utilities/post_commit_retro.md`.
- If issue number or commit SHA is missing, infer it only when the local context makes the inference high confidence.
