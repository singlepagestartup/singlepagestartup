# Codex Workflow (Phase 1)

This directory adds a Codex-native workflow in parallel with the existing `.claude` setup.

## Scope

- Root workflow only (no `tools/digital-agency` / `tools/deployer` migration in this phase)
- Same status-gated lifecycle as `.claude`:
  - `core-00-create`
  - `core-10-research`
  - `core-20-plan`
  - `core-30-implement`
  - `core-next` dispatcher

## Contracts

- GitHub status backend remains in `.claude/helpers/*.sh`.
- Canonical process docs remain in `.claude/commands/**/*.md`.
- Codex skills are wrappers that execute the same logic and produce the same artifacts.

## Skills

- Core: `core-next`, `core-00-create`, `core-10-research`, `core-20-plan`, `core-30-implement`
- Utility: `github`, `github-status`, `validate-plan`, `create-handoff`, `resume-handoff`, `implement-plan`, `commit`, `describe-pr`
- Legacy aliases: `ralph-research`, `ralph-plan`, `ralph-impl`, `oneshot`, `oneshot-plan`

## Subagents

Codex subagents are defined in `.codex/agents/*.toml` and mirror `.claude/agents/*` responsibilities.

## Run modes

- Safe default:
  - `codex --profile sps-safe`
- No confirmation prompts (workspace sandbox):
  - `codex --profile sps-auto`
  - or `codex --ask-for-approval never --sandbox workspace-write`

Use full bypass mode only if you explicitly accept elevated risk.
