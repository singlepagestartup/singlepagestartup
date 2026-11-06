# PR #266 PayKeeper identifier validation

Date: 2026-11-02. Source: `9cc3bb67eaaea81284dd49250964dca0e2f1f530`.
Comparison base: `81d75b1f0d` (main, including the requested workspace metadata commit).

## Scope and review

Main no longer rewrites malformed UUID equality to text LIKE. The PayKeeper
service still passes unvalidated `orderid` to the UUID-backed relation filter.
The PR remains applicable because it rejects that input before the SDK lookup
and produces a predictable 400 instead of relying on a database exception.
The generic query builder is unchanged.

The original validator was a pure function placed among model services. It now
lives in the existing backend utility package at
`libs/shared/backend/utils/src/lib/webhook-identifiers/index.ts`, exported as
`validateWebhookIdentifiers` and `IValidateWebhookIdentifiersProps`. There is
no duplicate copy at the former billing service path. Plain-object validation
also rejects arrays, null, scalar JSON values and non-plain object instances.
Optional string fields preserve the PR's empty/absent/null compatibility.

The PayKeeper service validates the payload before reading fields or querying
relations. The returned UUID reaches the existing `eq` SDK filter unchanged.
A canonical unknown UUID retains 404; the known-invoice unit scenario retains
invoice update and callback behavior. Owning SDK calls and their cache/revalidation
transport remain in place; no direct SQL or new mutation path is introduced.

Twenty-three console.log statements were removed from the PayKeeper service,
including the Basic Authorization header and full props/provider body dumps.
The service success-path test asserts no console.log calls. Existing global
provider-webhook debug logging and errors containing provider response text are
outside this change; this is not a claim of complete log redaction.

## Verification

- Billing Jest: six suites, 31 tests pass.
- Backend utils Jest: nine suites, 167 tests pass. The new utility suite covers
  malformed payloads, UUID/type failures, safe 400 messages, UUID case preservation,
  empty fields, absent/null fields and null-prototype payloads.
- Full API scenario: nine tests pass through candidate API port 4001 with local
  PostgreSQL. Malformed form UUIDs and JSON field types/shapes return 400 without
  repeating sentinel values in the entire response. A random unknown canonical
  UUID reaches the relation lookup and returns 404.
- Candidate API has dummy PayKeeper configuration and provider origin
  `http://127.0.0.1:1`; no real account credentials or payment server are used.
  The scenario creates no live Payment Intent, Invoice or payment. The known
  settlement branch is checked with stubbed SDK/provider data in unit tests.
- `tsc --noEmit` for billing and backend utils passes. API retains the same 18
  normalized diagnostics as main; none are added.
- Scoped ESLint: six changed/new TypeScript files, zero errors/warnings, with
  project loading disabled and TypeScript checked separately.
- Module dependency check: zero violations. AST audit: six TypeScript files,
  zero inline type imports. Consistency inventory retains its nine SQL adapters
  and 24 raw fetch call sites; the new validation adds no data read or write.

Commands use the existing Jest configs for billing, backend utils and API
scenarios. The API spec is
`apps/api/specs/scenario/singlepagestartup/issue-230/backend-paykeeper-identifiers.scenario.spec.ts`.
Set `SCENARIO_API_URL` to the configured test API and supply its RBAC secret
through the environment; never place real secrets in command output or artifacts.

## Protocol boundary and remaining work

Official source, checked 2026-11-02:
[PayKeeper POST notifications](https://docs.paykeeper.ru/metody-integratsii/priyom-post-opoveshhenij/).
The provider echoes the merchant's orderid; SPS invoice creation supplies the
Payment Intent UUID. Requiring UUID here is therefore an SPS contract, not a
provider-wide identifier rule.

The provider requires signature verification and its acknowledgment response.
The existing service only requires the webhook-secret setting and does not
verify `key`; the common controller returns JSON. These behaviors are unchanged.
This PR does not certify a working or authenticated live provider integration.
No real valid callback or money movement was exercised. Existing shared
controller envelope/zero-amount shortcuts are also unchanged; the input guard
is a service-branch contract, not a replacement for route-wide authorization.

No schema, data snapshot, permission, frontend or dependency changes are needed.
Inherited custom PayKeeper IDs/error matching and imports of the former helper
need the migration described in the PR and commit trailers.
