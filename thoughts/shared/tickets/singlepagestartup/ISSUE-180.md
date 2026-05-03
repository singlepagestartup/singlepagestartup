# Issue: [log-watch] [LW-c5696ab78964] host_host Not Found error. Page with url /%22/\_next/static/chunks/<id>.js%22 not found

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/180
**Issue**: #180
**Status**: Research Needed
**Created**: 2026-05-03
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

This copied production log-watch error must be reproduced and fixed in SPS. The original report came from production, but the current local SPS workspace has been started with a database dump from the affected project, so the failure should be treated as locally reproducible.

## Key Details

- Source issue: https://github.com/flakecode/doctorgpt/issues/16
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

Copied from https://github.com/flakecode/doctorgpt/issues/16

Original repository: `flakecode/doctorgpt`
Original issue: #16
Original author: @flakecode
Original created at: 2026-05-02T03:00:04Z
Original updated at: 2026-05-02T03:00:04Z

---

Automated production log watchdog found this error more than 3 times in the last `1h`.

Fingerprint: `LW-c5696ab78964`
Detected at: `2026-05-02T03:00:02+00:00`
Service: `host_host`
Containers: `host_host.1.b5vl4mo5s7xah8t9nayvl2q6i`
Occurrences in window: `26`

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

- `404`

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
  "message": "Not Found error. Page with url /wp-json/gravitysmtp/v1/tests/mock-data not found",
  "status": 404,
  "cause": [
    {
      "message": "Not Found error. Page with url /wp-json/gravitysmtp/v1/tests/mock-data not found"
    }
  ]
}
❌ API Error: {
  "message": "Not Found error. Page with url /%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22 not found",
  "status": 404,
  "cause": [
    {
      "message": "Not Found error. Page with url /%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22 not found"
    }
  ]
}
❌ API Error: {
```

### Sample 2

```text
  "status": 404,
  "cause": [
    {
      "message": "Not Found error. Page with url /wp-json/gravitysmtp/v1/tests/mock-data not found"
    }
  ]
}
❌ API Error: {
  "message": "Not Found error. Page with url /%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22 not found",
  "status": 404,
  "cause": [
    {
      "message": "Not Found error. Page with url /%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22 not found"
    }
  ]
}
❌ API Error: {
  "message": "Not Found error. Page with url /%22/_next/static/chunks/app/%5B%5B...url%5D%5D/page-65843dfda759d7ec.js%22 not found",
```

### Sample 3

```text
  "message": "Not Found error. Page with url /%22/_next/static/chunks/app/%5B%5B...url%5D%5D/page-65843dfda759d7ec.js%22 not found",
  "status": 404,
  "cause": [
    {
      "message": "Not Found error. Page with url /%22/_next/static/chunks/app/%5B%5B...url%5D%5D/page-65843dfda759d7ec.js%22 not found"
    }
  ]
}
❌ API Error: {
  "message": "Not Found error. Page with url /%22/_next/static/chunks/135-21d596c62729608b.js%22 not found",
  "status": 404,
  "cause": [
    {
      "message": "Not Found error. Page with url /%22/_next/static/chunks/135-21d596c62729608b.js%22 not found"
    }
  ]
}
❌ API Error: {
```

## Fingerprint Source

```text
host_host||Not Found error. Page with url /%22/_next/static/chunks/<id>.js%22 not found
```
