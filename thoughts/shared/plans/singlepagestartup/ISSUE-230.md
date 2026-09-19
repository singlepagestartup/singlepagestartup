---
date: 2026-09-19T02:26:05+03:00
issue_number: 230
repository: singlepagestartup
topic: "Validate PayKeeper webhook identifiers before relation lookup"
status: in_review
---

# PayKeeper Webhook Identifier Validation Implementation Plan

## Overview

Validate the identifiers of a PayKeeper webhook payload in the billing
payment-intent service before any relation lookup, so an unusable `orderid`
answers a deterministic 400 instead of reaching the UUID-backed
`paymentIntentId` filter.

## Current State Analysis

The webhook branch of the PayKeeper provider service trusts the parsed body.
`proceed` destructures `props.data` and sends `data.orderid` straight into
`paymentIntentsToInvoicesApi.find` as an `eq` filter on `paymentIntentId`
(`libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.ts:470-496`).
`IPayKeeperWebhookData` (`paykeeper.ts:154-167`) is a compile-time type only;
the controller builds `data` from `Object.fromEntries(new URLSearchParams(...))`
for form bodies and from `JSON.parse` for JSON bodies
(`controller/singlepage/provider-webhook/index.ts:34-52`), so at runtime any
field can be missing, empty, or a non-string.

What a bad `orderid` does today depends on the shared query builder, not on the
find handler. `libs/shared/backend/api/src/lib/query-builder/filters.ts:114-128`
rewrites an `eq` filter on a `uuid` column into
`LIKE '%value%'` over `CAST(column AS TEXT)` whenever `isUuid(value)` is false.
The lookup therefore returns an empty list (404 through
`paykeeper.ts:498-502`) or substring-matches unrelated relation rows and
proceeds with someone else's invoice. The issue's own mechanism — a failure
inside `libs/shared/backend/api/src/lib/controllers/rest/handler/find/index.ts:23-30`
— is contradicted by that code, and the literal `undefined` in the production
signature `Internal server error: undefined` was not reproduced from code
reading (research, Open Questions 1). This plan removes the input class that
produced the reports; it does not claim to explain the `undefined` token.

Sibling providers already guard their webhooks: CloudPayments and TipTopPay
verify an HMAC over the raw body
(`cloudpayments.ts:230-237`, `tiptoppay.ts:229-234`), Telegram Star compares
`X-RBAC-SECRET-KEY` in the controller
(`provider-webhook/index.ts:160-168`). PayKeeper requires
`PAYKEEPER_WEBHOOK_SECRET` to exist (`paykeeper.ts:340-344`) and never reads it.

## Desired End State

A PayKeeper webhook whose `orderid` is not a canonical UUID, or whose `id`,
`sum`, or `clientid` is not a string, is rejected by the service before any
network or database call, and the endpoint answers 400 with
`Validation error. Invalid orderid` (or the matching field name). A canonical
but unknown UUID keeps the existing 404 `Not Found error` answer. A canonical
UUID that matches a relation row keeps the existing flow unchanged. Because the
value reaching the filter is always a canonical UUID, the query builder always
takes its `eq` branch and the lookup is exact.

Verification: the new service spec (`paykeeper.spec.ts`) passes under
`npx nx run @sps/billing:jest:test`, and a manual `curl` against a running API
returns 400 for an invalid `orderid` and 404 for a random valid UUID.

### Key Discoveries

- `paykeeper.ts:479-496` is the only consumer of `data.orderid`; nothing else in
  the webhook branch reads the payload, so one guard at the top of the branch
  covers the whole path.
- `query-builder/filters.ts:114-128` uses `validate as isUuid` from `uuid`. The
  guard must use the same predicate, otherwise a value both sides judge
  differently would still reach the `LIKE` branch.
- `uuid` is already imported directly by framework code
  (`query-builder/filters.ts:3`, `apps/api/app.ts:17`); no dependency is added.
- `getHttpErrorType` maps by message text with no `[Category]` prefix present:
  `Validation error.` reaches the 400 entry through `/validation error/i`
  (`http-error/paterns/index.ts:70`) and `Not Found error.` reaches 404 through
  `/not found/i` (line 52). The status flows through the controller's existing
  `HTTPException` at `provider-webhook/index.ts:183-186` untouched.
- `telegram-star.spec.ts` is the mocking model for a provider service spec:
  module mocks for `@sps/shared-utils`, the invoice SDK, and the relation SDK
  declared before the `Service` import.
- The PayKeeper answer contract (`OK <md5(id + secret_seed)>`) is **not**
  present anywhere in the repository. The only `md5` in billing belongs to
  0xprocessing (`service/singlepage/index.ts:667`), and the webhook controller
  answers `c.json({ data: result }, 200)` for every provider.

## What We're NOT Doing

- No signature verification. PayKeeper's `key` is an md5 over the identifiers
  and a secret seed, and the answer it expects is an md5 as well. Neither the
  seed scheme nor the answer format exists in this repository, and guessing
  either would silently reject genuine callbacks. Recorded as follow-up below.
- No change to `libs/shared/backend/api/src/lib/query-builder/filters.ts`. The
  `LIKE` fallback for non-UUID `eq` filters is Phase 1 of the remediation plan
  (SEC-01, SEC-32) and has consumers outside billing.
- No identifier guard for the other provider branches in this change. The helper
  is written to serve them, but each provider has its own identifier contract and
  its own tests; the plan's Phase 6 item 8 sentence about the other branches
  becomes the follow-up below.
- No change to the existing logging in the webhook branch or in
  `getInvoiceData`. Both log more than they should (`paykeeper.ts:472, 476` log
  the raw body and headers; `paykeeper.ts:272` logs the Basic `Authorization`
  header), but that is a separate hygiene change; this plan only refrains from
  adding any new logging of payload values.
- No schema, migration, seed, or `startup` file change.

## Implementation Approach

One guard function in the service layer, called once at the top of the webhook
branch, plus a spec. The function lives beside the provider services so other
providers can adopt it without a new package, and it is parameterized by field
lists rather than hard-coded to PayKeeper. The controller stays thin: it keeps
parsing the body and rethrowing through `getHttpErrorType`, and receives the
correct status because the thrown message carries the `Validation error.`
category the shared mapper already understands.

## Phase 1: Identifier guard in the service layer

### Overview

Add the reusable validation and apply it to the PayKeeper webhook branch.

### Changes Required

#### 1. Webhook identifier validation

**File**: `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/webhook-identifiers.ts` (new)
**Why**: The payment-intent service layer is where provider payloads are
interpreted; the controller must stay a router and the shared backend utils
package has no identifier-validation helper to extend
(`libs/shared/backend/utils/src/lib/` holds authorization, blobify-files,
http-error, localized-field, logger, telegram-markdown-formatter,
unique-constraint-error, websocket-manager).
**Changes**: Export an interface for the call props and one function that takes
the parsed payload, a list of fields that must be canonical UUIDs, and a list of
fields that must be strings when present. Reject a payload that is not a plain
object. Reject a UUID field that is missing, not a string, or not accepted by
`validate` from `uuid` — the same predicate the query builder uses. Reject a
listed string field that is present with a non-string value; tolerate absence and
the empty string, because SPS never sends `clientid` at invoice creation
(`paykeeper.ts:362-376`) and PayKeeper echoes it empty. Throw plain `Error`s
whose message is `Validation error. Invalid <field>` for a named field and
`Validation error. Invalid webhook payload` for a non-object body, so the shared
mapper answers 400. Never interpolate a received value into a message.

#### 2. PayKeeper webhook branch

**File**: `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.ts`
**Why**: `paykeeper.ts:470-496` is where the unvalidated `orderid` enters the
relation filter.
**Changes**: Call the guard as the first statement of the webhook branch's `try`,
requiring `orderid` as a UUID and `id`, `sum`, `clientid` as strings. Use the
returned `orderid` for the filter value and for the existing 404 message instead
of `data.orderid`, so the type system also shows the value is validated. Leave
the rest of the branch, its error handling and its messages unchanged.

### Success Criteria

#### Automated Verification

- [ ] Tests pass: `npx nx run @sps/billing:jest:test`
- [ ] Lint passes: `npx nx run @sps/billing:eslint:lint`

#### Manual Verification

- [ ] A form-encoded POST to `/api/billing/payment-intents/paykeeper/webhook`
      with a non-UUID `orderid` answers 400 and the invalid value does not appear
      in the response body.
- [ ] The same request with a random canonical UUID answers 404.

---

## Phase 2: Behaviour specification

### Overview

Pin the new boundary with a BDD spec next to the provider service.

### Changes Required

#### 1. PayKeeper service spec

**File**: `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.spec.ts` (new)
**Why**: No spec covers `paykeeper.ts` today; `telegram-star.spec.ts` is the
established pattern for a provider service spec in this module
(`libs/modules/billing/jest.config.ts` picks it up through `jest:test`).
**Changes**: Follow the repository BDD format — a top-level JSDoc `BDD Suite`
header with Given/When/Then and a `BDD Scenario` JSDoc above each case, with
behaviour-first names. Mock `@sps/shared-utils` for the five environment values
`proceed` requires, the invoice SDK, and the relation SDK, declared before the
service import. Cover: a non-UUID `orderid` rejected with the validation message
and no relation lookup; a non-string identifier rejected the same way; a
canonical unknown UUID reaching the lookup with an `eq` filter and answering the
not-found message; and a canonical known UUID completing the existing flow
through a stubbed PayKeeper invoice fetch, the invoice update, and the callback.

### Success Criteria

#### Automated Verification

- [ ] Tests pass: `npx nx run @sps/billing:jest:test`
- [ ] Lint passes: `npx nx run @sps/billing:eslint:lint`

#### Manual Verification

- [ ] None beyond Phase 1.

---

## Testing Strategy

### Unit Tests

- Validation rejects a non-UUID `orderid` before `paymentIntentsToInvoicesApi.find`
  is called; the assertion on the mock is what proves "before the lookup".
- Validation rejects a non-string `id`, the shape a JSON caller can produce that
  a form-encoded provider callback cannot.
- A canonical UUID with no matching relation row still answers the existing
  `Not Found error` message, so the 404 path is unchanged.
- A canonical UUID with a matching row still updates the invoice and calls the
  status callback, so the success path is unchanged.

### Integration Tests

None. The path crosses HTTP into the same API process and the billing
integration lane (`jest:integration`) has no provider-webhook harness.

### Manual Testing Steps

Against a running API of this branch on `http://localhost:4015`, with
`X-RBAC-SECRET-KEY` read from `apps/api/.env`:

1. POST the form body `id=1&sum=100.00&clientid=&orderid=not-a-uuid&key=x` and
   expect 400 with `Validation error. Invalid orderid`.
2. POST the same body with a random canonical UUID as `orderid` and expect 404
   with the `Not Found error` message.
3. POST with a real payment-intent id whose relation row exists and confirm the
   invoice reaches PayKeeper and the response is 200.

## Performance Considerations

The guard is a type check and one regular-expression test per field, executed
once per webhook. It removes a network round trip and a database query for
rejected payloads.

## Migration Notes

No data migration. A downstream project that relied on a non-UUID `orderid`
substring-matching a relation row loses that behaviour; that behaviour was a
bug, and a project that needs different identifier rules overrides the PayKeeper
call in its `startup` service layer.

## Follow-up (not in this change)

1. **PayKeeper signature verification.** `PAYKEEPER_WEBHOOK_SECRET` is required
   at startup (`paykeeper.ts:340-344`) and never read, and the `key` field of
   `IPayKeeperWebhookData` is never checked, so any caller that passes the route
   authorization can drive the webhook. PayKeeper's documented scheme is
   `key = md5(id + sum + clientid + orderid + secret_seed)` with the answer
   `OK <md5(id + secret_seed)>`; neither the seed nor the answer exists in this
   repository, and the controller answers JSON for every provider
   (`provider-webhook/index.ts:177-182`). Implementing both needs the account's
   secret seed and one confirmed live callback, so it belongs in its own issue
   together with the answer format. Until then the route's only protection is
   the RBAC permission record
   (`libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/2c707d1b-0600-408a-ba79-848aa595bd8e.json`),
   which is appendix routes B finding F11.
2. **The other provider branches.** The remediation plan's Phase 6 item 8 asks
   for the same identifier check on every provider. The helper added here takes
   field lists for that reason; wiring 0xprocessing, Payselection, CloudPayments,
   TipTopPay, dummy and Telegram Star needs each provider's identifier contract
   and its own spec.
3. **Webhook log hygiene.** `paykeeper.ts:472` logs the whole props including
   `rawBody` and headers, `paykeeper.ts:476` logs the full payload, and
   `paykeeper.ts:272` logs the Basic `Authorization` header of the PayKeeper API
   account. The issue's implementation notes ask for this; it is a separate
   change because it touches the creation path too.
4. **The `undefined` diagnosis.** Research Open Question 1 remains open: no layer
   on the traced path builds the message `undefined`, so
   `Internal server error: undefined` is still unexplained. This change makes the
   reported input class deterministic (400) but does not close the question; the
   nested exception log line for one of the eight production events would.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-230.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-230.md`
- Audit appendix: `thoughts/shared/research/singlepagestartup/2026-09-19-audit-appendix-routes-B.md` (F11)
- Umbrella plan: `thoughts/shared/plans/singlepagestartup/2026-09-19-dead-code-and-security-remediation.md` (Layering contract; Phase 6 item 8)
