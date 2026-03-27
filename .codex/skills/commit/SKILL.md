---
name: "commit"
description: "Creates Git commits using SPS utility command contract."
---

# commit

Codex wrapper for `.claude/commands/utilities/commit.md`.

## Execution Contract

1. Read `.claude/commands/utilities/commit.md` fully before executing.
2. Execute the same workflow semantics and status gates.
3. Keep all artifacts in the same paths under `thoughts/shared/*`.
4. Use existing helper scripts in `.claude/helpers/*.sh` for GitHub status logic.

## Codex Adaptation Rules

- When the source mentions Claude-specific slash invocation mechanics, execute the referenced workflow in the current Codex thread.
- For delegated research tasks, use Codex subagents defined in `.codex/agents/*.toml`.
- Do not rewrite process policy in this phase; preserve behavior parity with the source command.
- Keep git write operations (`git add`, `git commit`) in one consistent execution context.
- In sandboxed sessions, if `.git/index.lock` permission errors occur, immediately retry git write commands with elevated permissions.
- Quote file paths with shell glob characters (`[]`, `*`, `?`) during inspection/staging/commit commands.

## Inputs

- If issue number / file path is required by the source command, request it from the user or infer it exactly as the source command specifies.
