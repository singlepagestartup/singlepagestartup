---
issue_number: 348
issue_title: "Attach the Admin role to count routes without an anonymous caller"
start_date: 2026-09-26T00:50:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-348.md
status: complete
completed_date: 2026-09-26
---

# Implementation Progress: ISSUE-348 - Attach the Admin role to count routes without an anonymous caller

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-348.md`

## Phase Progress

### Phase 1: Overview cards count in the browser

- [x] Started: 2026-09-26T03:55+0300
- [x] Completed: 2026-09-26T04:05+0300
- [x] Automated verification: message card spec 1/1; with the server-rendered wrapper restored it fails. After narrowing: `tsc --noEmit` of the 10 changed modules 0 errors each, their unit lanes and lint pass.

**Notes**: 21 wrappers in 10 modules: the 18 models whose count this issue closes and the 3 whose count #346 closed. A first pass covered all 61 wrappers and was narrowed (incident 2). Each keeps its `index.tsx` and `interface.ts`; `Component.tsx` renders the new `ClientComponent.tsx` with explicit `isServer` and `variant`.

### Phase 2: Admin role on the 47 count rows

- [x] Started: 2026-09-26T04:05+0300
- [x] Completed: 2026-09-26T04:20+0300
- [x] Automated verification: 47 new files, each naming the snapshot Admin role and a distinct one of the 47 count permission ids; no other data file changed; the inventory counts 475 permissions, 246 role-less, 231 attachments, 0 orphans.

**Notes**: `sps-lite-issue-348` is a `pg_dump` copy of the development database. A dump of the untouched copy differed from the branch only by the 29 #346 relation files. 47 `POST /api/rbac/roles-to-permissions` calls with the operator secret answered 201; `npx nx run api:db:dump` wrote the 47 files and deleted the 29 #346 files, which were restored from the branch. Baseline before the change: anonymous counts on `social/messages`, `crm/requests`, `rbac/actions`, `notification/notifications`, `social/chats-to-messages`, `rbac/permissions`, `ecommerce/products` and `blog/articles` all answered 200.

### Phase 3: Reviewed list

- [x] Started: 2026-09-26T04:20+0300
- [x] Completed: 2026-09-26T04:30+0300
- [x] Automated verification: `is-authorized.spec.ts` 12/12 with the new social message count scenario. Mutation check: with the 47 new files moved out, the seed scenario names exactly the 47 count rows.

**Notes**: the list holds 246 entries, one per role-less seed row; the pending group keeps the four notification template reads; the content group comment records why its count routes stay without a role.

### Verification

- Unit lanes (`npx nx run-many --target=jest:test --skip-nx-cache`, `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`) for the 10 changed modules: all pass (`@sps/rbac` 84 suites and 392 tests, `@sps/social` 17 suites, `@sps/ecommerce` 16, `@sps/agent` 17, `@sps/notification` 6, `@sps/billing` 4, `@sps/analytic`, `@sps/broadcast`, `@sps/crm`, `@sps/telegram` 2 each). A first run over all 15 modules and `@sps/shared-frontend-components` also passed.
- Lint (`NODE_OPTIONS=--max-old-space-size=12288 npx nx run-many --target=eslint:lint`) for the 10 modules: pass, no warnings.
- Types (`npx tsc --noEmit -p libs/modules/<module>/tsconfig.json`) for the 10 modules: 0 errors.
- `node tools/agents/code-placement.mjs`: clean.
- HTTP on port 4303 against `sps-lite-issue-348` after the change: `GET /api/social/messages/count` answers 403 without a token and with a customer token, 200 with an admin token; `crm/requests`, `rbac/actions`, `notification/notifications`, `agent/agents`, `social/chats-to-messages` and `telegram/pages` counts answer 403 without a token; `crm/requests/count` answers 200 for the admin; `ecommerce/products`, `blog/articles`, `crm/forms`, `billing/currencies` and `website-builder/widgets` counts answer 200 without a token; `rbac/permissions/count` and `broadcast/channels/count` answer 200 through the allow rules #308 owns. Fixtures (two `init` subjects and one admin role link) were removed with the throwaway database.
- Browser check of the admin overview: not run; the host needs a real install.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 1 — Run interrupted by the account usage limit

- **Occurrences**: 1
- **Stage**: Verification
- **Symptom**: the session stopped after lint; the API on port 4303 was gone on resume.
- **Root Cause**: the account usage limit.
- **Fix**: resumed from this file; restarted the API against the throwaway copy.
- **Reusable Pattern**: update this file after each verification step.

### Incident 2 — Card change first covered every overview card

- **Occurrences**: 1
- **Stage**: Phase 1 - Overview cards count in the browser
- **Symptom**: all 61 wrappers moved to the browser, 40 of them for counts that stay public.
- **Root Cause**: uniformity with the table wrappers was preferred over the rows the issue closes.
- **Fix**: reverted 40 wrappers; reran types, lint and lanes.
- **Reusable Pattern**: scope an enabling change by the rows the issue closes.

## Summary

### Changes Made

- 47 `roles-to-permissions` seed rows attach the Admin role to the count routes of the pending group.
- The reviewed list drops those rows; its content and pending group comments record the reasoning.
- A seed-check scenario for `GET /api/social/messages/count`.
- 21 admin-v2 overview card wrappers render the model card in the browser; a spec for the message card.

### Commits

- `cb3d61ac94` fix(rbac): require the Admin role for count routes only the admin UI reads
- `1973eea0b7` docs: add research, plan and process log for #348

### Review addition

- The identity, role and subject overview cards take the same client wrapper, at the lead's request in the approving review; an identity card spec follows the message card spec. `npx nx run @sps/rbac:jest:test`: 85 suites, 393 tests; `@sps/rbac` lint and `tsc --noEmit`: pass; the spec fails against the server-rendered wrapper.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/351 (base `claude/issue-303-roleless-permissions`)
- [x] PR number: 351

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T05:10:00+0300
