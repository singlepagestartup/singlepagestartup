---
name: "core-30-implement"
description: "Runs implementation phase against approved plan with progress handling."
---

# core-30-implement

Primary workflow skill. Canonical source: `.claude/commands/core/30-implement.md`.

## Required Behavior

1. Read `.claude/commands/core/30-implement.md` completely.
2. Enforce the same GitHub Project status gate and transitions.
3. Preserve all required comments/checkpoints described by the source command.
4. Write/update artifacts in the exact same repository paths.
5. Use `.claude/helpers/*.sh` for status operations.
6. For GitHub issue comments, use `.claude/helpers/gh_issue_comment.sh` with `--body-file` (or stdin) instead of inline `--body "..."` markdown.
7. Follow `.claude/references/repository-context-contract.md` for repo/project context; never derive artifact namespaces from bare `gh repo view`.
8. After commit and PR creation, run `.claude/helpers/submit_pr_for_code_review.sh ISSUE_NUMBER PR_NUMBER_OR_URL` before giving the final implementation answer. Do not treat `$commit` + `$describe-pr` as complete implementation finalization unless the issue status has been verified as `Code Review`.

## Codex Adaptation Rules

- If the source references Claude `SlashCommand()`, continue in the same Codex context by executing the referenced command logic directly.
- For parallel research/planning tasks, use Codex subagents from `.codex/agents/*.toml`.
- Keep failure handling and human-review gates equivalent to source behavior.
- Prefer bash-compatible execution for helper flows that use heredoc/body-file patterns.

## Inputs

- Accept the same inputs as `.claude/commands/core/30-implement.md` (issue number and optional flags/paths).

## Notes

Respect in-progress resume behavior and incident log handling exactly as source command describes.
Mirror implementation incidents into the persistent process artifact exactly as the source command describes.
