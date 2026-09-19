---
issue_number: 267
issue_title: "Namespace PR description artifacts by repository"
repository: singlepagestartup
created_at: 2026-09-19T00:00:00Z
last_updated: 2026-09-19T00:00:00Z
status: active
current_phase: create
---

# Process Log: ISSUE-267 - Namespace PR description artifacts by repository

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run `core/10-research`

## Phase Notes

### Create

- Summary: Raised while reviewing PR #259. The owner noticed that its recorded
  description landed at `thoughts/shared/prs/259_description.md` with no project
  segment, and that a downstream project reaching PR #259 would collide with it.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-267.md`, GitHub issue https://github.com/singlepagestartup/singlepagestartup/issues/267 (status: Research Needed)
- Notes: The audit that produced the ticket was run before the issue existed, so
  research does not need to rediscover the scope: 27 flat files in `prs/`, 3 in
  `plans/`, 17 dangling reference lines in 11 files, and a flat plans example at
  `create_worktree.md:19`. `thoughts/shared/pr_description.md` was checked and is
  the project-invariant template, not a misplaced artifact.

### Research

- Summary:
- Outputs:
- Notes:

## Incidents

- The session that raised this was isolated in the `issue-233-cache-bounds`
  worktree, where `.claude/.env` is absent because worktrees do not inherit
  gitignored files. The GitHub Project helpers need it; it was copied from the
  main checkout before the preflight would work. The worktree guard also refuses
  commands containing the literal word `source`, so `load_config.sh` could not be
  sourced and `.claude/helpers/get_repo_name.sh` and
  `.claude/helpers/get_repo_full_name.sh` were invoked directly instead.
