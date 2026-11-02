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

- `addAction` writes a compact debug snapshot to the `global-actions-store`
  `sessionStorage` key. It keeps up to 50 recent channels and three events per
  channel; large `props` and `result` values are replaced with metadata. An
  oversized snapshot falls back to action metadata only.
- The snapshot is write-only in the current implementation: initialization
  does not read it or hydrate the store. Storage failures do not interrupt
  the live in-memory event log used for revalidation.
- The backend owns authoritative entity data; React Query caches SDK results
  for rendering. Neither entity data nor persistent drafts are restored from
  the event snapshot. See [the store contract](../../README.md) for the runtime
  flow and state lifetime.
