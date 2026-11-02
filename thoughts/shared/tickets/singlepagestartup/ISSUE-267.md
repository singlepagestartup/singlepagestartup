---
repository: singlepagestartup
issue_number: 267
status: Research Needed
created: 2026-09-19
---

# Issue: Namespace PR description artifacts by repository

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/267
**Status**: Research Needed
**Created**: 2026-09-19
**Priority**: medium
**Size**: small

---

## Problem to Solve

`thoughts/shared/prs/` is flat. Every other artifact category under
`thoughts/shared/` is namespaced by repository — `handoffs/`, `plans/`,
`processes/`, `research/`, `retrospectives/` and `tickets/` all carry a
`singlepagestartup/` segment — but PR descriptions are written straight into
`prs/{number}_description.md`.

PR numbers are per-repository, so a downstream project that also reaches PR
#259 writes the same path with different content. The framework and every
project built on it then collide on that file whenever changes are synchronized
between them, and the collision is silent: both sides hold a plausible
`259_description.md`.

The rule this violates is already written in the workflow that breaks it.
`.agents/workflows/engineering/utilities/describe_pr.md:89` states "Resolve
`REPO_NAME` through `.claude/helpers/get_repo_name.sh`; never hard-code a
repository namespace", and line 87 of the same file applies `REPO_NAME` to the
handoff path. Only the `prs/` paths omit it.

## Key Details

- Root cause: `.agents/workflows/engineering/utilities/describe_pr.md` lines 26,
  76 and 81 write `thoughts/shared/prs/{number}_description.md` with no
  `REPO_NAME` segment.
- 27 files sit flat in `thoughts/shared/prs/`, from `168_description.md` to
  `259_description.md`.
- 3 legacy files sit flat in `thoughts/shared/plans/`:
  `self-contained-blocks-refactor.md`,
  `separation-of-concerns-decomposition.md`,
  `services-blog-storybook-migration.md`.
- 17 lines across 11 files under `thoughts/` reference the flat `prs/` paths and
  would dangle after a move.
- `.agents/workflows/engineering/create_worktree.md:19` carries a flat plans
  example (`thoughts/shared/plans/fix-mcp-keepalive-proper.md`) that teaches the
  same mistake.
- The Claude adapter `.claude/commands/utilities/describe_pr.md` delegates to the
  canonical file and needs no change.

## Implementation Notes

- `thoughts/shared/pr_description.md` is the PR description **template**, read by
  step 1 of the same workflow. It is project-invariant and correctly stays
  outside the namespace. Do not move it.
- Move existing artifacts with `git mv` so history follows the files.
- Decide explicitly whether the 17 existing cross-references are rewritten to the
  new paths or left as historical record; dangling links in durable process
  documents are themselves a cost.
- Worth considering as part of the fix: a check that fails when a file appears
  directly under `thoughts/shared/<category>/` instead of
  `thoughts/shared/<category>/<repo>/`, so the convention stops depending on each
  workflow author remembering it.
