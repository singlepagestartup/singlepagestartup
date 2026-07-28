/**
 * BDD Suite: Cache helpers - appendToListQueries, patchInListQueries, removeFromListQueries.
 *
 * Given: a QueryClient pre-seeded with list queries under a shared route.
 * When: a cache helper is invoked with a target item and route.
 * Then: only the affected queries and items are mutated; structural sharing
 *       preserves original references for unchanged data.
 */

import { QueryClient } from "@tanstack/react-query";
import {
  appendToListQueries,
  patchInListQueries,
  removeFromListQueries,
} from "./index";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

type Item = { id: string; name: string };

const ROUTE = "/api/test/items";

function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function seed(qc: QueryClient, key: unknown[], data: Item[]): void {
  qc.setQueryData(key, data);
}

// ---------------------------------------------------------------------------
// appendToListQueries
// ---------------------------------------------------------------------------

describe("appendToListQueries", () => {
  /**
   * BDD Scenario: Append into a param-less list query.
   *
   * Given: a param-less list query `[route, undefined]` with one item.
   * When:  appendToListQueries is called with a new item.
   * Then:  the new item is appended to the list.
   */
  it("appends a new item into a param-less list query", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    const existing: Item = { id: "1", name: "Alice" };
    seed(qc, key, [existing]);

    const newItem: Item = { id: "2", name: "Bob" };
    appendToListQueries(qc, ROUTE, newItem);

    expect(qc.getQueryData(key)).toEqual([existing, newItem]);
  });

  /**
   * BDD Scenario: Deduplication - item with same id is patched, not duplicated.
   *
   * Given: a param-less list query containing item id="1".
   * When:  appendToListQueries is called with a newer version of id="1".
   * Then:  the existing entry is patched; the list length stays the same.
   */
  it("patches an existing item instead of duplicating when id matches", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    seed(qc, key, [{ id: "1", name: "Alice" }]);

    appendToListQueries(qc, ROUTE, { id: "1", name: "Alice Updated" });

    const result = qc.getQueryData<Item[]>(key);
    expect(result).toHaveLength(1);
    expect(result?.[0].name).toBe("Alice Updated");
  });

  /**
   * BDD Scenario: Upsert of an unchanged existing item preserves the array ref.
   *
   * Given: a param-less list query containing item id="1".
   * When:  appendToListQueries upserts an identical id="1" (append-after-refetch
   *        race where the item is already present and unchanged).
   * Then:  the original array reference is returned - no extra list rerender,
   *        matching patchInListQueries / removeFromListQueries no-op behavior.
   */
  it("preserves the array reference when an upsert does not change the item (prefix mode)", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    const original: Item[] = [{ id: "1", name: "Alice" }];
    seed(qc, key, original);

    appendToListQueries(qc, ROUTE, { id: "1", name: "Alice" });

    expect(qc.getQueryData(key)).toBe(original);
  });

  /**
   * BDD Scenario: Upsert of an unchanged existing item preserves the array ref
   * in exact mode.
   *
   * Given: an exact-key list query containing item id="1".
   * When:  appendToListQueries upserts an identical id="1" with exact = true.
   * Then:  the original array reference is returned unchanged.
   */
  it("preserves the array reference when an upsert does not change the item (exact mode)", () => {
    const qc = makeClient();
    const exactUrl = "/api/test/exact/messages";
    const key = [exactUrl];
    const original: Item[] = [{ id: "1", name: "Alice" }];
    seed(qc, key, original);

    appendToListQueries(
      qc,
      exactUrl,
      { id: "1", name: "Alice" },
      { exact: true },
    );

    expect(qc.getQueryData(key)).toBe(original);
  });

  /**
   * BDD Scenario: Upsert of a CHANGED existing item still returns a new array.
   *
   * Given: a param-less list query containing item id="1".
   * When:  appendToListQueries upserts a differing id="1".
   * Then:  a new array reference is produced and the item is patched.
   */
  it("returns a new array reference when an upsert changes the item (prefix mode)", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    const original: Item[] = [{ id: "1", name: "Alice" }];
    seed(qc, key, original);

    appendToListQueries(qc, ROUTE, { id: "1", name: "Alice Updated" });

    const result = qc.getQueryData<Item[]>(key);
    expect(result).not.toBe(original);
    expect(result).toHaveLength(1);
    expect(result?.[0].name).toBe("Alice Updated");
  });

  /**
   * BDD Scenario: Append into a query with filters -> targeted invalidation.
   *
   * Given: a list query with serialized `filters` in its key.
   * When:  appendToListQueries is called.
   * Then:  the query is marked stale (invalidated) rather than mutated.
   */
  it("invalidates (not appends) when params contain filters", async () => {
    const qc = makeClient();
    const key = [ROUTE, "filters%5B0%5D%5Bcolumn%5D=name"];
    const original: Item[] = [{ id: "1", name: "Alice" }];
    seed(qc, key, original);

    appendToListQueries(qc, ROUTE, { id: "2", name: "Bob" });

    // Data is unchanged immediately - invalidation schedules a refetch
    expect(qc.getQueryData(key)).toEqual(original);
    // Query is now stale
    const query = qc.getQueryCache().find({ queryKey: key });
    expect(query?.isStaleByTime(0)).toBe(true);
  });

  /**
   * BDD Scenario: Append into a query with orderBy -> targeted invalidation.
   *
   * Given: a list query with `orderBy` in its serialized params.
   * When:  appendToListQueries is called.
   * Then:  the query is invalidated, not mutated.
   */
  it("invalidates (not appends) when params contain orderBy", async () => {
    const qc = makeClient();
    const key = [ROUTE, "orderBy%5Band%5D%5B0%5D%5Bcolumn%5D=createdAt"];
    const original: Item[] = [{ id: "1", name: "Alice" }];
    seed(qc, key, original);

    appendToListQueries(qc, ROUTE, { id: "2", name: "Bob" });

    expect(qc.getQueryData(key)).toEqual(original);
    const query = qc.getQueryCache().find({ queryKey: key });
    expect(query?.isStaleByTime(0)).toBe(true);
  });

  /**
   * BDD Scenario: Append into a query with limit/pagination -> targeted invalidation.
   *
   * Given: a list query with `limit` and `offset` in its params.
   * When:  appendToListQueries is called.
   * Then:  the query is invalidated, not mutated.
   */
  it("invalidates (not appends) when params contain limit or offset", async () => {
    const qc = makeClient();
    const key = [ROUTE, "limit=10&offset=0"];
    const original: Item[] = [{ id: "1", name: "Alice" }];
    seed(qc, key, original);

    appendToListQueries(qc, ROUTE, { id: "2", name: "Bob" });

    expect(qc.getQueryData(key)).toEqual(original);
    const query = qc.getQueryCache().find({ queryKey: key });
    expect(query?.isStaleByTime(0)).toBe(true);
  });

  /**
   * BDD Scenario: Append into a query with pagination page param -> invalidation.
   *
   * Given: a list query with `page` in its params.
   * When:  appendToListQueries is called.
   * Then:  the query is invalidated, not mutated.
   */
  it("invalidates (not appends) when params contain page", async () => {
    const qc = makeClient();
    const key = [ROUTE, "page=2"];
    const original: Item[] = [{ id: "1", name: "Alice" }];
    seed(qc, key, original);

    appendToListQueries(qc, ROUTE, { id: "2", name: "Bob" });

    expect(qc.getQueryData(key)).toEqual(original);
    const query = qc.getQueryCache().find({ queryKey: key });
    expect(query?.isStaleByTime(0)).toBe(true);
  });

  /**
   * BDD Scenario: Append into a query with search param -> invalidation.
   *
   * Given: a list query with `search` in its params.
   * When:  appendToListQueries is called.
   * Then:  the query is invalidated, not mutated.
   */
  it("invalidates (not appends) when params contain search", async () => {
    const qc = makeClient();
    const key = [ROUTE, "search=alice"];
    const original: Item[] = [{ id: "1", name: "Alice" }];
    seed(qc, key, original);

    appendToListQueries(qc, ROUTE, { id: "2", name: "Bob" });

    expect(qc.getQueryData(key)).toEqual(original);
    const query = qc.getQueryCache().find({ queryKey: key });
    expect(query?.isStaleByTime(0)).toBe(true);
  });

  /**
   * BDD Scenario: Append into a query with custom params -> targeted invalidation.
   *
   * Given: a list query with arbitrary serialized params in its key.
   * When:  appendToListQueries is called.
   * Then:  the query is invalidated, not mutated, because the helper cannot
   *        prove the new item belongs in that list.
   */
  it("invalidates (not appends) when params contain any custom value", async () => {
    const qc = makeClient();
    const key = [ROUTE, "q=alice"];
    const original: Item[] = [{ id: "1", name: "Alice" }];
    seed(qc, key, original);

    appendToListQueries(qc, ROUTE, { id: "2", name: "Bob" });

    expect(qc.getQueryData(key)).toEqual(original);
    const query = qc.getQueryCache().find({ queryKey: key });
    expect(query?.isStaleByTime(0)).toBe(true);
  });

  /**
   * BDD Scenario: Exact-key mode bypasses param-safety and always appends.
   *
   * Given: a single-element URL query key (hand-written SDK style) with no
   *        second key slot.
   * When:  appendToListQueries is called with opts.exact = true.
   * Then:  the item is appended regardless of the URL contents.
   */
  it("appends in exact-key mode bypassing param-safety", () => {
    const exactUrl =
      "/api/rbac/subjects/abc/social-module/profiles/def/chats/ghi/threads/jkl/messages";
    const qc = makeClient();
    const key = [exactUrl];
    seed(qc, key, [{ id: "1", name: "msg-1" }]);

    appendToListQueries(
      qc,
      exactUrl,
      { id: "2", name: "msg-2" },
      { exact: true },
    );

    expect(qc.getQueryData<Item[]>(key)).toHaveLength(2);
  });

  /**
   * BDD Scenario: Non-array cached data is skipped gracefully.
   *
   * Given: a query whose cached value is a number (non-array).
   * When:  appendToListQueries is called.
   * Then:  the cached value is unchanged and no error is thrown.
   */
  it("skips non-array cached data gracefully", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    qc.setQueryData(key, 42);

    expect(() =>
      appendToListQueries(qc, ROUTE, { id: "1", name: "Alice" }),
    ).not.toThrow();

    expect(qc.getQueryData(key)).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// patchInListQueries
// ---------------------------------------------------------------------------

describe("patchInListQueries", () => {
  /**
   * BDD Scenario: Patch an existing item.
   *
   * Given: a list query with item id="1".
   * When:  patchInListQueries is called with a partial update for id="1".
   * Then:  only that item's fields are updated; others are untouched.
   */
  it("patches the item matching the id", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    const alice: Item = { id: "1", name: "Alice" };
    const bob: Item = { id: "2", name: "Bob" };
    seed(qc, key, [alice, bob]);

    patchInListQueries<Item>(qc, ROUTE, "1", { name: "Alice Updated" });

    const result = qc.getQueryData<Item[]>(key)!;
    expect(result[0]).toEqual({ id: "1", name: "Alice Updated" });
    expect(result[1]).toBe(bob); // reference preserved for unaffected item
  });

  /**
   * BDD Scenario: No-op when id is absent.
   *
   * Given: a list query that does not contain item id="99".
   * When:  patchInListQueries is called for id="99".
   * Then:  the array reference is unchanged (structural sharing preserved).
   */
  it("preserves the original array reference when id is absent", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    const original: Item[] = [{ id: "1", name: "Alice" }];
    seed(qc, key, original);

    patchInListQueries<Item>(qc, ROUTE, "99", { name: "Ghost" });

    expect(qc.getQueryData(key)).toBe(original);
  });

  /**
   * BDD Scenario: Structural sharing - unchanged items keep their references.
   *
   * Given: a list query with two items.
   * When:  one item is patched.
   * Then:  the other item keeps the exact same object reference.
   */
  it("preserves references of unpatched items (structural sharing)", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    const alice: Item = { id: "1", name: "Alice" };
    const bob: Item = { id: "2", name: "Bob" };
    seed(qc, key, [alice, bob]);

    patchInListQueries<Item>(qc, ROUTE, "1", { name: "Alice Updated" });

    const result = qc.getQueryData<Item[]>(key)!;
    expect(result[1]).toBe(bob); // bob is the same object in memory
  });

  /**
   * BDD Scenario: Non-array cached data is skipped gracefully.
   *
   * Given: a query whose cached value is a string.
   * When:  patchInListQueries is called.
   * Then:  no error is thrown and the value is unchanged.
   */
  it("skips non-array cached data gracefully", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    qc.setQueryData(key, "not-an-array");

    expect(() =>
      patchInListQueries<Item>(qc, ROUTE, "1", { name: "Alice" }),
    ).not.toThrow();

    expect(qc.getQueryData(key)).toBe("not-an-array");
  });
});

// ---------------------------------------------------------------------------
// removeFromListQueries
// ---------------------------------------------------------------------------

describe("removeFromListQueries", () => {
  /**
   * BDD Scenario: Remove an existing item.
   *
   * Given: a list query with item id="1" and id="2".
   * When:  removeFromListQueries is called for id="1".
   * Then:  id="1" is gone; id="2" remains with its original reference.
   */
  it("removes the item matching the id", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    const alice: Item = { id: "1", name: "Alice" };
    const bob: Item = { id: "2", name: "Bob" };
    seed(qc, key, [alice, bob]);

    removeFromListQueries(qc, ROUTE, "1");

    const result = qc.getQueryData<Item[]>(key)!;
    expect(result).toHaveLength(1);
    // bob's data is preserved (React Query structural sharing does not
    // guarantee reference equality for items that shift array positions)
    expect(result[0]).toStrictEqual(bob);
  });

  /**
   * BDD Scenario: No-op when id is absent - reference preserved.
   *
   * Given: a list query that does not contain item id="99".
   * When:  removeFromListQueries is called for id="99".
   * Then:  the original array reference is returned unchanged.
   */
  it("preserves the original array reference when id is absent", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    const original: Item[] = [{ id: "1", name: "Alice" }];
    seed(qc, key, original);

    removeFromListQueries(qc, ROUTE, "99");

    expect(qc.getQueryData(key)).toBe(original);
  });

  /**
   * BDD Scenario: Unaffected queries keep their references.
   *
   * Given: two distinct list queries - one with filters (does not contain the
   *        item), one without (contains the item).
   * When:  removeFromListQueries is called.
   * Then:  the filtered query's array reference is unchanged; the param-less
   *        query loses only the removed item.
   */
  it("preserves references on queries where item is absent (structural sharing across queries)", () => {
    const qc = makeClient();
    const paramlessKey = [ROUTE, undefined];
    const filteredKey = [ROUTE, "filters%5B0%5D=name"];
    const filteredData: Item[] = [{ id: "2", name: "Bob" }];

    seed(qc, paramlessKey, [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ]);
    seed(qc, filteredKey, filteredData);

    removeFromListQueries(qc, ROUTE, "1");

    // Param-less query lost "Alice"
    expect(qc.getQueryData<Item[]>(paramlessKey)).toHaveLength(1);
    // Filtered query's array ref is preserved (item "1" was not there)
    expect(qc.getQueryData(filteredKey)).toBe(filteredData);
  });

  /**
   * BDD Scenario: Non-array cached data is skipped gracefully.
   *
   * Given: a query whose cached value is null.
   * When:  removeFromListQueries is called.
   * Then:  no error is thrown.
   */
  it("skips non-array cached data gracefully", () => {
    const qc = makeClient();
    const key = [ROUTE, undefined];
    qc.setQueryData(key, null);

    expect(() => removeFromListQueries(qc, ROUTE, "1")).not.toThrow();
  });
});
