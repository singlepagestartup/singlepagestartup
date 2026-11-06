## Summary

The cron runner can record a long-running agent as aborted when its self-HTTP
request times out, while the handler continues working. That finished error
marker allows another scan of the same Host pages to start.

Each scheduled run now has a run id. The runner waits only for a bounded
handoff window; the handler records its own completion through route middleware.
A running marker blocks later ticks until completion or the maximum duration.
The branch includes current main and retains its Agent variants and seeded jobs.

Closes #223

## Changes

- Move scheduled-run decisions, markers and dispatch into the Agent run service.
  Dispatch carries `X-SPS-AGENT-RUN-ID` and uses bounded concurrency.
- Attach completion middleware to the twelve agent-execution POST routes.
  Manual requests without the run-id header keep their existing behavior.
- Reject invalid cron intervals before the first dispatch. Retain markers for at
  least `max(3600, AGENT_MAX_DURATION_IN_SECONDS)` seconds.
- Stop page-cache scans when superseded or after repeated fetch failures.
  Return 409 for supersession and 502 for the failure threshold, so completion
  records an HTTP error instead of success.
- Keep constants in shared constants, preserve current service composition,
  and update the Telegram test fixture for main's shared cache utilities.
- Record review and runtime evidence in
  `thoughts/shared/research/singlepagestartup/2026-11-02-pr261-agent-runtime-validation.md`.

## Verification

- [x] Agent Jest suite: 20 suites, 110 tests passed.
- [x] Shared Utils Jest suite: 17 suites, 117 tests passed.
- [x] `tsc --noEmit -p libs/modules/agent/tsconfig.json` passed.
- [x] Changed-file ESLint rules passed for 17 TypeScript files, with parser
  project loading disabled and TypeScript checked separately.
- [x] Module dependency check: 15520 source files, zero violations.
- [x] Inline type-import audit and `git diff --check` passed.
- [x] Real Bun/Hono loopback harness: a 1.5 s handler outlived a 1 s dispatch
  timeout, the next tick remained blocked, and the handler recorded its own
  completion for the same run id. No duplicate handler execution occurred.

## Downstream migration

Impact: required for projects overriding Agent route tables or service
construction, reading cron markers, or maintaining custom page-cache handlers.

1. Preserve the Agent run service composition and add the completion middleware
   to every owned agent-execution POST route. Preserve main's current routes and
   SDK variants when integrating overrides.
2. Carry `runId` and `supersedes` in owned marker readers. Completion records
   contain observed HTTP status/error information rather than the handler body.
3. Keep cron validation before the first dispatch. Custom page-cache handlers
   should return non-success statuses for early stops: 502 for the failure
   threshold and 409 for supersession; callers can inspect `data.stopped`.
4. Optional bounds are `AGENT_CRON_MAX_CONCURRENCY` (default 3),
   `AGENT_CRON_DISPATCH_TIMEOUT_IN_SECONDS` (default 10), and
   `AGENT_PAGE_CACHE_MAX_CONSECUTIVE_FAILURES` (default 10).
   `AGENT_MAX_DURATION_IN_SECONDS` defaults to 5400 and also sets the minimum
   marker lifetime when greater than one hour.
5. Verify a long handler remains running after the dispatch timeout, a second
   tick skips it, completion uses the same run id, invalid schedules do not
   dispatch, and failed page-cache stops are recorded as errors.

## Notes

Marker ownership remains a read-before-write check. Atomic claims across API
replicas, including completion racing stale-run replacement, remain separate
work in #213. This change does not promise exactly-once execution.

The global application cron was not triggered during this review because its
jobs include billing, notification and cleanup operations. The runtime harness
used isolated in-memory markers. No schema or data migration is required. The
placement checker still reports the pre-existing Studio `Files.tsx` / `Files/`
collision outside this PR.
