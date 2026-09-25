---
issue_number: 313
issue_title: "Bound list reads, request bodies, timeouts and WebSocket connections"
start_date: 2026-09-25T22:10:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-313.md
status: in_progress
---

# Implementation Progress: ISSUE-313 - Bound list reads, request bodies, timeouts and WebSocket connections

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-313.md`

## Phase Progress

### Phase 1: Sort validation in the shared repository

- [x] Started: 2026-09-25T22:12:00Z
- [x] Completed: 2026-09-25T23:05:00Z
- [x] Automated verification: PASSED (unit lanes, lint, `tsc:build`, mutation checks)

**Notes**:

- Baseline before the change: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-backend-api:jest:test --skip-nx-cache` → 6 suites passed, 1 skipped (`order-by.spec.ts`), 56 tests passed, 1 skipped.
- After the change, same command → 6 suites passed, 1 skipped, 70 tests passed, 1 skipped. The 14 new `find` scenarios in `repository/database/index.spec.ts` all pass (`npx jest --config libs/shared/backend/api/jest.config.ts --verbose libs/shared/backend/api/src/lib/repository/database/index.spec.ts` → 27 passed).
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/backend-utils:jest:test --skip-nx-cache` → 6 suites, 130 tests passed (4 new 400 cases).
- Mutation checks, each restored from a byte copy (`cmp` clean afterwards):
  - allow-list removed from `parseOrderByMethod` → 5 failed (`sql`, `count`, `constructor`, `ASC`, and the every-item scenario);
  - column check reduced to truthiness → 2 failed (`constructor`, `enableRLS` columns);
  - only the first item validated → 1 failed (the every-item scenario).
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false NODE_OPTIONS=--max-old-space-size=12288 npx nx run @sps/shared-backend-api:eslint:lint --skip-nx-cache` → 0 errors, 2 warnings, both in the untouched `controllers/rest/index.ts:139,153`.
- Same environment, `npx nx run @sps/backend-utils:eslint:lint --skip-nx-cache` → no problems.
- Same environment, `npx nx run @sps/shared-backend-api:tsc:build --skip-nx-cache` → success, with the 4 dependency tasks.
- HTTP on port 4313 (API started from this worktree with `API_SERVICE_PORT=4313 API_SERVICE_URL=http://localhost:4313 NEXT_PUBLIC_API_SERVICE_URL=http://localhost:4313` and the three `BUG_SERVICE_*` variables blank, `npm run api:dev`):
  - `GET /api/host/pages?orderBy[and][0][column]=createdAt&orderBy[and][0][method]=asc&limit=50` → 200, 25 rows, 25 distinct `createdAt` values in ascending order; the same with `desc` → 200 in descending order; the two responses are exact reverses;
  - two valid items → 200; no sort → 200;
  - `method=sql`, `count`, `constructor`, `ASC` → 400 `Validation error. Unknown orderBy method '<method>'`;
  - `column=constructor`, `enableRLS`, `missing` → 400 `Validation error. Unknown column '<column>'`; `column=createdAt desc` → 400 `Validation error. OrderBy column must be an identifier`;
  - `orderBy[and]=createdAt` → 400 `Validation error. 'orderBy.and' must be an array`; a valid first item with `method=sql` on the second → 400;
  - `GET /api/host/pages/count` with `method=sql` → 200, since `count` ignores the sort;
  - the server log holds 21 exceptions, all status 400, none 5xx.

### Phase 2: Configurable request body limit

- [x] Started: 2026-09-25T22:30:00Z
- [x] Completed: 2026-09-25T23:20:00Z
- [x] Automated verification: PASSED (unit lanes, lint, `tsc:build`, template render, HTTP proof)

**Notes**:

- `bash -n tools/deployer/api.sh` → exit 0.
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false NODE_OPTIONS=--max-old-space-size=12288 npx nx run @sps/shared-utils:eslint:lint --skip-nx-cache` → no problems; `@sps/shared-utils:tsc:build` → success; `@sps/shared-utils:jest:test` → 12 suites, 74 tests passed.
- Same environment, `npx nx run api:jest:test --skip-nx-cache` → 2 suites, 4 tests passed; `npx nx run api:eslint:lint --skip-nx-cache` → 0 errors, 2 warnings, both unused `eslint-disable` directives in the untouched `apps/api/jest.integration.config.ts` and `jest.scenario.config.ts`.
- `npx tsc --noEmit -p apps/api/tsconfig.json` → exit 2 with 25 errors, none in a changed file. They sit in billing, open-router, z-ai, file-storage and rbac files this branch does not touch, and are Bun typing mismatches (`fetch().json()` typed `unknown`, two `File` shapes).
- `node tools/agents/code-placement.mjs` → no same-name file and folder pairs.
- `npx prettier --check` on every changed TypeScript and Markdown file → clean.
- `api.env.j2` rendered with the local `ansible-playbook` (template task in a scratch playbook, placeholder values for the unconditional variables): with `API_MAX_REQUEST_BODY_BYTES=67108864` the rendered file carries `API_MAX_REQUEST_BODY_BYTES=67108864`; with the variable empty, the line is absent.
- HTTP on port 4313, default configuration: a POST of 135266304 bytes (129 MiB) with `Content-Length` to `/api/file-storage/files` → 413 with an empty body; a 5 MiB multipart upload with the operator key → 201, stored `size` 5242880; fixture deleted (`DELETE` → 200, then `GET` → 404), no file left under `apps/api/public`.
- HTTP on port 4313 with `API_MAX_REQUEST_BODY_BYTES=1048576`: a 2 MiB multipart upload → 413 with an empty body and no exception in the app log; a 512 KiB upload → 201, stored `size` 524288; fixture deleted (`DELETE` → 200), no file left under `apps/api/public`.
- The server was stopped after each run; nothing listens on 4313.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 0 -->

## Summary

### Changes Made

- `0d53ec4a1d` fix(repository): accept only asc and desc sorts on columns of the table. `libs/shared/backend/api/src/lib/repository/database/index.ts` (allow-list, identifier pattern, `prepareOrderBy`), its spec (14 scenarios) and four 400 cases in `libs/shared/backend/utils/src/lib/http-error/index.spec.ts`.
- `1c7dd010fb` fix(api): take the request body limit from API_MAX_REQUEST_BODY_BYTES. `libs/shared/utils/src/lib/envs/api.ts`, `apps/api/server.ts`, `apps/api/README.md`, `tools/deployer/api.sh`, `tools/deployer/api/api.env.j2`, `tools/deployer/.env.example`.
- Both commit messages pass `node tools/upstream/migrations.mjs message` before and after committing.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-25T23:30:00Z
