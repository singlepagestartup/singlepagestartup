# Smooth Realtime Data Updates Without Full Component Rerenders — Implementation Plan

## Overview

Introduce a React Query cache-patching layer that makes create/update/delete render as local, visually-stable UI updates across the whole codebase (all factory-backed models/relations in all 16 modules plus hand-written SDKs like chat), and upgrade the WebSocket invalidation pipeline from a 1000 ms-deferred background fallback into an immediate cross-client reconciliation path — when another user changes data, subscribed clients must see the update right away.

## Current State Analysis

- Realtime flow today: backend mutation → revalidation middleware broadcast (`libs/middlewares/src/lib/revalidation/index.ts:207-231`) → WS → `globalActionsStore` (`apps/host/src/components/revalidation/ClientComponent.tsx:21-77`) → factory `subscription()` → `queryClient.invalidateQueries` after a 1000 ms `setTimeout` (`libs/shared/frontend/client/api/src/lib/factory/index.ts:129-226`). Freshness is always a full refetch; `setQueryData`/`setQueriesData` appear 0 times in `libs`/`apps`.
- All 168 model/relation SDK clients across all 16 modules spread `factory<IModel>()` (e.g. `libs/modules/ecommerce/models/order/sdk/client/src/lib/singlepage/index.ts`), so the generic factory is the single integration point that covers every standard CRUD flow.
- Factory mutations (`factory/index.ts:360-465`) have no cache handling and spread `...props?.reactQueryOptions` last — there is currently no internal `onSuccess` to merge with.
- Factory query keys: `find` = `[route, serializedParams?]`, `findById` = `["${route}/${id}", serializedParams?]`, `count` = `["${route}/count", serializedParams?]` (`factory/index.ts:247-341`). React Query prefix matching is array-element based: a `[route]` filter matches `find` lists but NOT `findById`/`count` keys.
- The social chat bypasses the factory: ~41 hand-written SDK files use `useQuery`/`useMutation` directly with one-element URL query keys and manual `meta.topics`. The chat find query key is thread-scoped while update/delete mutation keys are chat-scoped — prefixes do not align, so chat needs explicit-key patching.
- Chat UI problems (confirmed at file:line in research): composer `form.watch` values rerender the whole timeline (`hooks/use-chat-composer.ts:73-80,223-235`; `ClientComponent.tsx:111-155,312-320`); `MessageTimeline.tsx:39-84` has zero `React.memo`, broadcasts a single `isDeleting` boolean to all rows, and uses array-index key fallback for actions; create/update/delete success paths call a full `invalidateQueries` (`hooks/use-message-actions.ts:75-92`, `hooks/use-thread-messages-refetch.ts:14-31`); `utils.ts:69-83` includes `lastItem.data.updatedAt` in the scroll signature so edits scroll the timeline to the bottom.
- Ecommerce cart = `order` (type `cart`) + `orders-to-products`; list queries use generic factory keys with filters in slot 2; remove-from-cart uses the factory delete mutation; add-to-cart calls the server SDK + `router.refresh()` (bypasses factory); no ecommerce query sets `meta.topics` (route fallback only).
- Backend HTTP cache (`libs/middlewares/src/lib/http-cache/index.ts`): GET responses are cached in KV with versioned exact-path keys and TTL `KV_TTL` (default 30 s, `libs/shared/utils/src/lib/envs/host.ts:59`). Successful 2xx mutations bump cache versions in a fire-and-forget async block (`:133-213`) for the mutation path, the path without a trailing UUID, and `/rbac/permissions`. The client never sends `Cache-Control: no-store` (0 occurrences in `libs/shared/frontend/client/api`). The middleware already carries an issue-152 exclusion for cart aggregate counters with the comment "exact-path cache invalidation may leave stale quantity/total after cart mutations" (`:94-103`) — a documented precedent of this staleness class.

## Desired End State

- Factory `create`/`update`/`delete` mutations patch the React Query cache locally (append/patch/remove with safety rules) before any user callback, for every model and relation in every module, with no per-model changes required.
- Chat: typing rerenders only the composer; create appends one row; edit patches one row without scrolling to bottom; delete removes one row; unchanged rows keep stable props and do not rerender; AI/OpenRouter flow still refetches.
- Ecommerce cart benefits from the factory integration with zero cart-specific code changes.
- Cross-client realtime: WebSocket topic/route invalidation fires immediately (no artificial 1000 ms delay), so when another user changes data, every subscribed client refetches right away and — thanks to structural sharing + memoized rows — renders it as a local row update. Perceived cross-client latency = WS push + refetch round trip (sub-second).
- Conventions are documented so all future components/SDKs follow the same pattern.

Verification: BDD specs for cache helpers, factory callback merging, subscription timing, and chat patching pass; manual browser checks confirm no timeline flicker/jumps for chat, faster cart updates, and sub-second propagation of changes to a second browser window.

### Key Discoveries:

- `factory<IModel>()` spread in 168 SDK clients → one integration point covers all modules (`libs/modules/*/models/*/sdk/client`, `libs/modules/*/relations/*/sdk/client`).
- `[route]` prefix matching covers `find` lists only; `findById` (`route/id`) and `count` (`route/count`) need their own handling (`factory/index.ts:247-341`).
- User `reactQueryOptions` is spread last in factory mutations (`factory/index.ts:391,428,463`) — internal `onSuccess` must be merged so the user callback runs after internal cache handling, not replaced.
- Chat message **update** SDK returns an array (`ISocialModuleMessage[]`) while create/delete return a single message — Layer 3 patch logic must handle both shapes.
- `editingMessageId` already exists as a precedent for per-row pending scoping (`hooks/use-message-actions.ts:20`); there is no `deletingMessageId` yet.
- BDD test harness for chat exists at `…/message/list/default/test-utils.tsx`; shared-api spec precedent at `libs/shared/frontend/client/api/src/lib/request-limmiter/index.spec.ts`.
- The shared `queryClient` singleton (`libs/shared/frontend/client/api/src/lib/provider/index.tsx:6-13`) is imported by both factory and hand-written chat hooks, so helpers always hit the same cache.
- HTTP-cache granularity is safe for the generic factory but NOT for chat: factory base routes bump correctly (`/api/<module>/<models>/<id>` minus UUID = the list GET path), but chat message update/delete hit chat-scoped paths (`…/chats/<cid>/messages/<mid>`) and bump only `…/chats/<cid>/messages` — the thread-scoped timeline GET (`…/chats/<cid>/threads/<tid>/messages`) is never bumped, and the backend cannot derive it from the mutation URL (`threadId` is absent). For up to `KV_TTL` (30 s) a post-mutation refetch can return stale data from the backend HTTP cache and overwrite a correct local cache patch, visually reverting an edit/delete. This staleness exists today; local patching makes it more visible (new → old → new flicker), so Phase 4 must close it.

## What We're NOT Doing

- Not adding entity payloads to WS broadcasts or patching other clients' caches from WS data. `/ws/revalidation` is a shared broadcast channel delivered to ALL connected clients; carrying entity bodies would leak private data (chat messages, orders) across users, and per-topic WS authorization is out of scope. Cross-client immediacy is achieved instead by removing the artificial invalidation delay (Phase 5) — broadcasts stay metadata-only.
- Not introducing a Zustand (or any second) store for server data.
- Not changing chat SDK query-key structures, `meta.topics`, or the revalidation middleware/topic rules.
- Not refactoring add-to-cart away from its server-SDK + `router.refresh()` path.
- Not memoizing ecommerce cart rows in this issue (explicit follow-up only if flicker remains after Phase 6 verification).
- Not building a generic mutation-path → read-path bump-rules engine for the HTTP cache middleware; for the chat timeline a targeted cache exclusion (issue-152 precedent) is sufficient, and factory base routes already bump correctly.
- Not migrating the other ~40 hand-written SDK files to the new mutation contract — the convention is documented (Phase 7) and applied opportunistically in future work; chat is the reference implementation.

## Implementation Approach

Four coverage levels, delivered bottom-up: (A) shared cache helpers integrated into the generic factory → automatic coverage for all factory-backed models/relations; (B) the same helpers used with explicit keys by hand-written SDK flows, with chat as the reference; (C) component-level conventions (row memoization, scoped pending state, localized form subscriptions) proven on the chat timeline; (D) the WS invalidation pipeline upgraded from a 1000 ms-deferred fallback into the immediate, metadata-only cross-client reconciliation path — covering other users' changes and server-created data (AI replies). Levels A–C make refetches visually local; level D makes them immediate, so together they deliver realtime freshness without flicker. Each phase is independently shippable and verifiable.

## Phase 1: Shared Cache Helpers + Factory Integration (Layer 0)

### Overview

Create the reusable cache-patching helpers and wire them into the factory mutations so every model/relation in every module gets local cache updates automatically.

### Changes Required:

#### 1. New cache helpers module

**File**: `libs/shared/frontend/client/api/src/lib/cache/index.ts` (new; directory does not exist yet)
**Why**: Single shared implementation of safe list-cache patching for both factory and hand-written SDKs.
**Changes**: Implement three generic helpers over items with `{ id: string }`:

- `appendToListQueries(queryClient, route, item, opts?)` — uses `queryClient.setQueriesData({ queryKey: [route] }, updater)` for prefix coverage of `[route]` and `[route, serializedParams]` keys. Safety rules: deduplicate by `id` (if the item already exists, patch it instead); for queries whose second key element (serialized params) contains filters, do NOT append — instead immediately invalidate that specific query (targeted, not deferred), because the new item may not match the filter. Must also accept an explicit full query key (for hand-written SDKs with one-element URL keys).
- `patchInListQueries(queryClient, route, id, patch)` — shallow-merge patch by `id` across all matched list queries; no-op when the item is absent (safe for filtered lists). Preserve references of untouched items (structural sharing): only the patched item and the containing array get new references.
- `removeFromListQueries(queryClient, route, id)` — filter out by `id` across matched queries; no-op (return the same reference) when the item is absent so unaffected queries do not rerender.
- All helpers must tolerate non-array cached data (skip gracefully) and accept either a route string (prefix mode) or an explicit query key (exact mode) — hand-written chat keys are single-element URL strings.

#### 2. Barrel export

**File**: `libs/shared/frontend/client/api/src/lib/index.ts`
**Why**: Helpers must be importable as `@sps/shared-frontend-client-api` by chat hooks and any future SDK.
**Changes**: Add `export * from "./cache"` next to the existing `factory`/`provider`/`request-limmiter` exports.

#### 3. Factory mutation integration

**File**: `libs/shared/frontend/client/api/src/lib/factory/index.ts` (mutations at `:360-465`)
**Why**: This is the single point that gives all 168 SDK clients local cache updates with no per-model changes.
**Changes**:

- `create` (`:360-393`): add an internal `onSuccess` that calls `appendToListQueries` for `factoryProps.route` with the created entity, plus targeted invalidation of `count` queries (`["${route}/count"]` prefix). Then invoke the caller's `reactQueryOptions.onSuccess` (and other callbacks) — merge, don't let the spread replace internal handling. Other `reactQueryOptions` fields keep their current pass-through behavior.
- `update` (`:394-430`): internal `onSuccess` calls `patchInListQueries` by the returned entity's `id`, and patches/invalidates the matching `findById` cache (`["${route}/${id}"]` prefix) so detail views stay fresh without waiting for the WS refetch.
- `delete` (`:431-465`): internal `onSuccess` calls `removeFromListQueries` by the deleted entity's `id`, removes/invalidates the `findById` entry, and invalidates `count` queries. If the response has no usable `id`, fall back to a targeted `invalidateQueries({ queryKey: [route] })` instead of guessing.
- Keep the existing `addToGlobalStore` `cb` and the `subscription()` registration untouched — WS invalidation remains the fallback.

#### 4. BDD specs

**Files**: `libs/shared/frontend/client/api/src/lib/cache/index.spec.ts` (new), factory mutation callback-merge spec (new or extending existing factory coverage)
**Why**: Acceptance criteria require BDD coverage of helper behavior and callback merging.
**Changes**: Follow the `request-limmiter/index.spec.ts` BDD format (top-level `BDD Suite` JSDoc with Given/When/Then, per-test `BDD Scenario`). Cover: append dedup-by-id; append-to-filtered → targeted invalidation, not append; patch no-op on absent id; remove preserves references of unmatched queries; structural sharing (unchanged items keep identity); prefix vs exact key modes; factory create/update/delete run internal cache handling AND the user-provided `reactQueryOptions.onSuccess` afterwards, in that order.

### Success Criteria:

#### Automated Verification:

- [ ] Shared api tests pass: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-client-api:jest:test`
- [ ] Type check passes: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-client-api:tsc:build`
- [ ] Lint passes: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-client-api:eslint:lint`
- [ ] Shared unit suite stays green: `npm run test:unit:shared`

#### Manual Verification:

- [ ] No behavioral regression on any factory-backed screen (spot-check a generic admin list create/update/delete).
- [ ] WS invalidation still fires afterwards (observe deferred refetch in devtools network tab).

---

## Phase 2: Isolate Chat Composer Rerenders (Layer 1)

### Overview

Stop composer keystrokes from rerendering the message timeline by moving reactive form subscriptions out of the top-level chat component.

Chat directory (all relative paths below): `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/`.

### Changes Required:

#### 1. Composer hook

**File**: `hooks/use-chat-composer.ts` (`:73-80`, `:223-235`)
**Why**: `form.watch("description")`/`form.watch("files")` make the hook's consumer (the top-level `ClientComponent`) rerender on every keystroke.
**Changes**: Stop returning `description` and `selectedFileNames` as top-level reactive values. Where the top level genuinely needs to react to description changes (e.g. `syncSelectedSkillsToDescription`), use the callback form of `form.watch(callback)` (non-rendering subscription) or move the logic down into the composer scope. Keep the create-success/AI-reaction flow intact (it changes in Phase 4, not here).

#### 2. Top-level chat component

**File**: `ClientComponent.tsx` (`:111-155`, `:312-320`)
**Why**: It currently consumes `composer.description` in a `useEffect` and ~6 derived `useMemo`s/booleans (knowledge command match, visible knowledge commands, skill mention options, etc.) and renders `<MessageTimeline>` in the same body.
**Changes**: Remove all `composer.description`-derived state from this component. Pass the form (or composer handle) down and let `Composer.tsx` derive its own state.

#### 3. Composer component

**File**: `components/Composer.tsx`
**Why**: It already owns local UI state (`activeKnowledgeCommandIndex`, `activeSkillMentionOptionIndex` at `:57-60`); it is the right boundary for all composer-only derived state.
**Changes**: Move into `Composer.tsx` (or a new composer-scoped hook colocated in `hooks/`): `canSubmit`, selected file names, knowledge command picker state, skill mention picker state, filtered skill mention options. Subscribe to `description`/`files` inside this boundary only.

#### 4. Test harness

**Files**: `ClientComponent.spec.tsx`, `test-utils.tsx`
**Why**: Existing specs assert against current props/structure; prop drilling changes will affect them.
**Changes**: Update mocks/assertions for the moved props; add a BDD scenario asserting that timeline-rendering props do not change when only the description value changes (rerender isolation at the prop level).

### Success Criteria:

#### Automated Verification:

- [ ] Chat specs pass: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:jest:test`
- [ ] Lint/type for the rbac module pass (eslint:lint / tsc:build targets).

#### Manual Verification:

- [ ] Typing in the composer does not rerender timeline rows (verify with React DevTools "Highlight updates").
- [ ] Knowledge command picker and skill mention picker still work while typing.
- [ ] File selection display and submit enablement still work.

---

## Phase 3: Memoize Chat Timeline Rows (Layer 2)

### Overview

Make timeline rows rerender only when their own data changes.

### Changes Required:

#### 1. Timeline rows

**File**: `components/MessageTimeline.tsx` (`:39-84`)
**Why**: Rows are not memoized; one `isDeleting` boolean is passed to every message row; action rows fall back to array-index keys.
**Changes**: Extract `MemoizedMessageRow` and `MemoizedActionRow` wrapped in `React.memo`, keeping `MessageProfileLoader`/`ActionProfileLoader` inside the memo boundary. Use stable keys for actions (`action.id`; avoid index fallback wherever the data provides an id). Replace the `isDeleting` boolean prop with a `deletingMessageId` so only the affected row sees a pending state.

#### 2. Row handlers and pending scoping

**File**: `hooks/use-message-actions.ts` (`:20`, `:66-92`)
**Why**: Handlers recreated each render defeat `React.memo`; `deleteMessage.isPending` is global today.
**Changes**: Wrap row handlers in `useCallback`; introduce `deletingMessageId` state (set on delete start, cleared on settle), following the existing `editingMessageId` precedent.

#### 3. Top-level wiring

**File**: `ClientComponent.tsx` (`:313`)
**Why**: Currently passes `isDeleting={deleteMessage.isPending}` to the timeline.
**Changes**: Pass `deletingMessageId` instead; ensure all callbacks passed to `MessageTimeline` are referentially stable.

#### 4. Profile sidebar callback

**File**: `hooks/use-profile-sidebar.ts` (`:250-266`)
**Why**: `openProfile` is a plain function recreated each render and passed as `onProfileOpen` to every row.
**Changes**: Memoize `openProfile` with `useCallback`.

### Success Criteria:

#### Automated Verification:

- [ ] Chat specs pass: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:jest:test`
- [ ] New BDD scenario: deleting one message marks only that row as pending (assert via `deletingMessageId` prop propagation).

#### Manual Verification:

- [ ] With React DevTools highlighting, receiving/sending a message rerenders only the new row, not existing rows.
- [ ] Deleting a message shows the pending state only on that row.

---

## Phase 4: Chat Targeted Cache Patches + Scroll Fix (Layer 3)

### Overview

Replace full-list invalidation on chat mutation success with targeted cache patches using the Phase 1 helpers and the explicit thread-message query key; fix edit-triggered scroll-to-bottom.

### Changes Required:

#### 1. Thread messages cache API

**File**: `hooks/use-thread-messages-refetch.ts` (`:14-31`)
**Why**: Currently returns a single `invalidateQueries` callback; the find query key is thread-scoped while mutation keys are chat-scoped, so generic factory automation cannot cover chat.
**Changes**: Return `{ refetch, append, patch, remove }`. `refetch` keeps the current invalidation. `append`/`patch`/`remove` call the shared cache helpers in exact-key mode with the one-element thread-message query key already built in this hook. `patch` must handle both a partial patch and a full message object.

#### 2. Create success path

**File**: `hooks/use-chat-composer.ts` (`:128-198`, `:213-221`)
**Why**: The `createMessage.isSuccess` effect currently calls the full `refetchThreadMessages()`.
**Changes**: On create success, `append(createMessage.data)` (create SDK returns a single message). Keep the full `refetch()` for the OpenRouter/AI reaction flow (`react-by-openrouter`), because the server creates messages the client cannot predict. On mutation error, call `refetch()` to restore server truth.

#### 3. Update/delete success paths

**File**: `hooks/use-message-actions.ts` (`:75-92`)
**Why**: Both currently call `refetchThreadMessages()`.
**Changes**: Update success → `patch(id, …)`; note the update SDK returns `ISocialModuleMessage[]` (array) — select the message matching the edited id (fall back to `refetch()` if not found). Delete success → `remove(id)` (delete SDK returns a single message). On error in either flow → `refetch()`.

#### 4. Scroll signature

**File**: `utils.ts` (`getTimelineSignature`, `:69-83`)
**Why**: Including `lastItem.data.updatedAt` makes editing the last message re-trigger scroll-to-bottom (`hooks/use-message-thread-scroll.ts:89-129` keys on the signature).
**Changes**: Remove `lastItem.data.updatedAt` from the signature so only genuinely new items (length/id changes) scroll the timeline.

#### 5. Backend HTTP cache consistency for the chat timeline

**File**: `libs/middlewares/src/lib/http-cache/index.ts`
**Why**: Chat message update/delete mutations hit chat-scoped paths and bump only `…/chats/<cid>/messages`; the thread-scoped timeline GET (`…/chats/<cid>/threads/<tid>/messages`) is never version-bumped and cannot be derived from the mutation URL (no `threadId`). Within `KV_TTL` (30 s) a reconciliation refetch can therefore return stale data and revert a correct local patch — the exact staleness class already documented by the issue-152 cart-counter exclusion (`:94-103`).
**Changes**: Exclude the chat thread-messages GET path (`/api/rbac/subjects/<id>/social-module/profiles/<pid>/chats/<cid>/threads/<tid>/messages`) from HTTP caching, following the issue-152 exclusion precedent (path-pattern early `next()` before the cache lookup). Realtime chat data and a 30 s server-side cache are fundamentally at odds, so exclusion is preferred over inventing a mutation→read-path bump rule the middleware cannot compute. Also evaluate the chat actions GET path (`…/chats/<cid>/actions`): actions are created server-side (no HTTP mutation passes through this middleware), so its cache version is never bumped either — apply the same exclusion if confirmed. Add a comment in the middleware referencing this issue, mirroring the issue-152 comment style.

#### 6. BDD specs

**Files**: chat spec files + `test-utils.tsx`
**Why**: Acceptance criteria require coverage of chat create/update/delete cache patching; the current `test-utils.tsx` queryClient mock exposes only `invalidateQueries`.
**Changes**: Extend the `@sps/shared-frontend-client-api` mock (`test-utils.tsx:391-400`) to cover the cache helpers / `setQueriesData`. Add scenarios: create success appends without invalidating; AI flow still refetches; update success patches the single row (array return shape handled); delete success removes the row; mutation error falls back to refetch; editing the last message does not change the scroll signature.

### Success Criteria:

#### Automated Verification:

- [ ] Chat specs pass: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:jest:test`
- [ ] Shared suite stays green: `npm run test:unit:shared`
- [ ] Middlewares type check passes: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/middlewares:tsc:build` (note: `@sps/middlewares` has no jest target, so the http-cache exclusion is verified by type check + the manual staleness check below)

#### Manual Verification:

- [ ] Sending a message appends it instantly; no loading/skeleton replacement of the timeline.
- [ ] Editing a message updates only that row and does NOT scroll to bottom.
- [ ] Deleting a message removes only that row.
- [ ] AI/OpenRouter reply still appears reliably (server-created message arrives via refetch).
- [ ] WS refetch still reconciles a second browser window (cross-client immediacy itself is delivered in Phase 5; at this point the legacy 1000 ms delay is still acceptable).
- [ ] After editing/deleting a message, the background refetch (within 30 s of the mutation) returns fresh data and does NOT revert the patched row (verifies the http-cache exclusion).

---

## Phase 5: Immediate Cross-Client Reconciliation

### Overview

Turn the WS revalidation path from a deferred background fallback into the immediate realtime sync mechanism: when another user changes data, subscribed clients refetch and render the change right away. Combined with Phases 2–3 (memoization + structural sharing), the refetch renders as a local row update, so immediacy does not reintroduce flicker. Broadcasts remain metadata-only (no entity payloads — see "What We're NOT Doing").

### Changes Required:

#### 1. Remove the artificial invalidation delay

**File**: `libs/shared/frontend/client/api/src/lib/factory/index.ts` (`subscription()`, `:155-200`)
**Why**: Both the topic path and the route-fallback path defer `invalidateQueries` behind a hardcoded `setTimeout(…, 1000)` — the main source of cross-client latency. `invalidateQueries` refetches active queries immediately regardless of `staleTime`, so removing the delay is sufficient on the client side.
**Changes**: Invalidate immediately on message receipt for both topic matching and route-fallback matching. Replace the fixed 1000 ms delay with a small randomized jitter (~0–200 ms) so many clients receiving the same broadcast do not refetch in lockstep. Keep the existing `topicTriggerKey` dedup so one broadcast triggers at most one invalidation per subscribed route.

#### 2. Guarantee cache-version bump ordering on the backend

**Files**: `libs/middlewares/src/lib/http-cache/index.ts` (`:133-213`), `apps/api/app.ts` (middleware registration order — verify only)
**Why**: HTTP-cache version bumps currently run fire-and-forget after the response. With the 1000 ms client delay gone, another client's immediate refetch can outrun the bump and receive a stale cached response, defeating the realtime guarantee.
**Changes**: Await the cache-version bumps for mutation methods (POST/PUT/PATCH/DELETE) before the middleware completes, so the revalidation WS broadcast can only reach clients after the backend HTTP cache is already invalidated. Verify the registration order of the http-cache and revalidation middlewares in `apps/api/app.ts` supports this ordering and document the assumption with comments in both middleware files. GET response-caching writes may remain fire-and-forget.

#### 3. BDD specs

**Files**: factory `subscription()` spec (new or extended) in `libs/shared/frontend/client/api`
**Why**: The subscription timing contract changes from "deferred by 1000 ms" to "immediate with bounded jitter".
**Changes**: Scenarios: a revalidation message with matching topics triggers invalidation without the fixed 1-second delay; the route-fallback path likewise; duplicate broadcasts with the same `topicTriggerKey` do not double-invalidate; jitter stays within its bound (use fake timers).

### Success Criteria:

#### Automated Verification:

- [ ] Shared api tests pass: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-client-api:jest:test`
- [ ] Middlewares type check passes: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/middlewares:tsc:build`
- [ ] API suite stays green: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run api:jest:test`

#### Manual Verification:

- [ ] Two browser windows, same chat: a message sent in window A appears in window B sub-second, rendered as a single appended row (no list flicker); repeat for edit and delete.
- [ ] Two windows, cart: removing an item in window A updates window B promptly (no ~1 s+ lag).
- [ ] Editing a message in window A never shows stale (pre-edit) content in window B after the update lands (bump-ordering guarantee works).
- [ ] Mutation response latency on the API is not measurably degraded by awaiting version bumps (Redis incr is ~1 ms).

---

## Phase 6: Ecommerce Cart Universality Check

### Overview

Verify that factory-backed cart/order flows benefit from Phases 1 and 5 with zero cart-specific code changes. This phase is verification-first; code changes only if a defect in the shared layer is exposed.

### Changes Required:

#### 1. Verification of existing flows (no planned code changes)

**Files** (read/verify): `libs/modules/ecommerce/models/order/frontend/component/src/lib/singlepage/delete/ClientAction.tsx`, `…/singlepage/cart-default/Component.tsx`, `…/singlepage/create/ClientAction.tsx`
**Why**: The ticket uses the cart as the proof that Layer 0 generalizes.
**Changes**: Verify: remove-from-cart (factory delete) removes the order from cached filtered list queries immediately (filtered lists rely on `remove` being a safe no-op/match operation); any factory `create` against filtered cart queries triggers targeted invalidation rather than unsafe append; quantity/total counters keep working through their existing paths (they have no `subscription` and are out of scope). Document that add-to-cart (server SDK + `router.refresh()`) intentionally does not use the new path.
**Note**: If flicker remains in cart rows after this verification, record cart-row memoization as a follow-up issue — do not implement it here.

### Success Criteria:

#### Automated Verification:

- [ ] Ecommerce suite stays green: `npm run test:unit:ecommerce`

#### Manual Verification:

- [ ] Remove-from-cart visually removes the row faster than the current ~1 s+ deferred invalidation path.
- [ ] Cart totals/quantity still update (via their existing flows).
- [ ] No console errors from the cache helpers on cart pages.

---

## Phase 7: Document Conventions (Codebase-Wide Reproducibility)

### Overview

Make the approach the documented default for all future models, relations, hand-written SDKs, and list components.

### Changes Required:

#### 1. Shared API docs

**File**: `libs/shared/frontend/client/api/README.md` (create or extend)
**Why**: The cache helpers and the factory mutation contract (internal cache handling → then user `onSuccess`) are new shared infrastructure.
**Changes**: Document the three helpers, prefix vs exact key modes, the filtered-append safety rule, dedup-by-id, `findById`/`count` handling, and the mandatory contract for hand-written SDK mutations (internal `onSuccess` → cache patch → `globalActionsStore` push → user callback), with chat as the reference implementation.

#### 2. Revalidation docs

**File**: `libs/middlewares/src/lib/revalidation/README.md`
**Why**: It currently describes invalidation as the only freshness mechanism.
**Changes**: Describe the new two-tier model: local cache patches for the acting client + immediate (jittered, metadata-only) WS topic/route invalidation for all other clients and server-created data. Document why broadcasts must never carry entity payloads (shared unauthenticated channel) and the bump-before-broadcast ordering guarantee.

#### 3. Code review checklist

**File**: `CLAUDE.md` (Code Review Checklist section)
**Why**: Component-level conventions must be enforced at review time for every module.
**Changes**: Add checklist items: list rows memoized with stable id keys; pending state scoped per item (`<action>ingId`, not a shared boolean); form `watch` subscriptions kept at the lowest component that needs them; mutations patch cache via shared helpers (factory automatically, hand-written SDKs via the documented contract) and never replace WS invalidation.

### Success Criteria:

#### Automated Verification:

- [ ] Markdown files pass lint (if configured); no build impact.

#### Manual Verification:

- [ ] Docs reviewed for accuracy against the implemented behavior; all docs in English.

---

## Testing Strategy

### Unit Tests (BDD format per CLAUDE.md):

- Cache helpers: append dedup, filtered-append → targeted invalidation, patch/remove no-ops, structural sharing/reference stability, prefix vs exact key modes, non-array cache tolerance.
- Factory: internal `onSuccess` ordering with user `reactQueryOptions.onSuccess`; `findById`/`count` handling on update/delete; fallback to targeted invalidation when the response lacks an id.
- Chat: create append, AI-flow refetch retention, update array-shape patch, delete remove, error → refetch, scroll signature excludes `updatedAt`, `deletingMessageId` scoping, composer/timeline rerender isolation at prop level.
- Subscription: immediate invalidation on topic/route match (no fixed 1 s delay), jitter bound, `topicTriggerKey` dedup under duplicate broadcasts.

### Integration Tests:

- Existing chat `ClientComponent.spec.tsx` flows must stay green after Phases 2–4 (composer typing, message send, edit, delete end-to-end through mocked SDK).

### Manual Testing Steps:

1. Start infra + apps (`./up.sh`, `npm run api:dev`, `npm run host:dev`) — research noted `localhost:4000` was down during the research browser check, so end-to-end WS behavior MUST be verified during implementation.
2. Chat: with React DevTools "Highlight updates" on — type (only composer updates), send (one row appended), edit last message (row updates, no scroll jump), delete (only that row pending, then removed), trigger AI reply (assistant message appears via refetch). Re-check the edited/deleted row ~5–30 s after the mutation to confirm the background refetch does not revert it (backend HTTP cache exclusion working).
3. Open the same chat in a second browser window: verify a message sent in window A appears in window B sub-second as a single appended row (after Phase 5); repeat for edit (row updates in place, no stale revert) and delete (row removed).
4. Cart: add item (existing path), remove item (row disappears immediately), verify totals; repeat remove with a second window open to confirm prompt cross-client propagation.

## Performance Considerations

- Patches must preserve React Query structural sharing: when the eventual WS-triggered background refetch returns data identical to the patched cache, unchanged items must keep their references so memoized rows do not rerender.
- `setQueriesData` with a `[route]` prefix iterates all cached query variants for the route; updaters must be cheap (single-pass map/filter) and return the original reference when nothing matched.
- Phase 5 removes the artificial 1000 ms delay; the small randomized jitter (~0–200 ms) plus the existing `topicTriggerKey` dedup prevent a synchronized refetch stampede when many clients receive one broadcast. Net effect: fewer full refetches for the acting client (patched locally), faster reconciliation for everyone else.
- HTTP-cache version bumps are currently fire-and-forget after the mutation response (`http-cache/index.ts:133`); Phase 5 awaits mutation-path bumps so the WS broadcast cannot outrun backend cache invalidation. The added mutation latency is a few Redis `incr` round trips (~ms).

## Migration Notes

- Purely additive; no data or schema changes. Rollback per layer: removing the internal `onSuccess` wiring in the factory restores today's behavior exactly (WS invalidation never stopped running). Chat hooks can fall back to `refetch()`-only by reverting Phase 4 call sites. Phase 5 rollback = restoring the deferred timeout in `subscription()` and reverting the awaited bumps to fire-and-forget.
- The factory mutation callback-merge changes the semantics for callers that today rely on `reactQueryOptions.onSuccess` being the ONLY success handler — internal cache handling now runs first. Audit existing `reactQueryOptions.onSuccess` usages of factory mutations during Phase 1 implementation; their callbacks still run, only after cache patching.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-195.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-195.md`
- Process log: `thoughts/shared/processes/singlepagestartup/ISSUE-195.md`
- Crux files: `libs/shared/frontend/client/api/src/lib/factory/index.ts`, `libs/middlewares/src/lib/revalidation/index.ts`, `libs/middlewares/src/lib/http-cache/index.ts`, `apps/api/app.ts`, `apps/host/src/components/revalidation/ClientComponent.tsx`, chat list dir `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/`

<!-- Last synced at: 2026-06-10T12:43:35Z -->
