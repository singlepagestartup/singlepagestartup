---
date: 2026-09-26T00:14:00+03:00
issue_number: 302
repository: singlepagestartup
topic: "Review the payment webhook provider gate"
status: approved
---

# Payment webhook provider gate Implementation Plan

## Overview

The provider webhook route will refuse a provider that
`ALLOWED_BILLING_SERVICE_PROVIDERS` does not list, through one predicate that
payment creation also uses, and the default list will no longer contain
`dummy`.

## Current State Analysis

- Payment creation checks the list inline (`provider/index.ts:85-91`); the
  webhook handler reads the provider from the path and never checks it
  (`provider-webhook/index.ts:30`).
- The webhook's zero-amount shortcut (`:59-93`) and every provider branch
  (`:97-181`) run for any path segment. The `dummy` branch marks the named
  invoice `paid` and the linked payment intents `succeeded` without a
  credential (`service/singlepage/index.ts:752-803`).
- The default list includes `dummy` (`libs/shared/utils/src/lib/envs/host.ts:9-11`);
  `apps/api/create_env.sh` does not set the variable; the deployer example
  lists all eight providers (`tools/deployer/.env.example:139`).
- Neither handler has a spec. Unit tests load `apps/api/.env` through
  `jest.setup.ts`, so a spec must control the list itself.

## Desired End State

- `POST /api/billing/payment-intents/<name>/webhook` answers 400
  `Validation error. Provider <name> is not allowed` when `<name>` is not an
  exact entry of the list, before the body is parsed; nothing is read or
  written.
- A listed provider's webhook behaves exactly as before, including the
  zero-amount shortcut and the Telegram Star operator-secret check.
- Payment creation refuses and accepts the same providers as before, at the
  same point of the handler, through the same predicate.
- With the variable unset, the list is `stripe,0xprocessing,payselection,cloudpayments,tiptoppay`.
  A project that wants `dummy` lists it; local environments created by
  `apps/api/create_env.sh` list it explicitly.

Verification: unit specs for the predicate, both handlers and the default;
a DB-backed scenario; an HTTP proof on port 4302 with and without `dummy` in
the list; a mutation check on the webhook gate.

### Key Discoveries

- Both handlers receive the payment-intent `Service`
  (`controller/singlepage/index.ts:67-77`), and `service/startup/index.ts`
  subclasses the singlepage service, so a service method gives projects an
  override seam at no cost.
- The billing module has no middleware package and no utils folder; a
  predicate that only billing uses does not belong in `@sps/backend-utils`
  yet, and a helper beside the REST handlers is the anti-pattern the
  placement contract names.
- `getHttpErrorType` already answers `Validation error ... is not allowed`
  with 400 (`http-error/index.spec.ts:13-47`).
- The observer middleware runs a checkout's order-check pipe only after a 2xx
  webhook response (`libs/middlewares/src/lib/observer/index.ts:55-63`); a
  refused webhook starts nothing.

## What We're NOT Doing

- Changing any provider branch, its payload handling or its signature checks.
  Refusing branches that lack signature headers stays with #230 and later
  work.
- Removing the `dummy` provider, tying it to `NODE_ENV`, or requiring the
  operator secret on its webhook. The environment list is the switch.
- Changing RBAC permission rows or the seed.
- Changing the frontend checkout forms; the product checkout variant keeps its
  `dummy` default value and relies on the server's list, as the other
  unlisted names in those forms already do.
- Trimming or case-folding list entries. Matching stays exact, as creation
  matches today.
- Moving the constant from `envs/host.ts` to `envs/billing.ts`, or adding a
  middleware package to billing.

## Implementation Approach

Add `isProviderAllowed({ provider })` to the singlepage payment-intent
service. The creation handler replaces its inline split-and-includes with the
predicate at the same position. The webhook handler calls the predicate right
after it reads the provider name and throws the same Validation error, which
its existing `catch` maps to 400. Then drop `dummy` from the code default and
make the list explicit where environments are created.

## Phase 1: Shared predicate and both handlers

### Overview

One predicate decides for both routes; the webhook refuses unlisted providers.

### Changes Required

#### 1. Payment-intent service

**File**: `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/index.ts`
**Why**: both handlers hold this service, and its `startup` subclass is the
project seam.
**Changes**: import `ALLOWED_BILLING_SERVICE_PROVIDERS` in the existing
`@sps/shared-utils` block; add `isProviderAllowed(props: { provider: string })`
returning whether the provider is an exact entry of the comma-separated list.

#### 2. Creation handler

**File**: `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider/index.ts`
**Why**: the gate must be one rule for both routes.
**Changes**: replace lines 85-91 with a call to `this.service.isProviderAllowed`
at the same position and the same error message; remove the now unused
`ALLOWED_BILLING_SERVICE_PROVIDERS` import.

#### 3. Webhook handler

**File**: `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider-webhook/index.ts`
**Why**: the finding.
**Changes**: after reading `provider` (line 30), refuse an unlisted provider
with `Validation error. Provider <name> is not allowed` before the body is
read, so the zero-amount shortcut and the branches run only for listed
providers.

#### 4. Specs

- `service/singlepage/index.spec.ts`: the predicate accepts listed names and
  refuses a name that is only part of a listed entry, a name that extends
  one, and `dummy` when the list omits it. The list is a getter on a partial
  `@sps/shared-utils` mock.
- `controller/singlepage/provider-webhook/index.spec.ts`: the handler mounted
  on a Hono app. An unlisted `dummy` answers 400 and neither the service
  branch nor the invoice lookup runs; a listed `dummy` answers 200 through
  `service.dummy`; a listed provider still settles a zero-amount invoice; a
  listed `telegram-star` still answers 403 without the operator secret and
  reaches its service with it.
- `controller/singlepage/provider/index.spec.ts`: creation answers 400 for an
  unlisted provider without calling its branch, and 201 through
  `service.dummy` when `dummy` is listed.

### Success Criteria

#### Automated Verification

- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/billing:jest:test`
- [x] `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/billing:eslint:lint`
- [x] `npx tsc --noEmit -p libs/modules/billing/tsconfig.json`
- [x] Mutation check: with the webhook gate removed, the webhook spec fails; restored, it passes.

#### Manual Verification

- [x] Covered by the HTTP proof in Phase 3.

---

## Phase 2: Default list, environment templates and docs

### Overview

`dummy` leaves the code default; environments that want it say so.

### Changes Required

#### 1. Default value

**File**: `libs/shared/utils/src/lib/envs/host.ts`
**Changes**: default `stripe,0xprocessing,payselection,cloudpayments,tiptoppay`;
a doc comment in the style of the `KV_*` comments stating that the list gates
creation and webhooks and that `dummy` settles invoices without a payment.
**Spec**: `libs/shared/utils/src/lib/envs/host.spec.ts` reloads the module
after `jest.resetModules()` with the variable unset and set, and restores the
environment.

#### 2. Local environment

**File**: `apps/api/create_env.sh`
**Why**: the product checkout variant defaults to `dummy`, and local setups
have run on the default list until now.
**Changes**: write `ALLOWED_BILLING_SERVICE_PROVIDERS` with the previous
default, `dummy` included, and a comment. Deployments never run this script
(`create_env.sh api deployment` writes the container environment instead).

#### 3. Deployer example

**File**: `tools/deployer/.env.example`
**Changes**: drop `dummy` from the example value and add a comment explaining
what `dummy` does and when to list it. `api.env.j2` already renders the key.

#### 4. Model documentation

**File**: `libs/modules/billing/models/payment-intent/README.md`
**Changes**: a "Payment providers" section: the two routes, the list that
gates both, the default, and what listing `dummy` means.

### Success Criteria

#### Automated Verification

- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-utils:jest:test`
- [x] `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-utils:eslint:lint`
- [x] `npx tsc --noEmit -p libs/shared/utils/tsconfig.json`
- [x] `bash -n apps/api/create_env.sh`

---

## Phase 3: DB-backed scenario and HTTP proof

### Overview

Prove the gate against a running API and the database.

### Changes Required

#### 1. Scenario spec

**File**: `apps/api/specs/scenario/singlepagestartup/issue-302/backend-provider-webhook-gate.scenario.spec.ts`
**Why**: the scenario lane is where end-to-end behavior is checked with the
database; it does not depend on which providers a developer lists.
**Changes**: create a zero-amount invoice and payment intent through the
server SDKs with the operator secret. A provider name that is not in the list
answers 400 and leaves both rows unpaid; the first listed provider settles
the invoice through the zero-amount shortcut and moves the payment intent to
`succeeded`. Delete the fixture afterwards. Reuse the issue-154 env helpers.

### Success Criteria

#### Automated Verification

- [x] `API_SERVICE_URL=http://localhost:4302 npx jest --config apps/api/jest.scenario.config.ts --runInBand --runTestsByPath <spec>` against the API on port 4302
- [x] `npx tsc --noEmit -p apps/api/specs/scenario/tsconfig.json`
- [x] `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run api:eslint:lint`
- [x] `node tools/agents/code-placement.mjs`

#### Manual Verification

- [x] API on port 4302 with a list without `dummy`: the anonymous `dummy` webhook answers 400 and the throwaway invoice stays `open`.
- [x] API on port 4302 with `dummy` listed: the same call answers 200, the invoice is `paid` and its payment intent `succeeded`; the fixture is deleted.

---

## Testing Strategy

### Unit Tests

- Predicate: exact matching against the configured list.
- Webhook: refusal before any read for an unlisted provider; unchanged
  behavior for listed `dummy`, the zero-amount shortcut and Telegram Star.
- Creation: the same refusal and acceptance as before the refactor.
- Default: `dummy` absent when the variable is unset.

### Integration Tests

- The scenario spec above, run against the API on port 4302.

### Manual Testing Steps

1. Boot the API from the worktree on port 4302 with the list set without `dummy`; post the `dummy` webhook for a throwaway invoice without credentials and with the operator secret; both answer 400 and the invoice stays `open`.
2. Boot it again with `dummy` listed; the same call answers 200 and settles the invoice; delete the fixture.

## Use Cases Kept

- Payment creation for listed providers, and its refusal for unlisted ones.
- Zero-amount payments: creation posts to the webhook of a provider that
  passed the same list.
- `dummy` in projects that list it: creation and its delayed webhook call.
- Telegram Star: the bot posts with the operator secret; the list check runs
  first and the secret check stays.
- The checkout observer's order check after an accepted webhook.
- Local development created by `apps/api/create_env.sh`, which lists `dummy`.
- Cross-origin API access, uploads, the anonymous cart, tunnel development and
  MCP OAuth: no middleware, CORS, cookie or route change touches them.

## Performance Considerations

The predicate splits a short string once per request, as creation already
does.

## Migration Notes

- A deployment that relied on the default for `dummy` loses it; to keep it,
  set `ALLOWED_BILLING_SERVICE_PROVIDERS` with `dummy`. A production
  deployment that takes real payments removes `dummy` from its value.
- A provider must stay listed as long as its webhooks can still arrive, for
  example subscription renewals after a project stops offering it.
- Each webhook path segment must be listed. A Payselection webhook URL that
  uses a different segment from the listed creation name needs both names.
- A GitHub Actions deployment whose `ALLOWED_BILLING_SERVICE_PROVIDERS` or
  `PREVIEW_ALLOWED_BILLING_SERVICE_PROVIDERS` secret is unset uses the new
  default.

## References

- Research: `thoughts/shared/research/singlepagestartup/ISSUE-302.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-230.md`
