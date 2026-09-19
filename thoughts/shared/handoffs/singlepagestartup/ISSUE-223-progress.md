---
issue_number: 223
issue_title: "Prevent long page-cache agents from being marked aborted while still running"
start_date: 2026-09-18T23:00:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-223.md
status: complete
completed_date: 2026-09-18
---

# Implementation Progress: ISSUE-223 - Prevent long page-cache agents from being marked aborted while still running

**Started**: 2026-09-18
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-223.md`

## Phase Progress

### Phase 1: Agent-run service

- [x] Started: 2026-09-18T23:05:00Z
- [x] Completed: 2026-09-18T23:25:00Z
- [x] Automated verification: `npx nx run @sps/agent:jest:test` PASSED,
      `npx nx run @sps/agent:eslint:lint` PASSED,
      `npx nx run @sps/shared-utils:jest:test` PASSED,
      `npx nx run @sps/shared-utils:eslint:lint` PASSED

**Notes**: `runIdHeader` joined `route` in the agent model SDK, so the runner,
the middleware and the page-cache handler share the contract without depending
on each other. The three new bounds live next to `AGENT_MAX_DURATION_IN_SECONDS`
in `libs/shared/utils/src/lib/envs/artificial-intelligence.ts`.

### Phase 2: Runner composition and completion middleware

- [x] Started: 2026-09-18T23:25:00Z
- [x] Completed: 2026-09-18T23:38:00Z
- [x] Automated verification: `npx nx run @sps/agent:jest:test` PASSED,
      `npx nx run @sps/agent:eslint:lint` PASSED

**Notes**: `cron.ts` shrank from 249 to 92 lines and now only composes. The
middleware package follows the rbac subject package: `index.ts` -> `src/index.ts`
-> `src/lib/agent-run/index.ts`, with a structural service type instead of an
import from the API package. The middleware instance is built once in the
controller constructor and attached to the twelve agent-execution POST routes.

### Phase 3: Page-cache early stop

- [x] Started: 2026-09-18T23:38:00Z
- [x] Completed: 2026-09-18T23:42:00Z
- [x] Automated verification: `npx nx run @sps/agent:jest:test` PASSED,
      `npx nx run @sps/agent:eslint:lint` PASSED,
      `npx tsc --noEmit -p libs/modules/agent/tsconfig.json` exit 0

**Notes**: The supersede check is throttled to once a minute between URLs, so a
25-minute run adds about 25 marker reads. The existing spec needed a request
context and two new scenarios; its original assertions are unchanged.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — A thrown Hono handler does not reject `await next()`

- **Occurrences**: 1
- **Stage**: Phase 2 - Runner composition and completion middleware
- **Symptom**: The middleware spec expected `markFinished` to be called with the
  handler's error message; it was called with `{ status: 500, error: "Internal
error. Agent responded with 500" }`.
- **Root Cause**: Hono's `compose` catches a handler exception at the handler's
  own dispatch index and turns it into a response through the application error
  handler, so an upstream middleware's `await next()` resolves with that
  response instead of rejecting.
- **Fix**: The spec now asserts the error status that the middleware actually
  observes, and a separate scenario drives the middleware directly with a
  rejecting `next` to cover the defensive catch.
- **Reusable Pattern**: When a Hono middleware must react to a handler failure,
  read the response status after `await next()`; treat the `catch` branch as the
  path for errors that escape the application error handler.

## Summary

### Changes Made

- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/agent-run.ts`
  (new): the run lifecycle - marker reads and writes, the due decision, the
  staleness rule, the supersede guard and the bounded dispatch.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`:
  composes `agentRun` from the injected `broadcastModule`.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts`:
  composition only; dispatches due agents through `limitedParallelExecution`.
- `libs/modules/agent/models/agent/backend/app/middlewares/**` (new): the
  `agent-run` route middleware package.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts`:
  registers the middleware on the agent-execution POST routes.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts`:
  stops on a superseded run or on consecutive page failures.
- `libs/modules/agent/models/agent/sdk/model/src/lib/index.ts`: `runIdHeader`.
- `libs/shared/utils/src/lib/envs/artificial-intelligence.ts`: three bounds.
- `libs/modules/agent/models/agent/README.md`: the run lifecycle and the knobs.
- Specs: `agent-run.spec.ts`, `cron.spec.ts`, `middlewares/.../agent-run/index.spec.ts`,
  and two scenarios in `page/cache.spec.ts`.

### Pull Request

- [ ] PR created: not requested in this session
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-18T23:45:00Z
