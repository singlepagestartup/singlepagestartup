# Issue: [log-watch] [LW-4b793fca2648] api_api Not Found error. Not Found

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/174
**Issue**: #174
**Status**: Research Needed
**Created**: 2026-05-03
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

This copied production log-watch error must be reproduced and fixed in SPS. The original report came from production, but the current local SPS workspace has been started with a database dump from the affected project, so the failure should be treated as locally reproducible.

## Key Details

- Source issue: https://github.com/flakecode/doctorgpt/issues/10
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

Copied from https://github.com/flakecode/doctorgpt/issues/10

Original repository: `flakecode/doctorgpt`
Original issue: #10
Original author: @flakecode
Original created at: 2026-05-01T02:00:04Z
Original updated at: 2026-05-01T02:00:04Z

---

Automated production log watchdog found this error more than 3 times in the last `1h`.

Fingerprint: `LW-4b793fca2648`
Detected at: `2026-05-01T02:00:02+00:00`
Service: `api_api`
Containers: `api_api.1.m55knlo8b4rsj5vsogx8x35jj`, `api_api.2.t780z64106fvcwidmtf3yropn`
Occurrences in window: `7`

## Error

```text
Not Found error. Not Found
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

## Project Context

The watchdog inspects `/root/.picoclaw/workspace/doctorgpt` and tries to connect the Docker error to concrete code paths, models, and tables. This section is critical for triage; if it is empty or low-confidence, manually inspect the matching endpoint/service before acting.

```json
{}
```

## Postgres Context

_No database rows matched extracted UUIDs, or no UUIDs were present in the error context._

## Log Context Samples

### Sample 1

```text
TimeoutNegativeWarning: -820572.8157693982 is a negative number.
Timeout duration was set to 1.
      at reconnect (/usr/src/app/node_modules/postgres/src/connection.js:353:5)
      at connect (/usr/src/app/node_modules/postgres/src/connection.js:113:7)
      at connect (/usr/src/app/node_modules/postgres/src/index.js:392:7)
      at <anonymous> (/usr/src/app/node_modules/postgres/src/query.js:140:65)

[ERROR] 🚨 Exception [ss8ErKtr3er4UvwRz2JE9] POST http://api:4000/api/notification/templates/abc47443-2f59-4c91-b99e-888bbba209f6/render? {
  "message": "Not Found error. Not Found",
  "stack": "Error: Not Found error. Not Found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/render/index.ts:72:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 404,
  "causes": [
    {
      "message": "Not Found error. Not Found",
      "stack": "Error: Not Found error. Not Found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/render/index.ts:72:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

### Sample 2

```text
  "causes": [
    {
      "message": "Not Found error. Not Found",
      "stack": "Error: Not Found error. Not Found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/render/index.ts:72:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
[ERROR] 🚨 Exception [n75ZGb4v5QwTbTDqBXWev] POST http://api:4000/api/notification/notifications/eeb924c7-4162-47da-9076-3435d14d7ceb/send? {
  "message": "Not Found error. Not Found",
  "stack": "Error: Not Found error. Not Found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:40:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 404,
  "causes": [
    {
      "message": "Not Found error. Not Found",
      "stack": "Error: Not Found error. Not Found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:40:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

### Sample 3

```text
  "causes": [
    {
      "message": "Not Found error. Not Found",
      "stack": "Error: Not Found error. Not Found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:40:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
[ERROR] 🚨 Exception [avr7QhpfxO-FYaQLrcm0S] POST http://api:4000/api/notification/notifications/9c1b6e7f-0c12-4982-bd10-34c8af21370a/send? {
  "message": "Not Found error. Not Found",
  "stack": "Error: Not Found error. Not Found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:40:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 404,
  "causes": [
    {
      "message": "Not Found error. Not Found",
      "stack": "Error: Not Found error. Not Found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:40:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

## Fingerprint Source

```text
api_api||Not Found error. Not Found
```
