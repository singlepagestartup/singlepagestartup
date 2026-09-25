Closes #302.

## Summary

`ALLOWED_BILLING_SERVICE_PROVIDERS` gated payment creation only. The provider webhook route dispatched on whatever provider name its path carried, and the `dummy` branch marks the invoice named in the request `paid` and moves the linked payment intents to `succeeded` without a signature or credential. Because `dummy` was in the default list, a deployment that never set the variable settled invoices for any caller of `POST /api/billing/payment-intents/dummy/webhook`.

The webhook now refuses a provider outside the list with 400 before it reads the body, through the same predicate payment creation uses, and `dummy` is no longer in the default list. The list stays the switch: a project that runs without real payments lists `dummy` and keeps the current behavior.

## Changes

Paths without a prefix are under `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/`.

- `service/singlepage/index.ts` — `isProviderAllowed({ provider })` on the singlepage payment-intent service: an exact match against the comma-separated list, as payment creation matched before. A project overrides it in its `startup` service.
- `controller/singlepage/provider/index.ts` — payment creation calls the predicate at the position of its old inline check; the refusal message and status are unchanged.
- `controller/singlepage/provider-webhook/index.ts` — the webhook calls the predicate right after reading the provider name and answers `400 Validation error. Provider <name> is not allowed` for an unlisted one, before the body is parsed. The zero-amount shortcut and every provider branch run only for listed providers; no branch's payload handling changed, and the Telegram Star operator-secret check stays.
- `libs/shared/utils/src/lib/envs/host.ts` — the default is `stripe,0xprocessing,payselection,cloudpayments,tiptoppay`, with a doc comment.
- `apps/api/create_env.sh` — local environments list the previous default, `dummy` included, so the local product checkout form, which defaults to `dummy`, keeps working. Deployments never run this script.
- `tools/deployer/.env.example` — the example list drops `dummy`; a comment says what it does and when to add it.
- `libs/modules/billing/models/payment-intent/README.md` — a "Payment providers" section: both routes, the list, the default and `dummy`.
- BDD specs for the predicate (`service/singlepage/index.spec.ts`), both handlers mounted on a Hono app (`controller/singlepage/provider/index.spec.ts`, `controller/singlepage/provider-webhook/index.spec.ts`), the default list (`libs/shared/utils/src/lib/envs/host.spec.ts`) and a DB-backed scenario (`apps/api/specs/scenario/singlepagestartup/issue-302/backend-provider-webhook-gate.scenario.spec.ts`).
- `thoughts/shared/` — research, plan, process log and progress record for #302.

## Verification

- [x] `npx nx run @sps/billing:jest:test` — 7 suites, 22 tests (4 and 12 before the change).
- [x] `npx nx run @sps/shared-utils:jest:test` — 13 suites, 76 tests.
- [x] `npx nx run @sps/billing:eslint:lint`, `npx nx run @sps/shared-utils:eslint:lint` and `npx nx run api:eslint:lint` (two existing warnings in untouched jest configs).
- [x] `npx tsc --noEmit` for `libs/modules/billing`, `libs/shared/utils` and `apps/api/specs/scenario` — 0 errors.
- [x] `node tools/agents/code-placement.mjs`.
- [x] Mutation checks: without the webhook check the webhook spec fails; without the creation check the creation spec fails; a substring or prefix predicate fails the predicate spec; without the webhook check the DB-backed scenario fails (`Expected: 400, Received: 200`).
- [x] The scenario against an API on port 4302, with and without `dummy` in the list — 2 passed each time.
- [x] The HTTP checks below against the same API, with throwaway fixtures deleted afterwards.

## How to verify it

Against an API started from this branch, with a throwaway invoice linked to a payment intent:

1. With `ALLOWED_BILLING_SERVICE_PROVIDERS=stripe,0xprocessing,payselection,cloudpayments,tiptoppay`, or with the variable empty so the default applies, `POST /api/billing/payment-intents/dummy/webhook` with `{"data":{"id":"<invoice id>"}}` answers 400, with or without the operator secret, and the invoice stays `open`. Before this change the same call answered 200 and the invoice became `paid`.
2. With `dummy` added to the list, the same call answers 200, the invoice is `paid` and the payment intent `succeeded`. A payment created through `POST /api/billing/payment-intents/:uuid/dummy` settles itself about ten seconds later, as before.
3. A provider name outside the list answers 400 even with the operator secret.

## Notes

- The product checkout variant in the RBAC subject module defaults its provider field to `dummy`. On a deployment that does not list `dummy`, payment creation refuses that default, as it already refuses any other unlisted name in those forms. The form is unchanged.
- The OpenAPI `paths.yaml` files document success responses only, so the payment-intent paths are unchanged.

## Downstream migration

Adaptation is required where a project relies on the default provider list, lists a provider only for payment creation, or overrides the payment-intent handlers.

**Applies to:** projects that take or simulate payments through the billing payment-intent routes, leave `ALLOWED_BILLING_SERVICE_PROVIDERS` unset in any environment, or override the payment-intent service or its provider handlers in startup code.

**Actions:**

- A project that takes real payments removes `dummy` from `ALLOWED_BILLING_SERVICE_PROVIDERS` in `tools/deployer/.env`, in the `ALLOWED_BILLING_SERVICE_PROVIDERS` and `PREVIEW_ALLOWED_BILLING_SERVICE_PROVIDERS` GitHub Actions secrets and on every running server, including values copied from the old `tools/deployer/.env.example`.
- A project that runs without real payments on purpose and relied on the default sets the variable with `dummy` in those places and in local `apps/api/.env` files created before this change.
- List every provider whose webhooks can still arrive, under the exact path segment of its webhook URL, including providers kept only for renewals of existing subscriptions. A Payselection webhook URL whose segment differs from the listed creation name needs both names.
- Startup overrides of the provider or provider-webhook handlers call `service.isProviderAllowed({ provider })` before handling; a project with its own allow rule overrides `isProviderAllowed` in its startup payment-intent service.
- A project whose checkout variant defaults to `dummy` lists `dummy` or changes that default in its own variant.

**Verify:** on a deployment without `dummy`, `POST /api/billing/payment-intents/dummy/webhook` answers 400 and leaves the invoice open; a listed provider still completes a real or zero-amount payment; `npx nx run @sps/billing:jest:test` passes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
