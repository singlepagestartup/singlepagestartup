# Issue: [log-watch] [LW-58b203387c4a] api_api Not Found error. Page with url /%22/\_next/static/chunks/<id>.js%22 not found

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/182
**Issue**: #182
**Status**: Research Needed
**Created**: 2026-05-03
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

This copied production log-watch error must be reproduced and fixed in SPS. The original report came from production, but the current local SPS workspace has been started with a database dump from the affected project, so the failure should be treated as locally reproducible.

## Key Details

- Source issue: https://github.com/flakecode/doctorgpt/issues/18
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

Copied from https://github.com/flakecode/doctorgpt/issues/18

Original repository: `flakecode/doctorgpt`
Original issue: #18
Original author: @flakecode
Original created at: 2026-05-02T03:00:10Z
Original updated at: 2026-05-02T03:00:10Z

---

Automated production log watchdog found this error more than 3 times in the last `1h`.

Fingerprint: `LW-58b203387c4a`
Detected at: `2026-05-02T03:00:08+00:00`
Service: `api_api`
Containers: `api_api.1.m55knlo8b4rsj5vsogx8x35jj`, `api_api.2.t780z64106fvcwidmtf3yropn`
Occurrences in window: `14`

## Error

```text
Not Found error. Page with url /%22/_next/static/chunks/<id>.js%22 not found
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
      "message": "Not Found error. Page with url /wp-json/gravitysmtp/v1/tests/mock-data not found",
      "stack": "Error: Not Found error. Page with url /wp-json/gravitysmtp/v1/tests/mock-data not found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:41:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
[ERROR] 🚨 Exception [t8cvrkNUFT01nJMp4VH_C] GET http://api:4000/api/host/pages/find-by-url?url=%2F%2522%2F_next%2Fstatic%2Fchunks%2F729-b75c2cb2d6e12e41.js%2522 {
  "message": "Not Found error. Page with url /%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22 not found",
  "stack": "Error: Not Found error. Page with url /%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22 not found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:41:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 404,
  "causes": [
    {
      "message": "Not Found error. Page with url /%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22 not found",
      "stack": "Error: Not Found error. Page with url /%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22 not found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:41:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

### Sample 2

```text
  "causes": [
    {
      "message": "Not Found error. Page with url /%22/_next/static/chunks/app/%5B%5B...url%5D%5D/page-65843dfda759d7ec.js%22 not found",
      "stack": "Error: Not Found error. Page with url /%22/_next/static/chunks/app/%5B%5B...url%5D%5D/page-65843dfda759d7ec.js%22 not found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:41:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
[ERROR] 🚨 Exception [6S2H31hj4pgWl3c3TstB3] GET http://api:4000/api/host/pages/find-by-url?url=%2F%2522%2F_next%2Fstatic%2Fchunks%2F135-21d596c62729608b.js%2522 {
  "message": "Not Found error. Page with url /%22/_next/static/chunks/135-21d596c62729608b.js%22 not found",
  "stack": "Error: Not Found error. Page with url /%22/_next/static/chunks/135-21d596c62729608b.js%22 not found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:41:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 404,
  "causes": [
    {
      "message": "Not Found error. Page with url /%22/_next/static/chunks/135-21d596c62729608b.js%22 not found",
      "stack": "Error: Not Found error. Page with url /%22/_next/static/chunks/135-21d596c62729608b.js%22 not found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:41:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

### Sample 3

```text
  "causes": [
    {
      "message": "Not Found error. Page with url /%22/_next/static/chunks/135-21d596c62729608b.js%22 not found",
      "stack": "Error: Not Found error. Page with url /%22/_next/static/chunks/135-21d596c62729608b.js%22 not found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:41:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
[ERROR] 🚨 Exception [PI3HTIhU5EXZY-6YWhXlx] GET http://api:4000/api/host/pages/find-by-url?url=%2F%2522%2F_next%2Fstatic%2Fchunks%2F820b9396-20df07f6879405e3.js%2522 {
  "message": "Not Found error. Page with url /%22/_next/static/chunks/820b9396-20df07f6879405e3.js%22 not found",
  "stack": "Error: Not Found error. Page with url /%22/_next/static/chunks/820b9396-20df07f6879405e3.js%22 not found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:41:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 404,
  "causes": [
    {
      "message": "Not Found error. Page with url /%22/_next/static/chunks/820b9396-20df07f6879405e3.js%22 not found",
      "stack": "Error: Not Found error. Page with url /%22/_next/static/chunks/820b9396-20df07f6879405e3.js%22 not found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:41:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

## Fingerprint Source

```text
api_api||Not Found error. Page with url /%22/_next/static/chunks/<id>.js%22 not found
```
