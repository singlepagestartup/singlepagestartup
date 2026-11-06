import { pgTable, uuid, integer, text } from "drizzle-orm/pg-core";
jest.mock("@sps/providers-db", () => ({ ConsistencyStore: jest.fn() }));
import { createMemoryCache } from "@sps/shared-utils";
import {
  consistencyContext,
  readDependencyKeys,
  scopeDependencyKey,
  trackRepositoryRead,
  invalidateConsistencyMemory,
  withConsistencyDatabase,
  type IConsistencyReadContext,
} from "./context";

const table = pgTable("context_messages", {
  id: uuid("id"),
  threadId: uuid("td_id"),
  title: text("title"),
  count: integer("count"),
});
const thread = "A4A97BA0-67F8-439E-BD73-425F3C020EA9";
const context = (): IConsistencyReadContext => ({
  dependencies: new Map(),
  resources: new Set(),
  complete: true,
  isCovered: async () => true,
});

describe("automatic repository dependencies", () => {
  it("derives a physical equality scope from the existing Table", () => {
    expect(
      readDependencyKeys(table, {
        and: [{ column: "threadId", method: "eq", value: thread }],
      }),
    ).toEqual([
      "public.context_messages|reset",
      scopeDependencyKey(
        "public.context_messages",
        "td_id",
        thread.toLowerCase(),
      ),
    ]);
  });
  it("uses an AND equality scope without reproducing SQL predicates", () => {
    expect(
      readDependencyKeys(table, {
        and: [
          { column: "title", method: "ilike", value: "test" },
          { column: "threadId", method: "eq", value: thread },
        ],
      }),
    ).toHaveLength(2);
  });
  it("conservatively tracks collection candidates for range/count/top-K", () => {
    expect(
      readDependencyKeys(table, {
        and: [{ column: "count", method: "gte", value: 4 }],
      }),
    ).toHaveLength(17);
  });
  it("does not subscribe a literal empty IN predicate to a collection", () => {
    expect(
      readDependencyKeys(table, {
        and: [{ column: "id", method: "inArray", value: [] }],
      }),
    ).toEqual([]);
  });
  it("collapses a large descriptor using its earliest collection snapshot", async () => {
    const scope = context();
    await consistencyContext.run(scope, async () => {
      for (let i = 0; i < 270; i++)
        await trackRepositoryRead(
          table,
          { execute: async () => [] },
          {
            and: [
              {
                column: "id",
                method: "eq",
                value: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
              },
            ],
          },
        );
    });
    expect(scope.complete).toBe(true);
    expect(scope.dependencies.size).toBeLessThanOrEqual(256);
    expect([...scope.dependencies.keys()]).toContain(
      "public.context_messages|*|0",
    );
  });
  it("propagates incomplete child/savepoint reads without changing another operation's DB", async () => {
    const scope = context();
    const tx = { transaction: "one" };
    await consistencyContext.run(scope, () =>
      withConsistencyDatabase(tx, async () => {
        expect(consistencyContext.getStore()?.database).toBe(tx);
        consistencyContext.getStore()!.complete = false;
      }),
    );
    expect(scope.complete).toBe(false);
    expect(scope.database).toBeUndefined();
  });
  it("records membership even when a read has no results", async () => {
    const scope = context();
    const db = { execute: jest.fn(async () => []) };
    await consistencyContext.run(scope, () =>
      trackRepositoryRead(table, db, {
        and: [{ column: "threadId", method: "eq", value: thread }],
      }),
    );
    expect(scope.dependencies.size).toBe(2);
    expect([...scope.dependencies.values()]).toEqual(["0", "0"]);
  });
  it("does not mix concurrent operation scopes or overwrite an earlier observation", async () => {
    const a = context(),
      b = context();
    await Promise.all(
      [a, b].map((scope, i) =>
        consistencyContext.run(scope, async () => {
          await Promise.resolve();
          await trackRepositoryRead(
            table,
            { execute: async () => [] },
            {
              and: [
                {
                  column: "threadId",
                  method: "eq",
                  value: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
                },
              ],
            },
          );
        }),
      ),
    );
    expect([...a.dependencies.keys()]).not.toEqual([...b.dependencies.keys()]);
    expect(consistencyContext.getStore()).toBeUndefined();
  });
  it("propagates and invalidates dependencies through existing memory caches", async () => {
    const cache = createMemoryCache({ ttlMs: 10000 });
    const first = context();
    await consistencyContext.run(first, async () => {
      await trackRepositoryRead(
        table,
        { execute: async () => [] },
        { and: [{ column: "threadId", method: "eq", value: thread }] },
      );
      cache.set("permission", true);
    });
    const second = context();
    consistencyContext.run(second, () =>
      expect(cache.get("permission")).toBe(true),
    );
    expect(second.dependencies).toEqual(first.dependencies);
    invalidateConsistencyMemory([...first.dependencies.keys()]);
    expect(cache.get("permission")).toBeUndefined();
  });
});
