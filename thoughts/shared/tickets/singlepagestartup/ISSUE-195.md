# Issue: Smooth realtime data updates without full component rerenders

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/195
**Status**: Research Needed
**Created**: 2026-06-10
**Priority**: high
**Size**: large
**Type**: feature/refactoring

---

## Problem to Solve

Frontend data updates currently rely on WebSocket revalidation messages that eventually call `queryClient.invalidateQueries`. This keeps data fresh, but it forces full query refetches and causes visually large rerenders on realtime-heavy screens.

The most visible case is the social chat timeline: sending, editing, deleting, or receiving messages can refetch the whole message/action list and make the UI flicker or jump. The same broad invalidation pattern affects other live-updating flows such as ecommerce cart/order interactions.

Build a reusable realtime update mechanism that preserves the current correctness guarantees from WebSocket + React Query, while making UI updates visually local and stable.

## Key Details

- Current flow:
  - backend mutation succeeds;
  - `libs/middlewares/src/lib/revalidation/index.ts` broadcasts `{ slug, payload, topics, createdAt, expiresAt }`;
  - `apps/host/src/components/revalidation/ClientComponent.tsx` stores the event in `globalActionsStore`;
  - `libs/shared/frontend/client/api/src/lib/factory/index.ts` subscribes and calls `queryClient.invalidateQueries`;
  - React Query refetches the affected query and subscribed components rerender.
- Chat message list currently fetches messages and actions separately in `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx`, derives a combined timeline, and renders the full list.
- `useChatComposer` watches `description` and `files` in the top-level chat `ClientComponent`, so typing in the composer can rerender the timeline even when server data has not changed.
- Chat-specific query keys use one-element URL keys, for example `[threadMessagesUrl]`.
- Generic factory queries use `[route, serializedParams]`, so exact `setQueryData([route])` is insufficient for factory-backed components. Shared helpers should use prefix matching via `setQueriesData({ queryKey: [route] }, updater)`.
- Chat queries already use `meta.topics`, so WebSocket topic invalidation can remain as the consistency fallback.
- React Query structural sharing should be preserved: if cache patches match the eventual server response, the background refetch should not force new references for unchanged data.
- Avoid creating a second source of truth in Zustand for server data unless a later phase proves React Query cache patching insufficient.

## Implementation Notes

### Layer 0: Shared React Query cache helpers

Add shared helpers under `libs/shared/frontend/client/api/src/lib/cache/index.ts` and export them from `@sps/shared-frontend-client-api`:

- `appendToListQueries<T extends { id: string }>(queryClient, route, item, opts?)`
- `patchInListQueries<T extends { id: string }>(queryClient, route, id, patch)`
- `removeFromListQueries(queryClient, route, id)`

Rules:

- Use `queryClient.setQueriesData({ queryKey: [route] }, updater)` so both `[url]` and `[route, serializedParams]` formats can be covered where appropriate.
- `patch` and `remove` are safe across filtered list queries because they no-op when the item is absent.
- `append` must be conservative for filtered queries. If serialized params contain filters, invalidate the full matched query immediately instead of appending an item that might not belong.
- Deduplicate by `id`; when an appended item already exists, patch it instead.

Integrate these helpers into factory mutations in `libs/shared/frontend/client/api/src/lib/factory/index.ts`:

- create -> append/update list cache for `factoryProps.route`;
- update -> patch by returned `id`;
- delete -> remove by deleted `id`;
- call user-provided `reactQueryOptions.onSuccess` after internal cache handling instead of replacing it via spread order.

Keep WebSocket invalidation as the background consistency guarantee.

### Layer 1: Isolate chat composer rerenders

Move `description` and `files` watch subscriptions out of the top-level chat `ClientComponent`.

- In `use-chat-composer.ts`, stop returning `description` and `selectedFileNames` as top-level reactive values.
- Move composer-only derived state into `components/Composer.tsx` or a composer-specific hook:
  - `canSubmit`;
  - selected file names;
  - knowledge command picker state;
  - skill mention picker state;
  - filtered skill mention options.
- Replace top-level `composer.description` effects with `form.watch(callback)` or a dedicated non-rendering callback subscription.

Result: typing in the composer should rerender the composer only, not the message timeline.

### Layer 2: Memoize chat timeline rows

Update `components/MessageTimeline.tsx`:

- extract `MemoizedMessageRow` with `React.memo`;
- extract `MemoizedActionRow` with `React.memo`;
- keep `MessageProfileLoader` / `ActionProfileLoader` inside the memoized row boundary;
- use stable keys for actions and avoid falling back to array index where possible.

Update supporting hooks:

- wrap message row handlers in `useCallback`;
- replace broad `isDeleting` propagation with `deletingMessageId`, so deleting one message does not rerender every row;
- memoize `openProfile` in `use-profile-sidebar.ts`.

Result: when new data arrives, existing rows keep stable props and unchanged rows do not rerender.

### Layer 3: Chat-specific targeted cache patches

The chat find query is thread-scoped, while message update/delete mutations are chat-scoped. Their route prefixes do not match, so generic factory automation is not enough.

Update `use-thread-messages-refetch.ts` to return a small API:

- `refetch()`;
- `append(message)`;
- `patch(id, patchOrMessage)`;
- `remove(id)`.

Use the shared cache helpers with the explicit thread message query key.

Update chat mutation flows:

- On message create success, append `createMessage.data` instead of invalidating the whole thread messages query.
- Keep full refetch for OpenRouter/AI responses because the server creates data the client cannot predict.
- On message update success, patch the edited message instead of refetching the full list.
- On message delete success, remove the deleted message instead of refetching the full list.
- On mutation error, run `refetch()` to restore server truth.

Fix scroll behavior:

- In `utils.ts`, remove `lastItem.data.updatedAt` from `getTimelineSignature`; editing an existing message should not trigger scroll-to-bottom behavior.

### Ecommerce cart as universality check

Factory-backed cart/order components should benefit from Layer 0 without local cart-specific changes:

- order quantity update -> factory update patches cached order queries;
- order delete -> factory delete removes the order from cached queries;
- order create with filtered cart queries -> immediate targeted invalidation rather than unsafe append;
- quantity/total counters can continue to update through existing WebSocket invalidation.

If visual flicker remains, treat cart row memoization as a follow-up, analogous to the chat timeline memoization.

## Acceptance Criteria

- Chat typing in the composer does not rerender existing message timeline rows.
- Creating a chat message appends it immediately without replacing the whole timeline with a loading/skeleton state.
- Editing a chat message updates only that row and does not scroll the timeline to the bottom.
- Deleting a chat message removes only that row and does not rerender unchanged rows.
- AI/OpenRouter response flow still refetches enough data to show server-created assistant messages reliably.
- WebSocket topic invalidation remains enabled as a background consistency fallback.
- Factory-backed create/update/delete mutations update React Query cache locally where safe and fall back to targeted invalidation where append would be unsafe.
- Existing `reactQueryOptions.onSuccess` callbacks continue to run after internal cache handling.
- Ecommerce cart quantity update/delete reflects faster than the current delayed full revalidation path.
- BDD tests cover shared cache helper behavior, factory mutation callback merging, and chat create/update/delete cache patching.

## References

- Source planning notes: `/Users/rogwild/.codex/attachments/4c6fbb2e-1401-417e-bbd3-725bc8d1e52d/pasted-text.txt`
- `apps/api/app.ts`
- `apps/host/src/components/revalidation/ClientComponent.tsx`
- `libs/middlewares/src/lib/revalidation/index.ts`
- `libs/middlewares/src/lib/revalidation/topic-rules.ts`
- `libs/shared/frontend/client/api/src/lib/factory/index.ts`
- `libs/shared/frontend/client/store/src/lib/global-actions-store.ts`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default`
