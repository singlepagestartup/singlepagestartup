# Revalidation Flow

This document fixes the current runtime contract between backend revalidation events and frontend React Query invalidation.

## Purpose

After successful write requests (`POST`, `PUT`, `PATCH`, `DELETE`), backend sends revalidation messages through WebSocket. Frontend consumes those messages and invalidates affected React Query entries.

## Why This Approach

- Route-only invalidation is too broad for realtime-heavy screens (chat, cart, notifications) and causes unnecessary refetch/rerender cascades.
- Topic-only invalidation is too strict during migration, because legacy queries may not yet define `meta.topics`.
- Combined strategy (topics first, route fallback) gives correctness now and allows incremental rollout without breaking existing modules.
- Template-based topic rules (`[...]`) provide explicit business mapping while keeping extension cost low (add rule, do not rewrite parser).

## Two-Tier Freshness Model (issue #195)

Freshness is delivered through two complementary tiers:

1. **Local cache patches (acting client)** — the client that performs a
   mutation patches its own React Query cache in place (append/patch/remove via
   `@sps/shared-frontend-client-api` cache helpers; the generic factory does
   this automatically). The UI updates instantly as a local row change, with no
   refetch and no list flicker.
2. **Immediate WS invalidation (all other clients + server-created data)** —
   the revalidation broadcast triggers topic/route invalidation right away
   (small randomized 0–200 ms jitter instead of the former fixed 1 s delay).
   Combined with memoized list rows and React Query structural sharing, the
   reconciling refetch renders as a local row update on every subscribed
   client.

### Broadcasts are metadata-only — never add entity payloads

`/ws/revalidation` is a shared broadcast channel delivered to ALL connected
clients. Carrying entity bodies (chat messages, orders, …) would leak private
data across users. Cross-client immediacy comes from the instant targeted
refetch, not from pushing data through the socket.

### Bump-before-broadcast ordering guarantee

`RevalidationMiddleware` MUST be registered BEFORE `HTTPCacheMiddleware` in
`apps/api/app.ts`. Hono unwinds post-`next()` code inner-first, so the inner
http-cache version bump (awaited for mutation methods) completes before the
outer revalidation broadcast. Otherwise another client's immediate refetch
could be served a stale cached response. This ordering is enforced by the
contract test in `apps/api/specs/singlepage/index.spec.ts`.

## Message Shape

WebSocket payload (`slug: "revalidation"`) includes:

- `payload` - route path (normalized, without query string)
- `topics` - semantic tags for targeted invalidation
- `createdAt`
- `expiresAt`

## Backend Side

Source:

- `libs/middlewares/src/lib/revalidation/index.ts` (this middleware)
- `libs/shared/utils/src/lib/topics/` (shared resolver + `singlepage.ts`
  framework-default rules + `startup.ts` project rules) — consumed by BOTH this
  middleware and http-cache, so the two middlewares never couple to each other

### 1. Route payloads

For each successful write request middleware emits:

- exact path (`normalizedPath`)
- path without trailing id (`pathWithoutLastId`)

### 2. Topics

Topics are resolved (by the shared `@sps/shared-utils` resolver) in two layers:

1. Topic rules — `topics/startup.ts` (project) before `topics/singlepage.ts`
   (framework defaults), template-based priority registry
2. generic `deriveTopicsFromPath` fallback from `*-module` path structure

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

## Canonical topic derivation (framework layer, issue #195)

One shared algorithm (`deriveTopicsFromPath` in `@sps/shared-utils`) is used by
THREE layers, making realtime precision symmetric by construction for any
model in any project built on the framework:

1. **This middleware** — derives mutation broadcast topics (explicit
   `topics/singlepage.ts` + `topics/startup.ts` rules win; derivation is the
   default).
2. **Frontend factory queries** — auto-derive `meta.topics` subscriptions from
   their read routes (`libs/shared/frontend/client/api/src/lib/factory`).
3. **HTTP-cache middleware** — derives per-topic cache versions: GET keys
   embed a topic-version vector, mutations bump their resolved topic versions
   (awaited, inside the bump-before-broadcast ordering contract), so nested
   reads are invalidated even when the mutation path cannot derive the read
   path.

### Shared resolver: broadcast topics == cache-bump topics (issue #195 F2)

Layers 1 and 3 do NOT call `deriveTopicsFromPath` independently — they share a
single resolver, `resolveTopicsForPath(path, rules)` in `@sps/shared-utils`
(explicit topic rules first, canonical derivation otherwise). The http-cache
bump uses the same compiled framework rule set (`defaultCompiledTopicRules`),
so both middlewares depend only on the shared primitive — never on each other.
This guarantees the WS broadcast and the cache-version bump compute IDENTICAL
topics: a project
topic rule can never make the two diverge and serve a cached read stale while
the broadcast announces a change.

Derived topics per path: `module.collection`, `module.collection.{id}` (when
the terminal id is present), and one scoped chain per ancestor-with-id
(`social.threads.{tid}.messages`). Bare ancestor entity topics
(`social.chats.{cid}` for a message mutation) are intentionally NEVER derived —
that class made child mutations rerender parent pages; parents opt in via
explicit rules only.

Both URL shapes reduce to the same canonical space:
`/api/<module>/<collection>...` and `/api/.../<name>-module/<chain...>`.

## How a project extends the realtime layer (no fork required)

Both middlewares accept constructor options — register project-specific rules
where the middlewares are constructed (`apps/api/app.ts`):

```ts
const revalidationMiddleware = new RevalidationMiddleware({
  // Evaluated BEFORE framework defaults; `stop: true` overrides them.
  topicRules: [
    {
      routeTemplate: "/api/rbac/subjects/[rbac.subjects.id]/crm-module/boards/[crm.boards.id]/cards",
      topics: ["crm.boards.[crm.boards.id].cards", "crm.cards"],
      stop: true,
    },
  ],
  notRevalidatingRoutes: [{ regexPath: /\/api\/custom\/webhooks/, methods: ["POST"] }],
});

const httpCacheMiddleware = new HTTPCacheMiddleware({
  // For reads that no mutation path/topic can describe (custom aggregates).
  excludedPathPatterns: [/^\/api\/crm\/boards\/[0-9a-f-]+\/burndown$/i],
});
```

When to add an explicit topic rule instead of relying on derivation:

- custom action / RPC routes whose terminal segment is a VERB, not a collection.
  The deriver cannot tell verbs from collections, so `.../orders/checkout`
  derives `ecommerce.checkout` and `.../messages/[id]/react-by/openrouter`
  derives `social.openrouter` — literal topics no reader subscribes to. The
  framework now SHIPS rules for its own action endpoints (the AI-reaction and
  ecommerce-checkout routes) in `@sps/shared-utils` `topics/singlepage.ts`
  (issue #195 F3); project action endpoints add their own rule in
  `topics/startup.ts` or via the constructor. More-specific action rules MUST
  precede the
  collection rule they share a prefix with (rules are prefix-matched);
- deliberate parent invalidation (e.g. a chat list ordered by last message
  registers a rule adding `social.chats.[social.chats.id]` to message
  mutations);
- aggregate reads (counters) — prefer http-cache `excludedPathPatterns`.

## How to add a new domain rule

1. Add a template rule to `@sps/shared-utils` `topics/singlepage.ts` (framework
   default) or `topics/startup.ts` (project), or pass it via the constructor
   options (project extension).
2. Hand-written SDK queries add `meta.topics`; factory queries derive them
   automatically.
3. Keep legacy behavior until all important queries are topic-aware.
4. Verify no route-name collisions and no duplicate listener registrations.
