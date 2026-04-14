---
name: "core-20-plan"
description: "Runs planning phase and produces implementation plan artifact."
---

# core-20-plan

Primary workflow skill. Canonical source: `.claude/commands/core/20-plan.md`.

## Required Behavior

1. Read `.claude/commands/core/20-plan.md` completely.
2. Enforce the same GitHub Project status gate and transitions.
3. Preserve all required comments/checkpoints described by the source command.
4. Write/update artifacts in the exact same repository paths.
5. Use `.claude/helpers/*.sh` for status operations.
6. Enforce explicit intent confirmation on ambiguous ticket wording before writing a new/rewritten plan.
7. Use `.claude/helpers/gh_retry.sh` for direct `gh` comment/view operations described by the source command.
8. For GitHub issue comments, use `.claude/helpers/gh_issue_comment.sh` with `--body-file` (or stdin) to avoid shell interpolation issues in markdown bodies.

## Codex Adaptation Rules

- If the source references Claude `SlashCommand()`, continue in the same Codex context by executing the referenced command logic directly.
- For parallel research/planning tasks, use Codex subagents from `.codex/agents/*.toml`.
- Keep failure handling and human-review gates equivalent to source behavior.
- Quote shell-sensitive paths containing glob characters (for example `[[...url]]`) in command execution.
- Prefer bash-compatible execution for helper flows that use heredoc/body-file patterns.
- In sandboxed Codex sessions, proactively request elevated permissions for `.claude/helpers/get_issue_status.sh`, `.claude/helpers/update_issue_status.sh`, `.claude/helpers/gh_issue_comment.sh`, and other networked GitHub helper flows instead of waiting for `gh_retry` to exhaust on blocked network access.

## Inputs

- Accept the same inputs as `.claude/commands/core/20-plan.md` (issue number and optional flags/paths).

## Notes

Plan output must remain compatible with downstream `core-30-implement`.
