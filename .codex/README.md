# Codex Workflow

This directory is the Codex adapter for the provider-neutral SPS development workflow. The universal entry point for any agent is the root `AGENTS.md`; this directory only maps that workflow onto Codex skills and subagents.

## Scope

- Root workflow only (no `tools/digital-agency` / `tools/deployer` migration in this phase)
- Same GitHub-Project-gated lifecycle as `.claude`:
  - `core-00-create`
  - `core-10-research`
  - `core-20-plan`
  - `core-30-implement`
  - `core-next` dispatcher

## Contracts

- GitHub status backend remains in `.claude/helpers/*.sh`.
- Canonical process docs remain in `.claude/commands/**/*.md` (provider-neutral despite the directory name).
- Workflow contracts live in `.claude/references/*.md` (`repository-context-contract`, `process-artifact-contract`, `knowledge-first-contract`).
- Codex skills are wrappers that execute the same logic and produce the same artifacts at the same paths.

**Fallback rule**: if a `.claude/commands/**` command has no Codex skill wrapper, read that command file fully and execute its instructions directly in the current Codex thread, applying the tool-mapping table from `AGENTS.md` ("Running the workflow from any provider").

## Skills

- Core: `core-next`, `core-00-create`, `core-10-research`, `core-20-plan`, `core-30-implement`
- Utility: `github`, `github-status`, `validate-plan`, `create-handoff`, `resume-handoff`, `implement-plan`, `commit`, `describe-pr`, `post-commit-retro`
- Legacy aliases: `ralph-research`, `ralph-plan`, `ralph-impl`, `oneshot`, `oneshot-plan` (hyphenated names only; they delegate to `core-*` semantics)

## Subagents

Codex subagents are defined in `.codex/agents/*.toml` and mirror `.claude/agents/*` responsibilities.
Their `developer_instructions` should be detailed enough to stand alone: mission, constraints, strategy, output format, and explicit "do not" rules should match the quality bar of `.claude/agents`.

- Read-only research/navigation: `codebase-locator`, `codebase-analyzer`, `codebase-pattern-finder`, `thoughts-locator`, `thoughts-analyzer`, `web-search-researcher`
- Browser verification: `browser-tester`
- Write-capable implementation: `frontend-developer`

## Run modes

- Safe default:
  - `codex --profile sps-safe`
- No confirmation prompts (workspace sandbox):
  - `codex --profile sps-auto`
  - or `codex --ask-for-approval never --sandbox workspace-write`

Use full bypass mode only if you explicitly accept elevated risk.

## How to invoke skills

- In Codex App/IDE, type `/` and select the skill by name (for example, `core-next`).
- Explicit invocation also works via `$` mention (for example, `$core-next`).
- Pass the issue number in the same prompt (for example: `Run core-next for issue 142`).
