---
date: 2026-05-03T22:55:03+03:00
researcher: flakecode
git_commit: 0e30ea072ddc631c2a4822b94967a0dfb6ba7ff0
branch: debug
repository: singlepagestartup
topic: "[log-watch] api_api /api/agent/agents/rbac-module-subjects-check MAX_PARAMETERS_EXCEEDED"
tags: [research, codebase, rbac, ecommerce, agent, database]
status: complete
last_updated: 2026-05-03
last_updated_by: flakecode
---

# Research: Issue #169 RBAC Subject Check Parameter Volume

**Date**: 2026-05-03T22:55:03+03:00
**Researcher**: flakecode
**Git Commit**: 0e30ea072ddc631c2a4822b94967a0dfb6ba7ff0
**Branch**: debug
**Repository**: singlepagestartup

## Research Question

What code path handles `POST /api/agent/agents/rbac-module-subjects-check`, how does it reach RBAC ecommerce order processing, and what does the restored production database show about the reported `MAX_PARAMETERS_EXCEEDED` condition?

## Summary

- The agent route is mounted as `POST /api/agent/agents/rbac-module-subjects-check` and delegates to the RBAC subject server SDK `check` call (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:124`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/check.ts:32`).
- The RBAC subject `POST /api/rbac/subjects/check` handler calls `this.service.ecommerceOrderProceed({})`; the subject-scoped variant `POST /api/rbac/subjects/:id/check` calls the same service with `subjectId` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/check.ts:20`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/findById/check.ts:26`).
- The current `ecommerceOrderProceed` implementation has a fixed `ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT = 100`, selects candidate orders by actionable statuses, orders them by `updatedAt asc`, and only then looks up subject-order relations for the selected order ids (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:52`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:170`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:209`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:232`).
- The restored local database is `doctorgpt-production`. It contains `66,398` rows in both `sps_ee_order` and `sps_rc_ss_to_ee_me_os_oq2`; this exceeds the production error's reported parameter ceiling of `65,534` if every relation order id is placed into one `inArray` query.
- In the same database, actionable orders are currently `239` total: `156 delivering`, `82 delivered`, and `1 canceling`. The current batch chooses `100` candidate orders and finds `100` subject-order relations for that batch.
- Live local API checks with the internal RBAC service header returned `200 OK` for both `/api/agent/agents/rbac-module-subjects-check` and `/api/rbac/subjects/check`. Without the internal/service authorization context, the agent route returned `403` from the global authorization middleware.

## Detailed Findings

### Agent Route

The API app applies global middlewares before mounting module apps, including request id, observer, action logger, authorization, billing, revalidation, and query parsing (`apps/api/app.ts:115`, `apps/api/app.ts:157`, `apps/api/app.ts:160`, `apps/api/app.ts:169`). The agent app is mounted under `/api/agent` (`apps/api/app.ts:172`).

The agent model controller binds `POST /rbac-module-subjects-check` to `rbacModuleSubjectCheck` (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:124`). That handler checks RBAC env, logs start/finish, and calls `rbacModuleSubjectApi.check` with `X-RBAC-SECRET-KEY` (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/check.ts:20`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/check.ts:32`).

The server SDK check action sends a `POST` request to `${host}${route}/check` after preparing form data (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/check.ts:29`, `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/check.ts:44`).

### RBAC Subject Check

The RBAC subject controller binds `POST /check` and `POST /:id/check` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:127`). The unscoped handler calls `ecommerceOrderProceed({})`; the scoped handler requires `id` from the route and calls `ecommerceOrderProceed({ subjectId: id })`.

RBAC subject documentation describes the subject layer as the orchestration layer for authenticated ecommerce cart/product flows and keeps dependency direction from RBAC to ecommerce (`libs/modules/rbac/models/subject/README.md:7`).

### Ecommerce Order Proceed

The service exports `ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT = 100` and actionable statuses `paid`, `delivering`, `delivered`, `canceling` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:52`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:54`).

For unscoped execution, it builds `candidateOrderFilters` with the status `inArray`, queries `ecommerceModule.order.find` with the fixed limit and `updatedAt asc`, dedupes the candidate orders, and returns early when none are found (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:170`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:209`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:226`).

For scoped execution, it first queries subject-order relations by `subjectId`, dedupes and slices relation order ids to the same batch limit, then adds those ids to candidate order filtering (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:178`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:194`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:202`).

After candidate order selection, relation lookup is constrained to the selected `orderIds`; subject-scoped runs also keep the `subjectId` filter (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:232`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:240`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:248`).

Each selected order is processed inside a per-order `try/catch`; errors are logged with order id, order status, and optional subject id (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:264`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:426`).

### Query Builder Behavior

Shared repository `find` passes `props.params.filters` to the shared query builder and applies returned filters with `methods.and(...filters)` (`libs/shared/backend/api/src/lib/repository/database/index.ts:41`, `libs/shared/backend/api/src/lib/repository/database/index.ts:77`).

The shared query builder converts `method: "inArray"` filter values into an array and delegates to Drizzle `queryFunctions[method](tableColumn, arrayFilter)` (`libs/shared/backend/api/src/lib/query-builder/filters.ts:130`, `libs/shared/backend/api/src/lib/query-builder/filters.ts:148`, `libs/shared/backend/api/src/lib/query-builder/filters.ts:163`). This means every array value becomes part of the database query parameter set.

### Restored Production Database

The local API env points at database name `doctorgpt-production`, and `psql` confirmed `current_database = doctorgpt-production`.

Production-like table cardinality:

- `sps_ee_order`: `66,398` rows.
- `sps_rc_ss_to_ee_me_os_oq2`: `66,398` subject-order relation rows.
- Distinct relation order ids: `66,398`.
- Distinct relation subject ids: `2,298`.

Order status distribution:

- `completed`: `63,608`
- `canceled`: `2,518`
- `delivering`: `156`
- `delivered`: `82`
- `requested_cancelation`: `31`
- `new`: `2`
- `canceling`: `1`

For the current code path:

- Actionable orders matching `paid`, `delivering`, `delivered`, `canceling`: `239`.
- Candidate orders selected by current batch: `100`.
- Relations for current candidate orders: `100`.
- Distinct subjects for current candidate orders: `100`.
- Max products per current candidate order: `1`.

The restored database therefore contains enough rows to explain the production parameter scale: an unbounded subject-order relation id handoff would carry `66,398` ids, while the current bounded path carries `100` selected order ids for the relation lookup.

### Local Runtime Checks

The local API process was already running on `localhost:4000`.

- `POST /api/agent/agents/rbac-module-subjects-check` without internal authorization returned `403 Forbidden` from `libs/middlewares/src/lib/is-authorized/index.ts`.
- `POST /api/agent/agents/rbac-module-subjects-check` with the local internal RBAC service header returned `200 OK` and `{"data":{"ok":true}}`.
- `POST /api/rbac/subjects/check` with the local internal RBAC service header returned `200 OK` and `{"data":{"ok":true}}`.
- Rechecking order status counts after those calls showed the same status distribution as before the calls.

### Test Coverage Found

`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.spec.ts` is a BDD unit contract for the bounded query behavior. It verifies:

- Unscoped execution selects actionable orders with the fixed batch limit and `updatedAt` ordering (`proceed.spec.ts:120`).
- Relation lookup happens after candidate order selection and receives only the selected order ids (`proceed.spec.ts:161`).
- Duplicate/excessive candidate order ids are deduped and capped to `ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT` (`proceed.spec.ts:202`).
- Scoped execution starts with a subject filter and keeps subject id on the bounded relation lookup (`proceed.spec.ts:246`, `proceed.spec.ts:280`).

Verification command used:

```bash
npx nx run @sps/rbac:jest:test --testFile=libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.spec.ts
```

Result: `1` suite passed, `6` tests passed.

## Code References

- `apps/api/app.ts:160` - global authorization middleware runs before module route mounts.
- `apps/api/app.ts:172` - agent app mounts under `/api/agent`.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:124` - agent route binding for `/rbac-module-subjects-check`.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/check.ts:32` - agent handler calls RBAC subject check SDK with service header.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/check.ts:20` - unscoped RBAC subject check calls ecommerce order proceed.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/findById/check.ts:26` - scoped RBAC subject check calls ecommerce order proceed with `subjectId`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:52` - fixed batch limit.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:209` - current candidate order query.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:248` - relation query constrained by selected order ids.
- `libs/shared/backend/api/src/lib/query-builder/filters.ts:130` - shared `inArray` query builder branch.

## Architecture Documentation

The RBAC module owns subjects, identities, roles, permissions, and relations (`libs/modules/rbac/README.md`). The RBAC subject model README states that RBAC subject orchestrates ecommerce cart/product flows and that dependency direction is `rbac > ecommerce` (`libs/modules/rbac/models/subject/README.md:9`).

The relevant relation schemas are:

- `sps_rc_ss_to_ee_me_os_oq2`: links RBAC subjects to ecommerce orders with `st_id` and `ee_me_or_id`.
- `sps_rc_ss_to_rs_3nw`: links RBAC subjects to roles with `st_id` and `re_id`.
- `sps_rc_rs_to_ee_me_ps_cv3`: links RBAC roles to ecommerce products with `re_id` and `ee_me_pt_id`.
- `sps_ee_order`: ecommerce order records with `status`, `type`, `receipt`, and `comment`.

## Historical Context

`thoughts/shared/research/singlepagestartup/ISSUE-152.md` documents prior DB-backed scenario testing around ecommerce cart/order lifecycle. It identifies the same DB verification area: orders, orders-to-products, and subjects-to-ecommerce-module-orders.

The issue ticket for #169 preserves the production log-watch report, including fingerprint `LW-e5b6f57f5a15`, route `/api/agent/agents/rbac-module-subjects-check`, related route `/api/rbac/subjects/check`, status `500`, and production error `MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded`.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-152.md` - DB-backed ecommerce cart/order scenario testing context.

## Open Questions

- No open research questions remain for the current code path and restored database state.
