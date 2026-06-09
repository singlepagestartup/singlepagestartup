# Issue: [log-watch] [LW-8fab42de873b] api_api Permission error. You do not have access to this resource: {"route":"/","method":"GET","type":"HTTP"}

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/179
**Issue**: #179
**Status**: Research Needed
**Created**: 2026-05-03
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

This copied production log-watch error must be reproduced and fixed in SPS. The original report came from production, but the current local SPS workspace has been started with a database dump from the affected project, so the failure should be treated as locally reproducible.

## Key Details

- Source issue: https://github.com/flakecode/doctorgpt/issues/15
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

Copied from https://github.com/flakecode/doctorgpt/issues/15

Original repository: `flakecode/doctorgpt`
Original issue: #15
Original author: @flakecode
Original created at: 2026-05-02T02:00:04Z
Original updated at: 2026-05-02T02:00:04Z

---

Automated production log watchdog found this error more than 3 times in the last `1h`.

Fingerprint: `LW-8fab42de873b`
Detected at: `2026-05-02T02:00:03+00:00`
Service: `api_api`
Containers: `api_api.1.m55knlo8b4rsj5vsogx8x35jj`, `api_api.2.t780z64106fvcwidmtf3yropn`
Occurrences in window: `4`

## Error

```text
Permission error. You do not have access to this resource: {"route":"/","method":"GET","type":"HTTP"}
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
  "causes": [
    {
      "message": "Permission error. You do not have access to this resource: {\"route\":\"/wp-json/gravitysmtp/v1/tests/mock-data\",\"method\":\"GET\",\"type\":\"HTTP\"}",
      "stack": "Error: Permission error. You do not have access to this resource: {\"route\":\"/wp-json/gravitysmtp/v1/tests/mock-data\",\"method\":\"GET\",\"type\":\"HTTP\"}\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/middlewares/src/lib/is-authorized/index.ts:166:19)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
[ERROR] 🚨 Exception [DnksiWSqOyZyCkLrb8xYl] GET http://api:4000/api/rbac/subjects/authentication/is-authorized?permission[route]=%2F&permission[method]=GET&permission[type]=HTTP {
  "message": "Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}",
  "stack": "Error: Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/is-authorized/index.ts:76:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 403,
  "causes": [
    {
      "message": "Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}",
      "stack": "Error: Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/is-authorized/index.ts:76:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

### Sample 2

```text
    {
      "message": "Permission error. You do not have access to this resource: {\"route\":\"/wp-json/gravitysmtp/v1/tests/mock-data\",\"method\":\"GET\",\"type\":\"HTTP\"}",
      "stack": "Error: Permission error. You do not have access to this resource: {\"route\":\"/wp-json/gravitysmtp/v1/tests/mock-data\",\"method\":\"GET\",\"type\":\"HTTP\"}\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/middlewares/src/lib/is-authorized/index.ts:166:19)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
[ERROR] 🚨 Exception [DnksiWSqOyZyCkLrb8xYl] GET http://api:4000/api/rbac/subjects/authentication/is-authorized?permission[route]=%2F&permission[method]=GET&permission[type]=HTTP {
  "message": "Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}",
  "stack": "Error: Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/is-authorized/index.ts:76:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 403,
  "causes": [
    {
      "message": "Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}",
      "stack": "Error: Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/is-authorized/index.ts:76:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

### Sample 3

```text
  "causes": [
    {
      "message": "Permission error. You do not have access to this resource: {\"route\":\"/wp-json/gravitysmtp/v1/tests/mock-data\",\"method\":\"GET\",\"type\":\"HTTP\"}",
      "stack": "Error: Permission error. You do not have access to this resource: {\"route\":\"/wp-json/gravitysmtp/v1/tests/mock-data\",\"method\":\"GET\",\"type\":\"HTTP\"}\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/is-authorized/index.ts:76:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
[ERROR] 🚨 Exception [h5FKte7w2qznpveaWYIm-] GET http://api.drgpt.ru/ {
  "message": "Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}",
  "stack": "Error: Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/middlewares/src/lib/is-authorized/index.ts:166:19)\n    at processTicksAndRejections (native:7:39)",
  "status": 403,
  "causes": [
    {
      "message": "Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}",
      "stack": "Error: Permission error. You do not have access to this resource: {\"route\":\"/\",\"method\":\"GET\",\"type\":\"HTTP\"}\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/middlewares/src/lib/is-authorized/index.ts:166:19)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

## Fingerprint Source

```text
api_api||Permission error. You do not have access to this resource: {"route":"/","method":"GET","type":"HTTP"}
```
