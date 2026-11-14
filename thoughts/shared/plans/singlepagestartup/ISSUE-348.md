---
date: 2026-09-26T03:45:00+0300
issue_number: 348
repository: singlepagestartup
topic: "Attach the Admin role to count routes without an anonymous caller"
status: approved
---

# Attach the Admin role to count routes without an anonymous caller Implementation Plan

## Overview

Give the Admin role to the 47 `count` rows the reviewed list keeps as
"pending review", after moving the admin-v2 overview cards that read those
counts, their only caller without a token, into the browser where the admin's
token is sent.

## Current State Analysis

- The pending group of `roleless-permissions/singlepage.ts` holds 47 count
  rows and four notification template reads. For 45 of the counts the list
  read of the same model already requires the Admin role.
- The only framework callers of `count` are the admin-v2 card and table and
  MCP. The host renders the admin-v2 overview on the server, and all 61 card
  wrappers pass `isServer={true}` to the model card, whose server half counts
  through the server SDK without a credential. The 61 table wrappers already
  render the model table in the browser.
- Cards whose count requires a role already fail on the server: identity, role
  and subject, and on #346 order, invoice and payment intent.
- The shared development database lacks only the 29 relation rows #346 added.

## Desired End State

- The 47 count rows carry the Admin role in the seed; the pending group keeps
  only the four notification template reads; the group comments state why the
  remaining counts carry no role.
- The admin-v2 overview cards of the models whose count this stack closes
  count in the browser with the admin's token, so the overview still shows
  those counts to admins.
- The rbac unit lane stays green and fails when one of the closed rows loses
  its role; an anonymous count on a closed model answers 403, an admin one
  200, and the catalog and blog counts stay public.

### Key Discoveries:

- `apps/host/app/[[...url]]/page.tsx:56-58` renders the admin-v2 tree with `isServer={true}`.
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/server.tsx:20-29` counts without a credential.
- `libs/modules/rbac/frontend/component/src/lib/admin-v2/overview/identity/admin-v2-table/ClientComponent.tsx` is the client wrapper pattern the cards follow.
- `libs/modules/rbac/models/permission/README.md` documents the dump procedure; the #303 process log records its pitfalls.

## What We're NOT Doing

- Not changing the four notification template reads; they stay pending and
  are reported.
- Not changing the content group rows, including the ten widget and catalog
  counts whose list read has no role-less row.
- Not touching `libs/middlewares/src/lib/is-authorized/**`: the Admin role on
  `rbac/permissions/count`, `rbac/roles-to-permissions/count`,
  `broadcast/channels/count` and `broadcast/channels-to-messages/count` takes
  effect when #308 anchors the allow rules that admit them.
- Not editing the order-line group, which #349 changes.
- Not forwarding credentials from host server components; the cards follow the
  table pattern instead.
- Not moving the cards whose count stays public, and not the identity, role
  and subject cards, whose counts the sensitive-route list closed before this
  stack; they fail the same way and are reported.

## Implementation Approach

The cards move to the client boundary pattern the tables use, so no new
mechanism appears; the seed follows the dump flow on a copy of the development
database; the list keeps its groups and only the pending group and the content
comment change.

## Phase 1: Overview cards count in the browser

### Changes Required:

#### 1. Card wrappers

**Files**: `libs/modules/*/frontend/component/src/lib/admin-v2/overview/*/admin-v2-card/{Component.tsx,ClientComponent.tsx}` for 21 wrappers in 10 modules: the 18 models whose count this issue closes (agent agents, analytic metrics, broadcast channels and messages, crm requests, notification notifications, templates and topics, rbac actions and permissions, social actions, attribute keys, attributes, chats, messages, skills and threads, telegram pages) and the 3 whose count #346 closed (ecommerce orders, billing invoices and payment intents)
**Why**: the server-rendered card counts without a token, so a card whose count requires a role fails.
**Changes**: a `"use client"` `ClientComponent.tsx` renders the model card with `isServer={false}`; `Component.tsx` renders it with explicit `isServer` and `variant` props, as the table wrappers do.

#### 2. Spec

**File**: `libs/modules/social/frontend/component/src/lib/admin-v2/overview/message/admin-v2-card/index.spec.tsx`
**Changes**: rendered with `isServer={true}` as the host does, the message card counts through the client SDK and never through the server SDK.

### Success Criteria:

#### Automated Verification:

- [x] Unit lanes of the 10 changed modules pass
- [x] The card spec fails against the server-rendered wrapper
- [x] Lint and `tsc --noEmit` of the changed modules pass

#### Manual Verification:

- [ ] Browser: an admin sees counts on the admin-v2 overview cards of a closed model (not run: the host needs a real install; the wrappers follow the table pattern already in use)

---

## Phase 2: Admin role on the 47 count rows

### Changes Required:

**Files**: 47 new files in `libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/data/`
**Changes**: on `sps-lite-issue-348`, a `pg_dump` copy of the development database, with the API on port 4303, create one `roles-to-permissions` row per count through `POST /api/rbac/roles-to-permissions` with the operator secret; run `npx nx run api:db:dump`; restore the 29 #346 relation files the dump deletes, drop unrelated drift, keep the 47 new files.

### Success Criteria:

#### Automated Verification:

- [x] Each new file names the snapshot Admin role and one of the 47 permission ids; no other data file changes

---

## Phase 3: Reviewed list

### Changes Required:

**Files**: `roleless-permissions/singlepage.ts`, `is-authorized.spec.ts`
**Changes**: remove the 47 rows from the pending group and rewrite its comment for the notification template reads; add the count reasoning to the content group comment; a scenario that the check names `GET /api/social/messages/count` when its Admin attachment is missing.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/rbac:jest:test` passes; dropping the new attachments fails the seed scenario

---

## Testing Strategy

### Unit Tests:

- Message overview card: client count, no server count.
- Seed check: unchanged scenarios pass; missing Admin attachment on the social messages count is named.

### Integration Tests:

- HTTP on port 4303 against the throwaway copy: anonymous `GET /api/social/messages/count` answers 200 before and 403 after, an admin 200; `crm/requests`, `rbac/actions`, `notification/notifications` and a relation count answer 403 anonymously; `ecommerce/products/count` and `blog/articles/count` answer 200.

### Manual Testing Steps:

1. Browser, if the host can run on a real install: admin session on `/admin/social` shows the message count.

## Performance Considerations

Cards fetch their counts after hydration, like the tables beside them; the
server no longer issues one count per card for every `/admin` request.

## Migration Notes

- Existing deployments receive the 47 attachments from `migrate.sh seed`.
- Projects with their own overview card wrappers for these models follow the new wrapper shape.

## References

- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-348.md` (local)
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-348.md`
- Base: #346 (`claude/issue-303-roleless-permissions`)
