---
issue_number: 297
issue_title: "Measure whether public reads can be authorized through permissions alone"
repository: singlepagestartup
created_at: 2026-09-22T00:00:00Z
last_updated: 2026-09-22T00:00:00Z
status: active
current_phase: create
---

# Process Log: ISSUE-297 - Measure whether public reads can be authorized through permissions alone

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run `core/10-research`, starting with the measurement

## Phase Notes

### Create

- Summary: Raised as review comments on PR #286 — three comments asking why
  the public module reads are allow-list rules rather than permission checks.
  The mechanism was read before the issue was written, rather than the issue
  being filed on the strength of the question alone.
- Outputs:
  - `thoughts/shared/tickets/singlepagestartup/ISSUE-297.md`
  - GitHub issue #297 (https://github.com/singlepagestartup/singlepagestartup/issues/297)
- Notes: Framed as a measurement with a conditional outcome, at the user's
  direction. Consolidation happens only if the performance difference turns out
  to be small; otherwise the duplication is documented as deliberate. Both
  endings close the issue.

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

<!-- incident-count: 1 -->

### Incident 1 — An issue was nearly filed before the mechanism was understood

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: The first answer to the review comment agreed that permissions
  would need "an anonymous role with a set of permissions, or an explicit
  decision that public reads stay a list". That framing was guesswork.
- **Root Cause**: The reply was written from the shape of the question, without
  reading the authorization service. No anonymous role is required: a
  permission with no roles attached already authorizes everyone, and 33 such
  records already exist for exactly these routes.
- **Fix**: The user asked for the mechanism to be studied before the issue was
  created. Reading it changed the issue from "migrate to permissions" to
  "measure whether migrating is affordable", which is a different and smaller
  question.
- **Preventive Action**: When a reviewer asks why a mechanism was chosen, read
  the alternative before answering. An answer that sounds reasonable and is
  unverified becomes the premise of the issue that follows it.
- **References**:
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:186-190`

## Reusable Learnings

- A permission row with no roles attached is public. That is the codebase's
  existing way to express anonymous access, and it needs no anonymous role.
- The allow-list short-circuits before RBAC runs, so permission records for an
  allow-listed route exist but never execute. Their presence is not evidence
  that they are in use.
- `authenticationIsAuthorized` is an HTTP call the API makes to itself, not an
  in-process call. Any comparison against a regular-expression match has to
  count that round trip.
