---
issue_number: 234
issue_title: "Bound anonymous Subject growth with safe retention and session initialization"
start_date: 2026-09-18T23:29:09Z
completed_date: 2026-09-18T23:46:24Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-234.md
status: complete
---

# Implementation Progress: ISSUE-234 - Bound anonymous Subject growth with safe retention and session initialization

**Started**: 2026-09-19
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-234.md`

## Phase Progress

### Phase 1: Retention and activity settings

- [x] Started: 2026-09-18T23:31Z
- [x] Completed: 2026-09-18T23:32Z
- [x] Automated verification: `npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/agent,@sps/shared-utils` PASSED

**Notes**: Three settings appended to `libs/shared/utils/src/lib/envs/rbac.ts` after the existing lifetime block; the exports already there were not reordered.

### Phase 2: Session initialization reuses an existing Subject

- [x] Started: 2026-09-18T23:32Z
- [x] Completed: 2026-09-18T23:36Z
- [x] Automated verification: `npx nx run @sps/rbac:jest:test` PASSED; `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json` PASSED

**Notes**: The reuse decision is `service/singlepage/init.ts`; the throttled touch is `service/singlepage/record-activity.ts`; `refresh.ts` takes the recorder through props. The controller now resolves the token with the shared `authorization` helper and keeps only verification, cookie and response. Status stays `201` and the response shape is unchanged.

### Phase 3: One retention implementation

- [x] Started: 2026-09-18T23:36Z
- [x] Completed: 2026-09-18T23:40Z
- [x] Automated verification: `npx nx run @sps/rbac:jest:test`, `npx nx run @sps/agent:jest:test` PASSED; `npx tsc --noEmit` for both projects PASSED

**Notes**: `deleteAnonymousSubjects` is the only implementation. New route `POST /rbac/subjects/delete-anonymous`, server SDK action `deleteAnonymous`, OpenAPI path and aggregate reference. The agent handler is one SDK call and returns the counts.

### Phase 4: Daily schedule in the repository snapshot

- [x] Started: 2026-09-18T23:37Z
- [x] Completed: 2026-09-18T23:39Z
- [x] Automated verification: `git status` shows exactly one added file under the agent data directory

**Notes**: The row was created through `POST http://localhost:4000/api/agent/agents` with the secret header and the same field shape as the three existing rows, then produced by `npx nx run api:db:dump`. The dump also rewrote permission, role, roles-to-permissions and file-storage snapshots from local-only rows; all 29 tracked changes were restored with `git checkout --` and all 32 unrelated new files were removed.

### Phase 5: Tests and documentation

- [x] Started: 2026-09-18T23:40Z
- [x] Completed: 2026-09-18T23:46Z
- [x] Automated verification: `npx nx run @sps/rbac:jest:test` (72 suites, 319 tests) PASSED; `npx nx run @sps/agent:jest:test` (17 suites, 88 tests) PASSED; lint PASSED

**Notes**: Four new specs, 17 new cases. The settings, the reuse rule and the blocker list are documented in the RBAC subject README; the seeded agents are listed in the agent README.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 1 — `api:db:dump` rewrites every module snapshot

- **Occurrences**: 1
- **Stage**: Phase 4 - Daily schedule in the repository snapshot
- **Symptom**: After `npx nx run api:db:dump`, `git status` showed 29 tracked snapshot changes and 32 new files across rbac permissions, roles, roles-to-permissions and file-storage, next to the one agent row that was wanted.
- **Root Cause**: There is no per-model dump target for the agent model. `api:db:dump` runs `app.dump()` for every module, and the repository dump deletes and rewrites each data directory from the local database, which holds rows that are not in the repository.
- **Fix**: Restored every tracked change under `*/backend/repository/database/src/lib/data/` with `git checkout --` and deleted every untracked file there except the new agent row.
- **Reusable Pattern**: When only one entity's snapshot is wanted, run the dump, then restore and clean by path prefix instead of writing the JSON by hand. Verify with `git status` before committing.

### Incident 2 — Prettier formatting fails lint after generated edits

- **Occurrences**: 1
- **Stage**: Phase 5 - Tests and documentation
- **Symptom**: `eslint:lint` for `@sps/rbac` reported three `prettier/prettier` errors in files written or edited by script.
- **Root Cause**: Hand-written import and literal formatting did not match the repository Prettier configuration.
- **Fix**: `npx prettier --write` on the three files, then lint again.
- **Reusable Pattern**: Run Prettier on every file written by a script before the lint target.

## Summary

### Changes Made

Framework layer only; no `startup` file, no schema change, no new dependency.

- `libs/shared/utils/src/lib/envs/rbac.ts`: `RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS` (3600), `RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS` (2592000), `RBAC_ANONYMOUS_SUBJECT_CLEANUP_BATCH_SIZE` (500).
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/init.ts` (new): reuse-or-create decision, token verification guarded so an unusable token never reaches a log.
- `.../service/singlepage/record-activity.ts` (new): touches `updatedAt` through the repository update path at most once per activity interval; a failed touch is logged, not thrown.
- `.../service/singlepage/refresh.ts`: records activity for the subject it already read.
- `.../service/singlepage/delete-anonymous-subjects.ts`: one bounded batch by last activity, `variant = default`, blockers resolved with `inArray` over the batch, in-process delete with the database cascade, counted result.
- `.../service/singlepage/index.ts`: `init`, `recordActivity`, `anonymousSubjectRetentionBlockers` (the `startup` seam), the billing-currency relation service injected.
- `.../controller/singlepage/authentication/init.ts`: thin; resolves the token, calls the service, keeps cookie and `201`.
- `.../controller/singlepage/delete-anonymous.ts` (new) and its route in `.../controller/singlepage/index.ts`.
- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/delete-anonymous.ts` (new) and its registration.
- `libs/modules/rbac/models/subject/sdk/model/src/lib/paths.yaml`, `apps/openapi/openapi.yaml`: the new route.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/delete-anonymous.ts`: one SDK call, counts in the response, no in-memory filter and no per-row HTTP delete.
- `libs/modules/agent/models/agent/backend/repository/database/src/lib/data/d31f7b35-00c9-42c0-973d-3ca447a13394.json` (new, tool-produced): the `rbac-module-subjects-delete-anonymous` agent, interval `0 0 * * *`.
- Specs: `init.spec.ts`, `record-activity.spec.ts`, `delete-anonymous-subjects.spec.ts`, agent `delete-anonymous.spec.ts`.
- Documentation: `libs/modules/rbac/models/subject/README.md`, `libs/modules/agent/models/agent/README.md`.

### Decisions

- Retention blockers: identity, ecommerce order, social profile, role, billing currency balance. `subjects-to-billing-module-payment-intents` is excluded: no framework service writes that relation, it has no DI binding in the subject module, and the framework path that creates a payment intent also creates the order link. A project that writes it directly adds a blocker from its `startup` service.
- Only `variant = default` subjects are candidates, which keeps agent, hidden and project-defined actors out of the query entirely.
- Deletion runs in process through the repository cascade rather than one HTTP `DELETE` per row: it removes the per-row cache-version bump and websocket broadcast that made the old handler a contributor to #233.
- `init` keeps `GET` and `201`, and still creates through the server SDK, so no client contract and no mutation semantics change.
- The retention default is 30 days, decoupled from `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS`.

### Pull Request

- [ ] PR created: not in scope for this session (no push, no PR)
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-18T23:46:24Z
