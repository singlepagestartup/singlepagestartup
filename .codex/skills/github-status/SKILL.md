---
name: "github-status"
description: "Reads status of an SPS issue in GitHub Project."
---

# github-status

Codex wrapper for `.claude/commands/github_status.md`.

## Execution Contract

1. Read `.claude/commands/github_status.md` fully before executing.
2. Execute the same workflow semantics and status gates.
3. Keep all artifacts in the same paths under `thoughts/shared/*`.
4. Use existing helper scripts in `.claude/helpers/*.sh` for GitHub status logic.

## Codex Adaptation Rules

- When the source mentions Claude-specific slash invocation mechanics, execute the referenced workflow in the current Codex thread.
- For delegated research tasks, use Codex subagents defined in `.codex/agents/*.toml`.
- Do not rewrite process policy in this phase; preserve behavior parity with the source command.

## Inputs

- If issue number / file path is required by the source command, request it from the user or infer it exactly as the source command specifies.
