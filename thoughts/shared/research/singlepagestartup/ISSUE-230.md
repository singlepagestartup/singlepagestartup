---
date: 2026-09-18T02:13:12+03:00
researcher: flakecode
git_commit: 29370bcbf85b195fbd1c2422707141135184d6e0
branch: worktree-issues-2026-09-18
repository: singlepagestartup
topic: "Validate PayKeeper webhook identifiers before relation lookup"
tags: [research, codebase, billing, payment-intent, paykeeper, provider-webhook, payment-intents-to-invoices, http-error, query-builder]
status: complete
last_updated: 2026-09-18
last_updated_by: flakecode
---

# Research: Validate PayKeeper webhook identifiers before relation lookup

**Date**: 2026-09-18T02:13:12+03:00
**Researcher**: flakecode
**Git Commit**: 29370bcbf85b195fbd1c2422707141135184d6e0
**Branch**: worktree-issues-2026-09-18
**Repository**: singlepagestartup

## Research Question

Issue #230 reports that `POST /billing/payment-intents/paykeeper/webhook` returned HTTP 500 with the signature `Internal server error: undefined` eight times on 2026-08-24, and attributes it to an unvalidated PayKeeper `orderid` reaching the UUID-backed `paymentIntentId` relation lookup. This research documents how the PayKeeper provider, the provider-webhook controller, the shared REST `find` path, the error-normalization chain, and the request-id plumbing work today; what SPS sends as `orderid` when it creates a PayKeeper invoice; how sibling providers validate their webhooks; which BDD specs exist; and which of the issue's load-bearing claims live code confirms or contradicts.

## Summary

- SPS creates a PayKeeper invoice with `orderid = props.entity.id`, the payment-intent UUID (`paykeeper.ts:362-376`), and links the relation only after the invoice receives PayKeeper's `invoice_id` as `providerId` (`paykeeper.ts:436-464`). The webhook branch then looks the relation up by `paymentIntentId = data.orderid` (`paykeeper.ts:479-496`) with no runtime check on `data`.
- The issue's three location claims are verified against live code: the forwarding block is `paykeeper.ts:475-496`, the relation column is `pgCore.uuid` at `schema.ts:17-20`, the shared find handler rethrows at `find/index.ts:30` (column 17 is the `HTTPException` token), and the controller rethrows at `provider-webhook/index.ts:185`.
- The issue's mechanism claim is contradicted by live code. The shared query builder special-cases `eq` on `uuid` columns: a value that fails `isUuid()` is rewritten to `LIKE '%value%'` against `CAST(column AS TEXT)` (`query-builder/filters.ts:114-128`, present since commit `053ff12df0d` on 2025-10-31). A read-only check against the local Postgres confirms that `pt_it_id = 'not-a-uuid'` raises `22P02 invalid input syntax for type uuid`, while the `LIKE` form succeeds. Under live code a plain non-UUID string therefore returns an empty array (mapped to a 404 `Not Found error` by `paykeeper.ts:498-502` and `paterns/index.ts:52`) or substring-matches unrelated relation rows; it does not fail inside the find handler.
- The literal `undefined` in the signature is not reproducible from code reading. The fallback at `http-error/index.ts:96-101` formats `Internal server error: ${message}` where `message = extractMessage(error) || "Unknown error"` (`extract/index.ts:1-7`), so a nested error must have carried the string `"undefined"` as its message. No layer on the traced path builds such a message. This stays an open question.
- The nested correlation id is dropped, not lost at the filter. `RequestIdMiddleware` mints a `nanoid` per inbound request (`libs/middlewares/src/lib/request-id/index.ts:12-14`, mounted at `apps/api/app.ts:116-117`); the server SDK forwards only `options.headers` plus cache control (`actions/find/index.ts:37-49`), so the nested relation request receives its own id. `response-pipe.ts:123-127` captures that nested id into the thrown payload, but `getHttpErrorType` returns only `status`, `message`, `category`, `details` (`type/index.ts:19-24`), so the controller's `HTTPException` at `provider-webhook/index.ts:185` no longer carries it and the outer exception log (`filters/exception/index.ts:52-59`) records only the outer id.
- The PayKeeper webhook branch performs no signature check. `PAYKEEPER_WEBHOOK_SECRET` must exist (`paykeeper.ts:340-344`) but is never read; `rawBody` and `headers` are accepted in the props type (`paykeeper.ts:200-204`) and unused. CloudPayments (`cloudpayments.ts:230-237`), TipTopPay (`tiptoppay.ts:229-234`), and Telegram Star (controller `provider-webhook/index.ts:160-168`) verify a secret before acting; the controller passes all request headers to PayKeeper without a precondition (`provider-webhook/index.ts:152-159`).
- No PayKeeper or provider-webhook spec exists. The closest BDD patterns are `telegram-star.spec.ts` (mocks `@sps/shared-utils`, the invoice SDK, the relation SDK, and `grammy`), `check/index.spec.ts`, and `http-error/index.spec.ts`. Billing unit tests run under `libs/modules/billing/jest.config.ts` via the `jest:test` target.

## Detailed Findings

### Route, mounting, and authorization

- `apps/api/app.ts:188` mounts the billing app at `/api/billing`; `libs/modules/billing/backend/app/api/src/lib/apps.ts:25-26` mounts the payment-intent app at `/payment-intents`; the controller binds `POST /:provider/webhook` (`controller/singlepage/index.ts:54-58`) and dispatches to `ProviderWebhook` (`controller/singlepage/index.ts:76-78`). The full path is `/api/billing/payment-intents/:provider/webhook`.
- An RBAC permission record exists for `POST /api/billing/payment-intents/paykeeper/webhook` (`libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/2c707d1b-0600-408a-ba79-848aa595bd8e.json`).
- Global middleware order in `apps/api/app.ts`: CORS (41-64), `onError` bound to `ExceptionFilter` (66-67), `RequestIdMiddleware` (116-117), observer (123-124), revalidation (153-154), optional HTTP cache (162-166), action logger (168-169), `IsAuthorizedMiddleware` (171-172), bill-route (174-175), `ParseQueryMiddleware` (177-178).
- The `startup` layer of the payment-intent service and controller extend the `singlepage` layer without overrides (`service/startup/index.ts:5-6`, `controller/startup/index.ts:7-12`).

### Provider-webhook controller

- Body parsing (`provider-webhook/index.ts:25-52`): reads all headers (27), reads `rawBody` as text unless multipart (28-29), logs headers and raw body at debug level (31-32), then builds `data` from JSON, multipart `data` field, or `Object.fromEntries(new URLSearchParams(rawBody))` for `application/x-www-form-urlencoded` (49-52). Every form value is a string; nothing validates shape.
- Zero-amount short-circuit (54-88): if `data.data.id` exists, it looks the invoice up via the in-process `billingModule.invoice.findById` and, for `amount === 0`, marks it paid and returns 200; errors in this block are swallowed (85-87).
- Provider dispatch (90-175): Stripe retrieves the event by id (92-100); 0xprocessing passes data (101-102); Payselection requires `x-site-id` and `x-webhook-signature` or throws `Validation error. Missing headers` (103-116); CloudPayments and TipTopPay act only when both HMAC headers exist and otherwise leave `result` undefined (117-142); dummy requires `data.data.id` (143-151); PayKeeper passes `data`, all `headers`, `rawBody`, and `this.service.updatePaymentIntentStatus` as `callback` with no precondition (152-159); Telegram Star compares an `X-RBAC-SECRET-KEY` header to `RBAC_SECRET_KEY` (160-174).
- An unknown `provider` or a skipped branch returns `200 { data: undefined }` (177-182).
- The catch normalizes with `getHttpErrorType` and rethrows `HTTPException(status, { message, cause: details })` (183-186). The issue's stack column `185:17` corresponds to the `HTTPException` token on line 185.
- Unlike the provider (creation) controller, the webhook controller does not consult `ALLOWED_BILLING_SERVICE_PROVIDERS` (`provider/index.ts:85-91`; env at `libs/shared/utils/src/lib/envs/host.ts:9-10`).

### PayKeeper service

- Type contracts: `IPayKeeperWebhookData` declares `id`, `sum`, `clientid`, `orderid`, `key`, `pk_hostname`, `ps_id`, `client_email`, `client_phone`, `service_name`, `fop_receipt_key`, `obtain_datetime` as strings (`paykeeper.ts:154-167`). `IServiceProceedProps` for `webhook` carries `data`, `rawBody`, HMAC-style `headers`, and `callback` (`paykeeper.ts:197-210`). Types are compile-time only; there is no runtime schema.
- Configuration guards (`paykeeper.ts:324-344`): `RBAC_SECRET_KEY`, `PAYKEEPER_BASE_URL`, `PAYKEEPER_API_LOGIN`, `PAYKEEPER_API_PASSWORD`, and `PAYKEEPER_WEBHOOK_SECRET` must be set; env definitions are in `libs/shared/utils/src/lib/envs/billing.ts:61-70`. `PAYKEEPER_WEBHOOK_SECRET` is not used anywhere else in the file.
- Creation branch (`paykeeper.ts:346-469`): creates a local `open` invoice with `provider: "paykeeper"` (347-360); builds `paymentData` with `orderid: props.entity.id` (the payment-intent UUID), `pay_amount`, `client_email`, optional `client_phone`, a seven-day `expiry`, and a JSON `service_name` carrying the cart (362-376); fetches a security token (381); posts form data to `${PAYKEEPER_BASE_URL}/change/invoice/preview/` (397-404); requires `invoice_id` and `invoice_url` in the response (422-426); stores `providerId = invoice_id` and `paymentUrl` on the invoice (436-448); creates the `payment-intents-to-invoices` relation with `paymentIntentId: props.entity.id` (454-464). The round-trip contract implied by this code is that PayKeeper echoes `orderid` unchanged; the alternative key `data.id` maps to `invoice.providerId`.
- Webhook branch (`paykeeper.ts:470-578`): logs the whole `props` including `rawBody` and headers (472), `data.orderid` (475), the full `data` (476), and `data.id` (477); calls `paymentIntentsToInvoicesApi.find` with `filters.and = [{ column: "paymentIntentId", method: "eq", value: data.orderid }]` (479-496); throws `Not Found error. Payment intent to invoice relation not found for payment-intent ID: ${data.orderid}` for an empty result (498-502); loads the invoice by `paymentIntentToInvoice[0].invoiceId` (504-511); requires `invoice.providerId` (522-526); fetches PayKeeper invoice state through `getInvoiceData` (532-534); when `status === "paid"` updates the local invoice amount and status (545-559); always invokes `props.callback({ invoice })` and throws `Failed to update payment intent status` when `ok` is false (566-570); the catch logs and rethrows unchanged (574-577).
- `getInvoiceData` (`paykeeper.ts:265-321`) logs the Basic `Authorization` header (272), the request URL (275), response status and headers (282-286), and the raw response body (297); failures are rewrapped as `Internal error. Failed to get invoice data: ${error}` (319).
- There is no already-paid guard in the webhook branch; a repeated delivery re-runs the PayKeeper lookup, re-updates the invoice, and calls the callback again. `updatePaymentIntentStatus` skips intents already `succeeded` or `canceled` (`service/singlepage/index.ts:116-120`).

### Relation lookup path

- SDK: `@sps/billing/relations/payment-intents-to-invoices/sdk/server` is a `factory` instance (`sdk/server/src/lib/singlepage/index.ts:13-17`) built on `@sps/shared-frontend-server-api` (`factory/index.ts:50-58`), which delegates to `actions.find` (`libs/shared/frontend/api/src/lib/actions/find/index.ts:23-68`). `actions.find` serializes `params` with `qs.stringify(..., { encodeValuesOnly: true })` (28-30), sends only `options.headers` plus cache control (37-49), and passes the response through `responsePipe` (56-59).
- API: `ParseQueryMiddleware` parses the query with `qs.parse` and stores `filters`, `orderBy`, `offset`, `limit` in `c.var.parsedQuery` (`middleware/parse-query/index.ts:21-86`). The shared find handler calls `service.find({ params: c.var.parsedQuery })` (`controllers/rest/handler/find/index.ts:23`) and rethrows any failure as `HTTPException` after `getHttpErrorType` (28-31). The CRUD action forwards to the repository (`service/crud/actions/find/index.ts:15-19`).
- Repository (`repository/database/index.ts:53-110`): builds filters through `queryBuilder.filters` (55-59), executes `select().from().where(and(...filters)).limit(Number(limit)).offset(Number(offset)).orderBy(order)` (86-93), validates rows with `selectSchema` (95-98), logs any error with `logger.error` (102), rewraps `ZodError` as `{ zodError }` JSON (104-106), and rethrows everything else unchanged (108).
- Query builder (`query-builder/filters.ts`): for a column whose `dataType` is `uuid` and `method === "eq"`, `isUuid(filter.value)` selects `eq(column, value)`; otherwise `like(CAST(column AS TEXT), "%" + value + "%")` (114-128). Blame attributes lines 114-125 to commit `053ff12df0d` dated 2025-10-31. Live Postgres check on `sps_bg_pt_is_to_is_lbb`: `pt_it_id = 'not-a-uuid'` returns `ERROR: invalid input syntax for type uuid`; `CAST(pt_it_id AS TEXT) LIKE '%not-a-uuid%'` returns `0` rows without error.
- Schema: `paymentIntentId` is `pgCore.uuid("pt_it_id").notNull().references(PaymentIntent.id, { onDelete: "cascade" })` (`schema.ts:17-20`); `invoiceId` mirrors it for invoices (21-24). The table name resolves to `sps_bg_pt_is_to_is_lbb` (`schema.ts:5-8`). The relation controller is the shared `RESTController` (`relations/payment-intents-to-invoices/backend/app/api/src/lib/controller/singlepage/index.ts:3-7`).
- An in-process alternative exists: the payment-intent DI container binds `currency`, `invoice`, and `paymentIntentsToInvoices` as `CRUDService` instances over their repositories (`bootstrap.ts:28-44`, interface at `di.ts:6-10`). The webhook controller uses `billingModule.invoice.findById` (`provider-webhook/index.ts:58-60`); `paykeeper.ts` uses the HTTP SDK instead.

### Error normalization chain

- `getHttpErrorType` (`libs/shared/backend/utils/src/lib/http-error/index.ts:7-102`): derives `message` via `extractMessage` (`error.message`, then `error.cause`, then `String(error)`; `extract/index.ts:1-7`) with fallback `"Unknown error"` (8); if the message is JSON with a numeric `status`, returns that status and `parsed.message || message` with `details = parsed.cause ?? details` (11-44); honors a numeric `error.status` (49-56); maps a `[Category]` prefix (58-83); scans `httpErrorPatterns` (85-94); otherwise returns `500` with `Internal server error: ${message}` (96-101).
- Pattern table (`paterns/index.ts`): `/not found/i` maps to 404 (52), `/validation error/i` and `/missing headers/i` to 400 (70, 75), `/internal server error/i` and `/configuration error/i` to 500 (35, 42). There is no pattern for Postgres error text such as `invalid input syntax`, so such messages fall to the line-98 fallback.
- The `UtilsProp` return type carries `status`, `message`, `category`, `details` only (`type/index.ts:19-24`).
- `ExceptionFilter` (`filters/exception/index.ts:19-116`): reads `x-request-id` or `"unknown"` (23); if `error.message` parses as JSON it lifts `message`, `status`, and `cause` (32-44), calling `e.stack.replace` on each cause entry (40); otherwise pushes `error.message` (47); logs `🚨 Exception [${requestId}] ${method} ${path}` with message, stack, status, and causes (52-59); optionally notifies Telegram for status 500 or higher (61-102); responds with `{ requestId, path, method, status, error, stack, cause }` (104-115).
- `responsePipe` (`libs/shared/utils/src/lib/response-pipe.ts:98-218`): for a non-OK response reads the JSON, takes `error || message || data || cause` as the primary message (116-122), captures `requestId` from the body or the `x-request-id` response header (123-127), includes cause stacks only when `NODE_ENV=development` or `DEBUG=true` (12-13, 137, 142), and on the server throws `HTTPException(res.status, { message: JSON.stringify(errorPayload), cause: errorPayload })` (171-178).
- Traced path for a nested API failure: repository rethrow (108) → find handler `HTTPException` (30) → nested `ExceptionFilter` JSON (104-115) → `responsePipe` `HTTPException` with JSON message (175-178) → `paykeeper.ts` catch/rethrow (574-577) → controller `getHttpErrorType` unpacks the JSON and returns `parsed.message` with `details = parsed.cause` (11-44) → controller `HTTPException` (185) → outer `ExceptionFilter` (non-JSON branch, 47) logs under the outer request id.

### Request-id plumbing

- `RequestIdMiddleware` sets `x-request-id` on the raw request when absent (`libs/middlewares/src/lib/request-id/index.ts:12-14`), mounted before all module routes (`apps/api/app.ts:116-117`).
- `actions.find` does not forward `x-request-id` (`actions/find/index.ts:37-49`), so a nested SDK request receives a new id from the middleware.
- The nested id reaches `errorPayload.requestId` (`response-pipe.ts:160`) and `parsed` inside `getHttpErrorType`, but `UtilsProp` has no `requestId` field, so it is not carried into the controller's rethrown `HTTPException`.
- The only `X-REQUEST-ID` header the billing service sets outbound is Payselection's `invoice.id` (`service/singlepage/index.ts:1098`).

### Sibling provider webhook validation

- CloudPayments (`cloudpayments.ts:188-262`): parses `props.data.Data` JSON (189-194), finds the invoice by `id = parsedData.invoiceId` through `invoiceApi.find` (200-218), rejects empty or multiple matches (220-226), verifies `content-hmac` with `CLOUDPAYMENTS_API_SECRET` over `rawBody` (230-237), updates the invoice and calls the callback only for `Status === "Completed"` (239-259), returns `{ code: 0 }` (261).
- TipTopPay (`tiptoppay.ts:186-259`) mirrors CloudPayments with `TIPTOPPAY_API_SECRET` (229-234).
- Telegram Star (`telegram-star.ts:88-159`): finds the invoice by `id = invoice_payload` (89-107), rejects empty or multiple matches (109-115), asserts amount and payload consistency (119-122, 182-187), returns `{ code: 0 }` without repeating the callback when the invoice is already paid by the same charge and throws when paid by another charge (124-135), then updates and calls the callback (137-158).
- The provider (creation) controller validates `uuid`, body shape, currency, and the provider allowlist before dispatch (`provider/index.ts:29-91`).
- `updatePaymentIntentStatus` (`service/singlepage/index.ts:64-140`): finds relations by `invoiceId` (69-87), loads intents with `inArray` (90-110), and marks eligible intents `succeeded` until the invoice amount is exhausted (112-136).

### Existing BDD specs and test wiring

- `telegram-star.spec.ts:1-7` header; mocks `@sps/shared-utils` with `RBAC_SECRET_KEY`, the invoice SDK (`create`, `find`, `update`), the relation SDK (`create`), and `grammy` (11-48); scenarios cover creation, link-before-delivery, webhook paid, and amount mismatch (60-276).
- `check/index.spec.ts:1-7` header; mocks `@sps/shared-utils`, `@sps/backend-utils`, and the invoice and payment-intent SDKs (11-36).
- `http-error/index.spec.ts` verifies category mapping by message text, including `Missing headers` to 400 (18) and `Internal server error` to 500 (124).
- Billing jest config: `libs/modules/billing/jest.config.ts` uses `jest.server-preset.js` and ignores `*.integration.spec.ts`; targets `jest:test` and `jest:integration` in `libs/modules/billing/project.json:9-22`.
- No spec exists for `paykeeper.ts`, `provider-webhook/index.ts`, or `query-builder/filters.ts` UUID handling.

### Frontend selection

- Checkout components offer `paykeeper` as a provider value (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/checkout-default/ClientComponent.tsx:30`).

### Issue claims verified against live code

| Claim                                                                 | Live code                                                                                           | Result                                                                               |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `paykeeper.ts:475-496` forwards `data.orderid` without validation     | Lines 475-496                                                                                       | Confirmed; lines 472 and 476 also log full props and data                            |
| Relation column UUID-backed at `schema.ts:17-20`                      | Lines 17-20                                                                                         | Confirmed                                                                            |
| Find handler converts failure at `find/index.ts:23-30`                | try 22, call 23, catch 28-31, throw 30                                                              | Confirmed; stack `30:17` matches the `HTTPException` token                           |
| Controller rewraps at `provider-webhook/index.ts:183-185`             | catch 183-186, throw 185                                                                            | Confirmed; stack `185:17` matches the `HTTPException` token                          |
| A non-canonical `orderid` "fails" in the find handler                 | `filters.ts:114-128` rewrites non-UUID `eq` to `LIKE` on text                                       | Contradicted for plain strings; the path returns an empty array or substring matches |
| Signature `Internal server error: undefined` arises from that failure | `http-error/index.ts:8, 96-101` needs a nested message equal to `"undefined"`                       | Not reproduced from code; origin unidentified                                        |
| Local and upstream copies of the three files are identical            | Upstream `git log --since=2026-07-01` shows only #211 (2026-07-20, six lines in `response-pipe.ts`) | Consistent for upstream; the issue did not compare `query-builder/filters.ts`        |

## Code References

- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.ts:154-167` - `IPayKeeperWebhookData` compile-time shape
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.ts:324-344` - configuration guards including unused `PAYKEEPER_WEBHOOK_SECRET`
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.ts:362-376` - `orderid: props.entity.id` sent to PayKeeper
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.ts:436-464` - `providerId` stored, relation created
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.ts:470-578` - webhook branch, logging, relation find, callback
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/paykeeper.ts:265-321` - `getInvoiceData` including auth-header logging
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider-webhook/index.ts:25-52` - body parsing by content type
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider-webhook/index.ts:152-159` - PayKeeper dispatch without header precondition
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider-webhook/index.ts:183-186` - error rethrow
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/index.ts:54-58` - `POST /:provider/webhook` binding
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/index.ts:64-140` - `updatePaymentIntentStatus`
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/bootstrap.ts:28-44` - in-process billing module services
- `libs/modules/billing/relations/payment-intents-to-invoices/backend/repository/database/src/lib/schema.ts:17-24` - UUID relation columns
- `libs/shared/backend/api/src/lib/controllers/rest/handler/find/index.ts:22-31` - shared find handler
- `libs/shared/backend/api/src/lib/repository/database/index.ts:53-110` - repository find and rethrow
- `libs/shared/backend/api/src/lib/query-builder/filters.ts:114-128` - UUID `eq` versus `LIKE` fallback
- `libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:21-86` - query parsing
- `libs/shared/backend/api/src/lib/filters/exception/index.ts:23-115` - request-id read, log, response body
- `libs/shared/backend/utils/src/lib/http-error/index.ts:7-102` - `getHttpErrorType`
- `libs/shared/backend/utils/src/lib/http-error/extract/index.ts:1-12` - message and cause extraction
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:31-90` - pattern table
- `libs/shared/backend/utils/src/lib/http-error/type/index.ts:19-24` - `UtilsProp`
- `libs/shared/utils/src/lib/response-pipe.ts:98-218` - SDK error payload and server rethrow
- `libs/shared/frontend/api/src/lib/actions/find/index.ts:23-68` - SDK find request
- `libs/shared/frontend/server/api/src/lib/factory/index.ts:50-58` - server SDK factory `find`
- `libs/middlewares/src/lib/request-id/index.ts:10-18` - request-id middleware
- `apps/api/app.ts:66-67, 116-117, 177-178, 188` - exception filter, request-id, parse-query, billing mount
- `libs/modules/billing/backend/app/api/src/lib/apps.ts:25-26, 45-46` - payment-intent and relation mounts
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/cloudpayments.ts:188-262` - CloudPayments webhook branch
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/tiptoppay.ts:186-259` - TipTopPay webhook branch
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/telegram-star.ts:88-159` - Telegram Star webhook branch
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider/index.ts:29-91` - creation-side validation and allowlist
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/telegram-star.spec.ts:1-58` - BDD header and mocking pattern
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/check/index.spec.ts:1-36` - controller-level BDD spec pattern
- `libs/shared/backend/utils/src/lib/http-error/index.spec.ts:1-177` - error classification spec
- `libs/modules/billing/jest.config.ts:1-5` and `libs/modules/billing/project.json:9-22` - test wiring
- `libs/shared/utils/src/lib/envs/billing.ts:61-70` - PayKeeper environment variables
- `libs/shared/utils/src/lib/envs/host.ts:9-10` - `ALLOWED_BILLING_SERVICE_PROVIDERS`
- `libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/2c707d1b-0600-408a-ba79-848aa595bd8e.json` - webhook route permission

## Architecture Documentation

- Layering: the payment-intent app follows repository → service → controller with `singlepage` and `startup` layers; provider integrations are classes instantiated inside the shared service (`service/singlepage/index.ts:516-524, 1209-1217`) and receive `updatePaymentIntentStatus` as a callback.
- Data access from providers goes through server SDK factories over HTTP to the same API process; an in-process `IBillingModule` with CRUD services exists for currency, invoice, and the relation.
- Error handling convention: services throw `Error` with a category prefix (`Validation error.`, `Not Found error.`, `Configuration error.`, `Internal error.`), controllers convert with `getHttpErrorType`, and `ExceptionFilter` renders the JSON body. Status mapping relies on message text through `httpErrorPatterns`.
- Query filter convention: `filters.and[]` entries with `column`, `method`, `value`; UUID `eq` filters are guarded by `isUuid` and otherwise become text `LIKE`.
- Correlation: `x-request-id` is per inbound request and is not propagated across nested SDK calls.
- BDD convention: top-level JSDoc `BDD Suite` with `Given/When/Then`, `BDD Scenario` JSDoc above each case, module mocks declared before imports.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-213.md:62-72` documents the provider lifecycle for Telegram Star and CloudPayments and `updatePaymentIntentStatus`; line 72 notes that relation schemas expose primary-key identity without pairwise unique constraints.
- `thoughts/shared/research/singlepagestartup/ISSUE-211.md:143-144` records that provider dispatch creates the currency relation before validating the provider and that provider implementations link the invoice after the external call.
- `thoughts/shared/processes/singlepagestartup/ISSUE-172.md` covers an unrelated `models:payment-intent` Nx target failure and notes that production log-watch issues can be reproduced locally with a restored database dump.
- No prior research or plan mentions PayKeeper, `orderid`, or the provider-webhook controller.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-213.md` - order and billing concurrency, provider invoice lifecycle
- `thoughts/shared/research/singlepagestartup/ISSUE-211.md` - concurrent Telegram RBAC bootstrap, provider ordering notes
- `thoughts/shared/research/singlepagestartup/ISSUE-173.md` - RBAC checkout owning payment-intent creation

## Open Questions

1. What produced the literal `undefined` in `Internal server error: undefined`? The traced code path does not build such a message; the nested request's own exception log line (the `find/index.ts:30:17` record) or the retained `orderid` shape would be needed to identify the layer.
2. Did `singlepagestartup/didigallery:0.0.224` include the `filters.ts:114-128` UUID fallback? Upstream has carried it since 2025-10-31; the issue compared only the PayKeeper service, the webhook controller, and the find handler.
3. What does PayKeeper guarantee for `orderid` round-tripping, which content type it posts, and what response body or status it expects and how it retries? Repository documentation (`libs/modules/billing/README.md`, the payment-intent and relation READMEs) does not cover webhooks.
4. Is signature verification with `PAYKEEPER_WEBHOOK_SECRET` an intended part of the contract? The variable is required but unused, and the `key` field in `IPayKeeperWebhookData` is not read.
5. When a non-UUID `orderid` substring-matches an existing relation row through the `LIKE` fallback, the webhook proceeds with that row's invoice; whether this occurred in production is unknown because the value was not retained.
