---
date: 2026-09-26T03:25:00+03:00
issue_number: 347
repository: singlepagestartup
topic: "Subject checkout routes: add the owner check"
status: approved
---

# Subject checkout routes: owner check Implementation Plan

## Overview

Put `RequestSubjectIdOwner` on the two subject checkout routes, as on the other subject-owned routes, and restrict the order checkout to orders linked to the subject. Every server-side caller first gets a credential, so no flow breaks when the guard lands.

## Current State Analysis

- `POST /:id/ecommerce-module/orders/checkout` and `POST /:id/ecommerce-module/products/:productId/checkout` are declared without `middlewares` (`controller/singlepage/index.ts:276-280,301-305`); their permission rows have no role, so the global authorization step admits every caller.
- The order checkout finds, annotates and checks out every order id from the body, with no subject filter (`order/checkout.ts:80-131`).
- Server-side callers: Telegram free subscription sends the operator secret (`service/singlepage/telegram/checkout-free-subscription.ts:323-339`); the subscription renewal (`service/singlepage/ecommerce/order/proceed.ts:1000-1009`) and the agent's `checkout_ec_me_pt_` callback (`agent/.../service/singlepage/index.ts:1908-1918`) send nothing.
- Browser callers send the signed-in subject's JWT through `saturateHeaders`, and the path id is that subject (`me` wrappers).

## Desired End State

- Both routes run `RequestSubjectIdOwner` before their handlers. A request without a credential answers 400 and a token of another subject 401; a wrong operator secret is refused (401 from the global authorization step, before the guard); the subject's own token and the operator secret reach the handler.
- The order checkout annotates and checks out only orders linked to the path subject through `subjects-to-ecommerce-module-orders`; other ids in the body are ignored, as ids of deleted orders already are. With none left it answers 404.
- The renewal sends `X-RBAC-SECRET-KEY`; the agent callback sends a token signed for the Telegram user whose subject is in the path.
- Verified by a route-table spec, caller specs, handler specs, and an HTTP run against a copy of the development database.

### Key Discoveries:

- `DefaultApp.useRoutes()` registers route middlewares with `hono.use(route.path, …)` just before the handler (`libs/shared/backend/api/src/lib/app/default/index.ts:72-82`), so a spec can mount the real table and send requests.
- The guard's statuses come from its messages through `getHttpErrorType` (`http-error/paterns/index.ts:3-22,78-81`); PR #346's route-table spec pins the same 400 and 401.
- `order/list.ts:43-90` is the owner-scoped pattern: `subjectsToEcommerceModuleOrders.find` by `subjectId`, then orders by id.
- The agent service already signs tokens for the Telegram user with `signRbacModuleSubjectJwt` (`agent/.../index.ts:735-756`) and sends them as `Authorization: Bearer` on an owner-guarded route (`:2426-2448`). The #311 branch changes that method's body to an access-typed token, so this call site keeps working after that merge.
- Every other outbound call in `proceed.ts` sends `X-RBAC-SECRET-KEY`.

## What We're NOT Doing

- No change to `deanonymize` or to where the handlers call it.
- No role on the two permission rows; the browser calls both routes with the subject's own token.
- No change to `RequestSubjectIdOwner`: its statuses stay 400 and 401, and its operator-secret comparison stays as it is (constant-time comparison is #295).
- No change to `ecommerceOrderCheckout`, whose two callers pass subject-scoped orders after this change.
- No change to the Telegram bot or the free-subscription service; both already send the operator secret.
- No change to the other ecommerce subject routes (their in-handler checks and the order line routes belong to other issues), to the OpenAPI entries (guarded siblings do not document their guards), or to the frontend.

## Implementation Approach

Fix the callers first, then add the guard and the order scope, so the guard never lands on a caller that cannot pass it. Use the existing seams only: the guard from the module middleware package, declared in the route table like its siblings; the subject-scoped lookup the list handler uses; the agent's existing token signer; the operator-secret header the proceed service uses everywhere else.

## Phase 1: Server-side callers carry a credential

### Overview

The two callers without a credential send one that passes the guard.

### Changes Required:

#### 1. Subscription renewal

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts`
**Why**: `delivered` creates the renewal checkout for the subject over HTTP with no credential; it runs inside operator-side order processing.
**Changes**: pass `options.headers` with `X-RBAC-SECRET-KEY` and `Cache-Control: no-store` on the `api.ecommerceModuleProductCheckout` call, like the other calls in the file.

**File**: `…/ecommerce/order/proceed.spec.ts`
**Changes**: the renewal scenario expects the operator-secret header on the checkout call.

#### 2. Agent Telegram checkout callback

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`
**Why**: `telegramBotEcommerceModuleProductFindByIdCheckout` checks out for the Telegram user's subject; the `jwtToken` it receives belongs to the bot's subject.
**Changes**: sign a token for the Telegram user's subject with `signRbacModuleSubjectJwt` and send it as `Authorization: Bearer` on the product checkout call.

**File**: `…/service/singlepage/telegram-subscription-checkout.spec.ts`
**Changes**: stub the signer; expect the header on the call and the signer to be called with the Telegram user's subject, not the bot's.

### Success Criteria:

#### Automated Verification:

- [x] `proceed.spec.ts` and `telegram-subscription-checkout.spec.ts` pass.
- [x] Removing either header makes its spec fail.

#### Manual Verification:

- [x] Code reading confirms no other server-side caller of the two routes lacks a credential.

---

## Phase 2: Owner guard and subject-scoped order checkout

### Overview

Both routes carry the guard; the order checkout ignores orders outside the subject.

### Changes Required:

#### 1. Route table

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`
**Why**: subject-owned routes keep `RequestSubjectIdOwner` as the first ownership guard (subject README).
**Changes**: `middlewares: [new RequestSubjectIdOwner().init()]` on both routes, declared like the sibling routes.

#### 2. Order checkout handler

**File**: `…/controller/singlepage/ecommerce-module/order/checkout.ts`
**Why**: the body names order ids; the handler annotates and checks out every id it finds.
**Changes**: read the subject's `subjectsToEcommerceModuleOrders`, keep the body ids linked to the subject, and look up, annotate and check out only those; with none left, answer "Not Found error. No ecommerce module orders found" as today.

#### 3. Specs

**File**: `…/controller/singlepage/index.spec.ts` (new)
**Changes**: mount the real route table through `DefaultApp.useRoutes()`; for each checkout route: no credential 400 and the handler does not run; another subject's token 401 and the handler does not run; the subject's token and the operator secret reach the handler.

**File**: `…/controller/singlepage/ecommerce-module/order/checkout.spec.ts`
**Changes**: the service mock returns the subject's order links; a new scenario shows an order of another subject in the body is neither annotated nor checked out, and a body with only such orders answers 404.

### Success Criteria:

#### Automated Verification:

- [x] The route-table spec and the order checkout spec pass.
- [x] Without the middleware on a route, that route's refusal scenarios fail; without the subject filter, the new handler scenario fails.

#### Manual Verification:

- [x] HTTP run (Testing Strategy) shows the statuses above on a running API.

---

## Phase 3: Subject README

### Overview

Document the guard and the credential each caller sends, for projects that add their own callers.

### Changes Required:

**File**: `libs/modules/rbac/models/subject/README.md`
**Changes**: a short section beside "Social Thread Permission Routes" naming the two routes, the guard, the credentials of browser, agent and operator callers, and the order scope.

### Success Criteria:

#### Automated Verification:

- [x] Prettier check passes on the README.

#### Manual Verification:

- [x] The section matches the code.

---

## Testing Strategy

### Unit Tests:

- Route table: both routes × {no credential, another subject's token, own token, operator secret}.
- Order checkout handler: owned orders, stale ids, another subject's order, only another subject's orders.
- Callers: renewal header, agent header and the subject the token is signed for.
- Lanes: `npx nx run @sps/rbac:jest:test`, `npx nx run @sps/agent:jest:test`; lint `@sps/rbac:eslint:lint`, `@sps/agent:eslint:lint`; types `npx tsc --noEmit -p libs/modules/{rbac,agent}/tsconfig.json`; `node tools/agents/code-placement.mjs`.

### Integration Tests:

- None added; the HTTP run covers the assembled pipeline.

### Manual Testing Steps:

1. Copy the development database to a throwaway database with `pg_dump` and run the API from this worktree on port 4347 against it.
2. Anonymous subject A (`GET …/authentication/init`) adds a product to its cart and checks out the cart with its own token: 200 with an invoice.
3. The same route for A with no token: 400; with the token of a second anonymous subject B: 401; with the operator secret: reaches the handler.
4. The product checkout for A: own token 200, B's token 401, no token 400, operator secret 200, a token signed the way the agent signs it 200.
5. B puts A's cart order into B's own order checkout: 404, A's order untouched.
6. Drop the throwaway database and stop the API.

## Performance Considerations

One extra read of the subject's order links per order checkout, the same query the cart list handler runs on every cart read.

## Migration Notes

Projects that call either route from their own server code without a credential must add one: a token of the subject in the path, or `X-RBAC-SECRET-KEY` for operator processes. Browser callers through the SDK need nothing.

## References

- Original ticket: GitHub issue #347 (https://github.com/singlepagestartup/singlepagestartup/issues/347)
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-347.md`
