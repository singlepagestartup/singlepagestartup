# Issue: [log-watch] [LW-e5b6f57f5a15] api_api /api/agent/agents/rbac-module-subjects-check MAX_PARAMETERS_EXCEEDED: Max number of parameters exceeded

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/169
**Issue**: #169
**Status**: Done / Closed as not planned
**Created**: 2026-05-03
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

This copied production log-watch error must be reproduced and fixed in SPS. The original report came from production, but the current local SPS workspace has been started with a database dump from the affected project, so the failure should be treated as locally reproducible.

## Key Details

- Source issue: https://github.com/flakecode/doctorgpt/issues/1
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

Copied from https://github.com/flakecode/doctorgpt/issues/1

Original repository: `flakecode/doctorgpt`
Original issue: #1
Original author: @flakecode
Original created at: 2026-04-30T15:47:19Z
Original updated at: 2026-04-30T22:40:01Z

---

Automated production log watchdog found this error more than 3 times in the last `1h`.

Fingerprint: `LW-e5b6f57f5a15`
Detected at: `2026-04-30T15:47:18+00:00`
Service: `api_api`
Containers: `api_api.1.orvhniflf552z3b2244nvj9n9`, `api_api.2.t6fihs7f45uea47nslewke8jd`
Occurrences in window: `29`

## Error

```text
MAX_PARAMETERS_EXCEEDED: Max number of parameters exceeded
```

## Request Data From Logs

Methods:

- `POST`

Paths / URLs:

- `http://api:4000/api/agent/agents/rbac-module-subjects-check`
- `http://api:4000/api/rbac/subjects/check`

Statuses:

- `500`

Request IDs:

- `RLWEtcZEQteXY3QHVYZPx`
- `ZALnoGoM-UE0KNJIJOjkA`
- `hok7gUZBwvgw8tZqKw29T`
- `vmV61CTX-tjb_R82AUqEl`

Agent jobs:

- `rbac-module-subjects-check`

UUIDs extracted from log context:
_not found in logs_

## Postgres Context

_No database rows matched extracted UUIDs, or no UUIDs were present in the error context._

## Log Context Samples

### Sample 1

```text
(Use `node --trace-warnings ...` to show where the warning was created)
(node:10031) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
(node:10031) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGINT listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:10031) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGTERM listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:10031) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGHUP listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:11368) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
[ERROR] 🚨 Exception [hok7gUZBwvgw8tZqKw29T] POST http://api:4000/api/agent/agents/rbac-module-subjects-check {
  "message": "Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded",
  "stack": "Error: Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/check.ts:47:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 500,
  "causes": [
    {
      "message": "Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded",
      "stack": "Error: Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/check.ts:47:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
```

### Sample 2

```text
(node:10031) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
(node:10031) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGINT listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:10031) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGTERM listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:10031) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGHUP listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:11368) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
[ERROR] 🚨 Exception [hok7gUZBwvgw8tZqKw29T] POST http://api:4000/api/agent/agents/rbac-module-subjects-check {
  "message": "Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded",
  "stack": "Error: Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/check.ts:47:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 500,
  "causes": [
    {
      "message": "Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded",
      "stack": "Error: Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/check.ts:47:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

### Sample 3

```text
(Use `node --trace-warnings ...` to show where the warning was created)
(node:10031) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGINT listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:10031) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGTERM listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:10031) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGHUP listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(node:11368) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
(Use `node --trace-warnings ...` to show where the warning was created)
[ERROR] 🚨 Exception [hok7gUZBwvgw8tZqKw29T] POST http://api:4000/api/agent/agents/rbac-module-subjects-check {
  "message": "Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded",
  "stack": "Error: Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/check.ts:47:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 500,
  "causes": [
    {
      "message": "Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded",
      "stack": "Error: Internal server error: MAX_PARAMETERS_EXCEEDED: Max number of parameters (65534) exceeded\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/check.ts:47:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
(node:11946) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 exit listeners added to [process]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
```

## Fingerprint Source

```text
api_api|http://api:4000/api/agent/agents/rbac-module-subjects-check|MAX_PARAMETERS_EXCEEDED: Max number of parameters exceeded
```
