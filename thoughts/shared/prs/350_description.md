Closes #347.

## Summary

`POST /api/rbac/subjects/:id/ecommerce-module/orders/checkout` and `POST /api/rbac/subjects/:id/ecommerce-module/products/:productId/checkout` had no owner check: their permission rows carry no role, and neither handler checked the caller. Both routes now run `RequestSubjectIdOwner`, like the 24 other subject routes that carry it, so a caller presents a token of the subject in the path or the operator secret. The order checkout also acts only on the subject's own orders. The two server-side callers that sent no credential are fixed in the same change, so the browser cart, Telegram free subscriptions, the agent's Telegram checkout button and subscription renewal keep working.

## Changes

- **Route guard.** `middlewares: [new RequestSubjectIdOwner().init()]` on both routes in the subject route table. Without a credential they answer 400, with another subject's token 401, the statuses this middleware gives on its other routes; the subject's own token and the operator secret reach the handler.
- **Order scope.** The order checkout reads the subject's `subjects-to-ecommerce-module-orders` rows and keeps only the body order ids linked to the subject. Other ids are ignored, as ids of deleted orders already were; with none left the route answers 404 before any order is read or annotated.
- **Subscription renewal.** `delivered` in the order proceed service sends `X-RBAC-SECRET-KEY` and `Cache-Control: no-store` on its product checkout call, like every other call in that service.
- **Agent Telegram checkout button.** `telegramBotEcommerceModuleProductFindByIdCheckout` signs a token for the Telegram user's subject with the existing `signRbacModuleSubjectJwt` and sends it as `Authorization: Bearer`; the `jwtToken` it receives belongs to the bot's subject.
- **Specs.** A new route-table spec, `controller/singlepage/index.spec.ts`, mounts the real table through `DefaultApp.useRoutes()` and checks both routes with no credential, another subject's token, the subject's own token and the operator secret. The order checkout spec shows that an order of another subject is neither annotated nor checked out and that a body with only such orders answers 404. The renewal and agent scenarios expect the new credentials.
- **Docs.** Subject README section "Ecommerce Checkout Routes".
- Unchanged: the two permission rows (the browser calls both routes with the subject's own token), the Telegram bot and the free-subscription service (both already send the operator secret), and `RequestSubjectIdOwner` itself.

## Verification

- [x] `npx nx run @sps/rbac:jest:test`: 83 suites, 390 tests pass.
- [x] `npx nx run @sps/agent:jest:test`: 17 suites, 89 tests pass.
- [x] `npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/agent`: pass, no warnings.
- [x] `npx tsc --noEmit -p libs/modules/{rbac,agent}/tsconfig.json`: no errors.
- [x] `node tools/agents/code-placement.mjs`: clean.
- [x] Mutation checks: removing the guard from either route fails that route's two refusal scenarios; the `main` order checkout handler fails three scenarios; the `main` proceed service fails the renewal scenario; the `main` agent service fails both agent scenarios.
- [x] HTTP on port 4347 against a throwaway copy of the development database, with two anonymous `init` subjects A and B. A adds two cart orders and lists them with its own token (200). Order checkout of A: no credential 400, B's token 401, a wrong operator secret 401, A's own token 200 with an invoice, the operator secret 200. B's own checkout naming A's order: 404, and A's order stays unchanged. Product checkout of A: no credential 400, B's token 401, A's token 200, the operator secret 200, a token signed the way the agent module signs it 200. The Telegram free-subscription route with the operator secret: 200, with a `paying` order and a zero-amount `telegram-star` invoice created through the guarded product checkout.
- [ ] Subscription renewal and the agent's Telegram checkout button end to end. Not run: they need an expired Telegram Stars order and a Telegram callback action. Their unit scenarios cover them, and the HTTP requests above carry the same credentials.
- [ ] Browser check of the cart checkout. Not run: the host does not build on the worktree's symlinked `node_modules`; the HTTP run sends the requests the client SDK sends.

## Notes

- PR #346 adds a route-table spec at the same path, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.spec.ts`. Whichever PR merges second combines the two suites into that file; both mock `@sps/shared-utils` the same way and build the app the same way. The two PRs change different hunks of the route table.
- `RequestSubjectIdOwner` answers 401, not 403, to another subject's token and 400 to a missing token, as on its other routes; this PR keeps those statuses.

## Downstream migration

- **Server-side callers.** Owned code that calls either checkout route, through `ecommerceModuleOrderCheckout`, `ecommerceModuleProductCheckout` or the paths directly, sends a token signed for the subject in the path when it acts for that subject, or `X-RBAC-SECRET-KEY` when it is an operator process. Browser calls through the client SDK need nothing.
- **Overrides.** A startup override of the subject controller keeps `RequestSubjectIdOwner` on both routes; an override of the order checkout handler keeps the `subjects-to-ecommerce-module-orders` filter.
- **Order scope.** A flow that checks out orders not linked to the subject through `subjects-to-ecommerce-module-orders` links them first.

_Verify:_ both routes answer 400 without a credential and 401 to another subject's token; the subject's own token and the operator secret reach the handler; owned renewal, bot and cart checkout flows still create their checkout.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
