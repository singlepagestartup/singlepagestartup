# Issue: [log-watch] [LW-6963a17a500a] api_api NX Running target models:payment-intent:<id> for project @sps/billing failed

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/172
**Issue**: #172
**Status**: Research Needed
**Created**: 2026-05-03
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

This copied production log-watch error must be reproduced and fixed in SPS. The original report came from production, but the current local SPS workspace has been started with a database dump from the affected project, so the failure should be treated as locally reproducible.

## Key Details

- Source issue: https://github.com/flakecode/doctorgpt/issues/5
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

Copied from https://github.com/flakecode/doctorgpt/issues/5

Original repository: `flakecode/doctorgpt`
Original issue: #5
Original author: @flakecode
Original created at: 2026-04-30T15:47:32Z
Original updated at: 2026-04-30T15:47:32Z

---

Automated production log watchdog found this error more than 3 times in the last `1h`.

Fingerprint: `LW-6963a17a500a`
Detected at: `2026-04-30T15:47:30+00:00`
Service: `api_api`
Containers: `api_api.1.orvhniflf552z3b2244nvj9n9`, `api_api.2.t6fihs7f45uea47nslewke8jd`
Occurrences in window: `4`

## Error

```text
NX Running target models:payment-intent:<id> for project @sps/billing failed
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

> nx run @sps/billing:"models:payment-intent:repository-migrate"

> bun run ./src/lib/migrate.ts




 NX   Running target models:payment-intent:repository-migrate for project @sps/billing failed

Failed tasks:

- @sps/billing:models:payment-intent:repository-migrate

Hint: run the command with --verbose for more details.



```

### Sample 2

```text

> bun run ./src/lib/migrate.ts




 NX   Running target models:payment-intent:repository-migrate for project @sps/billing failed

Failed tasks:

- @sps/billing:models:payment-intent:repository-migrate

Hint: run the command with --verbose for more details.




 NX   Running target models:repository-migrate for project @sps/billing failed
```

### Sample 3

```text

> nx run @sps/billing:"models:payment-intent:repository-migrate"

> bun run ./src/lib/migrate.ts




 NX   Running target models:payment-intent:repository-migrate for project @sps/billing failed

Failed tasks:

- @sps/billing:models:payment-intent:repository-migrate

Hint: run the command with --verbose for more details.



```

## Fingerprint Source

```text
api_api||NX Running target models:payment-intent:<id> for project @sps/billing failed
```
