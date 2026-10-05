---
issue_number: 352
issue_title: "Per-order subject routes: check the order belongs to the subject"
start_date: 2026-09-26T03:28:57Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-352.md
status: complete
completed_date: 2026-09-26
---

# Implementation Progress: ISSUE-352 - Per-order subject routes: check the order belongs to the subject

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-352.md`

## Phase Progress

### Phase 1: Order link middleware

- [x] Started: 2026-09-26T03:29Z
- [x] Completed: 2026-09-26T03:30:05Z
- [x] Automated verification: middleware spec 5/5. Mutation check: without the refusal, the three refusal scenarios fail (3 of 5); source restored.

**Notes**: `request-subject-owns-ecommerce-module-order/index.ts` mirrors `request-subject-owns-social-module-chat` (typed `IService`, constructor, `init()`, required params, `getHttpErrorType`) and reads `subjectsToEcommerceModuleOrders.find` with both columns and `limit: 1`, as `assertRequestingProfileAccess` does; a missing row answers 401 "Authorization error. Requested ecommerce-module order does not belong to subject". Exported from `middlewares/src/index.ts` as `RequestSubjectOwnsEcommerceModuleOrder`.

### Phase 2: Route table

- [x] Started: 2026-09-26T03:33Z
- [x] Completed: 2026-09-26T03:36:16Z
- [x] Automated verification: route-table spec `controller/singlepage/index.order-ownership.spec.ts` 19/19 (four routes × foreign order, another subject's token, own token, operator secret; three cart routes untouched by the link check). Mutation checks: without the link check on the quantity, total or PATCH route, that route's foreign-order scenario fails; without it on PATCH and DELETE, both fail; without `RequestSubjectIdOwner` on the four routes, the four "another subject's token" scenarios fail. Sources restored after each check.

**Notes**: the spec replaces the handlers with stubs installed on the controller prototype before construction, so it pins the route guards only. Route middlewares are registered per path whatever the method (`app/default/index.ts:72-82`); PATCH and DELETE share a path, so a DELETE request runs PATCH's pair as well, and removing the check from DELETE alone does not fail its scenario, as on the chat thread routes. The cart quantity, total and checkout routes, whose last segment also fits `:orderId`, are registered earlier and answer before the new guard.

### Phase 3: Subject README

- [x] Started: 2026-09-26T03:36:16Z
- [x] Completed: 2026-09-26T03:36:16Z
- [x] Automated verification: `npx prettier --check libs/modules/rbac/models/subject/README.md` passed.

**Notes**: one bullet in "Authorization Layering" after the chat thread example; the "Social Thread Permission Routes" section, where PR #350 adds its section, is untouched.

### Verification

- Unit lane (`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:jest:test --skip-nx-cache`): 84 suites / 404 tests passed.
- Lint (`NODE_OPTIONS=--max-old-space-size=12288 npx nx run @sps/rbac:eslint:lint --skip-nx-cache`): passed, no warnings (run again after the spec typing fix).
- Types (`npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`): 0 errors after incident 1.
- Placement (`node tools/agents/code-placement.mjs`): no same-name file and folder pairs.
- HTTP before and after the change: API from this worktree on port 4352 against `sps-lite-issue-352`, a `pg_dump` copy of the development database (351 tables, restore without errors), with the host URLs on a closed port and the Telegram, bug-report and SES credentials blanked. Each run creates two anonymous `init` subjects: A with two cart orders of `pro`, B with one.

  | Request                                                       | Before                   | After                   |
  | ------------------------------------------------------------- | ------------------------ | ----------------------- |
  | PATCH, A's token, A's order                                   | 200                      | 200                     |
  | PATCH, no credential                                          | 400                      | 400                     |
  | PATCH, B's token, A's path                                    | 403                      | 401                     |
  | PATCH, B's token, B's path, A's order                         | 200                      | 401, A's line unchanged |
  | PATCH, operator secret, A's order                             | 400 (handler: no token)  | 400 (handler: no token) |
  | PATCH, operator secret, A's path, B's order                   | 400                      | 401                     |
  | GET `…/:orderId/quantity` and `…/total`, A's token, A's order | 400 (handler: no body)   | 400 (handler: no body)  |
  | the same, no credential                                       | 400                      | 400                     |
  | the same, B's token, A's path                                 | 400                      | 401                     |
  | the same, B's token, B's path, A's order                      | 400                      | 401                     |
  | the same, operator secret, A's order                          | 400                      | 400 (handler: no body)  |
  | the same, operator secret, A's path, B's order                | 400                      | 401                     |
  | DELETE, no credential                                         | 401                      | 400                     |
  | DELETE, B's token, A's path                                   | 403                      | 401                     |
  | DELETE, B's token, B's path, A's order                        | 200                      | 401, A's order kept     |
  | DELETE, operator secret, A's order                            | 401 (handler: no token)  | 401 (handler: no token) |
  | DELETE, operator secret, A's path, B's order                  | 401                      | 401                     |
  | DELETE, A's token, A's order                                  | 404 (order already gone) | 200                     |

  Cart flow after the change: A adds two orders (200, 200); the cart quantity read answers 2 and the total 2 Stars and 2000 RUB; after A sets one line to 3 they answer 4 and 4000; after A removes the other order the cart holds 1 order and the reads answer 3 and 3000. Every error logged by the API during the run is one of the expected refusals.

- Cleanup: API stopped, `sps-lite-issue-352` dropped, scratch files holding tokens removed. The development database was only read by `pg_dump`.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — A spec passed under Jest but failed the type check

- **Occurrences**: 1
- **Stage**: Phase 2 - Route table
- **Symptom**: `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json` reported TS2345 in the route-table spec: the handler stub took `(c)` while the spied handlers take `(c, next)`.
- **Root Cause**: `jest.server-preset.js` runs ts-jest with `diagnostics: false`, so Jest does not type-check specs.
- **Fix**: the stub takes `(...args: Parameters<Controller[IHandlerName]>)` and reads the context from `args`; tsc then reported 0 errors and the spec still passed.
- **Reusable Pattern**: run `tsc --noEmit` on the project after adding a spec; a green Jest run says nothing about its types.

## Summary

### Changes Made

- `RequestSubjectOwnsEcommerceModuleOrder` in the subject middleware package, exported beside its siblings.
- `RequestSubjectIdOwner` and `RequestSubjectOwnsEcommerceModuleOrder` on the per-order quantity, total, update and delete routes.
- Specs: the middleware spec and the route-table spec `index.order-ownership.spec.ts`.
- Subject README: one bullet in "Authorization Layering".

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/353
- [x] PR number: 353
- Commit: `72a22c9365` (`fix(rbac): check the order belongs to the subject on per-order routes`); description saved as `thoughts/shared/prs/353_description.md`.

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done (after review and merge)

---

**Last updated**: 2026-09-26T03:39:10Z
