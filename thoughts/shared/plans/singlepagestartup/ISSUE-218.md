---
date: 2026-07-28T17:08:52+03:00
issue_number: 218
repository: singlepagestartup
topic: "Fix page-cache handler for string URL values"
status: in_review
---

# Fix Page-Cache Handler for String URL Values Implementation Plan

## Overview

Update the Agent page-cache handler to consume the Host service's
`{ url: string }` contract, build canonical localized page paths, and preserve
per-page failure isolation. Add focused BDD coverage for every path and
continuation case required by issue #218.

## Current State Analysis

The Host page service declares and returns flattened `{ url: string }[]`
records, including `"/"` for the root and leading-slash strings for nested
pages
(`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:11-13`,
`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:180-198`,
`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:225-238`).

The Agent page-cache handler iterates those records for every configured
language but calls `.join("/")` on each string while constructing the page
path
(`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:23-33`).
This throws before the inner per-page error boundary, so revalidation and page
fetching never begin. The existing inner boundary already logs downstream
failures and continues to later language/URL iterations
(`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:35-50`).

No focused page-cache controller spec currently exists. Nearby Agent scheduled
controller tests establish the repository's BDD header, mocked dependency,
minimal context, and direct Handler invocation pattern
(`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/check.spec.ts:1-73`).

## Desired End State

For every `{ url: string }` returned by the Host service, the handler produces
one canonical absolute page URL for every configured language, passes the same
URL to revalidation and page fetching, and continues processing after a
per-page downstream failure.

With the current Host base URL and language configuration, the required
observable paths are:

- root, default language: `http://localhost:3000/`
- nested, default language: `http://localhost:3000/gallery/item`
- root, non-default language: `http://localhost:3000/ru/`
- nested, non-default language: `http://localhost:3000/ru/gallery/item`

The local authenticated page-cache POST completes successfully and no longer
emits `url.url.join is not a function`.

### Key Discoveries

- The string URL contract is already authoritative in the Host service; the
  mismatch is isolated to the Agent consumer
  (`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:11-13`,
  `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:23-33`).
- English is the default language and Russian is the non-default language, so
  the handler must preserve the existing empty/default and `ru/` prefix
  semantics
  (`libs/shared/configuration/src/lib/internationalization/index.ts:1-15`).
- Revalidation and page fetch calls already share the constructed absolute
  path, and the inner catch already provides continuation semantics
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:35-50`,
  `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:65-80`).
- The project-qualified Agent Jest target is the reliable focused-test command;
  the shared `npm run test:file` wrapper has a recorded Nx parsing failure
  (`thoughts/shared/processes/singlepagestartup/ISSUE-183.md`).

## What We're NOT Doing

- Changing the Host page service, its `{ url: string }[]` contract, or its URL
  generation behavior.
- Changing route registration, authorization middleware, environment values,
  or internationalization configuration.
- Changing the seed flow's GET/POST mismatch; it is separate from the page-cache
  string-contract acceptance criteria.
- Changing the handler's downstream failure policy, logging contract, or
  revalidate-then-fetch ordering.
- Adding database schema changes, migrations, repository snapshots, or data
  modifications.
- Adding frontend or Browser UI controls for this scheduled backend endpoint.

## Implementation Approach

Treat each Host record's `.url` value as the documented string at the Agent
boundary. Normalize the page-relative portion and optional language prefix
while composing the existing Host service base URL so root and nested paths
contain exactly one separator. Keep the current URL/language loops,
revalidation call, page GET, and per-page error boundary intact.

Add a colocated controller spec that drives the real Handler with mocked Host
URL records, language configuration, revalidation/page responses, logger, and
Hono context. Assert observable paths and continuation behavior rather than
source-code structure.

## Phase 1: Normalize Localized Page Paths

### Overview

Align the Agent page-cache consumer with the Host service's string URL contract
without changing route, service, or failure-handling boundaries.

### Changes Required

#### 1. Agent page-cache handler

**File**:
`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts`

**Why**: This is the only production location that treats the Host URL string
as an array and aborts before revalidation or fetching.

**Changes**:

- Consume `url.url` as a string.
- Normalize the Host base URL, optional non-default language segment, and page
  string so the four required root/nested/default/non-default paths contain
  exactly one separator.
- Preserve the current loop order, one revalidation plus one page fetch per
  URL/language combination, and the existing inner catch that allows later
  combinations to continue.
- Preserve the successful `{ data: { ok: true } }` response and existing error
  mapping outside the per-page boundary.

### Success Criteria

#### Automated Verification

- [x] The focused page-cache BDD spec introduced in Phase 2 passes for the four
      required localized path shapes.
- [x] Agent TypeScript validation passes:
      `npx nx run @sps/agent:tsc:build`.
- [x] Agent linting passes:
      `npx nx run @sps/agent:eslint:lint`.

#### Manual Verification

- [x] Root and nested Host URL strings no longer throw during path construction.
- [x] Default-language paths omit the language segment; Russian paths contain
      one `ru` segment.
- [x] Revalidation still precedes the page GET for each combination.

---

## Phase 2: Add Focused BDD Regression Coverage

### Overview

Protect the string-contract fix and the existing continuation semantics with a
dedicated controller-level unit spec.

### Changes Required

#### 1. Page-cache controller specification

**File**:
`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.spec.ts`

**Why**: No current test executes this Handler with `{ url: string }` records or
asserts its localized page-cache paths.

**Changes**:

- Add the required top-level `BDD Suite` JSDoc and per-test `BDD Scenario`
  JSDoc blocks with explicit Given/When/Then lines.
- Mock `HOST_SERVICE_URL`, `RBAC_SECRET_KEY`, English/Russian
  internationalization, backend logging/error mapping, the Host `urls()`
  service, global page fetch behavior, and a minimal JSON response context.
- Cover `"/"` and `"/gallery/item"` fixtures across default and non-default
  languages.
- Assert the exact revalidation and page-fetch paths for all four combinations,
  including the root trailing slash and absence of doubled separators.
- Simulate a failed page operation followed by a successful later URL and
  assert that later revalidation/fetch work still executes and the handler
  returns success.
- Restore mocked global fetch state after each scenario so the spec is isolated.

### Success Criteria

#### Automated Verification

- [x] Focused page-cache tests pass:
      `npx nx run @sps/agent:jest:test --testFile=libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.spec.ts`.
- [x] The full Agent unit target passes:
      `npx nx run @sps/agent:jest:test`.
- [x] Assertions demonstrate that every URL/language combination reaches
      revalidation and page fetching.
- [x] Assertions demonstrate that a failed page does not prevent a later page
      from running.

#### Manual Verification

- [x] Test names and JSDoc describe behavior rather than implementation details.
- [x] The spec uses the real Handler and observable calls, without reading or
      matching source text.

---

## Phase 3: Verify the Live Page-Cache Endpoint

### Overview

Re-run the original production-equivalent local request and confirm the failure
signature is absent from the live API path.

### Changes Required

No additional production file changes are expected in this phase. Verification
uses the existing local API and Host processes.

### Success Criteria

#### Automated Verification

- [x] `git diff --check` passes.
- [x] Focused Jest, full Agent Jest, Agent TypeScript, and Agent lint commands
      listed above complete successfully.

#### Manual Verification

- [x] Authenticated
      `POST http://127.0.0.1:4000/api/agent/agents/host-module-page-cache`
      returns HTTP 200 with `{ data: { ok: true } }`.
- [x] The response and API logs contain no
      `url.url.join is not a function` signature.
- [x] Root, nested, default-language, and Russian page paths reach the existing
      revalidation/page-fetch flow.
- [x] A downstream page failure remains logged and isolated while later pages
      continue.

## Testing Strategy

### Unit Tests

- Exercise the Handler directly with `{ url: string }` fixtures.
- Assert exact root/nested paths for English and Russian.
- Assert revalidate-before-fetch ordering and one pair of operations per
  URL/language combination.
- Assert continuation after a failed page followed by a successful page.
- Assert the successful handler response once all combinations have been
  attempted.

### Integration Tests

- No new database-backed scenario is required because the defect is isolated to
  controller path composition and downstream-call orchestration.
- Use the existing running API/Host stack for the production-equivalent endpoint
  check after unit verification.

### Manual Testing Steps

1. Start or confirm the API on port 4000 and Host on port 3000.
2. Source the existing API environment without printing the RBAC secret.
3. POST to `/api/agent/agents/host-module-page-cache` with
   `X-RBAC-SECRET-KEY`.
4. Confirm HTTP 200 and the success JSON payload.
5. Inspect API/Host output for the absence of the original type error and for
   continued processing if any individual page cannot be fetched.

## Performance Considerations

The handler remains `O(urls × languages)` and retains one revalidation plus one
page GET per combination. Path normalization is local string processing and
does not introduce additional network requests or data reads.

## Migration Notes

No schema, data, configuration, or migration work is required. Rollback is
limited to reverting the Agent handler and its colocated regression spec.

## References

- Original ticket:
  `thoughts/shared/tickets/singlepagestartup/ISSUE-218.md`
- Approved research:
  `thoughts/shared/research/singlepagestartup/ISSUE-218.md`
- Process log:
  `thoughts/shared/processes/singlepagestartup/ISSUE-218.md`
- GitHub issue:
  https://github.com/singlepagestartup/singlepagestartup/issues/218
