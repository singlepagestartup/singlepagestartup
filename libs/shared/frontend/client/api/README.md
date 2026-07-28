# Client API

A library for managing API requests in the SinglePageStartup (SPS) application. Built on top of TanStack Query (React Query) and provides a factory pattern for creating API clients with built-in caching, error handling, and request tracking.

## Why This Approach

- Factory-based SDK hooks keep query keys and request behavior consistent across all modules.
- Revalidation is centralized in one subscription pipeline instead of ad-hoc invalidation in components.
- Hybrid invalidation (topics + route fallback) allows gradual migration:
  - new flows can use precise topic tags,
  - legacy flows continue to work through route matching.
- Segment-boundary route matching prevents false positives between similarly named endpoints.

## Structure

```
src/
├── lib/
│   ├── cache/            # Shared list-cache patch helpers (issue #195)
│   ├── factory/          # API client factory
│   │   ├── mutations/    # Mutation operations
│   │   ├── queries/      # Query operations
│   │   └── index.ts      # Factory implementation
│   ├── provider/         # React Query provider
│   └── request-limmiter/ # Request rate limiting
```

## Core Components

### Factory

The factory creates API clients with built-in operations. Here's how it's used in the project:

```typescript
// Example from libs/modules/website-builder/models/button/sdk/client/src/lib/singlepage.ts
"use client";

import { IModel, route, clientHost, query, options } from "@sps/website-builder/models/button/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export type IProps = {};

export type IResult = {};

export const api = factory<IModel>({
  queryClient,
  route,
  host: clientHost,
  params: query,
  options,
});
```

### Realtime Query Subscription Contract (`meta.topics`)

How a **query** receives live updates (the read side; the mutation/cache
contracts below are the write side). Two cooperating pieces:

1. `subscription(queryKey, queryClient)` — called in a `useEffect` with cleanup,
   registers the store listener that turns a WebSocket revalidation broadcast
   into a React Query invalidation for this route.
2. `meta.topics` — the realtime topics this query subscribes to. When a mutation
   broadcasts a topic, `invalidateByTopics` invalidates every query whose
   `meta.topics` intersect it, and React Query refetches it.

Topic shape: `<module>.<collection>` where `collection` is the route segment
(usually the plural model/relation name) — e.g. `ecommerce.orders`,
`social.messages` — plus ancestor-scoped chains
`<module>.<ancestor>.<ancestorId>.<collection>`. Topics come from the single
shared `deriveTopicsFromPath` in `@sps/shared-utils` — the SAME algorithm the
backend uses to broadcast — so a read matches the mutations that affect it by
construction.

**Factory queries — automatic, nothing to declare.** `factory().find` /
`findById` / `count` derive `meta.topics` from their route via
`deriveTopicsFromPath`. Every factory-based model/relation SDK gets realtime for
free.

**Hand-written SDK queries — explicit and REQUIRED.** A query written with
`useQuery` directly (not through the factory) MUST declare `meta.topics`, or it
silently stops updating: the subscription pipeline disables the legacy
route-fallback as soon as ANY query on the page carries matching topics, so a
topic-less query is never invalidated (this was the cart-badge regression). Two
cases:

- **Collection-shaped route** → derive, never hardcode:

  ```ts
  meta: { topics: deriveTopicsFromPath(queryKey), ...(userMeta ?? {}) }
  ```

  This matches the backend topics automatically and never drifts as routes
  change.

- **Aggregate / RPC route** (`/orders/quantity`, `/orders/total`, `/checkout`,
  `/react-by/openrouter`) → the canonical deriver would emit a topic no mutation
  broadcasts (`ecommerce.quantity`, `social.openrouter`). Subscribe to the real
  collection topic the readers share, and add a matching backend topic rule:

  ```ts
  meta: { topics: ["ecommerce.orders"], ...(userMeta ?? {}) }
  ```

  Action/RPC endpoints are mapped to their real reader topics by the framework
  topic rules in `@sps/shared-utils` `lib/topics/singlepage.ts` (framework
  defaults) and `lib/topics/startup.ts` (project layer) — see the Revalidation
  Contract.

**Never let caller `meta` clobber `topics`.** Merge a caller-supplied `meta`
INTO the topics object; never spread `reactQueryOptions` over the whole `meta`:

```ts
const { meta: userMeta, ...restReactQueryOptions } = props.reactQueryOptions ?? {};

useQuery({
  queryKey: [queryKey],
  meta: { topics: deriveTopicsFromPath(queryKey), ...(userMeta ?? {}) },
  // ...
  ...restReactQueryOptions, // must NOT re-introduce `meta`
});
```

An explicit caller `meta.topics` still wins (spread last); any other caller meta
is preserved; the default topic subscription survives.

### Cache Helpers (Targeted List Patching)

`src/lib/cache/index.ts` provides in-place React Query list patching so that
mutations render as local row updates instead of full-list refetches:

- `appendToListQueries(queryClient, route, item, opts?)`
- `patchInListQueries(queryClient, route, id, patch)`
- `removeFromListQueries(queryClient, route, id)`

Key modes:

- **Prefix mode (default)** — `route` matches all query keys starting with
  `[route]`, covering both factory keys (`[route, serializedParams]`) and
  one-element URL keys.
- **Exact mode** (`opts.exact = true`, append only) — `route` is the full
  first key element; used by hand-written SDKs (e.g. chat) that own their key
  semantics.

Safety rules:

- **Append**: only into param-less list queries. Any query whose key carries
  serialized params (filters, ordering, pagination, search, …) gets a targeted
  `invalidateQueries` instead — the new item may not match the filter, belongs
  at an unknown sort position, or would break page boundaries. Appends
  deduplicate by `id` (existing item is patched, not duplicated).
- **Patch / Remove**: safe everywhere — they no-op (returning the original
  array reference) when the item is absent, so filtered lists and unrelated
  queries never rerender.
- Non-array cached data is skipped gracefully.
- Structural sharing is preserved: untouched items keep their object
  references, which keeps memoized rows from rerendering.

### Factory Mutation Cache Contract

Factory `create`/`update`/`delete` mutations run **internal cache handling
first, then the caller's `reactQueryOptions.onSuccess`** (merged, not
replaced — full React Query v5 callback args are forwarded):

- `create` → `appendToListQueries` for the route + invalidate `route/count`
  queries.
- `update` → `patchInListQueries` by the returned `id` + patch the
  `route/<id>` findById cache.
- `delete` → `removeFromListQueries` by the deleted `id` + remove the
  `route/<id>` entry + invalidate `route/count`; falls back to targeted route
  invalidation when the response has no usable `id`.

WebSocket revalidation (see the Revalidation Contract below) stays enabled as
the background consistency guarantee: when the local patch matches the server
response, the reconciling refetch produces deep-equal data and no rerender.

### Hand-Written SDK Mutation Contract

Hand-written SDK mutations (files using `useMutation` directly instead of the
factory) MUST preserve the same two-tier behavior in their success handling:

1. keep the SDK-level `globalActionsStore` push so WebSocket revalidation stays
   the background consistency fallback,
2. patch the acting client's cache via the shared helpers (exact-key mode when
   the read query key cannot be derived from the mutation route),
3. call any consumer-specific success callback after the internal handling.

Reference implementation: the chat thread messages cache —
`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-thread-messages-refetch.ts`
(returns `{ refetch, append, patch, remove }`; mutations call `append`/`patch`/
`remove` on success and `refetch` on error or for server-created data such as
AI replies).

### Request Limiter

Rate limiting for API requests:

```typescript
import { requestLimiter } from "@sps/shared-frontend-client-api";

// Configure rate limiting
requestLimiter.configure({
  maxRequests: 100,
  timeWindow: 1000 * 60, // 1 minute
});
```

## Features

- Built on TanStack Query for efficient caching and state management
- Automatic request tracking and logging
- Rate limiting support
- Type-safe API operations
- Built-in error handling
- Configurable stale time and caching
- Support for both REST and GraphQL operations
- Automatic request deduplication
- Request/response interceptors
- Cross-tab synchronization

## Notes

- All requests are automatically tracked in the global actions store
- Supports both client-side and server-side rendering
- Includes built-in retry logic for failed requests
- Provides hooks for loading and error states
- Supports custom headers and authentication

## Revalidation Contract

Realtime invalidation contract (WebSocket + React Query) is documented in:

- `libs/middlewares/src/lib/revalidation/README.md`

## Testing

The library uses Jest for testing. Test configuration is located in `jest.config.ts`.

## License

MIT
