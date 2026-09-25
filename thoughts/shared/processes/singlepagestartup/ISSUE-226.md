---
issue_number: 226
issue_title: "Remove legacy pre-development files after downstream project migration"
repository: singlepagestartup
created_at: 2026-08-04T12:34:35Z
last_updated: 2026-09-17T23:14:37Z
status: active
current_phase: research
---

# Process Log: ISSUE-226 - Remove legacy pre-development files after downstream project migration

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: not_started
- Implement: not_started
- Current phase: research
- Next step: human review, then core/20-plan

## Phase Notes

### Create

- Summary: Created issue #226 for deferred legacy cleanup and moved it through Triage to Research Needed; deletion is explicitly gated on downstream-project migration.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-226.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-226.md`, https://github.com/singlepagestartup/singlepagestartup/issues/226.
- Notes: Type `refactoring`, priority `low`, size `small`; Project #2 status verified as Research Needed.

### Research

- Summary: Both deferred files were already deleted on 2026-09-11 in commit `160ba86315` (PR #235), together with their workspace index entries and the two `.agents/roles/SOURCES.md` path references. No stale reference remains outside the #226 ticket file. `npm run singlepagestartup:agents:validate` was removed in `838f6e6dc1` (2026-08-14) with its validator before PR #225 merged, never existed on `main`, and has no replacement; `npm run studio:validate` exists. No downstream-project inventory or migration confirmation is recorded in the repository, and the deletion commit predates the downstream-migration trailer contract.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-226.md`.
- Notes: Research ran in a worktree at `29370bcbf8` without GitHub status or comment changes; the issue has no comments, so the ticket file was left unchanged. The main checkout branch `codex/studio-portable-document-exports` is ahead of that commit (see Incident 2).

### Plan

- Summary:
- Outputs:
- Notes:

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — Project item was not immediately visible to the status helper

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: The create helper created issue #226 and added it to Project #2, but its immediate Triage update could not find the new Project item.
- **Root Cause**: GitHub Project item visibility lagged behind the successful add operation.
- **Fix**: Retried the canonical status helper after the create command returned; Triage and Research Needed updates then succeeded and status verification returned Research Needed.
- **Preventive Action**: When issue creation and Project add succeed but immediate lookup fails, retry the canonical status helper instead of recreating the issue.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/update_issue_status.sh`, `.claude/helpers/get_issue_status.sh`.

### Incident 2 — Issue targets and a referenced contract were absent at the worktree commit

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: The two files named by the issue did not exist at `29370bcbf8`, and `.agents/contracts/editorial-pass.md`, referenced by the task instructions and by the main checkout's `CLAUDE.md`, did not exist in the worktree either.
- **Root Cause**: The files had been deleted 38 days after the issue was opened (`160ba86315`, PR #235) without a comment on #226. The editorial-pass contract was added in `818f097d22` on `codex/studio-portable-document-exports`, which is ahead of the worktree commit; `CLAUDE.md` at `HEAD` does not mention it.
- **Fix**: Traced the deletion with `git log --all --diff-filter=D -- <paths>` and `git grep <token> <commit>^` versus `<commit>`; read the contract with `git show 818f097d22:.agents/contracts/editorial-pass.md` without leaving the worktree.
- **Preventive Action**: Before researching a cleanup issue, run `git log --all --diff-filter=D -- <paths>` for every path the issue names. When a referenced contract is missing, check `git log --all -S'<name>'` and read it from the newer commit instead of assuming it was never written.
- **References**: `160ba86315`, `3e876a2159`, `818f097d22`, `thoughts/shared/research/singlepagestartup/ISSUE-226.md`.

## Reusable Learnings

- Migration evidence may remain temporarily, but its deletion needs an explicit downstream-adoption gate rather than an arbitrary date.
- A newly added GitHub Project item may need one bounded status-helper retry before it becomes queryable.
- A gated cleanup can be absorbed by an unrelated refactor; a research phase for such an issue starts with `git log --diff-filter=D` on the named paths rather than assuming they still exist.
- The framework repository has no registry of downstream projects or their adaptation state; the downstream-migration contract stores completion in each child's local Git metadata, so "all maintained downstream projects migrated" is an operator statement, not a repository query.
