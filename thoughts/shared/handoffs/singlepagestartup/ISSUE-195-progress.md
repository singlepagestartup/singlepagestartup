---
issue_number: 195
issue_title: "Smooth realtime data updates without full component rerenders"
start_date: 2026-06-10T14:00:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-195.md
status: in_progress
---

# Implementation Progress: ISSUE-195 - Smooth realtime data updates without full component rerenders

**Started**: 2026-06-10
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-195.md`

## Phase Progress

### Phase 1: Shared Cache Helpers + Factory Integration

- [x] Started: 2026-06-10T14:00:00Z
- [x] Completed: 2026-06-10T14:30:00Z
- [x] Automated verification: PASSED (23 shared-api tests, type check, lint, full shared suite)

**Notes**: One test had to use `toStrictEqual` instead of `toBe` for the removed item — React Query does not guarantee reference equality for items that shift position in the array (different lengths trigger full array replacement in `replaceEqualDeep`). Added note in spec comment. Reviewer pass tightened append safety so any non-empty serialized params use targeted invalidation, and fixed factory `onSuccess` merge to forward the full React Query v5 callback signature.

### Phase 2: Isolate Chat Composer Rerenders

- [x] Started: 2026-06-10T14:40:00Z
- [x] Completed: 2026-06-10T15:10:00Z
- [x] Automated verification: PASSED (35 suites / 134 tests incl. new `ClientComponent.rerender.spec.tsx`, lint 0 errors, tsc green)

**Notes**: Composer derives all description-dependent state internally via `useWatch` (NOT `form.watch` — see Incident 1). ClientComponent keeps only a non-rendering `form.watch(callback)` subscription for skill-mention sync. New rerender-isolation spec mocks `MessageTimeline` and asserts zero re-invocations during typing and picker interactions. Also merged pre-existing duplicate-import lint errors in `Composer.tsx`/`MessageEditDialog.tsx` that blocked `@sps/rbac:eslint:lint`. Reviewer pass removed a duplicated comment and verified the real chat composer in Browser.

### Phase 3: Memoize Chat Timeline Rows

- [x] Started: 2026-06-10T15:15:00Z
- [x] Completed: 2026-06-10T15:35:00Z
- [x] Automated verification: PASSED (35 suites / 135 tests, lint 0 errors, tsc green)

**Notes**: `MemoizedMessageRow`/`MemoizedActionRow` extracted with `React.memo`, profile loaders inside the memo boundary. Row types derived from `IComponentPropsExtended` (action items are NOT the SDK `IModel` — they are `IResult[…ActionFindResult][0]`). `deletingMessageId` replaces the global `isDeleting` boolean (cleared on both isSuccess and isError). `onMessageRowEdit`/`onMessageRowDelete` wrapped in `useCallback`; `openProfile` memoized in `use-profile-sidebar`. New BDD scenario asserts scoped `deletingMessageId` propagation.

### Phase 4: Chat Targeted Cache Patches + Scroll Fix

- [x] Started: 2026-06-10T15:40:00Z
- [x] Completed: 2026-06-10T16:10:00Z
- [x] Automated verification: PASSED (36 suites / 142 tests rbac, shared suite green, middlewares tsc green, lint 0 errors)

**Notes**: `useThreadMessagesRefetch` now returns `ThreadMessagesCache` (`{refetch, append, patch, remove}`) built on the shared cache helpers with the exact thread-message key. Create/update/delete success handling moved from `isSuccess` effects into mutate-level callbacks — this both fixes "effect never refires for same-flag mutations" semantics AND makes the flows testable (test mocks invoke `options.onSuccess`). Update handles the array-shaped SDK response (select by edited id, refetch fallback). `getTimelineSignature` no longer includes `updatedAt`. HTTP-cache middleware: issue-195 exclusion added for chat thread-messages GET and chat actions GET (defense-in-depth, issue-152 precedent). New `ClientComponent.cache.spec.tsx` covers append-no-invalidate, AI-flow refetch, delete remove-in-place, delete-error refetch, update patch-in-place, scroll-signature scenarios.

### Phase 5: Immediate Cross-Client Reconciliation

- [x] Started: 2026-06-10T16:15:00Z
- [x] Completed: 2026-06-10T16:50:00Z
- [x] Automated verification: PASSED (shared-api 27 tests incl. 4 new subscription-timing scenarios, middlewares tsc, api suite baseline-equal, lint)

**Notes**: Factory `subscription()` now invalidates immediately with 0–199 ms jitter (`INVALIDATION_JITTER_MAX_MS = 200`), both topic and route-fallback paths; `topicTriggerKey` dedup unchanged. `apps/api/app.ts`: `RevalidationMiddleware` moved BEFORE the conditional `HTTPCacheMiddleware` block (outer position → its post-next broadcast unwinds last); ordering contract documented in code. http-cache middleware: mutation-success version bumps are now awaited inline before the middleware completes (GET caching writes and 5xx stale-bumps stay fire-and-forget). The `apps/api/specs/singlepage/index.spec.ts` middleware-order contract test was updated to encode the new ordering (revalidation → http-cache → auth). Verified via git stash that the 2 remaining api-suite failures (issue-158 billing scenario + one suite bootstrap) pre-exist on the branch.

### Phase 6: Ecommerce Cart Universality Check

- [x] Started: 2026-06-10T16:55:00Z
- [x] Completed: 2026-06-10T17:05:00Z
- [x] Automated verification: PASSED (`npm run test:unit:ecommerce` — 12 suites / 22 tests)

**Notes**: Verification-only, zero cart code changes (as planned). Confirmed: `@sps/ecommerce/models/order` SDK spreads `factory<IModel>()` → its delete/update/create mutations get automatic in-place cache patching from Phase 1; `EcommerceOrder`/`EcommerceOrdersToProducts` `variant="find"` queries are factory list queries (filtered → safe remove/patch by id, create → targeted invalidation). The subject-scoped cart mutations (`api.ecommerceModuleOrderUpdate` etc. in rbac subject SDK) are hand-written `useMutation` files WITHOUT cache patching — they benefit from Phase 5 immediacy (WS invalidation now ~0–200 ms instead of 1000 ms) and are candidates for the documented opportunistic migration (Phase 7 convention), per the plan's "What We're NOT Doing".

### Phase 7: Document Conventions

- [x] Started: 2026-06-10T17:10:00Z
- [x] Completed: 2026-06-10T17:20:00Z
- [x] Automated verification: PASSED (docs only, no build impact)

**Notes**: `libs/shared/frontend/client/api/README.md` — documented cache helpers (modes, safety rules), factory mutation cache contract, hand-written SDK contract with chat as reference. `libs/middlewares/src/lib/revalidation/README.md` — added Two-Tier Freshness Model section (local patches + immediate jittered WS invalidation), metadata-only broadcast rule, bump-before-broadcast ordering guarantee. `CLAUDE.md` — 4 new review checklist items (memoized rows, scoped pending state, useWatch rule, cache-patch contract).

### Phase 9: Topic Rule Precision + Global Invalidation Dedup (live-browser follow-up)

- [x] Started: 2026-06-13T00:30:00Z
- [x] Completed: 2026-06-13T01:10:00Z
- [x] Automated verification: PASSED (rbac 36/146, shared-api 4/28 incl. new global-dedup scenario, middlewares tsc, lint 0 errors)
- [x] Browser verification: PASSED — send message → 0 overview-page renders, 0 chat-shell renders, timeline-section-only reconciliation; thread-messages refetches dropped from ~50 to 1-per-broadcast (see Incident 2)

**Notes**: User reported the page still rerendered on send despite Phase 8. Live instrumentation (console.count at 4 levels + network capture via Chrome) exposed two backend/shared-layer defects invisible to jsdom tests: (1) missing thread-scoped topic rule → generic fallback broadcast broad topics invalidating chat findById (page-level query); (2) per-listener topic-invalidation dedup → one global invalidation scheduled per subscribed route → ~440 requests per send. Fixed in `libs/middlewares/src/lib/revalidation/topic-rules.ts` (new thread-scoped rule, first + stop) and `libs/shared/frontend/client/api/src/lib/factory/index.ts` (`globalTriggeredTopicKeys` module-scope dedup). Note: `bun --watch` does NOT restart on libs changes — `touch apps/api/server.ts` is required to reload middleware changes during dev.

### Phase 8: Timeline Boundary Isolation (review follow-up)

- [x] Started: 2026-06-11T10:00:00Z
- [x] Completed: 2026-06-11T12:00:00Z
- [x] Automated verification: PASSED (36 suites / 146 tests rbac incl. new shell-isolation scenario, shared suite green, lint 0 errors, tsc green)

**Notes**: Review feedback — the message/action data subscription lived too high (`client.tsx`), so cache appends rerendered the entire chat shell. Restructured into three boundaries:

1. **`components/MessageTimelineSection.tsx`** (new, `React.memo`) — owns the messages/actions `useQuery` subscriptions, the merged timeline, `useMessageActions`, `useMessageThreadScroll` + `timelineSignature`, the scroll viewport div, and `MessageEditDialog`. Renders a lightweight pulse placeholder while loading.
2. **`Composer.tsx`** — now owns `useChatComposer` (form + create/AI mutations) and the mention/command handlers. `createMessage.isPending` flips and the create-success cache append are contained inside this boundary.
3. **`ClientComponent.tsx` (shell)** — sidebar/dialog wiring only; receives NO message arrays; communicates via stable callback refs: `markShouldScrollToBottomRef` (composer → timeline scroll) and `registerFocusComposerTextArea` (shell → composer focus), plus the stable `ThreadMessagesCache`.

`client.tsx`/`server.tsx`/`Component.tsx` no longer fetch or pass message props (server prefetch removed — chat is an interactive auth-gated client UI; the data boundary lives in one place). `interface.ts` exports standalone `ISocialModuleMessages(AndActionsQuery)` types; `IComponentPropsExtended` has no message fields. test-utils: SDK find-query mocks added; the legacy `socialModuleMessagesAndActionsQuery` render option is translated into mock query state. Found & fixed during the new shell-isolation spec: `clearSelectedSkills` always passed a fresh `[]` to `setSelectedSkillIds`, scheduling a no-op shell rerender on every send — now bails when already empty.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 2 — Per-listener topic dedup caused a refetch storm (one invalidation per subscribed route)

- **Occurrences**: 1
- **Stage**: Phase 8 follow-up - live browser verification of "send message rerenders the page"
- **Symptom**: One message send produced ~440 API requests, including ~50 identical GETs of the thread-messages query, and the chat page (overview, 1727 lines) rerendered twice ~1–2 s after send.
- **Root Cause**: Two stacked defects. (1) `subscription()` in the factory deduplicated topic invalidations with a PER-LISTENER `triggeredTopicKeys`, but every subscribed route owns its own store listener and `invalidateByTopics` is a global predicate operation — one broadcast scheduled one global invalidation per subscribed route (dozens on the chat page), spread across the 0–200 ms jitter window. (2) The thread-scoped message create path (`…/threads/{tid}/messages`) had NO explicit topic rule (`topic-rules.ts` covered only the chat-scoped path; `path-to-regexp` with `end:false` does not match through the extra `/threads/{tid}` segment), so the generic fallback broadcast broad topics (`social.chats.{cid}`, `social.profiles.{pid}`) that match the chat findById query's `meta.topics` — invalidating page-level data on every send.
- **Fix**: (1) Moved the topic dedup registry to module scope (`globalTriggeredTopicKeys`) — first listener wins, one broadcast → one invalidation; BDD scenario "deduplicates one broadcast across many route subscriptions" added. (2) Added an explicit thread-scoped topic rule emitting exactly the timeline query topics (`social.chats.[cid].threads.[tid].messages`, `social.threads.[tid].messages`, `social.messages`).
- **Reusable Pattern**: Any GLOBAL invalidation mechanism must deduplicate GLOBALLY, not per subscriber. When adding a new nested mutation route, always add an explicit topic rule — the generic topic fallback emits parent-entity topics that cascade invalidation far beyond the mutated collection. Verified live: after both fixes a send renders 0 overview/shell rerenders, timeline-only reconciliation, and per-broadcast (not per-route) refetches.

### Incident 1 — form.watch rerenders the useForm host, not the caller

- **Occurrences**: 1
- **Stage**: Phase 2 - Isolate Chat Composer Rerenders
- **Symptom**: After moving `form.watch("description")` from the hook into `<Composer>`, the new rerender-isolation spec still failed — `MessageTimeline` re-invoked on every keystroke. Bisection (disabling the sync setter, then the whole watch-callback effect) showed neither was the cause.
- **Root Cause**: react-hook-form's `form.watch(name)` registers its render subscription on the component that called `useForm` (the form host = chat `ClientComponent` via `useChatComposer`), NOT on the component that calls `.watch()`. Documented RHF behavior: "watch will trigger re-render at the root of your app or form".
- **Fix**: Use `useWatch({ control: form.control, name })` inside `Composer` — `useWatch` subscribes the calling component only. The non-rendering `form.watch(callback)` subscription form remains safe for side-effect-only consumers.
- **Reusable Pattern**: When isolating form-driven rerenders to a child component, always use `useWatch` with `control` in the child; `form.watch(name)` anywhere in the tree rerenders the form host. A render-count spec with a mocked sibling is the reliable way to verify isolation.

## Notes

- GitHub comment (2026-06-10T13:10:34Z) confirms plan corrections (middleware ordering, append safety broadened, http-cache exclusion reframed as defense-in-depth). All incorporated in the plan already. No scope changes.
- Review smoke (2026-06-10): `http://localhost:3000/en/admin/social/chat` renders the factory-backed Social Chat admin table; search and opening the create dialog work without console errors. No create/delete mutation was submitted during this smoke check.
- Review smoke (2026-06-10): `http://localhost:3000/en/social/chats/bdbd3330-fc88-4614-9734-f367e519b15b/threads/42e59fdf-7b99-4154-971b-dc8a8754b438` renders the chat thread after scrolling to the composer; typing enables send, `/` shows `Learn`, and `@kn` shows `@knowledge`. No message was submitted.

## Summary

### Changes Made

- (populated during implementation)

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-06-10T15:33:45Z

### Phase 10–14: Framework-Grade Realtime (canonical topic algebra)

- [x] Started: 2026-06-13T01:30:00Z
- [x] Completed: 2026-06-13T02:45:00Z
- [x] Automated verification: PASSED — shared-utils 30 (12 new topic specs), middlewares 9 (new jest target), shared-api 32 (4 new factory-meta specs), rbac 146, ecommerce 22, shared suite green, api suite baseline-equal (issue-152 cache scenario UPDATED to the topic-versioned key contract and passing 4/4)
- [x] Browser verification (two tabs, fresh thread): PASSED — sender tab: 0 overview/0 shell renders on send, timeline-section only; listener tab: message arrived sub-second, 0 overview renders; cache reliability proven live: chat-scoped messages GET cached → thread-scoped create (path-bump CANNOT cover the read path) → next GET returned fresh data with the new message (topic-version bump rotated the key)

**Notes**:

- Phase 10: `deriveTopicsFromPath` in `@sps/shared-utils` (`lib/topics`) — canonical topic space (collection / entity / single-ancestor scoped chains, NO bare ancestor entity topics), both URL shapes (flat + `-module`) reduce to the same space; count/bulk stripped; symmetry + chat-equivalence BDD specs.
- Phase 11: revalidation middleware delegates generic derivation to the shared util; constructor extension API (`topicRules` prepended, `notRevalidatingRoutes` appended) — projects extend from `apps/api/app.ts` without forking; new `@sps/middlewares` jest target; `resolveBroadcastTopics` public for tests.
- Phase 12: topic-versioned http-cache — GET keys embed a per-topic version vector (`buildVersionedDataPrefix`, exported), mutations bump derived topic versions AWAITED inside the bump-before-broadcast contract; constructor `excludedPathPatterns`; existing exclusions retained as defense-in-depth. **Bug caught during integration**: the middleware's `path` is the FULL URL — topics must derive from `pathname` (initially derived [] silently). The issue-152 backend scenario was updated to the new key contract (local helper copies; importing `@sps/middlewares` into jest drags ESM-only deps).
- Phase 13: factory `find`/`findById`/`count` auto-derive `meta.topics` (user `reactQueryOptions.meta` overrides) — all 156 factory clients in every project are topic listeners with zero per-model code; this also fixed server-side flat action creates reaching chat actions subscriptions (previously route-fallback never matched).
- Phase 14 minor finding: on the AI chat, the LISTENER tab's message-list shell rendered 2 pairs during the AI pipeline (sender tab: 0). Suspected shell-level factory query (profiles-to-skills/skills) now topic-subscribed and its data changing during the pipeline; visually negligible (shell holds no message arrays), recorded as polish follow-up.
- Dev note repeated: `bun --watch` does not reload `libs/` changes — `touch apps/api/server.ts` required; scenario suites (issue-154) DELETE chats/threads from the dev DB — the RAG chat used in earlier phases was removed by them, a fresh thread was created for verification.

### Phase 15: Cart Badge Regression Fix + Layered Exclusion Config (user-reported)

- [x] Completed: 2026-06-13T03:05:00Z
- [x] Automated verification: PASSED (middlewares 9, rbac 146, ecommerce 22, lint clean)
- [x] Browser verification: PASSED — cart badge updated LIVE 2→3 on order create and 3→1 on order deletes, no page reload

**Notes**:

- **Regression root cause**: the cart badge reads the hand-written `orders/quantity` SDK query which had NO `meta.topics` and relied on the legacy route fallback. The topic branch in `subscription()` skips the route fallback whenever ANY topic subscriber matches — after Phase 13 gave every factory query auto-topics, that is effectively always, so topic-less hand-written queries were never invalidated again. Fixed by declaring `meta: { topics: ["ecommerce.orders"] }` in `quantity.ts`, `total.ts`, and `list.ts` (subject SDK, ecommerce-module/order). Framework rule reinforced: hand-written SDK queries MUST declare meta.topics.
- **Layered exclusion config** (user request, mirroring `is-authorized` route lists): http-cache hardcoded chat/cart regexes moved to `libs/middlewares/src/lib/http-cache/routes/singlepage.ts` (framework defaults) + `routes/startup.ts` (per-project seam, empty); revalidation got `revalidation/startup.ts` (topicRules + notRevalidatingRoutes project seam). Merge precedence: constructor options → startup → singlepage defaults. The `singlepage`/`startup` split mirrors how `libs/modules/startup` extends controllers.

### Phase 16: Middleware Route Architecture (shared RouteMatcher + routes/ per middleware)

- [x] Completed: 2026-06-13
- [x] Automated verification: PASSED — @sps/middlewares 9 suites / 35 tests (new pure route specs), tsc green, lint clean; api suite: cache scenario + middleware-order contract 6/6, 2 pre-existing baseline failures unchanged (issue-158 OpenRouter billing, issue-152 frontend-cart server-only jest env)
- [x] Runtime smoke: API rebooted; auth-free probe (`/authentication/me`), cache-clear, and ordinary reads all 200

**Notes (user-requested DX/clean-architecture pass):**

- New shared primitive `libs/shared/utils/src/lib/routes/` (exported from `@sps/shared-utils`) — `IRouteRule { regexPath, methods? }`, `RouteMatcher`, `composeRouteRules`; pure + dependency-free, one tested matcher reused by every middleware. Lives in `@sps/shared-utils` (not the middlewares lib) so any framework layer can match a path without importing middleware code. README documents the convention.
- **http-cache**: the 5 inline substring bypasses (`revalidation`, `http-cache`, `broadcast`, `favicon.ico`, auth probes) moved into `routes/singlepage.ts` as regex rules alongside the issue-152/195 exclusions; single `excludedRoutesMatcher.matches(pathname)` gate replaces the if-ladder. Legacy `excludedPathPatterns` option still accepted (normalized to rules); new `excludedRoutes` option added.
- **is-authorized / actions-logger / bill-route / observer**: each got `routes/singlepage.ts` + `routes/startup.ts` + `routes/index.ts` + `routes/index.spec.ts`; hardcoded `allowedRoutes`/`loggingRoutes`/`billingRoutes`/broadcast-skip moved there; each gained an optional `IMiddlewareOptions` extension seam.
- **revalidation**: inline `notRevalidatingRoutes` moved to `routes/singlepage.ts` + `routes/startup.ts` (topic RULES stay in `topic-rules.ts`/`startup.ts` — distinct data shape). `INotRevalidatingRoute` kept as deprecated alias of `IRouteRule`.
- Barrel `libs/middlewares/src/lib/index.ts` now exports `IRouteRule`/`RouteMatcher`/`composeRouteRules` + every middleware's `IMiddlewareOptions`.
- 3-layer precedence everywhere: constructor options → project `startup.ts` → framework `singlepage.ts`. Mirrors `libs/modules/startup` controller-extension model.

### Phase 17: Chat-list realtime regression (user-reported: new chat missing until reload)

- [x] Completed: 2026-06-13
- [x] Automated verification: PASSED — shared-utils 33 (3 new regression scenarios), rbac 146, middlewares 35; lint + rbac tsc clean
- [x] Browser verification: PASSED — chat list updated 6→7 on create and 7→6 on delete, LIVE, no reload

**Root cause (same class as the Phase 15 cart badge):** the chat-list query
`socialModuleProfileFindByIdChatFind` (hand-written SDK) had NO `meta.topics`.
After Phase 13 gave factory queries auto-topics, the topic branch in
`subscription()` almost always finds a topic match and skips the route
fallback — so a topic-less hand-written query is never invalidated. Compounded
here because the read route (`/social-module/profiles/{pid}/chats`) and the
create route (`/social-module/chats`) are differently scoped, so the route
fallback could not bridge them even when reached.

**Fix:** declare `meta: { topics: deriveTopicsFromPath(queryKey) }` on the
hand-written chat-list query (derives `social.chats` + `social.profiles.{pid}.chats`)
and on the knowledge-document list query (`social.documents`) — same class.
Chat create/update/delete all broadcast `social.chats`, so the list now
invalidates; message sends derive message topics (no bare `social.chats`), so
they do NOT over-invalidate the list (asserted by a new negative scenario).

**Framework lesson reinforced:** every hand-written SDK read query MUST declare
`meta.topics` (factory queries get them automatically). Candidates still
topic-less but intentionally skipped: `chat/find-by-id/profile/search` (search,
not a list), `openrouter/models` (static catalog), `authentication/{init,me,is-authorized}`
(auth probes) — none need realtime.
