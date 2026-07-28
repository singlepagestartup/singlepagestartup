---
date: 2026-06-10T14:54:50+03:00
researcher: flakecode
git_commit: ad291d4e75c0491471d68fad8a64458a5db19bd2
branch: issue-195
repository: singlepagestartup
topic: "Smooth realtime data updates without full component rerenders"
tags: [research, codebase, revalidation, react-query, factory, social-chat, ecommerce-cart, websocket]
status: complete
last_updated: 2026-06-10
last_updated_by: flakecode
---

# Research: Smooth realtime data updates without full component rerenders

**Date**: 2026-06-10T14:54:50+03:00
**Researcher**: flakecode
**Git Commit**: ad291d4e75c0491471d68fad8a64458a5db19bd2
**Branch**: issue-195
**Repository**: singlepagestartup

## Research Question

Document how the SPS frontend keeps realtime data fresh today and where full-list refetches / broad rerenders originate, so a future plan can introduce a reusable, visually-local update mechanism. Specifically map: (1) the WebSocket → React Query revalidation pipeline, (2) the generic `factory()` query/mutation layer, (3) the social chat message list (Layers 1–3 in the ticket), and (4) the ecommerce cart/order flow used as a universality check. Per the research contract this document describes only the **current** state — no recommendations.

## Summary

- The realtime flow is **WebSocket-broadcast → Zustand event bus → React Query `invalidateQueries`**. A backend mutation that returns 2xx triggers the revalidation middleware (`libs/middlewares/src/lib/revalidation/index.ts`), which broadcasts `{ slug, payload, topics, createdAt, expiresAt }` over WS. The host's `revalidation/ClientComponent.tsx` writes that message into `globalActionsStore`. The generic factory's `subscription()` listener reacts by calling `queryClient.invalidateQueries(...)` after a hardcoded **1000 ms `setTimeout`**. There is **no cache patching anywhere** — `setQueryData`/`setQueriesData` appear **0 times** in the whole `libs`/`apps` tree. Freshness is always achieved by full refetch.
- Invalidation is **topic-first, route-fallback**. If any cached query carries matching `meta.topics`, the listener invalidates by topic predicate and skips route matching; otherwise it falls back to prefix-matching the broadcast `payload` path against the subscribed `route` (`libs/shared/frontend/client/api/src/lib/factory/index.ts:141-204`).
- The **social chat queries bypass the generic `factory()` entirely**. They are hand-written SDK files that call `useQuery`/`useMutation` directly, use **one-element URL `queryKey`s** (e.g. `[".../threads/<threadId>/messages"]`), and attach `meta.topics` manually. This is why the ticket states "generic factory automation is not enough" for chat — the chat find query key and the message update/delete mutation keys have different prefixes.
- **Layer 1 (composer rerenders)**: `use-chat-composer.ts` calls `form.watch("description")` and `form.watch("files")` and returns `description`/`selectedFileNames` as top-level reactive values; the top-level `ClientComponent.tsx` consumes `composer.description` in a `useEffect` and several `useMemo`s and renders `<MessageTimeline>` in the same component, so every keystroke rerenders the timeline.
- **Layer 2 (timeline rows)**: `MessageTimeline.tsx` has **0** `React.memo` rows and propagates a single `isDeleting` boolean (`deleteMessage.isPending`) to every message row; action rows fall back to array index keys.
- **Layer 3 (chat cache patches)**: `use-thread-messages-refetch.ts` returns a single `invalidateQueries` callback. On message create/update/delete success the chat hooks call `refetchThreadMessages()` (full invalidate). The create-success path runs through a `useEffect` on `createMessage.isSuccess`. `getTimelineSignature` (`utils.ts:69-83`) includes `lastItem.data.updatedAt`, which feeds the scroll-to-bottom effect.
- **Ecommerce cart** = the `order` model (`type: "cart"`, `status: "new"`) plus the `orders-to-products` relation (holds `quantity`). Its list queries use the generic factory two-element `[route, serializedParams]` keys with filters serialized into slot 2; it has **no `meta.topics`** (route-fallback only, per `revalidation/README.md`). Add-to-cart currently calls the **server SDK directly + `router.refresh()`**; remove-from-cart uses the factory delete mutation; quantity update has no end-user client component (only admin forms).

## Detailed Findings

### Area 1 — The realtime revalidation pipeline (backend → WS → store → invalidate)

**Step 1: Backend broadcast.** The revalidation middleware runs `await next()` and, for successful (`200–299`) `POST/PUT/PATCH/DELETE` responses, computes topics + normalized paths and broadcasts one WS message per path:

- `libs/middlewares/src/lib/revalidation/index.ts:207-231` — the success branch; broadcasts `{ slug: "revalidation", payload, topics, createdAt, expiresAt }` via `websocketManager.broadcastMessage(...)` and also calls `this.revalidateTag(payload)` (Next.js tag revalidation at `:236-242`).
- `expiresAt = now + STALE_TIME * 5` (`:218`). `STALE_TIME` defaults to `60 * 1000` ms (`libs/shared/utils/src/lib/envs/host.ts:17-18`), so the broadcast TTL is ~5 min and query `staleTime` defaults to 60 s.
- `getTopics()` (`:171-179`) is **rule-first, generic-fallback**: it tries `resolveTopicsFromRules()` (compiled `path-to-regexp` matchers from `topic-rules.ts`) and only falls back to `getGenericTopics()` (`:124-169`, derives `<module>...` dotted topics from the URL) when no rule matches.
- `getNormalizedPaths()` (`:181-191`) emits both the full path and the path with the trailing UUID stripped (`UUID_PATH_SUFFIX_REGEX`).
- `notRevalidatingRoutes` (`:24-41`) excludes auth/broadcast/actions endpoints.

**Step 2: Topic rules.** `libs/middlewares/src/lib/revalidation/topic-rules.ts:7-28` defines exactly two rules today, both for chat, both `stop: true`:

- chat **messages** → topics `["social", "social.chats.[social.chats.id].messages", "social.messages"]`
- chat **actions** → topics `["social", "social.chats.[social.chats.id].actions", "social.actions"]`

**Step 3: WS receipt on the host.** `apps/host/src/components/revalidation/ClientComponent.tsx`:

- Connects to `${NEXT_PUBLIC_API_SERVICE_WS_URL}/ws/revalidation` with auto-reconnect (`:12-19`).
- On each message with `data.slug === "revalidation"`, pushes an action into `globalActionsStore` under store name `"revalidation"`, `type: "query"`, `requestId: data.payload`, `result: data` (`:21-40`).
- A second effect (`:42-77`) subscribes to the store and logs `"WebSocket triggered refetch"` for new `type: "mutation"` actions — this branch only `console.log`s; it performs no invalidation itself.

**Step 4: The event bus.** `libs/shared/frontend/client/store/src/lib/global-actions-store.ts` is a Zustand+immer store:

- `addAction()` appends to a per-name ring buffer capped at `MAX_ACTIONS = 10` (`:51-67`) and persists to `sessionStorage` (`:37-43`).
- Stores are keyed by `action.name` (`:48-49`); revalidation messages live under name `"revalidation"`.

**Step 5: Invalidation.** The generic factory `subscription()` is the consumer that actually invalidates — see Area 2.

### Area 2 — The generic `factory()` query/mutation/subscription layer

File: `libs/shared/frontend/client/api/src/lib/factory/index.ts`. Exported from `@sps/shared-frontend-client-api` via `libs/shared/frontend/client/api/src/lib/index.ts:1-3` → `src/index.ts:1`.

**Query key formats** (relevant to `setQueriesData({ queryKey: [...] }, …)` prefix matching in the ticket's Layer 0 plan):

- `find`: `[ "${route}", serializedParams | undefined ]` where `serializedParams = QueryString.stringify(params, { encodeValuesOnly: true })` (`:293-301`).
- `findById`: `[ "${route}/${id}", serializedParams | undefined ]` (`:247-257`).
- `count`: `[ "${route}/count", serializedParams | undefined ]` (`:333-341`).
- React Query query-key prefix matching is array-element based. Therefore `{ queryKey: [factoryProps.route] }` matches `find` queries whose first key segment is exactly `factoryProps.route`, but it does **not** match `findById` (`"${route}/${id}"`) or `count` (`"${route}/count"`) queries. Existing `subscription(route, queryClient)` remains aligned because each hook passes the same first key segment that its query uses (`route`, `route/id`, or `route/count`). A generic cache helper that is meant to patch more than list queries would need exact first-key targets or a predicate.

**Mutations have no cache handling.** `create`/`update`/`delete` (`:360-465`) build a `useMutation`, run the network mutation, and the only side effect is `addToGlobalStore({ type: "mutation", … })` via the internal `cb` (`:471-492`). User options are spread **last** as `...props?.reactQueryOptions` (`:391`, `:428`, `:463`), so there is currently no internal `onSuccess` to merge with — a caller-provided `reactQueryOptions.onSuccess` is the only `onSuccess`.

**`subscription(route, queryClient)`** (`:129-226`) — ref-counted per route (`activeSubscriptions`, `unsubscribeFunctions` maps). On the first subscriber it subscribes to `globalActionsStore` and, for each revalidation message newer than mount time:

- builds `topicTriggerKey` from `createdAt + sorted topics` (`:125-127`);
- if any cached query has matching `meta.topics` (`hasTopicQueries`, `:108-123`), schedules `invalidateByTopics(topics, queryClient)` in `setTimeout(…, 1000)` and `continue`s (skips route matching) (`:155-179`);
- else, if `message.result.payload` prefix-matches `route` (`isMatchingRoute`, bidirectional segment prefix, `:69-91`), schedules `queryClient.invalidateQueries({ queryKey: [route] })` in `setTimeout(…, 1000)` (`:190-200`).
- `invalidateByTopics` (`:93-106`) invalidates every query whose `meta.topics` intersects the broadcast topics.

**The shared `queryClient` singleton** is created in `libs/shared/frontend/client/api/src/lib/provider/index.tsx:6-13` (`refetchOnWindowFocus: false`, `refetchOnReconnect: false`) and re-exported through the same barrels; `<Provider>` wraps children in `<QueryClientProvider client={queryClient}>`. Chat hooks (`use-thread-messages-refetch.ts:4`, `use-profile-sidebar.ts:12`) and chat SDK queries import this exact instance, so direct `queryClient.invalidateQueries(...)` hits the same cache as the provider tree.

### Area 3 — Social chat message list (the primary case)

Directory: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/`.

**Component composition / data flow:**

- `client.tsx` (default export) fetches messages + actions via two SDK queries and derives the combined timeline with `createSocialModuleMessagesAndActionsQuery` (`client.tsx:15-64`), then renders `<Component>`.
- `Component.tsx` is a thin pass-through to `ClientComponent` (`Component.tsx:1-25`).
- `ClientComponent.tsx` (the "top-level chat ClientComponent" in the ticket) is the orchestrator that wires all hooks and renders `<MessageTimeline>` + `<Composer>` + dialogs/sidebar.
- `interface.ts:23-36` types the combined timeline as `({type:"message",data} | {type:"action",data})[]`; messages/actions come from `IResult[...MessageFindResult]` / `[...ActionFindResult]`.

**Chat SDK queries bypass `factory()` (hand-written, one-element keys, manual `meta.topics`):**

- Message find: `.../sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/message/find.ts`
  - `queryKey: ["${route}/${id}/social-module/profiles/${profileId}/chats/${chatId}/threads/${threadId}/messages"]` (`:27,:40`) — **single element**.
  - `meta.topics = ["social.chats.${chatId}.threads.${threadId}.messages", "social.threads.${threadId}.messages", "social.messages"]` (`:28-32`).
  - Calls `subscription(queryKey, queryClient)` (`:34-37`); pushes a `"query"` action via `select()` (`:59-70`); `...props.reactQueryOptions` spread last (`:72`).
- Action find: `.../chat/find-by-id/action/find.ts`
  - `queryKey: ["${route}/${id}/.../chats/${chatId}/actions?${JSON.stringify(params)}"]` (`:27-28,:40`) — **single element with params embedded in the URL string** (not a serialized 2nd slot).
  - `meta.topics = ["social.chats.${chatId}.actions", "social.actions"]` (`:29-32`).
- **Topic bridge note (descriptive):** backend message rule emits `social.chats.<id>.messages` / `social.messages` / `social`; the client message query registers `social.chats.<id>.threads.<threadId>.messages` / `social.threads.<threadId>.messages` / `social.messages`. The overlapping topic that actually drives chat-message topic invalidation is **`social.messages`**. For actions both sides share `social.chats.<id>.actions` and `social.actions`.

**Chat mutations (hand-written, with an internal `onSuccess`):**

- Create: `.../thread/find-by-id/message/create.ts` — `mutationKey: [".../threads/${threadId}/messages"]` (`:36-38`); internal `onSuccess(data)` pushes a `"mutation"` action then `...reactQueryOptions` last (`:64-77`); returns a **single** message.
- Update: `.../chat/find-by-id/message/update.ts` — `mutationKey: [".../messages/${messageId}"]` (`:36-38`); `IResult = ISocialModuleProfileFindByIdChatFindByIdMessageUpdateResult` which is an **array** `ISocialModuleMessage[]`; internal `onSuccess` + `...reactQueryOptions` last (`:60-72`).
- Delete: `.../chat/find-by-id/message/delete.ts` — `mutationKey: [".../messages/${messageId}"]` (`:36-38`); returns a **single** message; same internal-`onSuccess` pattern (`:60-72`).
- React-by-openrouter: `.../chat/find-by-id/message/react-by-openrouter.ts` — used for AI replies; returns a single message.
- **Key-prefix mismatch (descriptive):** find query key is thread-scoped (`.../threads/<threadId>/messages`); update/delete mutation keys are chat-scoped (`.../messages/<messageId>`). The thread/messages prefix does **not** contain the `/messages/<id>` mutation key, matching the ticket's statement that route prefixes do not align.

**Layer 1 — composer rerenders.** `hooks/use-chat-composer.ts`:

- `form.watch("files")` → `selectedFiles` and `form.watch("description")` → `description` (`:73-74`) are reactive subscriptions; `selectedFileNames` and `canSubmit` are derived from them (`:75-80`).
- The hook returns `description` and `selectedFileNames` as top-level values (`:223-235`).
- In `ClientComponent.tsx`, `composer.description` drives a `useEffect` (`:111-113`, `syncSelectedSkillsToDescription`) and several derived `useMemo`s / booleans: `knowledgeCommandMatch` (`:122`), `visibleKnowledgeChatCommands` (`:124-138`), `visibleSkillMentionOptions` (`:141-146`), `visibleKnowledgeMentionOption` (`:147-151`), `isKnowledgeSearchSelected` (`:152`), `isSkillMentionPickerOpen` (`:153-155`). Because `<MessageTimeline>` is rendered by this same component (`:312-320`), each keystroke re-runs the component body and re-renders the timeline subtree.
- Create success path: a `useEffect` on `createMessage.isSuccess` calls `toast.success`, `props.refetchThreadMessages()` (full invalidate) and `resetComposer()` (`:213-221`). The `onSubmit` `mutate(..., { onSuccess, onError })` also wires the AI reaction follow-up (`:128-198`).

**Layer 2 — timeline rows.** `components/MessageTimeline.tsx`:

- Maps `props.items` directly; message rows = `<MessageProfileLoader key={message.id}>` → `<SocialModuleProfile variant="chat-message-row" isDeleting={props.isDeleting} …/>` (`:39-62`); action rows = `<ActionProfileLoader key={action.id || index}>` → `<SocialModuleActionChatActionRow variant="chat-action-row" …/>` (`:64-84`).
- **No `React.memo`** (0 occurrences in the dir). `isDeleting` is a single boolean = `messageActions.deleteMessage.isPending` passed to **every** message row (`ClientComponent.tsx:313`); action keys fall back to array `index`.

**Layer 3 — chat cache patches + scroll.**

- `hooks/use-thread-messages-refetch.ts` returns a single `useCallback` that calls `queryClient.invalidateQueries({ queryKey: threadMessagesQueryKey })`; `threadMessagesQueryKey` is the **same one-element URL key** as the message-find query (`:15-30`).
- `hooks/use-message-actions.ts`: update success → `refetchThreadMessages()` + close dialog (`:75-84`); delete success → `refetchThreadMessages()` (`:86-92`). `deleteMessage` is created once with `socialModuleMessageId: "unknown"` and the real id is passed at `.mutate(...)` (`:34-40,:66-73`). There is already an `editingMessageId` state but no `deletingMessageId` (`:20`).
- `utils.ts:getTimelineSignature` (`:69-83`) joins `[threadId, items.length, lastItem.type, lastItem.data.id, lastItem.data.updatedAt, lastItem.data.createdAt]`. `ClientComponent.tsx:51-63` feeds this signature into `useMessageThreadScroll`.
- `hooks/use-message-thread-scroll.ts` runs a `useLayoutEffect` keyed on `[threadId, timelineItemCount, timelineSignature, scrollMessagesToBottom]` (`:89-129`) that scrolls to bottom when the signature changes — so a change in `lastItem.updatedAt` (e.g. editing the last message) currently re-triggers scroll.
- `hooks/use-profile-sidebar.ts:openProfile` (`:250-266`) is a plain (non-memoized) function passed to `MessageTimeline` as `onProfileOpen`.

**Composer internals.** `components/Composer.tsx` already holds its own local UI state (`activeKnowledgeCommandIndex`, `activeSkillMentionOptionIndex`, `:57-60`) and receives `canSubmit`, `selectedFileNames`, `visibleSkillMentionOptions`, etc. as props. The textarea is a RHF `Controller` (`:251-281`), so the textarea itself re-renders on input regardless; the timeline rerender comes from the parent consuming `composer.description`.

### Area 4 — Ecommerce cart/order (universality check)

There is no `cart` model; the cart is an `order` (`type: "cart"`, `status: "new"`) plus `orders-to-products` line items.

- Order route `"/api/ecommerce/orders"`, relation route `"/api/ecommerce/orders-to-products"` (`quantity` integer column, `.../backend/repository/database/src/lib/schema.ts`).
- **List queries use the generic factory** → two-element `[route, serializedParams]` keys with filters in slot 2 (e.g. `cart-default/Component.tsx` passes `apiProps.params.filters.and = [{column:"orderId",method:"eq",value}]`). Subscriptions register on the **base** route, so a base-route invalidation refetches every filtered variant.
- **Add to cart** (`order/.../singlepage/create/ClientAction.tsx`): calls `@sps/ecommerce/models/order/sdk/server` `api.create(...)` **directly** then `router.refresh()`; the `useMutation` path is commented out — it does not use the factory create mutation or the WS path.
- **Remove from cart** (`order/.../singlepage/delete/ClientAction.tsx`): `api.delete()` factory mutation; UI updates via the WS → 1000 ms-deferred `invalidateQueries` path.
- **Quantity update**: no end-user client component; only admin forms call `api.update()`. A server helper `ordersToProductsUpdate` (PATCH) exists but is unwired.
- **Counters**: `order.total`/`order.quantity` SDK queries use single-string keys and do **not** register a `subscription` (no auto-invalidate); `orders-to-products.total` does call `subscription(...)`. No ecommerce query sets `meta.topics` (route-fallback only), confirmed by `libs/middlewares/src/lib/revalidation/README.md` ("Cart queries currently rely on route fallback (no dedicated `meta.topics` yet)").

### Area 5 — Existing patterns relevant to the planned layers

- **Cache patching precedent:** none. `setQueriesData`/`setQueryData` = **0 matches** across `libs`+`apps`. Every realtime update path uses `invalidateQueries` (full refetch). Layer 0 would introduce a new pattern under `libs/shared/frontend/client/api/src/lib/cache/` (the `cache/` dir does not exist yet).
- **Memoization precedent in chat:** none (`React.memo`/`memo(` = 0 in the chat default dir).
- **BDD test convention** (CLAUDE.md "Test format (BDD)"):
  - Canonical full example: `…/chat/message/list/default/ClientComponent.spec.tsx` — `@jest-environment jsdom`, top-level `BDD Suite` JSDoc with `Given/When/Then`, `describe("Given: …")`, per-test `BDD Scenario` JSDoc, `it("When: … Then: …")` names.
  - Test harness: `…/default/test-utils.tsx` mocks `@sps/rbac/models/subject/sdk/client` (each method returns `{ mutate, isPending, isSuccess }`), mocks `@sps/shared-frontend-client-api` with `queryClient: { invalidateQueries: jest.fn() }` (via `jest.requireActual` spread, `:391-400`), mocks `sonner`, stubs `requestAnimationFrame`/`ResizeObserver`/`scrollTo`, and exposes `renderComponent("default"|"knowledge", options)` + `resetChatComponentMocks()`.
  - Shared-api package test example (where Layer 0 helper specs would live): `libs/shared/frontend/client/api/src/lib/request-limmiter/index.spec.ts` — simpler form (top-level `BDD Suite` JSDoc, plain `describe`/`it`).

### Browser Verification (2026-06-10)

The in-app browser was open at `http://localhost:3000/en`. The host app responded and rendered the public homepage, ecommerce product blocks, nav links, and the hidden revalidation component.

Observed runtime facts:

- `http://localhost:3000/en` rendered nav links including `Ecommerce`, `Chats`, and `Subjects`, plus visible `Add to cart` controls.
- The DOM contained one `data-variant="revalidation"` node and one `data-variant="authentication-init-default"` node on checked pages, confirming the host-level revalidation and auth-init components are mounted in the browser.
- Browser console logs contained `WebSocket triggered refetch` from `apps_host_src_components_revalidation_...js`. In source, this log is emitted by the second effect in `apps/host/src/components/revalidation/ClientComponent.tsx:42-77` when it sees new `type: "mutation"` actions in `globalActionsStore`; that effect only logs and does not perform invalidation.
- `http://localhost:3000/en/social/chats` rendered the layout/nav/footer but no visible chat list or composer in this browser session.
- A seeded chat data file exists at `libs/modules/social/models/chat/backend/repository/database/src/lib/data/7f4540f7-eec6-42ac-be2d-836e5b1b0407.json`, but opening `http://localhost:3000/en/social/chats/7f4540f7-eec6-42ac-be2d-836e5b1b0407` rendered `Page not found`.
- `curl http://localhost:4000/api/social/chats` failed with `Failed to connect to localhost port 4000`, so the API/WS server was not available for an end-to-end Browser check of mutations, WebSocket broadcasts, or React Query invalidation/refetch behavior.

Browser verification therefore confirms the host shell and revalidation component mounting, but it does **not** confirm chat composer/timeline rerender behavior or ecommerce mutation/refetch behavior end-to-end in the current runtime.

## Code References

- `libs/middlewares/src/lib/revalidation/index.ts:207-231` — success branch broadcasting `{slug,payload,topics,createdAt,expiresAt}`
- `libs/middlewares/src/lib/revalidation/index.ts:171-191` — `getTopics` (rule-first) and `getNormalizedPaths`
- `libs/middlewares/src/lib/revalidation/topic-rules.ts:7-28` — the two chat topic rules
- `apps/host/src/components/revalidation/ClientComponent.tsx:21-77` — WS receipt → `globalActionsStore`
- `libs/shared/frontend/client/store/src/lib/global-actions-store.ts:45-73` — Zustand event-bus store (`MAX_ACTIONS=10`)
- `libs/shared/frontend/client/api/src/lib/factory/index.ts:129-226` — `subscription()` topic-first / route-fallback, 1000 ms `setTimeout`
- `libs/shared/frontend/client/api/src/lib/factory/index.ts:228-492` — `factory()` query keys, mutations (no cache patching), `addToGlobalStore`; `find`, `findById`, and `count` use different first query-key strings
- `libs/shared/frontend/client/api/src/lib/provider/index.tsx:6-22` — `queryClient` singleton + `<QueryClientProvider>`
- `libs/shared/utils/src/lib/envs/host.ts:17-18` — `STALE_TIME = 60_000`
- `…/chat/.../message/list/default/client.tsx:15-64` — messages+actions fetch and combined timeline
- `…/default/ClientComponent.tsx:91-155` — composer wiring + `composer.description`-driven memos
- `…/default/ClientComponent.tsx:312-320` — `<MessageTimeline … isDeleting={deleteMessage.isPending}>`
- `…/default/hooks/use-chat-composer.ts:73-80,213-235` — `form.watch` reactive values, create-success effect
- `…/default/hooks/use-message-actions.ts:75-92` — update/delete success → `refetchThreadMessages()`
- `…/default/hooks/use-thread-messages-refetch.ts:14-31` — single invalidate callback, one-element key
- `…/default/components/MessageTimeline.tsx:39-84` — non-memoized rows, `isDeleting` to all rows
- `…/default/utils.ts:69-83` — `getTimelineSignature` (includes `lastItem.updatedAt`)
- `…/default/hooks/use-profile-sidebar.ts:250-266` — non-memoized `openProfile`
- `…/sdk/client/.../thread/find-by-id/message/find.ts:27-72` — chat message find query (one-element key + `meta.topics`)
- `…/sdk/client/.../chat/find-by-id/action/find.ts:27-71` — chat action find query
- `…/sdk/client/.../message/{create,update,delete}.ts` — chat mutations (internal `onSuccess`, update returns array)
- `libs/modules/ecommerce/models/order/frontend/component/src/lib/singlepage/{create,delete,cart-default}/…` — cart flows
- `libs/middlewares/src/lib/revalidation/README.md` — documents chat topic vs cart route-fallback status

## Architecture Documentation

- **Single direction of truth = React Query cache.** No second server-data store in Zustand; `globalActionsStore` is only an action/event log (ring-buffered, sessionStorage-persisted). The ticket's "avoid a second source of truth" constraint matches the current design.
- **Two invalidation tiers.** Tier 1 = `meta.topics` predicate invalidation (used by chat). Tier 2 = base-`route` prefix invalidation (used by everything else, including cart). Both are gated behind a 1000 ms `setTimeout` and only fire if a matching cached query exists.
- **React Query key matching.** Prefix matching is based on query-key array elements, not slash-delimited string prefixes inside a key element. A key filter `[route]` matches `[route, serializedParams]`, but not `[route/id, serializedParams]` or `[route/count, serializedParams]`.
- **Hand-written SDK vs generic factory.** Base CRUD on a model goes through `factory()` (two-element keys, route subscription). Nested/custom endpoints (chat messages/actions, order total/quantity) are hand-written SDK actions with their own `queryKey`/`mutationKey` and optional `meta.topics`/`subscription`. Mutation files follow a uniform shape: `useMutation` + internal `onSuccess` pushing a `globalActionsStore` `"mutation"` action + `...reactQueryOptions` spread last.
- **Mutation callback semantics.** Hook-level `reactQueryOptions.onSuccess` (spread last) would override an internal `onSuccess`; per-call `mutate(vars, { onSuccess })` runs in addition to the hook's `onSuccess` (React Query semantics). The chat composer uses the per-call form; the edit/delete flows use a `useEffect` on `isSuccess` instead of callbacks.

## Historical Context (from thoughts/)

- `thoughts/shared/tickets/singlepagestartup/ISSUE-195.md` — the source ticket with the proposed Layer 0–3 design (cache helpers, composer isolation, row memoization, chat targeted patches, cart universality check).
- `thoughts/shared/processes/singlepagestartup/ISSUE-195.md` — process log; before this research, phase was `create`, downstream `not_started`; records a sandboxed GitHub-network retry incident and the learning "treat React Query cache patching as the first candidate before adding a second server-data store."
- No `research`/`plan`/`handoff` artifacts existed for #195 before this document.
- Related prior work (same chat/social + revalidation surface): `ISSUE-164` (port draft chat UI — research/plan/handoff, 2026-04-25), `ISSUE-192` (profile-scoped Knowledge RAG in social chats — research/plan/handoff, 2026-05-25), `ISSUE-169` (RBAC subject check / ecommerce order proceed flow, 2026-05-03).

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-164.md` — chat timeline / composer / subject SDK methods.
- `thoughts/shared/research/singlepagestartup/ISSUE-192.md` — social chat variants, RBAC subject routes, message creation/attachments, topic invalidation.
- `thoughts/shared/research/singlepagestartup/ISSUE-169.md` — ecommerce order proceed flow / query builder.

## Open Questions

- **Chat update return shape:** the message **update** SDK returns `ISocialModuleMessage[]` (array) while create/delete return a single message — a Layer 3 "patch by returned id" would need to handle the array return. (Documented here; resolution belongs to planning.)
- **Counters without subscriptions:** `order.total` / `order.quantity` SDK queries register no `subscription`, so they do not auto-invalidate on the WS path today; how their UI currently stays fresh (e.g. `router.refresh()` after add-to-cart, or remounting) is only partially traced.
- **`select()`-pushed query actions:** chat find queries push `"query"` actions into `globalActionsStore` on every fetch via `select()`; their downstream effect (beyond the host component's `console.log`) was not fully traced and may be inert.
- **Live Browser limitation:** the current in-app browser session could not exercise chat timeline rerenders or WebSocket-backed mutation updates because `/social/chats` did not expose the chat UI and `localhost:4000` was not accepting API requests.
