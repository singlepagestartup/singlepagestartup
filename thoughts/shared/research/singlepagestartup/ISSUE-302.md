---
date: 2026-09-26T00:08:00+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-302-webhook-provider-gate
repository: singlepagestartup
topic: "Review the payment webhook provider gate"
tags: [research, codebase, billing, payment-intent, provider-webhook, dummy, allowed-billing-service-providers, deployer]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Review the payment webhook provider gate

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-302-webhook-provider-gate
**Repository**: singlepagestartup

## Research Question

`ALLOWED_BILLING_SERVICE_PROVIDERS` lists the payment providers a deployment
accepts. Which of the two payment-intent provider routes consult it, what the
`dummy` provider does when its webhook is called, what the default list
contains, and which code, templates and tests depend on the list or on the
`dummy` provider.

## Summary

- Only payment creation consults the list. `POST /api/billing/payment-intents/:uuid/:provider`
  splits `ALLOWED_BILLING_SERVICE_PROVIDERS` on commas and refuses a provider
  that is not an exact entry with `Validation error. Provider <name> is not allowed`
  (`provider/index.ts:85-91`), which the shared error mapping answers with 400.
- The webhook route `POST /api/billing/payment-intents/:provider/webhook`
  never reads the list (`provider-webhook/index.ts:24-193`). It parses the
  body, runs a zero-amount shortcut for any provider name (`:59-93`), then
  dispatches on the name (`:97-181`). A name that matches no branch answers
  200 with an empty body.
- The `dummy` webhook branch marks the invoice whose id the body names as
  `paid` and moves its linked payment intents to `succeeded`
  (`provider-webhook/index.ts:148-156`, `service/singlepage/index.ts:752-803`).
  It checks no signature or credential. Payment providers call their webhooks
  without SPS credentials, so the route accepts requests without credentials.
- The default list is `stripe,0xprocessing,payselection,cloudpayments,tiptoppay,dummy`
  (`libs/shared/utils/src/lib/envs/host.ts:9-11`). The deployer example lists
  all eight providers including `dummy` (`tools/deployer/.env.example:139`);
  `apps/api/create_env.sh` does not set the variable, so local development
  runs on the default.
- Reproduced on this commit over HTTP (API on port 4302, list without `dummy`):
  an anonymous `POST /api/billing/payment-intents/dummy/webhook` answered 200
  and the throwaway invoice became `paid`, its payment intent `succeeded`.
- Both handlers already hold the payment-intent `Service`; the service has a
  `startup` subclass, so a method there is overridable per project. The
  billing module has no middleware package and no utils folder.

## Detailed Findings

### Routes and handlers

- The payment-intent controller binds `POST /:provider/webhook` before
  `POST /:uuid/check` and `POST /:uuid/:provider`
  (`libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/index.ts:49-63`)
  and delegates each to a `Handler` class built with the controller's service
  (`:67-77`). The billing app mounts the model at `/payment-intents`
  (`libs/modules/billing/backend/app/api/src/lib/apps.ts:22-26`) and the API
  mounts billing at `/api/billing` (`apps/api/app.ts:188`).
- `controller/startup/index.ts` extends the singlepage controller without
  changes; `service/index.ts` exports the `startup` service, which extends the
  singlepage service without changes (`service/startup/index.ts:1-6`).

### Payment creation gate

- `provider/index.ts:25-27` rejects an unset `RBAC_SECRET_KEY`; `:29-67`
  validates the uuid, the `data` form field, the payment intent and the
  currency; `:69-79` links the payment intent to the currency.
- `:85-91` then applies the list:
  `ALLOWED_BILLING_SERVICE_PROVIDERS.split(",")` followed by
  `includes(provider)`. Matching is exact: no trimming, no case folding, no
  prefix match.
- A zero-amount payment intent creates an invoice and, 100 ms later, posts
  `{ data: { id: invoiceId } }` to `/api/billing/payment-intents/${provider}/webhook`
  with the operator secret (`:93-170`). The provider in that URL has already
  passed the gate.
- The `dummy` branch creates the invoice through `service.dummy` and, 10 s
  later, posts the same body to `/api/billing/payment-intents/dummy/webhook`
  with the operator secret (`:267-300`).

### Provider webhook handler

- `provider-webhook/index.ts:26-28` rejects an unset `RBAC_SECRET_KEY`;
  `:30` reads the provider name; `:31-57` parses JSON, multipart `data` or
  URL-encoded bodies.
- Zero-amount shortcut (`:59-93`): when the body carries `data.id` and the
  invoice with that id has `amount === 0`, the handler marks it `paid` through
  the invoice SDK with the operator secret, calls
  `service.updatePaymentIntentStatus` and answers 200. This runs before the
  provider dispatch and for every provider name; lookup errors are swallowed.
- Dispatch (`:97-181`): `stripe` retrieves the event from Stripe;
  `0xprocessing` passes the body; any name containing `payselection` requires
  the two Payselection headers; `cloudpayments` and `tiptoppay` act only when
  both HMAC headers are present; `dummy` requires `data.data.id` and calls
  `service.dummy({ data, action: "webhook" })`; `paykeeper` passes the body and
  headers; `telegram-star` requires the operator secret through
  `rbacSecretMatches(readRbacSecret(c))` and otherwise throws
  `Forbidden error. Invalid Telegram Star webhook secret` (`:165-181`).
- `:183-188` answers `{ data: result }` with 200; `:189-192` maps any thrown
  error through `getHttpErrorType` into an `HTTPException`.

### The `dummy` service branch

- `service/singlepage/index.ts:699-804`. `create` makes an `open` invoice with
  `provider: "dummy"` and links it to the payment intent (`:716-751`).
- `webhook` (`:752-803`) finds the invoice by the supplied id with the
  operator secret, fails on zero or several matches, updates it to `paid`
  and calls `updatePaymentIntentStatus`.
- `updatePaymentIntentStatus` (`:64-140`) finds the payment intents linked to
  the invoice and sets each non-terminal intent whose amount the invoice
  covers to `succeeded`.

### Environment value and templates

- `libs/shared/utils/src/lib/envs/host.ts:9-11` exports the list, read from
  `process.env` with the default
  `stripe,0xprocessing,payselection,cloudpayments,tiptoppay,dummy`. The default
  omits `paykeeper` and `telegram-star`.
- The only reader in code is `provider/index.ts:2,85`.
- Deployer: `tools/deployer/.env.example:139` sets
  `stripe,0xprocessing,payselection,cloudpayments,tiptoppay,dummy,paykeeper,telegram-star`;
  `tools/deployer/api.sh:38,145` and `tools/deployer/github_deployer.sh:99,212`
  forward it; `tools/deployer/api/api.env.j2:64` always renders the key, so an
  unset deployer value becomes an empty string and the code default applies.
- GitHub Actions: `.github/workflows/ansible.yml:108,227` pass
  `secrets.PREVIEW_ALLOWED_BILLING_SERVICE_PROVIDERS` and
  `secrets.ALLOWED_BILLING_SERVICE_PROVIDERS`; an unset secret also falls back
  to the code default.
- Local development: `apps/api/create_env.sh` writes no entry for the
  variable. In deployment mode the root `create_env.sh api deployment` writes
  the container environment to `apps/api/.env` (`create_env.sh:3-11,33-37`),
  so `apps/api/create_env.sh` runs only for local setups.
- `jest.setup.ts:11-13` loads `apps/api/.env` into every unit test process, so
  a test that depends on the list must mock `@sps/shared-utils` or clear the
  variable itself.

### Error mapping

- `getHttpErrorType` maps a message that starts with `Validation error` to 400
  and a `Forbidden` message to 403
  (`libs/shared/backend/utils/src/lib/http-error/index.ts:95-99`). Its spec
  already pins `Provider google is not allowed` as a 400 Validation error
  (`http-error/index.spec.ts:13-47`).

### Frontend checkout forms

- The subject checkout variants keep their own hard-coded provider lists,
  independent of the environment list:
  `rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/checkout-default/ClientComponent.tsx:13-38`
  (default value `dummy` at `:56`),
  `.../order/checkout-default/ClientComponent.tsx:12-32` (default `stripe` at
  `:49`) and `.../order/list/checkout-default/ClientComponent.tsx:23-36`
  (default `stripe` at `:59`). The server refuses a submitted provider that is
  not in the environment list.

### Callers of the two routes

- Server SDK: `billing/models/payment-intent/sdk/server/src/lib/singlepage/provider.ts`
  posts to the creation route and `provider-webhook.ts` to the webhook route
  (its body type is the Telegram Star payload); both are exported from
  `sdk/server/src/lib/singlepage/index.ts:37-47`. The client SDK exposes
  neither action.
- Checkout: `rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:743-798`
  creates the payment intents and calls `billingModulePaymentIntentApi.provider`
  with the checkout's provider and the operator secret. `:801-829` stores an
  observer message whose trigger is `POST .../payment-intents/${provider}/webhook`
  and whose pipe posts to `/api/ecommerce/orders/:id/check`. The observer
  middleware runs the pipe only after a 2xx response to a request with the
  trigger's method and URL (`libs/middlewares/src/lib/observer/index.ts:55-63,152-153`).
  `checkout.spec.ts:632` pins the Stripe trigger URL.
- Telegram Star: the agent service (`agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1909-1919`)
  and the free-subscription flow (`rbac/.../service/singlepage/telegram/checkout-free-subscription.ts:323-332`)
  check out with `provider: "telegram-star"`, which reaches the creation route
  and its list check. After Telegram reports a successful payment, the bot
  posts the payment to `/api/billing/payment-intents/telegram-star/webhook`
  through `providerWebhook` with the operator secret
  (`apps/telegram/src/lib/telegram-bot.ts:773-826`).
- The creation handler itself posts to the webhook for zero-amount intents
  and for `dummy` (see above).
- No caller in `apps/mcp` or `apps/host`; the host only has a Telegram reply
  template named after the payment-intent-created event.
- The RBAC permission seed holds one `POST` row per provider webhook path,
  nine in total, under `libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/`
  (`3183c75f-...json` is the `dummy` row).
- Specs that touch these calls mock the payment-intent SDK
  (`apps/telegram/src/lib/telegram-bot.spec.ts:85`,
  `rbac/.../ecommerce/order/checkout.spec.ts:33`), so they do not reach either
  handler.

### Tests

- Billing unit tests run under `libs/modules/billing/jest.config.ts` through
  `npx nx run @sps/billing:jest:test` (four suites, twelve tests on this
  commit). `controller/singlepage/check/index.spec.ts` and
  `service/singlepage/telegram-star.spec.ts` are the payment-intent specs;
  `provider/` and `provider-webhook/` have none.
- Handler specs in the repository build either a plain context object
  (`check/index.spec.ts:53-88`) or a real Hono app
  (`libs/shared/backend/utils/src/lib/rbac-secret/index.spec.ts`); environment
  constants are mocked with getters so one suite can vary them
  (`rbac/models/subject/.../authentication/oauth/exchange.spec.ts:9-42`).
- DB-backed scenarios live under `apps/api/specs/scenario/singlepagestartup/issue-<n>/`
  and run with `npm run test:scenario:issue -- singlepagestartup <n>`; none
  covers payment creation or provider webhooks. `issue-158` reads and writes
  through the server SDKs with the operator secret.

## Code References

- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/index.ts:49-77` - route bindings and handler delegation
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider/index.ts:85-91` - the only list check
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider/index.ts:93-170` - zero-amount creation posting to the webhook
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider/index.ts:267-300` - `dummy` creation and its delayed webhook call
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider-webhook/index.ts:30` - provider name read, no list check
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider-webhook/index.ts:59-93` - zero-amount shortcut before dispatch
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider-webhook/index.ts:148-156` - `dummy` dispatch
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider-webhook/index.ts:165-181` - Telegram Star operator-secret check
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/index.ts:64-140` - `updatePaymentIntentStatus`
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/index.ts:752-803` - `dummy` webhook: invoice paid, intents succeeded
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/startup/index.ts:1-6` - project override seam for the service
- `libs/shared/utils/src/lib/envs/host.ts:9-11` - list and default
- `tools/deployer/.env.example:139`, `tools/deployer/api/api.env.j2:64` - deployer value and template
- `apps/api/create_env.sh` - local env script without the variable
- `jest.setup.ts:11-13` - unit tests load `apps/api/.env`

## Architecture Documentation

- Handlers under `controller/singlepage/<name>/index.ts` hold the request
  logic and call `this.service`; framework behavior sits in `singlepage`
  classes and projects override it in `startup` subclasses.
- Environment values are read once in `libs/shared/utils/src/lib/envs/*.ts`
  and imported from `@sps/shared-utils`. Comma-separated lists are split at
  the call site (`provider/index.ts:85`, `crm/.../request/create.ts:119-120`,
  `host/.../actions/generate.ts:32`); no shared list parser exists.
- Handlers report failures by throwing `Error` with a category prefix and
  mapping it in their `catch` block through `getHttpErrorType`.
- Route middleware exists for modules only in
  `libs/modules/rbac/models/subject/backend/app/middlewares`; billing has no
  middleware package.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-230.md` (PayKeeper webhook
  identifiers) already records that the webhook controller does not consult
  the list. Issue #230 is in research and concerns the PayKeeper branch, not
  the dispatch entry.
- Commit `93b6d9f0c5` moved the Telegram Star secret comparison to
  `rbacSecretMatches`; it is the most recent change to the webhook handler.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-230.md`

## Open Questions

- A deployment whose Payselection webhook URL path segment differs from the
  name it lists for payment creation (for example `payselection` in the URL,
  `payselection-international` in the list) would need both names listed once
  the webhook reads the list. The webhook URLs are deployment values
  (`PAYSELECTION_RUB_WEBHOOK_URL`, `PAYSELECTION_INT_WEBHOOK_URL`) with no code
  default, so this is checked per deployment.
