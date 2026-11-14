---
date: 2026-09-26T03:30:00+0300
researcher: flakecode
git_commit: 37c314a2bbf788e860eb77348e7072b749c64391
branch: claude/issue-348-count-rows-admin-role
repository: singlepagestartup
topic: "Attach the Admin role to count routes without an anonymous caller"
tags: [research, codebase, rbac, permission, roles-to-permissions, seed, count, admin-v2]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Attach the Admin role to count routes without an anonymous caller

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 37c314a2bb
**Branch**: claude/issue-348-count-rows-admin-role (stacked on `claude/issue-303-roleless-permissions`, #346)
**Repository**: singlepagestartup

## Research Question

The reviewed list of role-less permission rows from #346 keeps 47 `count` rows
in a group of reads with no anonymous caller. Which of them can take the Admin
role, which caller reads each of them, and what the seed change needs.

## Summary

- The pending group of `roleless-permissions/singlepage.ts` holds 51 rows: 47
  `count` routes and the four list and `[id]` reads of notification templates
  and `notifications-to-templates`.
- For 45 of the 47 count routes the list read of the same model has no
  role-less row, so it requires the Admin role through the root row `* *`;
  only the count answers other callers. The two exceptions are
  `notification/templates` and `notification/notifications-to-templates`,
  whose list reads sit in the same pending group.
- Four framework components call a `count` action: the admin-v2 card (server
  and client halves), the admin-v2 table (client) and the MCP
  `countContentRecords` operation. No public or customer component counts.
- The host renders the admin-v2 overview on the server (`isServer={true}`),
  and all 61 overview card wrappers pass that value to the model card, so each
  card reads its count through the server SDK, which sends no credential. That
  is the only caller of these counts that sends no token: 18 of the 47 rows
  have an overview card. The overview tables do not have this path: all 61
  table wrappers render the model table in the browser with `isServer={false}`.
- The same server path already fails for counts that require a role: the
  identity, role and subject cards (sensitive list) and, on #346, the order,
  invoice and payment-intent cards.
- Four of the 47 rows are also admitted by the unauthenticated allow-list of
  the is-authorized middleware before the permission service runs
  (`rbac/permissions/count`, `rbac/roles-to-permissions/count`,
  `broadcast/channels/count`, `broadcast/channels-to-messages/count`); a role
  on those rows takes effect once #308 anchors those rules.
- The shared development database holds the permission and role snapshot ids
  and every roles-to-permissions snapshot id except the 29 rows #346 added.

## Detailed Findings

### The pending group

`libs/modules/rbac/models/permission/backend/repository/database/src/lib/roleless-permissions/singlepage.ts:258-310`
lists:

| Kind                                        | Rows                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model counts with an overview card (18)     | `agent/agents`, `analytic/metrics`, `broadcast/channels`, `broadcast/messages`, `crm/requests`, `notification/notifications`, `notification/templates`, `notification/topics`, `rbac/actions`, `rbac/permissions`, `social/actions`, `social/attribute-keys`, `social/attributes`, `social/chats`, `social/messages`, `social/skills`, `social/threads`, `telegram/pages` |
| Relation counts, no card (29)               | `broadcast/channels-to-messages`, `crm/forms-to-requests`, three ecommerce order and store relations, `notification/notifications-to-templates`, `notification/topics-to-notifications`, eight `rbac` permission, role and subject relations, twelve `social` relations, two `telegram` relations                                                                         |
| Notification template reads (4, not counts) | `notification/templates` list and `[id]`, `notification/notifications-to-templates` list and `[id]`                                                                                                                                                                                                                                                                       |

Evidence for the list reads: the seed has no role-less `GET <route>` row for
any of the 47 models except the two notification tables; a request with no
matching row is decided by the root row alone
(`libs/modules/rbac/models/permission/backend/app/api/src/lib/service/singlepage/index.ts:197-245`).

### Count callers

- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/server.tsx:20-29`
  and `client.tsx:21`: the overview card counts its model.
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:135`:
  the table counts for pagination in the browser.
- `apps/mcp/lib/content-management/operations.ts:320-343`: `countContentRecords`
  sends the connector's headers (`auth.ts:4-10`), that is the forwarded
  subject token or the operator secret.
- No server SDK `count` call exists in backend services, Telegram or the host
  outside the card (search for `.count(` across `libs` and `apps`).
- Broadcast readers use `find`, not `count`
  (`libs/modules/broadcast/relations/channels-to-messages/frontend/component/src/lib/singlepage/subscription/client.tsx:12`).

### How the admin-v2 overview reaches its counts

- `apps/host/app/[[...url]]/page.tsx:56-58` renders `AdminV2` with
  `isServer={true}`; `apps/host/src/components/admin-v2/Component.tsx:178-201`
  passes it to every module overview.
- Module overviews pass it to the per-model card wrapper, for example
  `libs/modules/rbac/frontend/component/src/lib/admin-v2/overview/Component.tsx:25-32`.
- All 61 wrappers `libs/modules/*/frontend/component/src/lib/admin-v2/overview/*/admin-v2-card/Component.tsx`
  render `<ParentComponent variant="admin-v2-card" isServer={props.isServer} />`
  (two file shapes: 18 re-export `Component` from `index.tsx`, 43 wrap it).
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/index.tsx:24-35`
  picks the server half when `isServer` is true; `server.tsx:20-29` calls
  `props.api.count` with only `Cache-Control`.
- Model server SDKs pass `options` that carry `next.revalidate` only, for
  example `libs/modules/social/models/message/sdk/model/src/lib/index.ts:15-24`;
  `libs/shared/frontend/api/src/lib/actions/count/index.ts:37-54` adds no
  credential, and nothing in `apps/host` or `libs/shared/frontend` forwards the
  request's cookies.
- `libs/shared/utils/src/lib/response-pipe.ts` throws an `HTTPException` on the
  server for a non-OK answer, so the card falls to its `ErrorBoundary`.
- The table wrappers render a `"use client"` `ClientComponent.tsx` that passes
  `isServer={false}` to the model table
  (`libs/modules/rbac/frontend/component/src/lib/admin-v2/overview/identity/admin-v2-table/ClientComponent.tsx`);
  the browser query adds the admin's token through `saturateHeaders`
  (`libs/shared/frontend/client/api/src/lib/factory/queries/count/index.tsx:45`).
  Of the 61 table wrappers, 18 pass explicit props to the client file and 43
  spread them.
- A client boundary has to sit above the model variant: the model card index
  hands `clientApi`, `serverApi`, `Provider` and `Component` to the shared
  card, and those functions cannot cross from a server component to a client
  one.

### Allow-list interplay

`libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:14-38,68-75`
admits, before the permission service runs: `GET` under `/api/broadcast/channels`
(unanchored, so also `channels-to-messages`), `GET /api/rbac/roles-to-permissions`
(unanchored) and `GET /api/rbac/permissions/.*`. The rule does not match
`/api/rbac/permissions-to-billing-module-currencies`.

### Counts kept without a role

The content group keeps 87 count routes. Ten of them count tables whose list
read has no role-less row: the `widgets` counts of agent, analytic, billing,
notification, startup and telegram, `blog/categories-to-website-builder-module-widgets`,
`blog/widgets-to-categories`, `ecommerce/stores-to-products-to-attributes` and
`ecommerce/widgets-to-categories`. They count widget and catalog tables the
host renders on public pages.

### Seed production

- The procedure and its pitfalls are in
  `libs/modules/rbac/models/permission/README.md` ("Role-less permissions") and
  in the #303 process log: change rows through the API on a database that
  holds the snapshot ids, then `npx nx run api:db:dump`.
- The shared development database holds the permission (475) and role (14)
  snapshot id sets and 155 of the 184 roles-to-permissions snapshot ids; the
  29 it lacks are exactly the files #346 added. A dump of a copy of it
  therefore deletes those 29 files, which are restored from the branch.
- `migrate.sh seed` inserts new relation files on existing deployments at the
  next start (`libs/shared/backend/api/src/lib/repository/database/index.ts:421-586`).

### Test gates

- `is-authorized.spec.ts` (rbac unit lane) fails when a role-less seed row is
  missing from the list and names the `GET /api/ecommerce/orders` row when its
  Admin attachment is missing.
- Overview specs mock at the per-model folder or model component level:
  `libs/modules/{ecommerce,social,knowledge,website-builder}/frontend/component/src/lib/admin-v2/overview/Component.spec.tsx`.

## Code References

- `libs/modules/rbac/models/permission/backend/repository/database/src/lib/roleless-permissions/singlepage.ts:13-16,258-310` - content and pending groups
- `apps/host/app/[[...url]]/page.tsx:56-58` - admin-v2 rendered with `isServer={true}`
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/{index,server,client}.tsx` - card halves
- `libs/modules/*/frontend/component/src/lib/admin-v2/overview/*/admin-v2-{card,table}/` - 61 card and 61 table wrappers
- `libs/shared/frontend/api/src/lib/actions/count/index.ts:23-68` - count action
- `apps/mcp/lib/content-management/operations.ts:320-343` - MCP count
- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:14-38,68-75` - allow rules (owned by #308)

## Architecture Documentation

- The host renders public pages on the server without credentials; personal
  and admin data is read in the browser with the subject token. The admin-v2
  tables follow that rule through a client wrapper; the cards do not.
- Seed data is a dump of a development database; relation files reference
  snapshot ids, so a change is made on a database that holds them.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-303.md` - seed inventory, dump flow and the reviewed list this issue edits.
- `thoughts/shared/processes/singlepagestartup/ISSUE-303.md` - incidents of the dump flow (seeded databases get new ids; `bash migrate.sh` from the root).

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-303.md`

## Open Questions

None block the plan. For a decision outside this issue: the four notification
template reads stay role-less; they have no anonymous caller either.
