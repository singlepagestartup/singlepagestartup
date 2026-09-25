---
issue_number: 304
issue_title: "Harden upload validation and static file delivery"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-25T22:33:36Z
status: active
current_phase: implement
---

# Process Log: ISSUE-304 - Harden upload validation and static file delivery

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: lead review of PR #331; fixes land on the same branch

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings N-03, SEC-31, SEC-10. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: verified every ticket claim against `78d7d43125`. The static route
  (`apps/api/app.ts:69-114`) sets only `Content-Type` and `Content-Length`;
  three handlers take uploaded bytes (create, update, create-from-url) with no
  size bound beyond Bun's 128 MiB request default; both multipart handlers
  return inside the loop after the first file, and a repeated field or a
  `file[]` array is not counted. Every caller sends at most one file, under
  `file`. `nosniff` and a CSP header leave image, media and CSS background
  loads alone; `sandbox` affects PDFs in frames and, per a 2024 report, PDFs
  opened directly in Safari.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-304.md`.
- Notes: the deployer never forwards `FILE_STORAGE_PROVIDER`, so the provider
  recommendation is documentation plus a decision for the lead. The update
  handler creates a row when a `PATCH` has no file; recorded as an
  observation outside scope.

### Plan

- Summary: four phases. Delivery headers in the static route with an
  issue-304 scenario spec; one file per multipart request on create and
  update; a configurable upload limit (environment value, a route middleware
  in a new model-level middleware folder, the controller wiring, a 400
  keyword for Hono's body-limit error, a capped read in `create-from-url`);
  deployer, local environment and README changes. Plan approval is delegated
  to the issue agent for this wave.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-304.md`.
- Notes: PDFs keep the `sandbox` header, as the scope asks for every
  response; the Safari report is raised for a decision. Forwarding
  `FILE_STORAGE_PROVIDER` through the deployer is left out because the
  example environment sets `vercel-blob` with a placeholder token.

### Implement

- Summary: all four phases done. Every served file carries `nosniff` and
  `Content-Security-Policy: sandbox`; a multipart create or update takes one
  file; `FILE_STORAGE_MAX_UPLOAD_BYTES` (50 MiB) is enforced by a new model route
  middleware and by a capped read in `create-from-url`, with Hono's body-limit
  message mapped to 400; the variable mirrored in the deployer and local
  environment; module and deployer README sections. Unit, integration, lint,
  type and scenario checks pass; each guard was mutation-checked; the
  behavior was proven with `curl` and in Chromium against the API on 4304.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-304-progress.md`,
  code and specs listed there; commits `473c88d29c` and `39f810e541`;
  PR #331 (`thoughts/shared/prs/331_description.md`).
- Notes: the `create-from-url` scenarios live in the controller spec. The
  scenario suite ran through the jest CLI because the shared Redis does not
  answer and the runner's cache preflight fails.
- Review round 1 (PR #331): an upload over the limit answers 413 through a
  `Payload Too Large error` category of the shared error mapper, thrown with
  one message by the middleware and both `create-from-url` checks
  (`da0e2e9493`).

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 4 -->

### Incident 1 — Blob return type conflicts in the API program

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `tsc -p apps/api/tsconfig.json` gained two errors in
  `create-from-url/index.ts` while the module program passed.
- **Root Cause**: the API program loads `bun-types`, whose `Blob` differs from
  the DOM `Blob`; an explicit `Promise<Blob>` return type picked Bun's.
- **Fix**: rely on inference for `readBody`; chunks typed
  `Uint8Array<ArrayBuffer>[]`.
- **Preventive Action**: compare the API program's errors with the baseline
  instead of expecting a clean run.
- **References**: progress file, Incident 1.

### Incident 2 — Mutation run hung on an endless stream

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: the `create-from-url` mutation produced no result, then hung
  until killed; `timeout` is missing on macOS.
- **Root Cause**: an endless `ReadableStream` in the scenario.
- **Fix**: a finite, over-limit stream.
- **Preventive Action**: finite inputs in guard tests.
- **References**: research document, Known Pitfalls.

### Incident 3 — Scenario filter not applied through Nx

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `nx run api:jest:scenario --testPathPattern=issue-304` ran every
  scenario suite against the 4304 API.
- **Root Cause**: the option did not reach jest.
- **Fix**: `npx jest -c apps/api/jest.scenario.config.ts <issue dir>`. The
  other suites stopped before writing; issue-160 deleted its own product.
- **Preventive Action**: run one scenario suite through the jest CLI.
- **References**: progress file, Incident 3.

### Incident 4 — Shared Redis does not answer

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the scenario runner's HTTP-cache preflight answered 500.
- **Root Cause**: `sps-lite-redis-1` on localhost:6384 accepts TCP but answers
  no command.
- **Fix**: ran the suite without the runner; left the shared container alone
  and reported it.
- **Preventive Action**: probe Redis with a raw `PING` before debugging the
  cache middleware.
- **References**: progress file, Incident 4.

## Reusable Learnings

- Pin `SCENARIO_API_PORT` to the assigned port: the scenario runner reuses any
  API already listening on its preferred port.
- Run one scenario suite with
  `npx jest -c apps/api/jest.scenario.config.ts apps/api/specs/scenario/<project>/issue-<n>`.
- Give guard tests finite inputs, so a removed guard fails an assertion
  instead of hanging the run.
- In-process `hono.request` with a `FormData` body sends no `Content-Length`,
  so Hono's `bodyLimit` takes its streaming path; set the header explicitly to
  test the declared-length path.
