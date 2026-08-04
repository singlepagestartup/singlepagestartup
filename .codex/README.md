# Codex Workflow

This directory is the Codex adapter for the provider-neutral SPS development workflow. The universal entry point for any agent is the root `AGENTS.md`; this directory only maps that workflow onto Codex skills and subagents.

## Scope

- Same GitHub-Project-gated engineering lifecycle as every provider:
  - `core-00-create`
  - `core-10-research`
  - `core-20-plan`
  - `core-30-implement`
  - `core-next` dispatcher
- Local pre-development through `singlepagestartup`

## Contracts

- GitHub status backend remains in `.claude/helpers/*.sh`.
- Canonical process docs live in `.agents/workflows/**/*.md`.
- Shared contracts and roles live in `.agents/contracts/**` and `.agents/roles/**`.
- Codex skills are wrappers that execute the same logic and produce the same artifacts at the same paths.

**Fallback rule**: when a canonical engineering workflow has no Codex skill,
read its `.agents/workflows/engineering/**` file fully and execute it in the
current thread using the tool mapping in `AGENTS.md`.

## Skills

- Core: `core-next`, `core-00-create`, `core-10-research`, `core-20-plan`, `core-30-implement`
- Utility: `github`, `github-status`, `validate-plan`, `create-handoff`, `resume-handoff`, `implement-plan`, `commit`, `describe-pr`, `post-commit-retro`
- Pre-development: `singlepagestartup`
- Legacy aliases: `ralph-research`, `ralph-plan`, `ralph-impl`, `oneshot`, `oneshot-plan` (hyphenated names only; they delegate to `core-*` semantics)

## Subagents

Codex subagents are defined in `.codex/agents/*.toml`; these files contain native
discovery metadata and explicit pointers to the canonical responsibility in
`.agents/roles/*.md`. Pre-development role files also contain the professional
method, so their adapters load one canonical file rather than a second playbook.

- Read-only research/navigation: `codebase-locator`, `codebase-analyzer`, `codebase-pattern-finder`, `thoughts-locator`, `thoughts-analyzer`, `web-search-researcher`
- Browser verification: `browser-tester`
- Write-capable implementation: `frontend-developer`
- Pre-development: `account-manager`, `business-analyst`,
  `market-researcher`, `strategist`, `communication-strategist`,
  `brand-designer`, `web-designer`

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
