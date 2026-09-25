# Issue #223: Prevent long page-cache agents from being marked aborted while still running

## Metadata

- URL: https://github.com/singlepagestartup/singlepagestartup/issues/223
- Status: Research Needed
- Created: 2026-08-02T21:18:08Z
- State: open
- Labels: `size:medium`
- Type: bug
- Priority: medium
- Size: medium
- Production observation window: 2026-08-01T21:04:25Z to 2026-08-02T21:04:25Z

## Problem to Solve

The framework cron runner invokes `host-module-page-cache` through a synchronous
self-HTTP request. On the production-sized page set, the page-cache handler runs
for about 25–26 minutes, but the caller is aborted after about 4 minutes 22
seconds. The cron runner records an error result while the server-side handler
continues and eventually reports success. Some scheduled times launch paired
handlers, so the same cache-warming work can overlap.

### Observed vs expected

Observed: the cron runner persists an abort result after roughly 262 seconds,
while the invoked page-cache handler remains active and later logs `finished`.
Multiple handlers for the same slug can execute concurrently.

Expected: one scheduled execution has one authoritative lifecycle. It remains
in progress until the handler actually succeeds or fails, and a second run for
the same agent cannot start while the first one is active.

### Impact

- Execution history reports failures for jobs that later complete.
- Operators and automation cannot trust the recorded result.
- Duplicate 25–26 minute cache scans can multiply API/Host traffic and resource
  usage.
- A retry can race an already-running handler because caller cancellation and
  server-side completion are not coordinated.

## Key Details

### Production evidence

- Affected service: `api_api`.
- Requested 24-hour window: 2026-08-01T21:04:25Z to
  2026-08-02T21:04:25Z. Docker retained API logs from 2026-08-02T14:58:01Z.
- Sanitized signature: `host-module-page-cache | AbortError: The operation was aborted.`
- Fresh caller aborts: 8.
- First abort: 2026-08-02T15:04:24Z.
- Last abort: 2026-08-02T21:04:24Z.
- Six completed handlers had already shown the same pattern: start, caller
  abort after about 262 seconds, then handler finish about 21–22 minutes later.
- Paired starts and aborts were observed at 15:00/15:04, 18:00/18:04, and
  21:00/21:04 UTC.
- Image:
  `singlepagestartup/didigallery:0.0.223@sha256:451dc511e2ec92e06b877c3556cd039ee9cdf52aa8d1a2c6a887bcc81e0da7b0`.
- Runtime: Bun 1.3.14; deployed `apps/api/server.ts` sets `idleTimeout: 0`.

Minimal sanitized stack:

```text
[ERROR] Error during agent 'host-module-page-cache':
AbortError: The operation was aborted.
  at processTicksAndRejections (native:7:39)
```

No crash, restart loop, OOM, health-check failure, or failed Swarm task was
present; the defect is the scheduler's incorrect terminal state and overlapping
work, not a service crash.

### Root cause (as stated in the issue)

- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:26`
  and `:27` iterate every URL and language sequentially.
- The handler awaits revalidation and a page GET for every entry at `:40` and
  `:42`, and does not return its response until `:61`. With the production data
  set, this takes about 25–26 minutes.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts:209`
  dispatches the agent through a synchronous `fetch()` back to the API.
- Its catch at `cron.ts:225-228` converts a transport abort into a terminal
  `{ error }` result, which is then persisted at `cron.ts:230-241`, although the
  target handler continues running.
- There is no durable completion handshake or atomic per-slug execution lock
  spanning caller cancellation and actual handler completion.

The relevant control flow exists in `upstream/main` commit
`036cdb033fbcb5597b90a5b502965034fdd98189`. The didigallery checkout differs in
this cron file only by two debug `console.log` statements, so this is a
framework-level SinglePageStartup defect and belongs in
`singlepagestartup/singlepagestartup`.

### Reproduction / conditions

1. Configure `host-module-page-cache` with a due interval.
2. Return a production-sized URL collection from the Host page service and at
   least two configured languages.
3. Make the sequential revalidate + GET loop run longer than the caller
   connection lifetime.
4. Invoke `/api/agent/agents/cron`.
5. Observe that cron stores `The operation was aborted.` while the page-cache
   handler keeps running and later logs `finished`.
6. Invoke cron concurrently or again while the first handler is still active;
   observe overlapping work for the same slug.

## Implementation Notes

### Proposed fix (from the issue)

Give agent execution a durable lifecycle independent of one long HTTP response:

1. Atomically acquire a per-agent execution lease/idempotency key before
   dispatch.
2. Execute long-running work through a completion-aware job path (or direct
   service invocation) rather than treating a self-HTTP connection as the
   source of truth.
3. Persist the terminal result only when the handler actually completes or a
   deliberate cancellation is acknowledged.
4. Bound page-cache work with measured concurrency/batching so it does not
   serialize every URL/language pair unnecessarily.
5. Preserve per-page failure isolation and the URL normalization fixed in #218.

### Alternatives and risks (from the issue)

- Merely increasing an HTTP timeout leaves completion coupled to transport and
  does not prevent concurrent duplicate dispatch.
- Unbounded parallel page fetches could overload Host/API, so concurrency must
  be explicitly limited.
- A lock without expiry/recovery could strand an agent after a real process
  crash; leases need ownership, heartbeat/expiry, and safe takeover semantics.
- Changing execution history requires compatibility with existing cron message
  records.

### Test plan (from the issue)

- Add BDD unit tests around `executeCronTask` with a delayed handler response,
  caller cancellation, and a successful eventual completion.
- Add a concurrent-cron BDD scenario proving only one execution lease is
  acquired for a slug.
- Add recovery coverage for a stale lease and failure coverage for an actual
  handler exception.
- Extend the page-cache tests with a large URL fixture and bounded-concurrency
  assertions while retaining the #218 path cases.
- Run the Agent unit/integration targets and a DB-backed cron scenario.

## Acceptance Criteria

- [ ] A page-cache run longer than the former abort threshold is not recorded as failed while it is still executing.
- [ ] Each scheduled run creates one start record and one authoritative terminal result.
- [ ] Concurrent cron requests cannot execute the same agent slug simultaneously.
- [ ] A real handler failure is recorded once with an actionable reason.
- [ ] Abandoned executions recover safely after the configured lease duration.
- [ ] Page-cache continues to normalize root/nested/localized paths as fixed in #218.
- [ ] Production-equivalent logs contain no scheduler `AbortError` for a page-cache handler that later finishes.

## References

- GitHub issue: https://github.com/singlepagestartup/singlepagestartup/issues/223
- Cited upstream commit: `036cdb033fbcb5597b90a5b502965034fdd98189`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts`
- `apps/api/server.ts`
- Related issues checked in the issue text:
  - #178 (closed) covers a generic abort surfaced from a different RBAC
    notification path; it does not identify page-cache lifecycle mismatch.
  - #218 (closed) fixed string URL normalization before page work began; the
    current handler reaches page work and fails later at scheduler lifecycle
    level.

## Comments

No comments were present on the GitHub issue when this ticket was captured
(2026-09-18).
