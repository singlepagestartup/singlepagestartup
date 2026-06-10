---
issue_number: 195
issue_title: "Smooth realtime data updates without full component rerenders"
repository: singlepagestartup
created_at: 2026-06-10T11:23:52Z
last_updated: 2026-06-10T12:12:06Z
status: active
current_phase: research
---

# Process Log: ISSUE-195 - Smooth realtime data updates without full component rerenders

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: not_started
- Implement: not_started
- Current phase: research
- Next step: Human review of research, then `core-20-plan` (advance to Ready for Plan).

## Phase Notes

### Create

- Summary: Creating a new SPS workflow issue from user-provided realtime update implementation notes.
- Outputs:
  - Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-195.md`
  - Process artifact: `thoughts/shared/processes/singlepagestartup/ISSUE-195.md`
  - GitHub issue: https://github.com/singlepagestartup/singlepagestartup/issues/195
- Notes:
  - User explicitly requested `core-00-create`.
  - Priority inferred as `high`, size as `large`, type as `feature/refactoring` from the implementation scope and cross-cutting frontend impact.
  - GitHub issue was created through `.claude/helpers/create_issue_with_project.sh` and transitioned from `Triage` to `Research Needed`.

### Research

- Summary: Documented the current realtime pipeline (revalidation middleware → WS broadcast → `globalActionsStore` → factory `subscription()` → `invalidateQueries` with a 1000 ms `setTimeout`), the generic `factory()` query/mutation layer, the social chat message list (Layers 1–3 targets), and the ecommerce cart/order universality check. Verified all crux files firsthand.
- Outputs:
  - Research: `thoughts/shared/research/singlepagestartup/ISSUE-195.md`
- Notes:
  - Key finding: chat queries bypass the generic `factory()` (hand-written SDK, one-element URL `queryKey`s, manual `meta.topics`), so the find query key is thread-scoped while update/delete mutation keys are chat-scoped — prefixes do not align (confirms Layer 3 needs explicit key patching).
  - Key finding: `setQueriesData`/`setQueryData` = 0 usages and `React.memo` = 0 in the chat dir — Layers 0 and 2 introduce brand-new patterns; everything currently relies on `invalidateQueries`.
  - Nuance for planning: chat message **update** SDK returns an array (`ISocialModuleMessage[]`) while create/delete return a single entity; chat mutation files already have an internal `onSuccess` with `...reactQueryOptions` spread last.
  - Used 3 parallel sub-agents (SDK query construction, ecommerce cart flows, thoughts/ history); cross-checked their claims against direct reads.
  - Review update: Browser verification on `localhost:3000` confirmed the host shell and mounted `revalidation` component, but did not expose chat UI; `localhost:4000` was not accepting API requests, so end-to-end WS/mutation behavior could not be verified live.
  - Review correction: Research now records that React Query query-key prefix matching is array-element based; `[factoryProps.route]` matches list keys like `[route, params]`, but not `[route/id, params]` or `[route/count, params]`.

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

### Incident 1 — Sandboxed GitHub network retry

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: Initial helper run reported `error connecting to api.github.com` and returned an empty issue URL.
- **Root Cause**: GitHub network access was blocked in the sandboxed command environment.
- **Fix**: Re-ran the same `create_issue_with_project.sh` command with network escalation, preserving the helper-driven workflow.
- **Preventive Action**: For future core workflow GitHub operations, if `gh` reports `api.github.com` connectivity errors, retry the exact helper block with `require_escalated` instead of rewriting the GitHub sequence.
- **References**: `.claude/helpers/create_issue_with_project.sh`; `core-00-create` workflow.

## Reusable Learnings

- For realtime data issues, treat React Query cache patching as the first candidate before adding a second server-data store.
