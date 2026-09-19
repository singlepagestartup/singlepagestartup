## Summary

The PayKeeper webhook branch sent the provider's `orderid` straight into an `eq` filter on the uuid-backed `paymentIntentId` column. The shared query builder rewrites such a filter into a text `LIKE` when the value is not a canonical uuid, so an unusable identifier either matched unrelated relation rows or returned nothing. Production answered eight opaque 500s on the route, with PostgreSQL text in the body.

The identifiers are now validated in the service layer before any lookup: `orderid` must be a canonical uuid, and `id`, `sum` and `clientid` must be strings when the provider sends them. An invalid identifier answers 400 through the existing error mapper, a canonical but unknown uuid keeps the 404 answer, and the value reaching the filter is always exact.

Closes #230

## Changes

- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/webhook-identifiers.ts` (new) — `validateWebhookIdentifiers` takes the parsed payload plus a list of fields that must be canonical uuids and a list that must be strings when present. It rejects a payload that is not a plain object, uses the same `validate` predicate from `uuid` as `libs/shared/backend/api/src/lib/query-builder/filters.ts`, and tolerates an absent or empty optional field, because providers echo fields SPS never sets. Every message carries the `Validation error.` category the shared mapper already maps to 400, and none of them repeats a received value.
- `.../service/singlepage/paykeeper.ts` — the webhook branch calls the guard as the first statement of its `try`, then uses the returned `orderid` for the filter value and for the not-found message.
- `.../service/singlepage/paykeeper.spec.ts` (new) — four scenarios following the `telegram-star.spec.ts` mocking pattern: a non-uuid `orderid` and a non-string `id` are refused with no relation lookup; a canonical unknown uuid reaches the lookup with an `eq` filter and keeps the not-found answer; a canonical known uuid completes the existing flow through a stubbed invoice fetch, the invoice update and the callback.
- The guard is parameterized by field lists rather than hard-coded to PayKeeper, so the other provider branches can adopt it without a new package. The controller stays a router: it keeps parsing the body and rethrowing through `getHttpErrorType`.

The query builder itself is unchanged. Its `LIKE` fallback for non-uuid `eq` filters has consumers outside billing and belongs to the separate remediation phase that covers SEC-01 and SEC-32.

## Downstream migration

The single commit carries `Downstream-Impact: required`.

**Applies to** projects that accept PayKeeper callbacks, override the billing payment-intent service in their startup layer, or send an `orderid` other than the payment-intent id when creating a PayKeeper invoice.

**Actions**

- Confirm the project sends the payment-intent id as `orderid` at invoice creation. A startup override that sends another identifier must send a canonical uuid, or override the webhook branch with its own validation.
- Update monitoring, alerting or provider retry handling that keyed on the previous 500 answer for a malformed PayKeeper callback. The same input now answers 400 with `Validation error. Invalid orderid`.

**Verify**

Post a form-encoded callback to the PayKeeper webhook route with an invalid `orderid` and expect 400, with a random canonical uuid and expect 404, and with a live payment-intent id and expect the existing paid flow.

## Verification

- [x] `npx nx run @sps/billing:jest:test --skip-nx-cache` — 16 passed in 5 suites.
- [x] `npx nx run @sps/billing:eslint:lint --skip-nx-cache` — clean.
- [x] `npx nx run @sps/billing:tsc:build --skip-nx-cache` — clean.
- [x] `node tools/upstream/migrations.mjs message` — the commit's trailers are valid.
- [x] Manual verification against a running instance: an invalid `orderid` answers 400, a non-string `id` answers 400, and an unknown canonical uuid answers 404.

## How to verify it

Run this branch's API and read the RBAC secret from `apps/api/.env`. The examples below use port 4015.

```bash
RBAC_SECRET_KEY="$(grep '^RBAC_SECRET_KEY=' apps/api/.env | cut -d= -f2-)"
```

**An invalid `orderid` answers 400**

```bash
curl -i -X POST http://localhost:4015/api/billing/payment-intents/paykeeper/webhook \
  -H "X-RBAC-SECRET-KEY: $RBAC_SECRET_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data 'id=301&sum=100.00&clientid=&orderid=not-a-uuid&key=abc'
```

Expected `HTTP/1.1 400` with `"error":"Validation error. Invalid orderid"`. The check that matters: `not-a-uuid` appears nowhere in the body. Before this change the same call returned 500 with PostgreSQL text.

**A non-string `id` answers 400**

A form-encoded body always yields strings, so this case needs a JSON body. The `orderid` has to be canonical, because the uuid fields are checked first:

```bash
curl -i -X POST http://localhost:4015/api/billing/payment-intents/paykeeper/webhook \
  -H "X-RBAC-SECRET-KEY: $RBAC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  --data '{"id":301,"sum":"100.00","clientid":"","orderid":"3f2b9c18-6f6f-4a1e-9f9a-2f1b8c7d4e55","key":"abc"}'
```

Expected `HTTP/1.1 400` with `"error":"Validation error. Invalid id"`.

**An unknown canonical uuid still answers 404**

```bash
curl -i -X POST http://localhost:4015/api/billing/payment-intents/paykeeper/webhook \
  -H "X-RBAC-SECRET-KEY: $RBAC_SECRET_KEY" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data 'id=301&sum=100.00&clientid=&orderid=3f2b9c18-6f6f-4a1e-9f9a-2f1b8c7d4e55&key=abc'
```

Expected `HTTP/1.1 404` with `"error":"Not Found error. Payment intent to invoice relation not found for payment-intent ID: 3f2b9c18-6f6f-4a1e-9f9a-2f1b8c7d4e55"`.

The answer body is the shared exception shape `{ requestId, path, method, status, error, stack, cause }` in all three cases.

## Notes

Signature verification is not part of this change. `PAYKEEPER_WEBHOOK_SECRET` is required at startup and never read, and the `key` field of `IPayKeeperWebhookData` is never checked, so any caller that passes the route authorization can drive the webhook. PayKeeper's documented scheme is `key = md5(id + sum + clientid + orderid + secret_seed)` with the answer `OK <md5(id + secret_seed)>`; neither the seed nor that answer format exists in this repository, and the controller answers JSON for every provider. Implementing both needs the account's secret seed and one confirmed live callback, so it is follow-up 1 in `thoughts/shared/plans/singlepagestartup/ISSUE-230.md` rather than a guess in code. Until then the route's only protection is its RBAC permission record, which is finding F11 of the routes-B audit appendix.

Three further follow-ups are recorded in the same plan:

- The other provider branches — 0xprocessing, Payselection, CloudPayments, TipTopPay, dummy and Telegram Star — still take their identifiers unvalidated. The helper takes field lists for that reason, but each provider needs its own identifier contract and spec.
- Webhook log hygiene: the branch logs the whole props including `rawBody` and headers and then the full payload, and `getInvoiceData` logs the Basic `Authorization` header of the PayKeeper API account. This change adds no new logging of payload values and removes none of the existing lines, because the same cleanup touches the creation path.
- `Internal server error: undefined` stays unexplained. No layer on the traced path builds that message. Making the reported input class deterministic does not close the question; the nested exception log line for one of the eight production events would.
