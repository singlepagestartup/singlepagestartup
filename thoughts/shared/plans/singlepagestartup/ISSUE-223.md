---
date: 2026-09-19T00:00:00+03:00
issue_number: 223
repository: singlepagestartup
topic: "Prevent long page-cache agents from being marked aborted while still running"
status: in_review
---

# Prevent long page-cache agents from being marked aborted while still running

## Overview

Move the agent run lifecycle out of the cron runner's self-HTTP call: the runner
dispatches and returns, the invoked handler records its own completion through a
route middleware, and a running marker blocks re-dispatch until completion or a
staleness limit.

## Current State Analysis

`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts`
holds every decision and every write:

- It reads all agents and every Broadcast message on the `cron` channel
  (`cron.ts:27-83`).
- `executeCronTask` deletes earlier markers for the slug, pushes a running
  marker, `await`s a bare `fetch()` to `POST /api/agent/agents/<slug>`, and
  pushes the fetch outcome as the result marker (`cron.ts:171-236`).
- A handler that runs longer than the caller's connection makes the runner store
  `{ error: "The operation was aborted." }` while the handler keeps working; the
  result marker then clears the only running guard (`cron.ts:104-110`), so the
  next due interval dispatches the same slug again.
- Every due agent is dispatched concurrently and the HTTP response waits for all
  of them (`cron.ts:150-154`).
- Markers are Broadcast messages whose `expiresAt` defaults to one hour
  (`libs/modules/broadcast/models/message/backend/repository/database/src/lib/fields/singlepage.ts:9-12`),
  shorter than the 5400 s default of `AGENT_MAX_DURATION_IN_SECONDS`
  (`libs/shared/utils/src/lib/envs/artificial-intelligence.ts:1-2`).
- The page-cache handler loops over every URL and language with no stop
  condition (`.../controller/singlepage/page/cache.ts:23-61`).

Constraints discovered:

- `IHttpRoute` already carries `middlewares`, and the module app registers them
  (`libs/shared/backend/api/src/lib/controllers/interface.ts:14-19`,
  `libs/shared/backend/api/src/lib/app/default/index.ts:72-82`).
- The one existing model middleware package
  (`libs/modules/rbac/models/subject/backend/app/middlewares`) is a plain folder
  inside the model's `backend/app`, exported through `index.ts` -> `src/index.ts`
  and imported relatively by the controller; its middlewares declare a
  structural `IService` type instead of importing the API package.
- Broadcast writes are only available through the server SDK (`pushMessage`,
  `messageDelete`); the injected `broadcastModule` exposes reads only
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/di.ts`).
- The repository insert layer converts an `expiresAt` string into a `Date`
  (`libs/shared/backend/api/src/lib/repository/database/index.ts:191-205`), so a
  marker can set its own expiry through the existing `pushMessage` call.
- The production evidence in the issue shows that aborting the caller does not
  stop the server-side handler: the handler finished 21-26 minutes after the
  262 s abort.

## Desired End State

- The cron runner never records a result it did not observe. It writes a running
  marker, starts the self-HTTP request, and returns once every dispatch has been
  started.
- The invoked handler records its own completion, whether it returns or throws.
- A running marker blocks re-dispatch of the same slug until it is finished or
  `AGENT_MAX_DURATION_IN_SECONDS` passes; a superseded run stops writing results.
- Due agents are dispatched with bounded concurrency.
- The page-cache handler stops early when its run was superseded or after a
  bounded number of consecutive page failures.

Verified by: `npx nx run @sps/agent:jest:test`, `npx nx run @sps/agent:eslint:lint`,
and the manual recipe in this plan.

### Key Discoveries

- `cron.ts:205-224` converts a transport abort into a terminal result; this is
  the exact line the issue's root cause section names.
- `cron.ts:89-110` is the only run-state check and it is a read, not a claim.
- `limitedParallelExecution` (`libs/shared/utils/src/lib/limited-parallel-execution/index.ts`)
  awaits `Promise.race` once `concurrency` tasks are in flight, so task
  `concurrency + 1` starts only after one of the first `concurrency` settles.
- `libs/modules/agent/models/agent/sdk/model/src/lib/index.ts` already holds the
  model's HTTP contract constants (`route`), so the run-id header name belongs
  there and both the API service and the middleware package can import it
  without depending on each other.

## What We're NOT Doing

- No durable job table, queue, worker, advisory lock, or schema change.
- No in-process SDK mode (plan item Phase 9 item 2 beyond what #223 needs).
- No change to the page-cache loop's sequential shape or to its language
  expansion.
- No change to the deployer, the system cron trigger, or `apps/api/server.ts`.
- No edits to `startup` files or to repository data snapshots.
- Not fixing the unrelated finding that any Broadcast message create purges
  expired rows (SEC-29 / Phase 9 item 1).

## Implementation Approach

Decompose the runner: an agent-run service owns marker reads, marker writes, the
due decision and a single dispatch; the cron controller composes them; a route
middleware in the agent model's middlewares package closes the run on the
handler side. The Broadcast `cron` channel stays the storage, with the existing
payload shape plus a `runId`.

## Phase 1: Agent-run service

### Overview

Move every marker decision and write out of the controller into the service.

### Changes Required

#### 1. Run-id header constant

**File**: `libs/modules/agent/models/agent/sdk/model/src/lib/index.ts`
**Why**: The header is part of the agent model's HTTP contract and is needed by
the runner, the middleware and the page-cache handler.
**Changes**: Export a `runIdHeader` constant with the value `X-SPS-AGENT-RUN-ID`.

#### 2. Environment knobs

**File**: `libs/shared/utils/src/lib/envs/artificial-intelligence.ts`
**Why**: The existing agent knob lives here; bounds must be projects-settable.
**Changes**: Add `AGENT_CRON_MAX_CONCURRENCY` (default 3),
`AGENT_CRON_DISPATCH_TIMEOUT_IN_SECONDS` (default 10) and
`AGENT_PAGE_CACHE_MAX_CONSECUTIVE_FAILURES` (default 10), in the file's existing
`parseInt(...) || default` style.

#### 3. Agent-run service

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/agent-run.ts` (new)
**Why**: The service layer holds the logic; the controller must only compose.
**Changes**: A class exposing `findMarkers`, `getLatestMarker`, `isDue`,
`markRunning`, `markFinished`, `isRunSuperseded` and `dispatch`, plus the marker
and decision interfaces.

- Markers are read from the `cron` Broadcast channel exactly as the controller
  reads them today, and parsed into `{ id, slug, runId, datetime, result, supersedes }`.
- `isDue` returns a decision object: a running marker younger than
  `AGENT_MAX_DURATION_IN_SECONDS` is not due; otherwise the existing
  `cron-parser` evaluation applies with the marker datetime as the anchor, and a
  due decision that replaces a stale running marker carries the superseded run id.
- `markRunning` deletes the slug's previous markers, then pushes
  `{ datetime, slug, runId, supersedes? }` with an explicit `expiresAt` that is
  never shorter than the current one-hour default and never shorter than
  `AGENT_MAX_DURATION_IN_SECONDS`.
- `markFinished` pushes `{ datetime, slug, runId, result }`, but only when the
  slug's newest marker still belongs to that run; otherwise it logs and skips, so
  a superseded or already-finished run cannot overwrite the live marker.
- `dispatch` writes the running marker, sends the self-HTTP request with the
  run-id header and an `AbortSignal.timeout` of the dispatch window, and never
  reads a successful response body. A deliberate abort or timeout means the
  handler was accepted and is still running. A connection failure or a non-2xx
  response is recorded through `markFinished` with the error.

#### 4. Service composition

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`
**Why**: Handlers and the middleware reach the run logic through the service.
**Changes**: Add an `agentRun` property built from the injected `broadcastModule`
in the constructor, following the file's existing property/constructor order.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/agent:jest:test` passes, including a new
      `agent-run.spec.ts` covering the fresh, stale and finished marker cases and
      the superseded `markFinished` guard.
- [ ] `npx nx run @sps/agent:eslint:lint` passes.

#### Manual Verification

- [ ] A cron call writes a running marker whose payload carries a `runId`.

---

## Phase 2: Runner composition and completion middleware

### Overview

Make the controller a composition, and let the handler side close the run.

### Changes Required

#### 1. Cron controller

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts`
**Why**: It currently owns marker I/O, the due decision and the dispatch result.
**Changes**: Read agents and markers, ask the service for each agent's decision,
then run the due dispatches through `limitedParallelExecution` bounded by
`AGENT_CRON_MAX_CONCURRENCY`, and answer with the dispatched agents as today.
`executeCronTask` and its inline fetch handling are removed.

#### 2. Agent middlewares package

**File**: `libs/modules/agent/models/agent/backend/app/middlewares/index.ts`,
`.../middlewares/src/index.ts`, `.../middlewares/src/lib/agent-run/index.ts` (new)
**Why**: The repository rule puts route middleware in the model's middlewares
package; the rbac subject package is the shape to follow.
**Changes**: A `Middleware` class taking a structural service type, whose handler
skips requests without the run-id header and otherwise records the outcome
through `markFinished` in a `finally`, so a thrown handler also closes its run.
The status and a short outcome are recorded; the response body is not buffered.

#### 3. Route registration

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts`
**Why**: Completion must be recorded for every route the runner can dispatch to.
**Changes**: Build one middleware instance in the constructor and add it to the
`middlewares` field of every agent-execution POST route.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/agent:jest:test` passes, including a `cron.spec.ts` that
      asserts the runner returns without awaiting the handler body, records a
      dispatch failure, and starts dispatch four only after one of the first
      three settles.
- [ ] The middleware spec asserts a finished marker on success and on a thrown
      handler, and no marker without the header.
- [ ] `npx nx run @sps/agent:eslint:lint` passes.

#### Manual Verification

- [ ] A second cron call during a run does not dispatch the same slug again.

---

## Phase 3: Page-cache early stop

### Overview

Let the long handler give up when its run no longer owns the slug or when the
Host side is failing repeatedly.

### Changes Required

#### 1. Page-cache handler

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts`
**Why**: A superseded 25-minute scan should not keep loading Host.
**Changes**: Read the run id from the request header; count consecutive page
failures and stop at `AGENT_PAGE_CACHE_MAX_CONSECUTIVE_FAILURES`; between URLs,
and at most once a minute, ask the service whether the run was superseded and
stop if it was. The successful response stays `{ data: { ok: true } }`; an early
stop reports the reason in the response body and in the log.

### Success Criteria

#### Automated Verification

- [ ] The existing `page/cache.spec.ts` stays green.
- [ ] `npx nx run @sps/agent:jest:test` and `npx nx run @sps/agent:eslint:lint`
      pass.

#### Manual Verification

- [ ] A page-cache run whose marker was superseded stops before the URL list ends.

---

## Testing Strategy

### Unit Tests

- Service: fresh running marker is not due, stale running marker is due and
  carries the superseded run id, finished marker falls through to the schedule,
  `markFinished` skips when the newest marker belongs to another run, running
  markers carry an expiry that covers the max duration.
- Runner: the dispatch does not await the response body, a refused connection is
  recorded as a finished marker, a deliberate abort is not, and the concurrency
  bound holds.
- Middleware: a finished marker is written on a 200 and on a thrown handler, and
  nothing is written without the run-id header.

### Manual Testing Steps

Against a running API instance of this worktree on `http://localhost:4014`, with
`SECRET="$(grep -m1 '^RBAC_SECRET_KEY=' apps/api/.env | cut -d= -f2-)"`:

1. Create a temporary page-cache agent so the slug is due every minute:
   `curl -s -X POST http://localhost:4014/api/agent/agents -H "X-RBAC-SECRET-KEY: $SECRET" -F 'data={"title":"host-module-page-cache","slug":"host-module-page-cache","interval":"* * * * *"}'`
   and keep the returned id.
2. Trigger the runner:
   `curl -s -X POST http://localhost:4014/api/agent/agents/cron -H "X-RBAC-SECRET-KEY: $SECRET" -F 'data={}'`.
   It answers within seconds with the dispatched agent rows.
3. Read the markers: `GET /api/broadcast/channels` to find the `cron` channel id,
   then `GET /api/broadcast/channels/<id>/messages`. The page-cache slug shows a
   payload with a `runId` and no `result` while the handler runs, and a second
   payload with the same `runId` and a `result` once it finishes.
4. Trigger the runner again while the handler still runs; the response must not
   contain the page-cache agent and no new running marker must appear.
5. Delete the temporary agent:
   `curl -s -X DELETE http://localhost:4014/api/agent/agents/<id> -H "X-RBAC-SECRET-KEY: $SECRET"`.

## Performance Considerations

The runner's response time stops being the longest handler's runtime and becomes
at most `ceil(due / AGENT_CRON_MAX_CONCURRENCY) * AGENT_CRON_DISPATCH_TIMEOUT_IN_SECONDS`.
The page-cache run adds at most one marker read per minute.

## Migration Notes

Markers written before this change have no `runId`; their finishing writes are
skipped once and the staleness rule re-dispatches on the next due interval. No
schema change, no data migration.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-223.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-223.md`
- Audit: `thoughts/shared/research/singlepagestartup/2026-09-19-dead-code-and-security-audit.md`
  (SEC-28, SEC-30), appendix `2026-09-19-audit-appendix-resource-exhaustion.md`
  (F23), appendix `2026-09-19-audit-appendix-routes-A.md` section 2
- Remediation plan: `thoughts/shared/plans/singlepagestartup/2026-09-19-dead-code-and-security-remediation.md`
  ("Layering contract", Phase 9 items 2-3)
