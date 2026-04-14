---
name: "github"
description: "GitHub issue/project management workflow for SPS."
---

# github

Codex wrapper for `.claude/commands/github.md`.

## Execution Contract

1. Read `.claude/commands/github.md` fully before executing.
2. Execute the same workflow semantics and status gates.
3. Keep all artifacts in the same paths under `thoughts/shared/*`.
4. Use existing helper scripts in `.claude/helpers/*.sh` for GitHub status logic.
5. Use `.claude/helpers/gh_issue_comment.sh` for issue comments and `--body-file` patterns for multiline markdown bodies.

## Codex Adaptation Rules

- When the source mentions Claude-specific slash invocation mechanics, execute the referenced workflow in the current Codex thread.
- For delegated research tasks, use Codex subagents defined in `.codex/agents/*.toml`.
- Do not rewrite process policy in this phase; preserve behavior parity with the source command.
- Execute any sequence that sources `.claude/helpers/load_config.sh` inside a single `bash -lc` block so `.claude` GitHub helpers work reliably even when the repo shell defaults to `zsh`.
- If `gh` reports `error connecting to api.github.com`, rerun the same helper block with escalated network access rather than bypassing `.claude` helpers.

## Inputs

- If issue number / file path is required by the source command, request it from the user or infer it exactly as the source command specifies.
