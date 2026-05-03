# Issue: [log-watch] [LW-fe596862c7a7] api_api Validation error. 'props.<id>.description' is empty.

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/175
**Issue**: #175
**Status**: Research Needed
**Created**: 2026-05-03
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

This copied production log-watch error must be reproduced and fixed in SPS. The original report came from production, but the current local SPS workspace has been started with a database dump from the affected project, so the failure should be treated as locally reproducible.

## Key Details

- Source issue: https://github.com/flakecode/doctorgpt/issues/11
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

Copied from https://github.com/flakecode/doctorgpt/issues/11

Original repository: `flakecode/doctorgpt`
Original issue: #11
Original author: @flakecode
Original created at: 2026-05-01T02:00:08Z
Original updated at: 2026-05-01T02:00:08Z

---

Automated production log watchdog found this error more than 3 times in the last `1h`.

Fingerprint: `LW-fe596862c7a7`
Detected at: `2026-05-01T02:00:06+00:00`
Service: `api_api`
Containers: `api_api.1.m55knlo8b4rsj5vsogx8x35jj`, `api_api.2.t780z64106fvcwidmtf3yropn`
Occurrences in window: `5`

## Error

```text
Validation error. 'props.<id>.description' is empty.
```

## Request Data From Logs

Methods:
_not found in logs_

Paths / URLs:
_not found in logs_

Statuses:

- `400`

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
      "message": "Not Found error. Not Found",
      "stack": "Error: Not Found error. Not Found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:40:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
[ERROR] 🚨 Exception [phNz9Ag3fJ3zc0znnzH98] POST http://api:4000/api/agent/agents/telegram-bot? {
  "message": "Validation error. 'props.socialModuleMessage.description' is empty.",
  "stack": "Error: Validation error. 'props.socialModuleMessage.description' is empty.\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:72:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 400,
  "causes": [
    {
      "message": "Validation error. 'props.socialModuleMessage.description' is empty.",
      "stack": "Error: Validation error. 'props.socialModuleMessage.description' is empty.\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:72:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

### Sample 2

```text
    {
      "message": "Not Found error. Not Found",
      "stack": "Error: Not Found error. Not Found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:40:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
[ERROR] 🚨 Exception [phNz9Ag3fJ3zc0znnzH98] POST http://api:4000/api/agent/agents/telegram-bot? {
  "message": "Validation error. 'props.socialModuleMessage.description' is empty.",
  "stack": "Error: Validation error. 'props.socialModuleMessage.description' is empty.\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:72:17)\n    at processTicksAndRejections (native:7:39)",
  "status": 400,
  "causes": [
    {
      "message": "Validation error. 'props.socialModuleMessage.description' is empty.",
      "stack": "Error: Validation error. 'props.socialModuleMessage.description' is empty.\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts:72:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
```

### Sample 3

```text
  "status": 404,
  "causes": [
    {
      "message": "Not Found error. Not Found",
      "stack": "Error: Not Found error. Not Found\n    at new HTTPException (/usr/src/app/node_modules/hono/dist/http-exception.js:6:5)\n    at <anonymous> (/usr/src/app/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:244:17)\n    at processTicksAndRejections (native:7:39)"
    }
  ]
}
[ERROR] 1 | // src/http-exception.ts
2 | var HTTPException = class extends Error {
3 |   res;
4 |   status;
5 |   constructor(status = 500, options) {
6 |     super(options?.message, { cause: options?.cause });
        ^
error: {"message":"Validation error. 'props.socialModuleMessage.description' is empty.","status":400,"cause":[{"message":"Validation error. 'props.socialModuleMessage.description' is empty."}]}
    res: undefined,
 status: 400,
```

## Fingerprint Source

```text
api_api||Validation error. 'props.<id>.description' is empty.
```
