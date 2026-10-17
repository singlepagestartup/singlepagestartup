import { createHash } from "node:crypto";
import { ConsistencyStore } from "@sps/providers-db";
import { Provider as KVProvider } from "@sps/providers-kv";
import { createMiddleware } from "hono/factory";
import {
  CONSISTENCY_HEADER,
  KV_PROVIDER,
  HTTP_CACHE_MAX_ENTRY_BYTES,
  type IConsistencyDelivery,
} from "@sps/shared-utils";
import {
  consistencyContext,
  invalidateConsistencyMemory,
  compactDependencies,
  type IConsistencyReadContext,
} from "../repository/database/context";

export const consistencyAuth = (authorization: string) =>
  createHash("sha256")
    .update(authorization.replace(/^Bearer\s+/i, "").trim() || "anonymous")
    .digest("hex");
interface IConnection {
  send: (message: string) => void;
  close: () => void;
}
interface IClient {
  socket: IConnection;
  auth: string;
  authorization: string;
  refs: string[];
  cursor: string;
  epoch: string;
  heartbeat: number;
  busy: boolean;
}
export interface IConsistencyRuntimeProps {
  store?: ConsistencyStore;
  verifyAuthorization: (authorization: string) => Promise<void>;
  invalidateTags?: (tags: string[]) => Promise<void>;
  publishLegacy?: (topics: string[]) => Promise<void>;
}

export function createConsistencyRuntime(props: IConsistencyRuntimeProps) {
  const store = props.store || new ConsistencyStore();
  const clients = new Map<IConnection, IClient>();
  const coverage = new Map<string, Promise<boolean>>();
  let timer: ReturnType<typeof setInterval> | undefined;
  let busy = false;
  let lastError = "";
  let ticks = 0;
  let failures = 0;
  let retryAt = 0;
  let stopped = false;
  const unlisten: (() => Promise<void>)[] = [];
  const subscriptions = new WeakMap<IConnection, Promise<unknown>>();
  let legacyCursor: string | undefined;
  const queryRequests = new Map<string, number>();
  const metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    shadowMatches: 0,
    shadowMismatches: 0,
    shadowRaces: 0,
    dispatchFailures: 0,
    clientFailures: 0,
    deliveredRefs: 0,
  };
  async function disposable<T>(
    operation: () => Promise<T>,
  ): Promise<T | undefined> {
    let timeout: ReturnType<typeof setTimeout>;
    try {
      return await Promise.race([
        operation(),
        new Promise<undefined>((resolve) => {
          timeout = setTimeout(() => resolve(undefined), 150);
        }),
      ]);
    } catch {
      return undefined;
    } finally {
      clearTimeout(timeout!);
    }
  }
  const send = (client: IClient, payload: IConsistencyDelivery) => {
    if (payload.type === "invalidate" || payload.type === "resync")
      metrics.deliveredRefs += payload.refs?.length || 0;
    client.socket.send(JSON.stringify(payload));
  };
  async function pumpClient(client: IClient) {
    if (client.busy) return;
    client.busy = true;
    try {
      if (Date.now() - client.heartbeat >= 15000) {
        try {
          await props.verifyAuthorization(client.authorization);
        } catch {
          clients.delete(client.socket);
          client.socket.close();
          return;
        }
      }
      const status = await store.status();
      if (
        client.epoch !== status.epoch ||
        BigInt(client.cursor) > BigInt(status.cursor) ||
        (BigInt(client.cursor) < BigInt(status.oldest) && client.cursor !== "0")
      ) {
        send(client, {
          protocol: 1,
          type: "resync",
          epoch: status.epoch,
          cursor: status.cursor,
          refs: client.refs,
        });
        client.cursor = status.cursor;
        client.epoch = status.epoch;
        return;
      }
      const queries = await store.queries(client.refs, client.auth);
      const missing = client.refs.filter(
        (ref) => !queries.some((q) => q.ref === ref),
      );
      if (missing.length) {
        send(client, {
          protocol: 1,
          type: "resync",
          epoch: status.epoch,
          cursor: client.cursor,
          refs: missing,
        });
        client.refs = client.refs.filter((ref) => !missing.includes(ref));
      }
      const events = await store.events(client.cursor);
      if (events.length) {
        const changed = queries
          .filter((q) =>
            events.some((event) =>
              event.keys.some(
                (key) =>
                  key in q.dependencies &&
                  BigInt(event.versions[key] || "0") >
                    BigInt(q.dependencies[key] || "0"),
              ),
            ),
          )
          .map((q) => q.ref);
        client.cursor = events.at(-1)!.sequence;
        send(client, {
          protocol: 1,
          type: "invalidate",
          epoch: status.epoch,
          cursor: client.cursor,
          refs: [...new Set(changed)],
        });
      }
      if (Date.now() - client.heartbeat >= 15000) {
        client.heartbeat = Date.now();
        const renewal = await store.renew(client.refs, client.auth);
        send(client, {
          protocol: 1,
          type: "heartbeat",
          epoch: status.epoch,
          cursor: client.cursor,
          degraded: status.degraded,
          ...renewal,
        });
      }
    } finally {
      client.busy = false;
    }
  }
  const recordFailure = (error: unknown) => {
    metrics.dispatchFailures++;
    retryAt = Date.now() + Math.min(30000, 1000 * 2 ** Math.min(failures++, 5));
    const message =
      error instanceof Error
        ? error.message
        : "Consistency runtime unavailable";
    if (message !== lastError) {
      console.error("Consistency runtime:", message);
      lastError = message;
    }
  };
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      if (legacyCursor === undefined)
        legacyCursor = (await store.status()).cursor;
      if (Date.now() >= retryAt) {
        try {
          await store.dispatch(async (tags, keys) => {
            invalidateConsistencyMemory(keys);
            await props.invalidateTags?.(tags);
          });
          failures = 0;
          retryAt = 0;
          lastError = "";
        } catch (error) {
          recordFailure(error);
        }
      }
      const delivered = await store.events(legacyCursor);
      if (delivered.length) {
        const keys = [...new Set(delivered.flatMap((event) => event.keys))];
        invalidateConsistencyMemory(keys);
        const resources = await store.resources();
        const topics = [
          ...new Set(
            keys
              .map(
                (key) =>
                  resources.find(
                    (resource) => resource.resource === key.split("|")[0],
                  )?.topic,
              )
              .filter(Boolean),
          ),
        ] as string[];
        await props.publishLegacy?.(topics);
        legacyCursor = delivered.at(-1)!.sequence;
      }
      const pumped = await Promise.allSettled(
        [...clients.values()].map(pumpClient),
      );
      metrics.clientFailures += pumped.filter(
        (result) => result.status === "rejected",
      ).length;
      if (++ticks % 60 === 0) await store.cleanup();
    } catch (error) {
      recordFailure(error);
    } finally {
      busy = false;
    }
  };
  return {
    store,
    metrics: () => ({
      ...metrics,
      connections: clients.size,
      subscriptions: [...clients.values()].reduce(
        (sum, client) => sum + client.refs.length,
        0,
      ),
      retryAt,
      lastError,
      memory: process.memoryUsage(),
      queryRequests: Object.fromEntries(queryRequests),
    }),
    start() {
      if (!timer) {
        stopped = false;
        for (const channel of ["sps_consistency", "sps_consistency_delivery"])
          void store.sql
            .listen(channel, () => void tick())
            .then((listener) => {
              if (stopped) void listener.unlisten();
              else unlisten.push(listener.unlisten);
            })
            .catch(() => undefined);
        timer = setInterval(() => void tick(), 1000);
        timer.unref?.();
        void tick();
      }
      return () => {
        if (timer) clearInterval(timer);
        timer = undefined;
        stopped = true;
        unlisten.splice(0).forEach((close) => void close());
      };
    },
    tick,
    /** Register after authorization. PostgreSQL, never Redis, proves freshness. */
    cache(options: { observe?: boolean } = {}) {
      const cache = new KVProvider({ type: KV_PROVIDER });
      return createMiddleware(async (c, next) => {
        const context = consistencyContext.getStore();
        if (
          c.req.method !== "GET" ||
          !context ||
          !context.complete ||
          c.req.header("Cache-Control") === "no-store"
        )
          return next();
        const identity = JSON.stringify([
          c.req.method,
          c.req.url,
          c.req.header("Authorization"),
          c.req.header("Cookie"),
          c.req.header("X-RBAC-SECRET-KEY"),
          c.req.header("Accept-Language"),
          c.req.header("Accept"),
        ]);
        const key = createHash("sha256").update(identity).digest("hex");
        const prefix = "sps-consistency:v1";
        let status: Awaited<ReturnType<typeof store.status>>;
        try {
          status = await store.status();
        } catch {
          c.header("Cache-Control", "no-store");
          return next();
        }
        const pointer = await disposable(() => cache.get({ prefix, key }));
        let candidate:
          | { body: string; dependencies: Record<string, string> }
          | undefined;
        if (pointer) {
          try {
            const raw = await disposable(() =>
              cache.get({ prefix, key: pointer }),
            );
            const entry = raw ? JSON.parse(raw) : undefined;
            if (entry?.epoch === status.epoch) {
              const current = await store.versions(
                Object.keys(entry.dependencies),
              );
              if (
                Object.entries(entry.dependencies).every(
                  ([k, v]) => current[k] === v,
                )
              ) {
                if (!options.observe)
                  for (const [k, v] of Object.entries(entry.dependencies)) {
                    const previous = context.dependencies.get(k);
                    if (
                      previous === undefined ||
                      BigInt(previous) > BigInt(v as string)
                    )
                      context.dependencies.set(k, v as string);
                    context.resources.add(k.split("|")[0]);
                  }
                context.collections ||= new Map();
                if (!options.observe)
                  for (const [k, v] of Object.entries(
                    entry.collections || {},
                  )) {
                    const previous = context.collections.get(k);
                    if (
                      previous === undefined ||
                      BigInt(previous) > BigInt(v as string)
                    )
                      context.collections.set(k, v as string);
                  }
                if (options.observe) candidate = entry;
                else {
                  metrics.cacheHits++;
                  c.header("X-SPS-Cache", "hit");
                  return new Response(entry.body, {
                    headers: {
                      "Content-Type": entry.contentType,
                      "X-SPS-Cache": "hit",
                    },
                  });
                }
              }
            }
          } catch {
            /* Disposable or unverifiable answers are cache misses. */
          }
        }
        metrics.cacheMisses++;
        await next();
        compactDependencies(context);
        if (
          c.res.status !== 200 ||
          !context.complete ||
          !context.dependencies.size ||
          !c.res.headers.get("Content-Type")?.includes("application/json")
        )
          return;
        const body = await c.res.clone().text();
        if (candidate) {
          const versions = await store.versions(
            Object.keys(candidate.dependencies),
          );
          if (
            !Object.entries(candidate.dependencies).every(
              ([key, v]) => versions[key] === v,
            )
          )
            metrics.shadowRaces++;
          else if (candidate.body === body) metrics.shadowMatches++;
          else metrics.shadowMismatches++;
        }
        if (Buffer.byteLength(body) > HTTP_CACHE_MAX_ENTRY_BYTES) return;
        const dependencies = Object.fromEntries(context.dependencies);
        const collections = Object.fromEntries(context.collections || []);
        const vector = createHash("sha256")
          .update(JSON.stringify(dependencies))
          .digest("hex");
        const immutable = key + ":" + status.epoch + ":" + vector;
        const value = JSON.stringify({
          body,
          contentType: c.res.headers.get("Content-Type"),
          epoch: status.epoch,
          dependencies,
          collections,
        });
        await disposable(async () => {
          await cache.set({
            prefix,
            key: immutable,
            value,
            options: { ttl: 300 },
          });
          await cache.set({
            prefix,
            key,
            value: immutable,
            options: { ttl: 300 },
          });
        });
      });
    },
    middleware(options: { metadata?: boolean } = {}) {
      return createMiddleware(async (c, next) => {
        if (
          !c.req.path.startsWith("/api/") ||
          c.req.path.startsWith("/api/consistency")
        )
          return next();
        if (
          c.req.method === "GET" &&
          process.env.SPS_CONSISTENCY_DIAGNOSTICS === "true"
        ) {
          const url = new URL(c.req.url);
          url.searchParams.sort();
          const identity = createHash("sha256")
            .update(url.origin + url.pathname + url.search)
            .digest("hex");
          queryRequests.set(identity, (queryRequests.get(identity) || 0) + 1);
          if (queryRequests.size > 1024)
            queryRequests.delete(queryRequests.keys().next().value!);
        }
        const context: IConsistencyReadContext = {
          dependencies: new Map(),
          resources: new Set(),
          complete: true,
          isCovered: (resource) => {
            let entry = coverage.get(resource);
            if (!entry) {
              entry = store.covered(resource).catch(() => false);
              coverage.set(resource, entry);
            }
            return entry;
          },
        };
        return consistencyContext.run(context, async () => {
          await next();
          compactDependencies(context);
          if (!context.complete) c.header("Cache-Control", "no-store");
          if (
            c.req.method !== "GET" ||
            c.res.status < 200 ||
            (c.res.status >= 300 && c.res.status !== 404) ||
            !context.complete ||
            !context.dependencies.size
          )
            return;
          const token =
            c.req.header("Authorization") ||
            c.req
              .header("Cookie")
              ?.match(/(?:^|;\s*)rbac.subject.jwt=([^;]+)/)?.[1] ||
            "";
          const secret =
            c.req.header("X-RBAC-SECRET-KEY") ||
            c.req
              .header("Cookie")
              ?.match(/(?:^|;\s*)rbac.secret-key=([^;]+)/)?.[1];
          try {
            const metadata = await store.register({
              auth: consistencyAuth(secret ? `secret:${secret}` : token),
              identity: c.req.url,
              dependencies: Object.fromEntries(context.dependencies),
              collections: Object.fromEntries(context.collections || []),
              tags: [
                c.req.path,
                ...(c.req
                  .header("X-SPS-Query-Tag")
                  ?.match(/^sps:q:[a-f0-9]{64}$/)
                  ? [c.req.header("X-SPS-Query-Tag")!]
                  : []),
              ],
            });
            if (secret) metadata.audience = "service";
            else metadata.session = consistencyAuth(token);
            if (options.metadata !== false || secret)
              c.header(
                CONSISTENCY_HEADER,
                Buffer.from(JSON.stringify(metadata)).toString("base64url"),
              );
          } catch {
            context.complete = false;
            c.header("Cache-Control", "no-store");
          }
        });
      });
    },
    receive(socket: IConnection, input: unknown): Promise<void> {
      const previous = subscriptions.get(socket) || Promise.resolve();
      const operation = previous
        .catch(() => undefined)
        .then(() => receive(socket, input));
      subscriptions.set(socket, operation);
      return operation;
    },
    disconnect(socket: IConnection) {
      clients.delete(socket);
    },
    async check(refs: string[], authorization: string) {
      await props.verifyAuthorization(authorization);
      return {
        ...(await store.status()),
        ...(await store.renew(refs, consistencyAuth(authorization))),
      };
    },
  };
  async function receive(socket: IConnection, input: unknown) {
    if (typeof input !== "string" || input.length > 32768)
      throw new Error("Invalid consistency frame");
    const message = JSON.parse(input);
    if (
      message.type !== "subscribe" ||
      !Array.isArray(message.refs) ||
      message.refs.length > 100 ||
      !message.refs.every(
        (ref: unknown) => typeof ref === "string" && ref.length < 128,
      )
    )
      throw new Error("Invalid consistency subscriptions");
    const authorization =
      typeof message.authorization === "string" ? message.authorization : "";
    await props.verifyAuthorization(authorization);
    const auth = consistencyAuth(authorization);
    const status = await store.status();
    const refs = [...new Set(message.refs)] as string[];
    const valid = await store.queries(refs, auth);
    const cursor =
      /^\d{1,19}$/.test(message.cursor) && message.cursor !== "0"
        ? String(message.cursor)
        : status.cursor;
    const client: IClient = {
      socket,
      auth,
      authorization,
      refs: valid.map((q) => q.ref),
      cursor,
      epoch: message.epoch || status.epoch,
      heartbeat: Date.now(),
      busy: false,
    };
    // Always check each ref's baseline: the connection cursor can be newer
    // than a GET that finished after another query advanced that cursor.
    const changed = await store.changed(refs, auth);
    clients.set(socket, client);
    if (changed.length)
      send(client, {
        protocol: 1,
        type: "resync",
        epoch: status.epoch,
        cursor,
        refs: changed,
      });
    await pumpClient(client);
    send(client, {
      protocol: 1,
      type: "ready",
      refs: client.refs,
      epoch: status.epoch,
      cursor: client.cursor,
      degraded: status.degraded,
    });
  }
}
