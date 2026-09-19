## Summary

`host-module-page-cache` walks every Host URL and takes 25 to 26 minutes in production, but the cron runner that started it was aborted after about 4 minutes 22 seconds. The runner awaited a self-HTTP request per due agent and stored that fetch outcome as the run's result, so `AbortError: The operation was aborted.` was written to the `cron` channel as the agent's result while the handler kept loading pages. An error result also counted as a finished run, which cleared the only guard against a second dispatch of the same slug: production logs show paired starts at 15:00/15:04, 18:00/18:04 and 21:00/21:04 UTC, two cache scans warming the same pages at once.

The run lifecycle now belongs to an agent-run service. The runner claims a slug with a running marker that carries a `runId`, starts the request with the `X-SPS-AGENT-RUN-ID` header and a short dispatch timeout, and returns without waiting for the handler. The handler closes its own run through a new route middleware, so the outcome is written by the side that observed it, and a running marker blocks the next dispatch of that slug until it finishes or `AGENT_MAX_DURATION_IN_SECONDS` passes.

Closes #223

## Changes

Paths are relative to `libs/modules/agent/models/agent/` unless stated otherwise.

- `backend/app/api/src/lib/service/singlepage/agent-run.ts` (new): the run lifecycle in one place — marker reads and writes on the Broadcast `cron` channel, the due decision (`isDue`, including the staleness rule that supersedes a lost run), `markRunning`, `markFinished` (which refuses a late result from a superseded run), `isRunSuperseded`, and `dispatch`. `dispatch` sends the run-id header with `AbortSignal.timeout(AGENT_CRON_DISPATCH_TIMEOUT_IN_SECONDS)` and treats that timeout as a handoff: the handler keeps working and stays unfinished in the markers. The runner writes a result only for a dispatch that failed before the handler was reached, such as a refused connection or an immediate error status.
- `backend/app/api/src/lib/service/singlepage/index.ts`: composes `agentRun` from the injected `broadcastModule`.
- `backend/app/api/src/lib/controller/singlepage/cron.ts`: 249 lines down to 92, composition only. It reads the channel and the markers once, asks the service which agents are due, and dispatches them through `limitedParallelExecution` bounded by `AGENT_CRON_MAX_CONCURRENCY`. The response still lists the agents this tick dispatched.
- `backend/app/middlewares/**` (new package): the `agent-run` route middleware reads `X-SPS-AGENT-RUN-ID` and writes the finished marker in a `finally`, so a handler that fails also closes its run. Without the header it does nothing, which leaves a manual call to an agent route unchanged.
- `backend/app/api/src/lib/controller/singlepage/index.ts`: builds the middleware once in the constructor and attaches it to the twelve agent-execution POST routes.
- `backend/app/api/src/lib/controller/singlepage/page/cache.ts`: re-reads its marker between URLs, at most once a minute, and stops when another run has claimed the slug; it also stops after `AGENT_PAGE_CACHE_MAX_CONSECUTIVE_FAILURES` page failures in a row. An early stop answers `{ data: { ok: false, stopped } }` and logs the reason instead of walking the remaining URLs.
- `sdk/model/src/lib/index.ts`: exports `runIdHeader`, so the runner, the middleware and the handler share the header name without importing each other.
- `libs/shared/utils/src/lib/envs/artificial-intelligence.ts`: the three new bounds, next to `AGENT_MAX_DURATION_IN_SECONDS`.
- `libs/modules/agent/models/agent/README.md`: a "Scheduled Run Lifecycle" section describing the marker pair, the staleness rule and the four knobs.
- Tests: `agent-run.spec.ts`, `cron.spec.ts` and the middleware spec are new; `page/cache.spec.ts` gains two scenarios and keeps its original assertions.

## Downstream migration

Impact: required. The cron execution markers changed shape and ownership, so a startup layer that rebuilds the agent routes or reads the cron channel keeps the old behaviour after a clean merge.

Applies to a project that declares its own agent route table through `bindHttpRoutes`, overrides the agent singlepage service constructor, reads the Broadcast `cron` channel payloads, or sizes the agent bounds in its deployment configuration.

1. In a startup agent controller that rebuilds the route table, add the `agent-run` middleware instance to the `middlewares` field of every agent-execution POST route it declares. Without it those agents never record a completion and stay blocked until the staleness limit passes.
2. In a startup agent service that overrides the constructor, keep the `agentRun` composition from the singlepage constructor, so the handlers and the middleware can reach the run lifecycle.
3. Update any reader of the cron payloads: a marker now carries `runId`, a superseding marker carries `supersedes`, and a finished result is the observed status, such as `{"status":200,"ok":true}`, instead of the handler's response body.
4. Three new environment variables, all optional: `AGENT_CRON_MAX_CONCURRENCY` (default 3), `AGENT_CRON_DISPATCH_TIMEOUT_IN_SECONDS` (default 10) and `AGENT_PAGE_CACHE_MAX_CONSECUTIVE_FAILURES` (default 10). `AGENT_MAX_DURATION_IN_SECONDS` (default 5400) keeps its meaning as the staleness limit.
5. Marker lifetime: a marker is now written with an explicit `expiresAt` of `max(1 hour, AGENT_MAX_DURATION_IN_SECONDS)`, 90 minutes by default, instead of the message table's one-hour default. A running marker can no longer expire before the staleness limit it enforces; raising the maximum duration keeps cron messages in the database for longer.
6. Verify: trigger `POST /api/agent/agents/cron` and confirm it answers in seconds rather than after the longest handler, then read the cron channel messages and confirm one running marker with a `runId` followed by one finished marker with the same `runId`. Trigger cron again during a long run and confirm the slug is not dispatched twice.

## Verification

- [x] `npx nx run @sps/agent:jest:test` — 19 suites, 103 tests, all passing.
- [x] `npx nx run @sps/agent:eslint:lint` — clean.
- [x] `npx nx run @sps/shared-utils:jest:test` — 60 tests, all passing.
- [x] `npx tsc --noEmit -p libs/modules/agent/tsconfig.json` — no errors.
- [x] Manual run against a live API instance, recorded below.

## How to verify it

Against a running API instance of this branch on `http://localhost:4014`, with
`SECRET="$(grep -m1 '^RBAC_SECRET_KEY=' apps/api/.env | cut -d= -f2-)"`. Each
step notes what this branch did when the step was run:

1. Trigger the runner with the seeded agents:
   `curl -s -X POST http://localhost:4014/api/agent/agents/cron -H "X-RBAC-SECRET-KEY: $SECRET" -F 'data={}'`.
   It answered in 0.49 s and returned the dispatched agents; the `cron` channel
   held a running marker and a finished marker with the same `runId` for each.
2. Create a temporary page-cache agent so the slug is due every minute:
   `curl -s -X POST http://localhost:4014/api/agent/agents -H "X-RBAC-SECRET-KEY: $SECRET" -F 'data={"title":"host-module-page-cache","slug":"host-module-page-cache","interval":"* * * * *"}'`,
   and keep the returned id.
3. Trigger the runner again. It answered once the 10 s dispatch window closed,
   rather than after the handler, and left the page-cache run in progress.
4. Trigger the runner immediately a third time: it dispatched nothing, because
   the running marker still owned the slug.
5. Read the markers: `GET /api/broadcast/channels` for the `cron` channel id,
   then `GET /api/broadcast/channels/<id>/messages`. The running marker kept one
   `runId` for about 100 s, and the finished marker with that same `runId`
   appeared at about t+105 s, written by the handler rather than the runner.
6. Delete the temporary agent:
   `curl -s -X DELETE http://localhost:4014/api/agent/agents/<id> -H "X-RBAC-SECRET-KEY: $SECRET"`.

## Notes

- The running marker is a read, not an atomic claim. Two API replicas ticking at the same moment can both find no marker and both dispatch the same slug. Narrowing that window belongs to #213.
- Markers written before this change carry no `runId`. Their finishing write is skipped once, and the staleness rule re-dispatches the slug on its next due interval. No schema change and no data migration.
- The runner's response time is now bounded by `ceil(due / AGENT_CRON_MAX_CONCURRENCY) * AGENT_CRON_DISPATCH_TIMEOUT_IN_SECONDS` instead of the longest handler's runtime. The page-cache run adds about one marker read per minute.
