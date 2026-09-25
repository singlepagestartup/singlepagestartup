---
issue_number: 308
issue_title: "Anchor the remaining authorization allow rules and restrict CORS origins"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-26T03:25:00Z
status: active
current_phase: complete
---

# Process Log: ISSUE-308 - Anchor the remaining authorization allow rules and restrict CORS origins

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review of pull request #341, then merge; rebase on #328 if it lands first

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings SEC-27, SEC-05, SEC-19. The issue is under embargo: neutral public title, detail only in the local ticket.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-308.md` (local only).
- Notes: none.

### Research

- Summary: every ticket claim holds at `78d7d43125`, and the unfixed HTTP behavior is recorded from an API on port 4308. The authentication prefix holds 14 routes with one method each; the only credential-less channel reader is the observer's channel lookup; the RBAC graph is read by the admin UI with a token, by in-process services, by one operator-secret call and by server-rendered `count` requests. The CORS echo carries local, tunnel and cross-domain front ends, and `MCP_SERVICE_ALLOWED_ORIGINS` is the deployer precedent for an optional origin list.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-308.md`.
- Notes: sub-agents covered the authentication callers, the broadcast callers, the RBAC graph callers and prior documents; the ticket, the process file and the review were copied into the worktree from the main checkout.

### Plan

- Summary: four phases: anchor the allow-list and extend its spec; delete the dead origin write; add `API_CORS_ALLOWED_ORIGINS` with a shared `resolveCorsOrigin` helper used by the API, Telegram and OpenAPI apps; document the value and wire it through the deployer like `MCP_SERVICE_ALLOWED_ORIGINS`. The channel list stays open for the observer; the RBAC graph reads leave the list.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-308.md` (status approved; approval delegated to the issue agent).
- Notes: `X-RBAC-SECRET-KEY` stays in the allowed CORS headers because the browser client still sends it (#305).

### Implement

- Summary: all four phases landed as planned. Every framework allow rule is anchored at both ends; the channel messages, channel by id, channel links and RBAC graph reads now go through the permission service; the dead origin write is gone; `API_CORS_ALLOWED_ORIGINS` and `resolveCorsOrigin` limit the echoed origins when set, in the API, Telegram and OpenAPI apps; the value is documented and wired through the deployer. Unit lanes, lint and type-check match or improve on the baseline, each guard fails its spec when reverted, and HTTP probes on port 4308 show the before and after.
- Outputs: commits `9db93cb1e0` (allow-list) and `41f13af908` (CORS origins), `thoughts/shared/handoffs/singlepagestartup/ISSUE-308-progress.md` (evidence per phase), pull request #341 with its description in `thoughts/shared/prs/341_description.md`.
- Notes: the throwaway channel, message and anonymous subjects were deleted and the API stopped. The Telegram and OpenAPI apps were checked in process rather than on a port, so the Telegram bot configured in the local environment never registered a webhook.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — A sub-agent misread a client boundary as a server fetch

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: the RBAC caller report stated that `/admin/rbac/*` renders the permission table on the server and requests `GET /api/rbac/permissions` without credentials, which would have made that route impossible to take off the allow-list.
- **Root Cause**: the report followed `isServer={true}` from `apps/host/app/[[...url]]/page.tsx` into the rbac overview and stopped there; the overview's `admin-v2-table` wrapper is a `"use client"` component that renders the model table with `isServer={false}`.
- **Fix**: read the wrapper (`libs/modules/rbac/frontend/component/src/lib/admin-v2/overview/permission/admin-v2-table/ClientComponent.tsx`) and the shared table's `isServer` switch (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/index.tsx:32-33`); the table fetches in the browser with the admin's token.
- **Preventive Action**: when a sub-agent claims a server-side fetch, open the last wrapper before the shared component and check its `isServer` prop and `"use client"` pragma.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-308.md`, section "Permission graph reads".

### Incident 2 — zsh read `$p:eslint:lint` as a history modifier

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: a baseline lint loop over `npx nx run $p:eslint:lint` failed with `Cannot find project 'slint'` for every project.
- **Root Cause**: zsh applies `:e` (extension) as a modifier to `$p`.
- **Fix**: `npx nx run "${p}:eslint:lint"`.
- **Preventive Action**: brace every parameter that a colon follows in zsh commands.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-308-progress.md`, Incident 1.

## Reusable Learnings

- An allow rule is only as narrow as its anchors: `RouteMatcher` runs `RegExp.test` on the lowercased path, so every rule needs `^` and `$`, and a spec case per sibling path it must not admit.
- In zsh, `$var:e...` is a modifier; write `"${var}:target"` in Nx loops.
