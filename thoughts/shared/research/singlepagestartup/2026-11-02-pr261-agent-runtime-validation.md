# PR #261: scheduled agent lifecycle

Date: 2026-11-02. Original PR head: `51219d4f251a51c37c3f5bf4fffe62e147e9b8be`.
Main used for integration: `912a112c0541f0a3cc1a3a942b2b1b8c114539a5`.

## Scope and current need

Main still awaits each scheduled agent's self-HTTP request and stores an aborted
fetch as the execution result, even when the handler continues. The PR separates
dispatch from completion: a run-id marker blocks subsequent ticks, while route
middleware records the handler's outcome. A stale marker can be superseded after
the configured maximum duration. Dispatch concurrency and consecutive page-cache
failures are bounded.

## Integration and corrections

- Main is integrated into the PR branch. The README retains both scheduled-run
  lifecycle documentation and the current seeded agents; the SDK retains the
  run-id header and main's `hidden` variant. Other main changes merge unchanged.
- Invalid schedules are checked before the first run. A regression test failed
  against the original PR decision (`first-run`) and passes after the correction
  (`invalid-interval`).
- A page-cache stop after repeated failures returns 502. A superseded scan
  returns 409. The middleware can therefore record a failed HTTP result instead
  of reporting a stopped scan as successful.
- Lifecycle constants live with shared constants. The middleware dependency is
  declared as an interface. No inline type imports occur in the changed files.
- The pre-existing Telegram subscription test failed on main because its
  partial shared-utils mock omitted `observeMemoryCache`. The fixture retains
  actual shared utilities and overrides only its scenario inputs.

## Verification

- Agent: 20 suites, 110 tests passed.
- Shared Utils: 17 suites, 117 tests passed.
- `tsc --noEmit -p libs/modules/agent/tsconfig.json`: passed after the corrections.
- Changed-file ESLint rules: 17 TypeScript files, no errors or warnings, with
  parser project loading disabled and a separate TypeScript check.
- Module dependencies: 15520 source files, no violations. The placement checker
  reports only the existing Studio `Files.tsx` / `Files/` collision.
- Inline type-import audit: 17 changed TypeScript files, zero occurrences.
- `git diff --check`: passed.

A temporary loopback Bun/Hono server exercised the actual dispatch service and
completion middleware with in-memory marker storage. The handler needed 1.5 s
and the dispatch timeout was 1 s. Dispatch returned `left-running` at 1007 ms;
the marker had no result and the next due decision stayed blocked. The handler
continued after the client abort and wrote `{ status: 200, ok: true }` for the
same run id. Only one handler execution occurred. The temporary server stopped
after the assertions. Bun printed a directory-mismatch diagnostic at exit when
using `--tsconfig-override`; the assertions and process exit status passed.

## Boundaries and remaining limitation

The runtime harness verifies HTTP cancellation and handler completion in Bun;
marker persistence and cache behavior are exercised by the service's existing
Broadcast SDK/DI paths and mocked tests, rather than a new database scenario.
The application's global cron was not triggered: its configured agents include
billing, notification and cleanup operations. No production deployment, payment,
notification or business-data cleanup was performed.

Broadcast marker ownership uses read-before-write checks. Simultaneous API
replicas or completion racing a stale-run replacement still lack an atomic
claim/compare-and-set guarantee. Distributed execution exclusion remains the
separate work in #213; this PR fixes the observed long-running dispatch timeout
without claiming exactly-once execution.
