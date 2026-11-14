---
issue_number: 313
issue_title: "Bound list reads, request bodies, timeouts and WebSocket connections"
start_date: 2026-09-25T22:10:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-313.md
status: complete
completed_date: 2026-09-26
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

### Review round 1 (pull request #334)

- [x] Started: 2026-09-26T08:30:00Z
- [x] Completed: 2026-09-26T09:40:00Z
- [x] Automated verification: PASSED

**Notes**:

- `git merge --no-ff origin/claude/issue-304-upload-delivery` → no conflict; merge commit `a4e26f8b00`.
- Trial of the requested placement (file-storage upload limit importing `@sps/middlewares`, reverted afterwards): `nx graph` puts eleven projects on a cycle, and `npx nx run @sps/file-storage:tsc:build` stops with "Could not execute command because the task graph has a circular dependency". With the middleware in `@sps/shared-backend-api`, `nx graph` shows no project on a cycle and `@sps/file-storage:tsc:build` succeeds with its 15 dependency tasks.
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run <project>:jest:test --skip-nx-cache`:
  - `@sps/shared-backend-api` → 7 suites passed, 1 skipped; 80 tests passed, 1 skipped (7 new middleware scenarios, 3 new filter scenarios);
  - `@sps/middlewares` → 10 suites, 64 tests passed;
  - `@sps/file-storage` → 4 suites, 22 tests passed, the #331 middleware and controller specs unchanged;
  - `api` → 2 suites, 4 tests passed; `@sps/backend-utils` → 6 suites, 133 tests passed; `@sps/shared-utils` → 12 suites, 74 tests passed.
- `NODE_OPTIONS=--max-old-space-size=12288` `eslint:lint` on `@sps/shared-backend-api`, `@sps/file-storage`, `@sps/shared-utils`, `@sps/backend-utils` and `api` → 0 errors; the 4 warnings are the untouched `controllers/rest/index.ts:139,153` and the two unused directives in the `apps/api` jest configs. `tsc:build` of `@sps/shared-backend-api`, `@sps/file-storage` and `@sps/shared-utils` → success. `tsc --noEmit -p apps/api/tsconfig.json` → the same 25 errors as before, none in a changed file.
- Mutation checks, each restored with `cmp`:
  - middleware with `maxSize: Number.POSITIVE_INFINITY` → 4 of the 7 middleware scenarios fail;
  - middleware ignoring `API_MAX_REQUEST_BODY_BYTES` → 3 fail;
  - filter column check back to truthiness → the 3 new filter scenarios fail;
  - registration removed from `apps/api/app.ts` on the running API → a 2 MiB body without a declared length reaches the handler (400 from its validation) instead of 413.
- HTTP on port 4313 with `API_MAX_REQUEST_BODY_BYTES=1048576` and `FILE_STORAGE_MAX_UPLOAD_BYTES=524288` (bug-report variables blank):
  - `POST /api/host/widgets` with the operator key, 2 MiB body without a declared length → 413 `Payload Too Large`; 256 KiB body without a declared length → 400 from the handler's own validation; 2 MiB with `Content-Length` → 413 with an empty body from Bun;
  - `POST /api/file-storage/files`, 768 KiB upload without a declared length → 413; with `Content-Length` → 413 `Payload Too Large error. The upload limit is 524288 bytes`; 256 KiB upload without a declared length → 201, stored `size` 262144, fixture deleted (`DELETE` → 200), no file left under `apps/api/public`;
  - `GET /api/host/pages` with a filter on `constructor`, `enableRLS` and `constructor->>en` → 400 `Validation error. Unknown column '<name>'`; on `variant` → 200;
  - the server log holds 5 responses with status 400 and 4 with 413, none 5xx; the server is stopped.
- Commits: `7fe5d1f1d1` (shared middleware, registration, file-storage wrapper), `2958e194a4` (filter columns), `b3107f8b4e` (#331 notes name `API_MAX_REQUEST_BODY_BYTES`); every message passes `node tools/upstream/migrations.mjs message` before and after committing.
- `gh pr edit 334 --base claude/issue-304-upload-delivery` → the pull request lists only this branch's files against #331; the description is rewritten and saved to `thoughts/shared/prs/334_description.md`.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 1 — The requested middleware path makes the project graph circular

- **Occurrences**: 1
- **Stage**: Review round 1
- **Symptom**: `npx nx run @sps/file-storage:tsc:build` stops with "Could not execute command because the task graph has a circular dependency" once the file-storage module imports `@sps/middlewares`.
- **Root Cause**: `@sps/middlewares` depends on `@sps/rbac` and `@sps/agent`, which depend on `@sps/file-storage`.
- **Fix**: the shared middleware lives in `@sps/shared-backend-api`, which depends on no module.
- **Reusable Pattern**: check `npx nx graph --file=<json>` for a path from the imported package back to the importing module before adding the import.

### Incident 2 — zsh modifiers in a loop over Nx targets

- **Occurrences**: 1
- **Stage**: Review round 1
- **Symptom**: "Cannot find project 'slint'" from `npx nx run $p:eslint:lint`.
- **Root Cause**: zsh reads `:e` and `:t` after a parameter as modifiers.
- **Fix**: `"${p}:eslint:lint"`.
- **Reusable Pattern**: brace a parameter that a colon follows in zsh.

## Summary

### Changes Made

- `0d53ec4a1d` fix(repository): accept only asc and desc sorts on columns of the table. `libs/shared/backend/api/src/lib/repository/database/index.ts` (allow-list, identifier pattern, `prepareOrderBy`), its spec (14 scenarios) and four 400 cases in `libs/shared/backend/utils/src/lib/http-error/index.spec.ts`.
- `1c7dd010fb` fix(api): take the request body limit from API_MAX_REQUEST_BODY_BYTES. `libs/shared/utils/src/lib/envs/api.ts`, `apps/api/server.ts`, `apps/api/README.md`, `tools/deployer/api.sh`, `tools/deployer/api/api.env.j2`, `tools/deployer/.env.example`.
- Both commit messages pass `node tools/upstream/migrations.mjs message` before and after committing.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/334
- [x] PR number: 334

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T09:40:00Z
