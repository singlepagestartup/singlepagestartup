Closes #230

## Summary

Malformed PayKeeper `orderid` values return HTTP 400 before the service queries
the UUID-backed Payment Intent–Invoice relation. A valid unknown UUID retains
404, and a known UUID retains the existing invoice/callback flow.

## Changes

- Update the branch from current main. Its exact UUID equality, provider router,
  SDK calls and payment transition behavior remain in place.
- Export `validateWebhookIdentifiers` from the existing `@sps/backend-utils`
  package. The pure validator belongs with backend utilities; the old copy
  beside Payment Intent services is removed.
- Require a plain payload object and UUID `orderid`. Check `id`, `sum` and
  `clientid` as strings when supplied, retaining empty/absent/null optional values.
  Validation errors name the field without echoing the submitted value.
- Remove PayKeeper service debug logging of Authorization headers, webhook props,
  payment payloads and provider responses. The common controller logging is unchanged.
- Extend service tests, add utility shape/type tests and a running-API scenario.

## Verification

- [x] Billing unit suite: six suites, 31 tests passed.
- [x] Backend utils unit suite: nine suites, 167 tests passed.
- [x] Full API + PostgreSQL scenario: nine tests passed with malformed form/JSON
      payloads, invalid field types and a random unknown UUID. No live invoice,
      payment provider call or settlement is used.
- [x] Billing and backend-utils TypeScript checks pass.
- [x] API TypeScript comparison: 18 existing diagnostics, none added against main.
- [x] Scoped ESLint: six TypeScript files, zero errors/warnings. Module dependency
      check: zero violations. Inline type-import AST audit: zero occurrences.

Detailed evidence: `thoughts/shared/research/singlepagestartup/2026-11-02-pr266-paykeeper-validation.md`.

## Notes

- UUID is the SPS invoice-creation contract: PayKeeper echoes the order ID supplied
  by the merchant. It is not a UUID requirement imposed by PayKeeper.
- Signature authentication and the provider-specific acknowledgment remain
  unimplemented. This PR improves input handling and does not certify the whole
  PayKeeper integration. The [provider contract](https://docs.paykeeper.ru/metody-integratsii/priyom-post-opoveshhenij/)
  describes those separate requirements.
- Existing common-controller envelope/zero-amount handling and debug logging are
  unchanged; validation here governs the PayKeeper service branch.
- No schema, dependency, permission, query-builder or frontend change.

## Downstream migration

Impact: required.

Applies to projects overriding the PayKeeper service, importing the former local
validator, using custom order IDs, matching previous 500 errors or consuming
PayKeeper service debug output.

Send the Payment Intent UUID as `orderid` when creating the invoice and preserve
validation before the relation lookup in owned overrides. Import the pure helper
from `@sps/backend-utils` instead of the removed local service path. Keep custom
identifier schemes in an explicit project override. Handle malformed identifiers
as 400 `Validation error. Invalid orderid`; canonical unknown UUIDs remain 404.
Replace any dependency on removed console output with the project's redacted
operational logging. Provider authentication still needs its own integration.

Run the billing/backend-utils suites and issue-230 API scenario with PayKeeper
configured. Verify malformed identifiers do not query relations or update an
invoice and do not appear in validation responses; test a known UUID with stubbed
provider data before exercising an account-specific callback in its test environment.
