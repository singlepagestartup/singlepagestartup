import { getDrizzle } from "@sps/shared-backend-database-config";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { getTableColumns, sql } from "drizzle-orm";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import {
  CONSISTENCY_COLLECTION_SHARDS,
  CONSISTENCY_MAX_DEPENDENCIES,
  API_SERVICE_URL,
  observeConsistencyResponses,
  observeMemoryCache,
  invalidateMemoryCacheEntries,
} from "@sps/shared-utils";
import { ConsistencyStore } from "@sps/providers-db";

export interface IConsistencyReadContext {
  dependencies: Map<string, string>;
  resources: Set<string>;
  collections?: Map<string, string>;
  complete: boolean;
  database?: any;
  isCovered: (resource: string) => Promise<boolean>;
}

export const consistencyContext =
  new AsyncLocalStorage<IConsistencyReadContext>();

const memorySnapshot = Symbol("consistency.reads");
interface IMemorySnapshot {
  dependencies: [string, string][];
  collections: [string, string][];
  complete: boolean;
}
observeMemoryCache(({ type, metadata }) => {
  const context = consistencyContext.getStore();
  if (!context) return;
  if (type === "validate") {
    const snapshot = metadata.get(memorySnapshot) as
      | IMemorySnapshot
      | undefined;
    if (!snapshot?.complete) return false;
    return new ConsistencyStore()
      .versions(snapshot.dependencies.map(([key]) => key))
      .then((versions) =>
        snapshot.dependencies.every(([key, v]) => versions[key] === v),
      )
      .catch(() => false);
  }
  if (type === "set")
    metadata.set(memorySnapshot, {
      dependencies: [...context.dependencies],
      collections: [...(context.collections || [])],
      complete: context.complete,
    } satisfies IMemorySnapshot);
  else {
    const snapshot = metadata.get(memorySnapshot) as
      | IMemorySnapshot
      | undefined;
    if (!snapshot) {
      context.complete = false;
      return;
    }
    if (!snapshot.complete) context.complete = false;
    context.collections ||= new Map();
    for (const [key, version] of snapshot.collections || []) {
      const previous = context.collections.get(key);
      if (previous === undefined || BigInt(previous) > BigInt(version))
        context.collections.set(key, version);
    }
    for (const [key, version] of snapshot.dependencies) {
      const previous = context.dependencies.get(key);
      if (previous === undefined || BigInt(previous) > BigInt(version))
        context.dependencies.set(key, version);
      context.resources.add(key.split("|")[0]);
    }
  }
  return undefined;
});
export function invalidateConsistencyMemory(keys: string[]) {
  const changed = new Set(keys);
  invalidateMemoryCacheEntries((metadata) => {
    const snapshot = metadata.get(memorySnapshot) as
      | IMemorySnapshot
      | undefined;
    return (
      !!snapshot &&
      (!snapshot.complete ||
        snapshot.dependencies.some(([key]) => changed.has(key)))
    );
  });
}

observeConsistencyResponses(async ({ url, metadata }) => {
  const context = consistencyContext.getStore();
  if (
    !context ||
    !url ||
    !API_SERVICE_URL ||
    new URL(url).origin !== new URL(API_SERVICE_URL).origin
  )
    return;
  if (!metadata) {
    context.complete = false;
    return;
  }
  let descriptor:
    | {
        dependencies: Record<string, string>;
        collections: Record<string, string>;
      }
    | undefined;
  try {
    descriptor = await new ConsistencyStore().readDependencies(metadata.ref);
  } catch {
    context.complete = false;
    return;
  }
  if (!descriptor) {
    context.complete = false;
    return;
  }
  for (const [key, version] of Object.entries(descriptor.dependencies)) {
    const previous = context.dependencies.get(key);
    if (previous === undefined || BigInt(previous) > BigInt(version))
      context.dependencies.set(key, version);
    context.resources.add(key.split("|")[0]);
  }
  context.collections ||= new Map();
  for (const [key, version] of Object.entries(descriptor.collections)) {
    const previous = context.collections.get(key);
    if (previous === undefined || BigInt(previous) > BigInt(version))
      context.collections.set(key, version);
  }
  compactDependencies(context);
});
export const resourceIdentity = (table: PgTable) => {
  const config = getTableConfig(table);
  return `${config.schema || "public"}.${config.name}`;
};
export const collectionDependencyKeys = (resource: string) =>
  Array.from(
    { length: CONSISTENCY_COLLECTION_SHARDS },
    (_, i) => `${resource}|*|${i}`,
  );
export const scopeDependencyKey = (
  resource: string,
  column: string,
  value: string,
) =>
  `${resource}|${column}|${createHash("sha256").update(value).digest("hex")}`;

export function readDependencyKeys(
  table: PgTable,
  filters?: { and?: { column: string; method: string; value: unknown }[] },
) {
  const resource = resourceIdentity(table);
  if (
    filters?.and?.some(
      (filter) =>
        filter.method === "inArray" &&
        Array.isArray(filter.value) &&
        filter.value.length === 0,
    )
  )
    return [];
  const columns = getTableColumns(table);
  const candidates: string[][] = [];
  for (const filter of filters?.and || []) {
    const column = columns[filter.column];
    if (
      !column ||
      column.columnType !== "PgUUID" ||
      !["eq", "inArray"].includes(filter.method)
    )
      continue;
    const raw =
      filter.method === "eq"
        ? [filter.value]
        : Array.isArray(filter.value)
          ? filter.value
          : Object.values(filter.value || {});
    if (!raw.length || !raw.every((v) => typeof v === "string")) continue;
    const values = raw.map((value) => {
      const hex = String(value).toLowerCase().replace(/[{}-]/g, "");
      return /^[a-f0-9]{32}$/.test(hex)
        ? `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
        : undefined;
    });
    if (values.some((value) => value === undefined)) continue;
    candidates.push(
      values.map((value) => scopeDependencyKey(resource, column.name, value!)),
    );
  }
  const scope = candidates.sort((a, b) => a.length - b.length)[0];
  return [
    ...new Set([
      `${resource}|reset`,
      ...(scope?.length && scope.length < CONSISTENCY_MAX_DEPENDENCIES
        ? scope
        : collectionDependencyKeys(resource)),
    ]),
  ];
}

/** Call before SQL, including queries returning no rows. No business graph. */
export async function trackRepositoryRead(
  table: PgTable,
  database: any,
  filters?: Parameters<typeof readDependencyKeys>[1],
) {
  const context = consistencyContext.getStore();
  if (!context) return;
  const keys = readDependencyKeys(table, filters);
  if (!keys.length) return;
  const resource = resourceIdentity(table);
  context.resources.add(resource);
  if (!(await context.isCovered(resource))) {
    context.complete = false;
    return;
  }
  context.collections ||= new Map();
  const baseline = collectionDependencyKeys(resource);
  const first = !context.collections.has(baseline[0]);
  const missing = [
    ...new Set([
      ...keys.filter((key) => !context.dependencies.has(key)),
      ...(first ? baseline : []),
    ]),
  ];
  if (!missing.length) return;
  // Use this repository's transaction/snapshot, not a separate pooled read.
  let rows: any;
  try {
    rows = await database.execute(
      sql`SELECT key,version::text AS version FROM sps_consistency.generation WHERE key=ANY(${sql.param(missing)}::text[])`,
    );
  } catch {
    context.complete = false;
    return;
  }
  for (const key of missing) {
    const version = String(
      rows.find((row: any) => row.key === key)?.version || "0",
    );
    if (baseline.includes(key) && first) context.collections.set(key, version);
    if (keys.includes(key)) context.dependencies.set(key, version);
  }
  compactDependencies(context);
}

/** Collapse only to the collection snapshot observed before the first read. */
export function compactDependencies(context: IConsistencyReadContext) {
  if (context.dependencies.size <= CONSISTENCY_MAX_DEPENDENCIES) return;
  const resources = [...context.resources].sort(
    (a, b) =>
      [...context.dependencies.keys()].filter((k) => k.startsWith(b + "|"))
        .length -
      [...context.dependencies.keys()].filter((k) => k.startsWith(a + "|"))
        .length,
  );
  for (const resource of resources) {
    const fallback = collectionDependencyKeys(resource);
    const current = [...context.dependencies.keys()].filter(
      (key) => key.startsWith(resource + "|") && !key.endsWith("|reset"),
    );
    if (
      current.length <= fallback.length ||
      !fallback.every((key) => context.collections?.has(key))
    )
      continue;
    current.forEach((key) => context.dependencies.delete(key));
    fallback.forEach((key) =>
      context.dependencies.set(key, context.collections!.get(key)!),
    );
    if (context.dependencies.size <= CONSISTENCY_MAX_DEPENDENCIES) return;
  }
  context.complete = false; // More than the bounded number of distinct resources.
}

export function withConsistencyDatabase<T>(
  database: any,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = consistencyContext.getStore();
  if (!previous)
    return consistencyContext.run(
      {
        dependencies: new Map(),
        resources: new Set(),
        complete: true,
        isCovered: async () => false,
        database,
      },
      operation,
    );
  previous.collections ||= new Map();
  const scope = { ...previous, database };
  return consistencyContext.run(scope, async () => {
    try {
      return await operation();
    } finally {
      if (!scope.complete) previous.complete = false;
    }
  });
}

export function withConsistencySnapshot<T>(
  operation: () => Promise<T>,
): Promise<T> {
  if (consistencyContext.getStore()?.database) return operation();
  return getDrizzle({}).transaction(
    (tx) => withConsistencyDatabase(tx, operation),
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
