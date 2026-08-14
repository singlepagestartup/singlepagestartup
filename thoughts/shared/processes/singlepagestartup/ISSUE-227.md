---
issue_number: 227
issue_title: "Coerce JSON date values in generic MCP content mutations"
repository: singlepagestartup
created_at: 2026-08-04T19:24:08Z
last_updated: 2026-08-04T19:26:23Z
status: active
current_phase: create
---

# Process Log: ISSUE-227 - Coerce JSON date values in generic MCP content mutations

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: Run `core/10-research` for issue #227 after confirming its Project status is `Research Needed`.

## Phase Notes

### Create

- Summary: Confirmed the MCP JSON-date validation mismatch in the current `sps-lite` checkout, created GitHub issue #227, added it to organization Project 2, and transitioned it from `Triage` to `Research Needed`.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-227.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-227.md`, and https://github.com/singlepagestartup/singlepagestartup/issues/227.
- Notes: Issue type `bug`, priority `medium`, and size `small` were inferred from the reproduced, bounded adapter defect. Related foundation work is issue #187. The shared helper completed issue creation, Project assignment, and both status transitions without incident.

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

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 0 -->

## Reusable Learnings

- Generic MCP write adapters must normalize JSON transport representations before validating against runtime schemas that require non-JSON JavaScript types such as `Date`.
