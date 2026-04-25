---
issue_number: 163
issue_title: "Create standalone Waku app to validate apps/host frontend startup behavior"
repository: singlepagestartup
created_at: 2026-04-24T23:50:06Z
last_updated: 2026-04-25T03:38:31+0300
status: active
current_phase: plan
---

# Process Log: ISSUE-163 - Create standalone Waku app to validate apps/host frontend startup behavior

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: not_started
- Current phase: plan
- Next step: human review, then core/30-implement

## Phase Notes

### Create

- Summary: Created GitHub issue `#163` for a standalone Waku parity spike, added it to the project, and advanced the status to `Research Needed` after documenting the required behavioral parity with `apps/host` and the constraints inherited from issue `#162`.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-163.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/163`
- Notes: The issue scope stays explicitly separate from an in-place `apps/host` migration. It uses issue `#162`, its process/retro artifacts, and the prior architecture research as required context for evaluating whether Waku can support SPS frontend startup and rendering paths.

### Research

- Summary: Completed a fresh codebase/documentation pass for the `apps/host` parity contract that issue `#163` assigns to the standalone Waku spike. The resulting research captures the active catch-all routing flow, language-prefix middleware, `/admin` branch, metadata/not-found behavior, the host page lookup-by-URL chain, and the page -> layout/widget -> `widgets-to-external-widgets` render stack, with issue `#162` artifacts included as historical context for the high-risk external-widget path.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-163.md`
- Notes: The ticket's referenced `deep-research-report.md` was not present anywhere in the workspace, and there were no pre-existing issue-162 or issue-163 research artifacts under `thoughts/shared/research/`.

### Plan

- Summary: Created the implementation plan for a standalone `apps/waku-host` parity spike, attached it to GitHub issue `#163`, and anchored the work around four phases: workspace/app scaffold, route and shell parity, host render-chain parity, and final verification plus viability documentation.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-163.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/163#issuecomment-4317236862`
- Notes: The plan keeps `apps/host` intact, treats `apps/waku-host` as the new evaluation surface, and makes the existing `widgets-to-external-widgets` path the main runtime viability gate because that was the highest-risk surface in issue `#162`.

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 4 -->

### Incident 1 — GitHub helper sequence required escalated network access

- **Phase**: Create
- **Occurrences**: 2
- **Symptom**: The initial `bash -lc` GitHub workflow block failed with `error connecting to api.github.com` while trying to create the issue through `gh`, and the same connectivity failure recurred during the research-phase status/helper reads for issue `#163`.
- **Root Cause**: GitHub API access was blocked by the sandboxed network context for the `gh` helper sequence.
- **Fix**: Re-ran the same `bash -lc` GitHub helper blocks with escalated network permissions, then completed both the create-phase issue/project updates and the research-phase status transitions successfully.
- **Preventive Action**: For future `core-*` GitHub helper flows in this environment, rerun the unchanged `bash -lc` block with escalation as soon as `gh` reports connectivity failures to `api.github.com`.
- **References**: `.claude/commands/core/00-create.md`, `.codex/skills/core-00-create/SKILL.md`, `.claude/commands/core/10-research.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-163.md`

### Incident 2 — `codebase-analyzer` sub-agents stalled during research synthesis

- **Phase**: Research
- **Occurrences**: 2
- **Symptom**: Two separate `codebase-analyzer` sub-agents did not return within repeated wait windows, including one interrupted retry with a narrower scope.
- **Root Cause**: The analyzer role stalled while processing the requested host-runtime summary, even after the task was narrowed and re-issued.
- **Fix**: Closed the stalled analyzer sessions, then completed the synthesis from direct local file reads plus the successful `codebase-locator`, `codebase-pattern-finder`, `thoughts-locator`, and `thoughts-analyzer` outputs.
- **Preventive Action**: When research synthesis depends on a `codebase-analyzer` pass in this environment, keep the scope narrow from the start and fall back quickly to local reads plus locator/pattern findings if the analyzer misses repeated timeout windows.
- **References**: `.codex/agents/codebase-analyzer.toml`, `thoughts/shared/research/singlepagestartup/ISSUE-163.md`

### Incident 3 — Planning GitHub helper steps required escalated network access

- **Phase**: Plan
- **Occurrences**: 3
- **Symptom**: The first attempt to move issue `#163` into `Plan in Progress` failed with repeated `error connecting to api.github.com`, and the later comment-sync and plan-attachment GitHub steps also required networked helper access outside the sandbox.
- **Root Cause**: GitHub API access for the planning helper sequence was still blocked by the sandboxed network context.
- **Fix**: Re-ran the status update with escalated network permissions, then used the same escalated helper path for issue comment sync and posting the final plan comment.
- **Preventive Action**: During future planning sessions in this environment, escalate GitHub helper reads/writes immediately after the first `api.github.com` connectivity failure instead of retrying the sandboxed path.
- **References**: `.claude/commands/core/20-plan.md`, `.claude/helpers/update_issue_status.sh`, `.claude/helpers/gh_issue_comment.sh`

### Incident 4 — `codebase-analyzer` never returned after the interrupted planning turn

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: After the earlier interrupted turn, the restarted `codebase-analyzer` planning sub-task never produced a result despite repeated extended waits, while the other planning sub-agents completed successfully.
- **Root Cause**: The analyzer session stalled or was lost across the interrupted planning turn, leaving the planning pass without its dedicated synthesis output.
- **Fix**: Completed the plan from direct local reads plus the successful `codebase-locator`, `codebase-pattern-finder`, and `thoughts-locator` outputs, then folded the necessary line-level references into the final plan manually.
- **Preventive Action**: For future planning passes in this repo, treat direct file reads as the primary source of truth and stop waiting on `codebase-analyzer` after one extended timeout window when other context gatherers have already returned.
- **References**: `.codex/agents/codebase-analyzer.toml`, `thoughts/shared/plans/singlepagestartup/ISSUE-163.md`

## Reusable Learnings

- When a framework migration is blocked by unresolved runtime regressions, open a separate parity spike issue instead of broadening the original migration ticket until it mixes evaluation work with in-place upgrade work.
