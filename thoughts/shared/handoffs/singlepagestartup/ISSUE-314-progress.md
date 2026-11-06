---
issue_number: 314
issue_title: "Review error response contents and error telemetry"
start_date: 2026-09-25T22:10:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-314.md
status: complete
completed_date: 2026-09-26
---

# Implementation Progress: ISSUE-314 - Review error response contents and error telemetry

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-314.md`

## Phase Progress

### Phase 1: Environment values

- [x] Started: 2026-09-25T22:12:00Z
- [x] Completed: 2026-09-25T22:14:00Z
- [x] Automated verification: PASSED

**Notes**: `API_ERROR_DETAILS` in `libs/shared/utils/src/lib/envs/api.ts`, `BUG_SERVICE_REPORT_WINDOW_IN_SECONDS` in `envs/host.ts` beside the other `BUG_SERVICE_*` values. No `NODE_ENV` constant is exported, so a parallel branch that adds one cannot collide through `export *`.

- `npx tsc --noEmit -p libs/shared/utils/tsconfig.json`: exit 0 (baseline exit 0).
- `npx nx run @sps/shared-utils:jest:test --skip-nx-cache`: 12 suites, 74 tests passed.
- `npx nx run @sps/shared-utils:eslint:lint --skip-nx-cache`: exit 0, no findings.

### Phase 2: Exception filter

- [x] Started: 2026-09-25T22:14:00Z
- [x] Completed: 2026-09-25T22:20:00Z
- [x] Automated verification: PASSED

**Notes**: `exposesDetails(c)` gates `stack` and `cause`; `reportFailure(...)` holds the gate, the window check and the unawaited send; the request id falls back to `randomUUID()`. The parse and log steps are unchanged.

- `npx tsc --noEmit -p libs/shared/backend/api/tsconfig.json`: exit 0 (baseline exit 0).

### Phase 3: Filter spec and mutation checks

- [x] Started: 2026-09-25T22:20:00Z
- [x] Completed: 2026-09-25T22:35:00Z
- [x] Automated verification: PASSED

**Notes**: `libs/shared/backend/api/src/lib/filters/exception/index.spec.ts`, 18 scenarios.

- `npx jest -c libs/shared/backend/api/jest.config.ts .../filters/exception/index.spec.ts`: 18 passed.
- `npx nx run @sps/shared-backend-api:jest:test --skip-nx-cache`: 7 suites passed, 1 skipped (`order-by.spec.ts` carries `describe.skip` on `main`), 74 tests passed.
- `npx nx run @sps/shared-backend-api:eslint:lint --skip-nx-cache`: exit 0; two warnings, both in `controllers/rest/index.ts:139,153`, present on `main`.
- `npx tsc --noEmit -p libs/shared/backend/api/tsconfig.json`: exit 0 after Incident 2; the jest target and lint were re-run afterwards with the same results.
- Mutation checks (`scratchpad/issue-314/mutation-check.py`), each applied alone, spec run, source restored; md5 of both sources matched the pre-mutation copy afterwards and the restored run passed 18/18:
  - M1 gate always open: 5 failed (production 5xx, production 4xx, wrong secret, unset `NODE_ENV`, `brief` override).
  - M2 gate ignores the operator secret: 2 failed (secret in header, secret in cookie).
  - M3 report awaited in the response path: 1 failed (answers before the send settles).
  - M4 window check removed: 1 failed (one report per route within the window).
  - M5 signature keyed by the request URL: 1 failed (one report per route within the window).
  - M6 request id falls back to `unknown`: 1 failed (generated request id).
  - M7 failed send logged as the error object: 1 failed (message only, no token).
  - M8 unset `NODE_ENV` treated as development: 1 failed (unset `NODE_ENV` answers brief).

### Phase 4: Configuration and documentation

- [x] Started: 2026-09-25T22:36:00Z
- [x] Completed: 2026-09-25T22:45:00Z
- [x] Automated verification: PASSED

**Notes**: `apps/api/create_env.sh` writes `API_ERROR_DETAILS=full`; `tools/deployer/api/api.env.j2` writes `API_ERROR_DETAILS={{ API_ERROR_DETAILS | default('brief', true) }}`; `apps/api/README.md`, `tools/deployer/README.md` and `README.md` document the modes, the window and the body keys.

- `bash -n apps/api/create_env.sh`: exit 0.
- Template line rendered with Ansible's Jinja2 under `StrictUndefined`: unset gives `brief`, empty gives `brief`, `full` gives `full`.
- `npx prettier --check` on the three READMEs and the four ISSUE-314 documents: clean.
- `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.

### Phase 5: HTTP proof

- [x] Started: 2026-09-25T22:46:00Z
- [x] Completed: 2026-09-25T22:58:00Z
- [x] Automated verification: PASSED

**Notes**: the API was started as `bun server.ts` in `apps/api` of this worktree on port 4314 with `MIDDLEWARE_HTTP_CACHE=false` and the three `BUG_SERVICE_*` values set empty, not through `npm run api:dev`: Nx loads project `.env` files through dotenv-expand, which can replace an empty process value with the file's value, and the worktree's `.env` holds a real bug-chat token. Bun and `apps/api/env.ts` keep the empty values (probed). Requests: `GET /api/host/pages?filters[and][0][column]=id&filters[and][0][method]=nope&filters[and][0][value]=x` (4xx) and `GET /api/host/pages?orderBy[and][0][column]=id&orderBy[and][0][method]=nope` (5xx). Only status codes and key names were printed.

| Run                        | Process environment                        | 4xx | 5xx | Body keys                                |
| -------------------------- | ------------------------------------------ | --- | --- | ---------------------------------------- |
| A                          | `NODE_ENV=production`                      | 400 | 500 | `error, method, path, requestId, status` |
| A + operator secret header | `NODE_ENV=production`                      | 400 | 500 | adds `cause, stack`                      |
| B                          | `NODE_ENV` and `API_ERROR_DETAILS` unset   | 400 | 500 | `error, method, path, requestId, status` |
| C                          | `API_ERROR_DETAILS=full`, `NODE_ENV` unset | 400 | 500 | adds `cause, stack`                      |
| D                          | `NODE_ENV=development`                     | 400 | 500 | adds `cause, stack`                      |

- Run A server log: the line `🚨 Exception [proof-production-5xx]` exists and its record carries a stack that names server files; same for the 4xx.
- Run A process environment: `BUG_SERVICE_TELEGRAM_BOT_TOKEN` and `BUG_SERVICE_PROJECT` present and empty; no send was attempted.
- Run D, `GET /public/%E0%A4%A` (fails in `decodeURIComponent` before the request-id middleware): 500, `requestId` is a generated UUID, not `unknown`, and the log line carries the same id.
- The server was stopped after each run; port 4314 is free.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 1 — zsh modifiers in loop variables

- **Occurrences**: 1
- **Stage**: Phase 3 - Filter spec and mutation checks
- **Symptom**: `npx nx run $p:eslint:lint` reported `Cannot find project 'slint'`.
- **Root Cause**: zsh reads `$p:e` as the extension modifier, so `$p:eslint:lint` expanded to `slint:lint`.
- **Fix**: `npx nx run "${p}:eslint:lint"`.
- **Reusable Pattern**: brace every shell variable that is followed by a colon in zsh; `status` is also read-only in zsh and cannot be a variable name.

### Incident 2 — A type error in the spec passed jest

- **Occurrences**: 1
- **Stage**: Phase 3 - Filter spec and mutation checks
- **Symptom**: after 18/18 scenarios passed, `npx tsc --noEmit -p libs/shared/backend/api/tsconfig.json` reported TS2741 on the spec's timer variable typed `NodeJS.Timeout`.
- **Root Cause**: `jest.server-preset.js` runs ts-jest with `diagnostics: false`, so jest never type-checks a spec; the project tsconfig resolves `setTimeout` to Bun's `Timer`.
- **Fix**: typed the variable as `ReturnType<typeof setTimeout>`; tsc exit 0, spec and lint re-run green.
- **Reusable Pattern**: run `tsc --noEmit -p <project>/tsconfig.json` after adding or editing a spec; a green jest run says nothing about types.

## Summary

### Changes Made

- `libs/shared/utils/src/lib/envs/api.ts`: `API_ERROR_DETAILS`.
- `libs/shared/utils/src/lib/envs/host.ts`: `BUG_SERVICE_REPORT_WINDOW_IN_SECONDS`.
- `libs/shared/backend/api/src/lib/filters/exception/index.ts`: detail gate, request-id fallback, unawaited and de-duplicated report, failure logged by message.
- `libs/shared/backend/api/src/lib/filters/exception/index.spec.ts`: 18 BDD scenarios.
- `apps/api/create_env.sh`, `tools/deployer/api/api.env.j2`: explicit mode per environment.
- `apps/api/README.md`, `tools/deployer/README.md`, `README.md`: documentation.

Commits: `87c5626463` (fix), `b48725eca0` (research, plan, process, progress), and the pull request description commit on top.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/332
- [x] PR number: 332

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-25T23:20:00Z
