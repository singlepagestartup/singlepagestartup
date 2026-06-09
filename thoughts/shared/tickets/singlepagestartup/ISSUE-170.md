# Issue: [log-watch] [LW-af9b64380f19] api_api PostgresError: relation "sps_bg_pt_it" already exists

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/170
**Issue**: #170
**Status**: Research Needed
**Created**: 2026-05-03
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

This copied production log-watch error must be reproduced and fixed in SPS. The original report came from production, but the current local SPS workspace has been started with a database dump from the affected project, so the failure should be treated as locally reproducible.

## Key Details

- Source issue: https://github.com/flakecode/doctorgpt/issues/3
- Local reproduction context: use the current repository, local services, and restored database state to reproduce the bug locally before relying on production logs.
- This is a small bug; keep the fix focused on the failing runtime behavior and avoid unrelated refactors.
- The production watchdog report and log samples are preserved below for exact fingerprint, service, request, and stack context.

## Implementation Notes

- Start by reproducing the reported failure locally against the restored database dump.
- Use the preserved production log context to identify the route, module, model, or background job involved.
- Follow SPS repository rules: keep backend behavior in module layers, use SDK providers, do not edit repository data snapshots to implement behavior fixes, and keep tests in the repository BDD format.

---

## Source Context

## Local Reproduction Context

This bug was originally detected on the production server and copied from `flakecode/doctorgpt`, but it should be treated as locally reproducible in the current SPS workspace.

The project has been started locally with a database dump from the affected project. An AI agent working on this issue can reproduce and debug the failure on the local machine using the current repository, local services, and restored database state instead of relying only on production logs.

---

Copied from https://github.com/flakecode/doctorgpt/issues/3

Original repository: `flakecode/doctorgpt`
Original issue: #3
Original author: @flakecode
Original created at: 2026-04-30T15:47:26Z
Original updated at: 2026-04-30T15:47:26Z

---

Automated production log watchdog found this error more than 3 times in the last `1h`.

Fingerprint: `LW-af9b64380f19`
Detected at: `2026-04-30T15:47:24+00:00`
Service: `api_api`
Containers: `api_api.1.orvhniflf552z3b2244nvj9n9`, `api_api.2.t6fihs7f45uea47nslewke8jd`
Occurrences in window: `10`

## Error

```text
PostgresError: relation "sps_bg_pt_it" already exists
```

## Request Data From Logs

Methods:
_not found in logs_

Paths / URLs:
_not found in logs_

Statuses:
_not found in logs_

Request IDs:
_not found in logs_

Agent jobs:
_not found in logs_

UUIDs extracted from log context:
_not found in logs_

## Postgres Context

_No database rows matched extracted UUIDs, or no UUIDs were present in the error context._

## Log Context Samples

### Sample 1

```text
(Use `node --trace-warnings ...` to show where the warning was created)
(node:1795) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGINT listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:1795) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGTERM listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:1795) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGHUP listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:3772) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
(node:4352) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
[ERROR] 784 |     }
785 |   )
786 |   Error.captureStackTrace(error, notSupported)
787 |   return error
788 | }
          ^
PostgresError: relation "sps_bg_pt_it" already exists
 severity_local: "ERROR",
   severity: "ERROR",
       file: "heap.c",
```

### Sample 2

```text
(node:1795) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGTERM listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:1795) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGHUP listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:3772) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
(node:4352) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
[ERROR] 784 |     }
785 |   )
786 |   Error.captureStackTrace(error, notSupported)
787 |   return error
788 | }
          ^
PostgresError: relation "sps_bg_pt_it" already exists
 severity_local: "ERROR",
   severity: "ERROR",
       file: "heap.c",
    routine: "heap_create_with_catalog",
       code: "42P07"
```

### Sample 3

```text
(node:1795) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGHUP listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:3772) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
(node:4352) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
[ERROR] 784 |     }
785 |   )
786 |   Error.captureStackTrace(error, notSupported)
787 |   return error
788 | }
          ^
PostgresError: relation "sps_bg_pt_it" already exists
 severity_local: "ERROR",
   severity: "ERROR",
       file: "heap.c",
    routine: "heap_create_with_catalog",
       code: "42P07"

```

## Fingerprint Source

```text
api_api||PostgresError: relation "sps_bg_pt_it" already exists
```
