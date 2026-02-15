# Client Store Internals

## Global Actions Store

Source:

- `libs/shared/frontend/client/store/src/lib/global-actions-store.ts`

Purpose:

- Keep a lightweight in-memory event log for frontend runtime events (queries, mutations, websocket revalidation messages).
- Provide a shared bridge between network layer and invalidation layer without coupling React components to websocket listeners directly.

Why this approach:

- React Query cache tracks data state, but not a unified event timeline.
- Revalidation logic needs a single stream of incoming events to decide what to invalidate.
- A small bounded store (`MAX_ACTIONS`) prevents unbounded memory growth while still keeping recent events for dedupe.
- Zustand + immer keeps implementation simple and framework-agnostic across modules.

Key API:

- `addAction(action)` - append new runtime event.
- `getActionsFromStoreByName(name)` - read events by channel (for example `revalidation`).
- `reset()` - clear store and session storage key.

Notes:

- Data is persisted to `sessionStorage` for visibility/debug continuity in one browser session.
- The store is not a business data source; authoritative data remains in backend + React Query cache.
