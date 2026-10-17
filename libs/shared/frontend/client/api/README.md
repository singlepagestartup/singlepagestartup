# Client API

The shared factory provides React Query SDK hooks, mutation patches and realtime
reconciliation. The standard Provider keeps API results in memory. It does not
restore entities or UI state from sessionStorage. `globalActionsStore` records
requests and compact consistency/legacy revalidation diagnostics; its sessionStorage snapshot is diagnostic.

## Queries

Factory `find`, `findById` and `count` use `consistencyQueryKey(route, params,
host)`. It serializes all parameters and separates API origins and authenticated
principals without putting credentials in keys. Hand-written migrated queries
use the same helper. Keep user query options and topic metadata when composing
hooks.

`responsePipe` publishes the successful response's consistency metadata beside
its normal typed result. `queryConsistency(queryClient)` associates the opaque
ref with the query matching that URL and origin. Factory hooks do not require
per-model dependency rules. The backend derives dependencies from actual
repository and tracked custom-SQL reads, including empty relations and counts.

Host owns one WebSocket connection. Its accepted, unexpired query refs receive
addressed invalidation and replay. A query without accepted coverage continues
to use `subscription(route, queryClient)` and `meta.topics`. Register legacy
subscriptions in useEffect and return their cleanup. Do not create a socket or
a periodic entity timer in a component.

Incoming invalidations coalesce while a fetch is running. A late initial result
cannot swallow a pending refresh. Unchanged JSON keeps structural sharing;
memoized rows can retain their props. A 401/403 reconciliation clears loaded
private data. A changed principal resets subscriptions, cursor and private query data. JWT
refresh for the same principal retains mounted data while reconciling queries.

The [transport contract](../../../../middlewares/src/lib/revalidation/README.md)
describes reconnect, lease renewal, retention and the shared 15-second fallback
version check. A healthy chat has no five-second messages poll.

## Mutations

Factory mutations run internal cache handling before the consumer's onSuccess,
with React Query v5 callback arguments:

- create appends/deduplicates an ID and invalidates count;
- update patches matching list records and detail entries;
- delete removes matching list/detail records and invalidates count.

Hand-written mutations keep action tracking, apply the shared cache helpers,
and then call the consumer callback. Preserve WebSocket reconciliation for
other clients, service writes and aggregate consequences.

The helpers are `appendToListQueries`, `patchInListQueries` and
`removeFromListQueries`. Append is limited to lists without filters, ordering or
pagination; an unknown membership receives targeted reconciliation. Patch and
remove affect only IDs already present. Untouched rows retain their references.
The optional exact append mode owns a one-element legacy key and must not be
used for a parameterized query.

Already loaded records pass to presentation components through
`dataSource="props"`. A constant queryFn would prevent reconciliation from
fetching current data. UI drafts and per-item pending state belong to their
mounted components, not the event store.

## Factory binding

```ts
import { factory, queryClient } from "@sps/shared-frontend-client-api";
import { clientHost, route, type IModel } from "@sps/social/models/message/sdk/model";

export const api = factory<IModel>({ queryClient, route, host: clientHost });
```

## Legacy query contract

Keep `meta.topics` while old clients and uncovered operations are supported.
Factory queries derive their collection topics; hand-written aggregates retain
their existing topic set. Merge caller metadata without silently dropping those
topics. Topic invalidation skips only a query with accepted consistency coverage,
not the whole page. Route fallback uses segment boundaries, so `/profiles` does
not match `/profiles-to-messages`.

## Checks

Run `npx nx run @sps/shared-frontend-client-api:jest:test`. The suites cover
mutation patches, subscription fallback, unrelated queries, initial-fetch races,
burst coalescing, structural sharing and clearing data after access loss.
