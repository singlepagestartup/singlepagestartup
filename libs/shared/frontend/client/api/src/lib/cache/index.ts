"use client";

import { QueryClient, replaceEqualDeep } from "@tanstack/react-query";

type WithId = { id: string };

/**
 * Returns true when the query key carries any serialized params. Any non-empty
 * params can change membership, sort order, pagination, search, or projection,
 * so blind append is only safe for param-less list queries.
 */
function hasMeaningfulParams(serializedParams: unknown): boolean {
  if (typeof serializedParams !== "string") {
    return false;
  }

  return serializedParams.trim().length > 0;
}

/**
 * Appends an item to all list queries whose key starts with [route].
 *
 * Safety rules (prefix mode, default):
 * - Queries with any serialized params receive a targeted `invalidateQueries`
 *   instead of an append - the new item may not satisfy the query, may belong
 *   at an unknown sorted position, or would break page boundaries.
 * - Param-less queries receive a safe append with id-based deduplication: if
 *   the item already exists it is patched rather than duplicated.
 * - Non-array cached data is skipped gracefully.
 *
 * Exact mode (opts.exact = true):
 * - `route` is treated as the full first key element (e.g. a hand-written SDK
 *   chat URL); param-safety rules are bypassed because the caller owns the key
 *   semantics.
 */
export function appendToListQueries<T extends WithId>(
  queryClient: QueryClient,
  route: string,
  item: T,
  opts?: { exact?: boolean },
): void {
  if (opts?.exact) {
    queryClient.setQueryData<T[]>([route], (old) => {
      if (!Array.isArray(old)) return old;
      const idx = old.findIndex((i) => i.id === item.id);
      if (idx !== -1) {
        // Upsert of an existing item: only break reference stability when the
        // merged item actually differs. On the append-after-refetch race the
        // item is already present and unchanged, so returning `old` avoids an
        // extra list rerender (matches patch/remove no-op behavior).
        const merged = { ...old[idx], ...item };
        const dedupedMerged = replaceEqualDeep(old[idx], merged);
        if (dedupedMerged === old[idx]) return old;
        const next = [...old];
        next[idx] = dedupedMerged;
        return next;
      }
      return [...old, item];
    });
    return;
  }

  const matchingQueries = queryClient
    .getQueryCache()
    .findAll({ queryKey: [route] });

  for (const query of matchingQueries) {
    const key = query.queryKey as unknown[];
    const serializedParams = key[1];

    if (hasMeaningfulParams(serializedParams)) {
      // Targeted immediate invalidation - do not await (fire-and-forget is fine
      // for cache invalidation; the component will refetch on next render).
      void queryClient.invalidateQueries({ queryKey: key });
      continue;
    }

    queryClient.setQueryData<T[]>(key, (old) => {
      if (!Array.isArray(old)) return old;
      const idx = old.findIndex((i) => i.id === item.id);
      if (idx !== -1) {
        // Upsert of an existing item: only break reference stability when the
        // merged item actually differs. On the append-after-refetch race the
        // item is already present and unchanged, so returning `old` avoids an
        // extra list rerender (matches patch/remove no-op behavior).
        const merged = { ...old[idx], ...item };
        const dedupedMerged = replaceEqualDeep(old[idx], merged);
        if (dedupedMerged === old[idx]) return old;
        const next = [...old];
        next[idx] = dedupedMerged;
        return next;
      }
      return [...old, item];
    });
  }
}

/**
 * Shallow-patches the item identified by `id` across all list queries whose
 * key starts with [route].
 *
 * - No-op when the item is absent in a given query (safe for filtered lists).
 * - Returns the original array reference when nothing matched so that React
 *   Query structural sharing is preserved and unaffected queries do not
 *   schedule a rerender.
 * - Non-array cached data is skipped gracefully.
 */
export function patchInListQueries<T extends WithId>(
  queryClient: QueryClient,
  route: string,
  id: string,
  patch: Partial<T>,
): void {
  const matchingQueries = queryClient
    .getQueryCache()
    .findAll({ queryKey: [route] });

  for (const query of matchingQueries) {
    const key = query.queryKey as unknown[];
    queryClient.setQueryData<T[]>(key, (old) => {
      if (!Array.isArray(old)) return old;
      let changed = false;
      const next = old.map((item) => {
        if (item.id === id) {
          changed = true;
          return { ...item, ...patch };
        }
        return item;
      });
      return changed ? next : old; // preserve original reference on no match
    });
  }
}

/**
 * Removes the item identified by `id` from all list queries whose key starts
 * with [route].
 *
 * - Returns the original array reference when the item is absent so that
 *   unaffected queries do not rerender (React Query structural sharing).
 * - Non-array cached data is skipped gracefully.
 */
export function removeFromListQueries(
  queryClient: QueryClient,
  route: string,
  id: string,
): void {
  const matchingQueries = queryClient
    .getQueryCache()
    .findAll({ queryKey: [route] });

  for (const query of matchingQueries) {
    const key = query.queryKey as unknown[];
    queryClient.setQueryData<WithId[]>(key, (old) => {
      if (!Array.isArray(old)) return old;
      const exists = old.some((item) => item.id === id);
      if (!exists) return old; // preserve reference - structural sharing
      return old.filter((item) => item.id !== id);
    });
  }
}
