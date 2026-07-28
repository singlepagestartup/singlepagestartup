---
issue_number: 216
issue_title: "Remove temporary natural-key repair after SPS rollout"
repository: singlepagestartup
created_at: 2026-07-21T19:49:55Z
last_updated: 2026-07-21T21:08:07Z
status: active
current_phase: create
---

# Process Log: ISSUE-216 - Remove temporary natural-key repair after SPS rollout

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run `core-10-research 216` after the compatibility release has been deployed to every maintained downstream project

## Phase Notes

### Create

- Summary: Created follow-up issue #216 for removing temporary deployment-time natural-key repair code after the downstream rollout is complete.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-216.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-216.md`, and https://github.com/singlepagestartup/singlepagestartup/issues/216.
- Notes: The issue was added to SPS Project #2 and moved through Triage to Research Needed. Removal is explicitly gated on every maintained downstream project upgrading and completing the compatibility migrations.
- Notes: Clarified that the temporary apply command remains mandatory on every API deployment/restart until rollout completion. The removal gate now requires per-project/environment deployment evidence, a zero-count repair check, index verification, log review, and rapid `/start` database-cardinality smoke testing.

### Research

- Summary:
- Outputs:
- Notes:

### Plan

- Summary:
- Outputs:
- Notes:

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

<!-- incident-count: 1 -->

### Incident 1 — GitHub helper required network escalation

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: Repository-context preflight could not connect to `api.github.com` in the restricted command environment.
- **Root Cause**: Ordinary workspace commands do not have external network access.
- **Fix**: Re-ran the unchanged shared create/status helper workflow with approved network escalation.
- **Preventive Action**: Preserve the helper-driven workflow and escalate network access on the documented GitHub connectivity failure instead of replacing it with raw partial commands.
- **References**: `.codex/skills/core-00-create/SKILL.md`, `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/get_issue_status.sh`

## Reusable Learnings

- Migration compatibility code must have a recorded removal gate so one-time repair logic does not remain in steady-state application maintenance indefinitely.
