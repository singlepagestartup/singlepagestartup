---
name: "core-00-create"
description: "Creates and initializes a new issue in the SPS linear workflow."
---

# core-00-create

Primary workflow skill. Canonical source: `.claude/commands/core/00-create.md`.

## Required Behavior

1. Read `.claude/commands/core/00-create.md` completely.
2. Enforce the same GitHub Project status gate and transitions.
3. Preserve all required comments/checkpoints described by the source command.
4. Write/update artifacts in the exact same repository paths.
5. Use `.claude/helpers/*.sh` for project/status operations.
6. For project item creation, use `.claude/helpers/add_issue_to_project.sh` (do not call raw `gh project item-add` directly).
7. For issue bodies/comments that may include markdown or shell-sensitive characters, prefer `--body-file` and `.claude/helpers/gh_issue_comment.sh` over inline `--body "..."`.
8. Prefer `.claude/helpers/create_issue_with_project.sh` for GitHub issue creation so URL/issue-number validation, project assignment, and status transitions fail fast as one helper-driven step.

## Codex Adaptation Rules

- If the source references Claude `SlashCommand()`, continue in the same Codex context by executing the referenced command logic directly.
- For parallel research/planning tasks, use Codex subagents from `.codex/agents/*.toml`.
- Keep failure handling and human-review gates equivalent to source behavior.
- Keep all GitHub operations in one consistent execution context and load owner/project config from `.claude/helpers/load_config.sh`.
- When a workflow step sources `.claude/helpers/load_config.sh`, execute the whole GitHub helper sequence inside one `bash -lc` block so exported variables persist and shell-dependent helper logic does not break under `zsh`.
- Ensure the GitHub helper shell block is fail-fast (`set -euo pipefail`) so project/status helpers do not run with empty issue identifiers after a create failure.
- If `gh` fails with `error connecting to api.github.com`, rerun the same `bash -lc` workflow block with escalated network access instead of rewriting the helper sequence.

## Inputs

- Accept the same inputs as `.claude/commands/core/00-create.md` (issue number and optional flags/paths).

## Notes

Use this as workflow entrypoint for newly created issues before research.
Maintain the persistent process artifact exactly as the source command describes.
