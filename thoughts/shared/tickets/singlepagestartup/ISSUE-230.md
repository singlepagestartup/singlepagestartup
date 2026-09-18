# Issue #230: Validate PayKeeper webhook identifiers before relation lookup

## Metadata

- URL: https://github.com/singlepagestartup/singlepagestartup/issues/230
- Status: Research Needed
- Created: 2026-08-24T21:27:03Z
- Type: bug
- Priority: high
- Size: small
- Labels: `size:small`

## Problem to Solve

The PayKeeper payment-intent webhook accepts an unvalidated external `orderid`
and passes it directly into a lookup against the UUID-backed
`paymentIntentId` relation. A non-canonical identifier reaches the generic REST
find handler, fails there, and is rewrapped by the provider webhook as HTTP 500
with the opaque signature `Internal server error: undefined`.

The production audit observed eight normalized failures in `api_api`, each on
`POST /billing/payment-intents/paykeeper/webhook`, between
2026-08-24T11:30:50Z and 2026-08-24T15:00:56Z. The repeated 500 responses can
cause provider retries and leave payment or invoice status unsynchronized.

## Key Details

- Sanitized signature: `Internal server error: undefined`.
- Affected service: `api_api`.
- Production image: `singlepagestartup/didigallery:0.0.224` with digest
  `sha256:50131dc9e1c21c1877a1cc0c6062ae85bda30099d878b2a618b3aebaf377e138`.
- Window: 2026-08-24T11:30:50Z through 2026-08-24T15:00:56Z.
- Count: eight normalized events, represented by 24 HTTP-500 status records and
  72 repeated structured error records.
- Safe stack fragment:

  ```text
  .../shared/backend/api/.../rest/handler/find/index.ts:30:17
  .../billing/.../provider-webhook/index.ts:185:17
  ```

- Runtime aggregation identified the provider route as PayKeeper for all eight
  events. The `orderid` was present but did not match the UUID, numeric, empty,
  undefined, or long-token shapes checked by the audit; the value itself was
  not retained.
- `paykeeper.ts:475-496` logs and forwards `data.orderid` without runtime
  validation. The target relation column is UUID-backed at
  `payment-intents-to-invoices/.../schema.ts:17-20`.
- The generic relation lookup converts the failure to an `HTTPException` at
  `shared/backend/api/.../rest/handler/find/index.ts:23-30`; the provider
  controller rewraps it at `provider-webhook/index.ts:183-185`, losing a useful
  provider/input diagnosis.
- Local `HEAD@67a960f34465` and `upstream/main@0f01a1553422` contain identical
  PayKeeper webhook, provider controller, and shared REST find implementations.
  This is framework-owned code, so the issue belongs to
  `singlepagestartup/singlepagestartup` rather than the didigallery startup.
- Searches of open and closed issues in both target repositories by signature,
  provider, route, relation, and source path found no duplicate.

### Observed and Expected Behavior

Observed: an incompatible PayKeeper `orderid` is queried as a payment-intent
relation key and produces an opaque HTTP 500. The provider can retry the same
callback while the application cannot determine whether payment status was
applied.

Expected: validate and normalize the provider payload before any relation
lookup. Invalid identifiers must produce the documented deterministic client or
provider acknowledgement response without a database query; valid identifiers
must either complete status synchronization or return a precise, non-sensitive
domain error.

### Reproduction / Trigger Conditions

1. Send a form-encoded PayKeeper webhook to
   `/billing/payment-intents/paykeeper/webhook` with the configured provider
   credentials and a present but non-canonical `orderid`.
2. The handler calls `paymentIntentsToInvoicesApi.find()` with that value.
3. The relation lookup fails and the endpoint returns HTTP 500 with
   `Internal server error: undefined`.

No production payload values are included in this reproduction.

## Implementation Notes

- Define and enforce a runtime schema for PayKeeper webhook data, especially
  the exact `orderid` contract used when SPS creates a PayKeeper invoice.
- Normalize the accepted identifier before relation lookup and reject or
  acknowledge invalid input according to the PayKeeper webhook contract.
- Preserve the original request correlation identifier and a safe provider
  context when nested SDK/REST errors are normalized; never return
  `undefined` as the error diagnosis.
- Avoid logging raw webhook bodies, headers, credentials, invoice data, or
  payment identifiers while adding diagnostics.
- Alternative: look up the invoice by PayKeeper provider invoice ID and then
  traverse the existing relation. This may be safer if PayKeeper does not
  guarantee round-tripping the SPS UUID in `orderid`, but it changes lookup
  semantics and must be verified against provider documentation and existing
  invoices.
- Risk: returning a non-2xx response may intentionally trigger provider retries.
  The implementation must distinguish transient internal failures from
  permanently invalid callbacks and use the provider's documented response
  contract.

## Acceptance Criteria

- [ ] PayKeeper webhook input is runtime-validated before relation or invoice lookup.
- [ ] A valid SPS-created PayKeeper callback resolves the intended payment intent and updates invoice/payment status exactly once.
- [ ] Missing, malformed, and incompatible `orderid` values do not reach a UUID-backed relation lookup and never produce `Internal server error: undefined`.
- [ ] Permanent invalid input receives the documented deterministic response; transient internal errors remain distinguishable and retryable.
- [ ] Nested lookup failures retain a safe category and request correlation ID without exposing headers, credentials, raw bodies, or personal/payment data.
- [ ] BDD tests cover a valid callback, missing `orderid`, malformed/non-canonical `orderid`, unknown relation, and nested lookup failure.
- [ ] A production-equivalent log run contains no matching undefined-error signature for PayKeeper callbacks.

### Test Plan

- Add focused BDD tests for the PayKeeper service and provider webhook controller
  with redacted fixtures.
- Assert that invalid identifiers cause no relation SDK call.
- Assert exact response category/status for invalid and unknown identifiers.
- Assert a valid callback invokes the status-update callback once and remains
  idempotent under a duplicate provider delivery.
- Assert nested SDK errors retain a safe diagnostic and correlation ID.
- Run the affected billing backend tests plus TypeScript validation.

## References

- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.ts`
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider-webhook/index.ts`
- `libs/shared/backend/api/src/lib/controllers/rest/handler/find/index.ts`
- `libs/modules/billing/relations/payment-intents-to-invoices/backend/repository/database/src/lib/schema.ts`

## Comments

No comments at the time of ticket creation.
