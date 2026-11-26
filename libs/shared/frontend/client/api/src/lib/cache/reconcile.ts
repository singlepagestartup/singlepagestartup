import type { Query, QueryClient, QueryFilters } from "@tanstack/react-query";

interface IPendingReconciliation {
  again: boolean;
  promise: Promise<void>;
}

const pending = new WeakMap<Query, IPendingReconciliation>();

/** A read started before an invalidation can still return an older snapshot. */
export function reconcileQuery(
  client: QueryClient,
  query: Query,
): Promise<void> {
  const cache = client.getQueryCache();
  if (cache.get(query.queryHash) !== query) {
    return Promise.resolve();
  }
  const previous = pending.get(query);
  if (previous) {
    previous.again = true;
    return previous.promise;
  }

  const state = { again: false, promise: Promise.resolve() };
  pending.set(query, state);
  state.promise = Promise.resolve().then(async () => {
    try {
      do {
        if (query.state.fetchStatus === "fetching") {
          await query.promise?.catch(() => undefined);
        }
        if (cache.get(query.queryHash) !== query) {
          return;
        }

        // Every event received before this read starts is covered by this read.
        state.again = false;
        await client.invalidateQueries(
          { queryKey: query.queryKey, exact: true, refetchType: "active" },
          { cancelRefetch: false },
        );
      } while (state.again);
    } finally {
      pending.delete(query);
    }
  });
  query.invalidate();
  return state.promise;
}

export async function reconcileQueries(
  client: QueryClient,
  filters: QueryFilters,
): Promise<void> {
  await Promise.all(
    client
      .getQueryCache()
      .findAll(filters)
      .map((query) => reconcileQuery(client, query)),
  );
}
