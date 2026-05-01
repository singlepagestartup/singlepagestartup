---
name: "core-next"
description: "Dispatches SPS issue workflow by current GitHub Project status."
---

# core-next

Primary workflow skill. Canonical source: `.claude/commands/core/next.md`.

## Required Behavior

1. Read `.claude/commands/core/next.md` completely.
2. Enforce the same GitHub Project status gate and transitions.
3. Preserve all required comments/checkpoints described by the source command.
4. Write/update artifacts in the exact same repository paths.
5. Use `.claude/helpers/*.sh` for status operations.
6. Follow `.claude/references/repository-context-contract.md` for repo/project context; never derive artifact namespaces from bare `gh repo view`.

## Codex Adaptation Rules

- If the source references Claude `SlashCommand()`, continue in the same Codex context by executing the referenced command logic directly.
- For parallel research/planning tasks, use Codex subagents from `.codex/agents/*.toml`.
- Keep failure handling and human-review gates equivalent to source behavior.

## Inputs

- Accept the same inputs as `.claude/commands/core/next.md` (issue number and optional flags/paths).

## Dispatch Mapping

Map statuses exactly as source contract:

- `Research Needed` / `Research in Progress` -> run `core-10-research`
- `Ready for Plan` / `Plan in Progress` -> run `core-20-plan`
- `Ready for Dev` / `In Dev` -> run `core-30-implement`
- Review/Done statuses -> stop and return explicit next human action.
