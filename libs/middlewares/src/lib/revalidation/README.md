# Revalidation Flow

This document fixes the current runtime contract between backend revalidation events and frontend React Query invalidation.

## Purpose

After successful write requests (`POST`, `PUT`, `PATCH`, `DELETE`), backend sends revalidation messages through WebSocket. Frontend consumes those messages and invalidates affected React Query entries.

## Why This Approach

- Route-only invalidation is too broad for realtime-heavy screens (chat, cart, notifications) and causes unnecessary refetch/rerender cascades.
- Topic-only invalidation is too strict during migration, because legacy queries may not yet define `meta.topics`.
- Combined strategy (topics first, route fallback) gives correctness now and allows incremental rollout without breaking existing modules.
- Template-based topic rules (`[...]`) provide explicit business mapping while keeping extension cost low (add rule, do not rewrite parser).

## Message Shape

WebSocket payload (`slug: "revalidation"`) includes:

- `payload` - route path (normalized, without query string)
- `topics` - semantic tags for targeted invalidation
- `createdAt`
- `expiresAt`

## Backend Side

Source:

- `libs/middlewares/src/lib/revalidation/index.ts`
- `libs/middlewares/src/lib/revalidation/topic-rules.ts`

### 1. Route payloads

For each successful write request middleware emits:

- exact path (`normalizedPath`)
- path without trailing id (`pathWithoutLastId`)

### 2. Topics

Topics are resolved in two layers:

1. `topic-rules.ts` (priority registry, template-based)
2. generic fallback from `*-module` path structure

Template format is aligned with permission matching style:

- route template: `/api/.../[domain.entity.id]/...`
- topic template: `social.chats.[social.chats.id].messages`

### 3. Rule order and `stop`

Rules are processed top-to-bottom.

- `stop: true` means "do not evaluate next rules after this match".
- Put more specific rules before generic ones.

### 4. Topic safety guard

Malformed topics are filtered out (e.g. missing placeholder replacement that produces `..`).

## Frontend Side

Source:

- `libs/shared/frontend/client/api/src/lib/factory/index.ts`

### 1. Subscription behavior

Each query/mutation registers route subscription via `subscription(route, queryClient)`.

Important:

- subscription must be mounted in `useEffect` with cleanup.
- calling `subscription(...)` directly in render causes duplicated listeners.

### 2. Invalidation strategy

For each incoming revalidation message:

1. If `topics` exist and there are queries with matching `meta.topics`:
   - invalidate by topics (`predicate` over query meta)
   - skip route matching branch
2. If `topics` exist but no query uses matching `meta.topics`:
   - fallback to route invalidation (legacy compatibility)
3. If `topics` are empty:
   - route invalidation only

### 3. Route matching rule

Route fallback uses segment-boundary prefix matching:

- valid match: `/api/social/messages` -> `/api/social/messages/123`
- invalid match: `/api/social/profiles` X `/api/social/profiles-to-messages`

This prevents false positives for similar route names.

## Current module status

### Chat

- Backend emits topic rules for:
  - `.../chats/[chatId]/messages`
  - `.../chats/[chatId]/actions`
- Chat queries with `meta.topics` receive targeted invalidation.

### Cart (ecommerce orders)

- Cart queries currently rely on route fallback (no dedicated `meta.topics` yet).
- This is intentional compatibility mode while topic migration is incremental.

## How to add a new domain rule

1. Add template rule to `topic-rules.ts`.
2. Add `meta.topics` to relevant frontend queries.
3. Keep legacy behavior until all important queries are topic-aware.
4. Verify no route-name collisions and no duplicate listener registrations.
