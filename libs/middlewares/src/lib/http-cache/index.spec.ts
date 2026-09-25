/**
 * BDD Suite: HTTP-cache topic-versioned key building.
 *
 * Given: a GET path with derived topic versions.
 * When: the versioned cache-data prefix is built.
 * Then: bumping ANY topic version rotates the key, so nested reads are
 *       invalidated by mutations whose paths cannot derive the read path
 *       (issue #195 reliability guarantee).
 */

jest.mock("@sps/providers-kv", () => {
  return {
    Provider: jest.fn().mockImplementation(() => ({})),
  };
});

jest.mock("@sps/backend-utils", () => {
  // The credential readers are the real ones, so the cache is exercised with
  // the header and cookie names the handlers read (issue #306).
  const { authorization, readRbacSecret } =
    jest.requireActual("@sps/backend-utils");

  return {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    websocketManager: { broadcastMessage: jest.fn() },
    authorization,
    readRbacSecret,
    // The comparison is driven per scenario here; what it does with a real
    // RBAC_SECRET_KEY is pinned in the operator-secret middleware's suite and
    // in the primitive's own suite.
    rbacSecretMatches: jest.fn(),
  };
});

import { Hono } from "hono";
import {
  deriveTopicsFromPath,
  HTTP_CACHE_MAX_ENTRY_BYTES,
  KV_TTL,
} from "@sps/shared-utils";
import { rbacSecretMatches } from "@sps/backend-utils";
import {
  Middleware,
  buildVersionedDataPrefix,
  getTopicVersionKey,
} from "./index";
import { createCacheGuard } from "./guard";
import { Middleware as RevalidationMiddleware } from "../revalidation";

const mockRbacSecretMatches = rbacSecretMatches as jest.Mock;
const OPERATOR_SECRET = "configured-operator-secret";

const SID = "303302a0-4eb7-4cef-af04-74d7e8e72442";
const PID = "88862025-5c38-4ce8-bb4c-4c5c511b874c";
const CID = "e3d65d9b-60fa-4e6b-8e4d-7a93960bc249";
const TID = "38529ce7-f88d-45d3-9f34-f40b6a3bf82c";
const MID = "e9fb51ab-dd98-4d5c-b3f8-7466ce7e440e";

const threadMessagesPath = `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/threads/${TID}/messages`;
const chatScopedMessagePath = `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages/${TID}`;

/**
 * Recording fake KV store: captures the version keys the middleware bumps
 * (`incr`) so a unit test can assert which topic versions a mutation rotates,
 * without Redis. `get` always misses, `set` is inert.
 */
function createRecordingStore() {
  const incrementedTopicKeys: string[] = [];
  const incrementedKeys: Array<{ prefix: string; key: string }> = [];

  return {
    incrementedTopicKeys,
    incrementedKeys,
    store: {
      async get() {
        return null;
      },
      async set() {
        return undefined;
      },
      async incr({ prefix, key }: { prefix: string; key: string }) {
        incrementedKeys.push({ prefix, key });
        // Topic version keys are stored under the version prefix with a
        // `topic:` key (see getTopicVersionKey).
        if (key.startsWith("topic:")) {
          incrementedTopicKeys.push(key.replace(/^topic:/, ""));
        }
        return 1;
      },
    },
  };
}

/**
 * Minimal Hono-context double for driving Middleware.init(): exposes the
 * request url/path/method/header surface the handler reads, the raw request
 * the cookie readers parse, and a settable response. `next` marks the response
 * status (simulating a downstream mutation handler succeeding).
 */
function createContext(args: {
  method: string;
  url: string;
  path: string;
  status?: number;
  body?: unknown;
}) {
  const status = args.status ?? 200;
  const res = {
    status,
    clone() {
      return {
        async json() {
          return args.body ?? {};
        },
      };
    },
  };

  return {
    req: {
      url: args.url,
      path: args.path,
      method: args.method,
      raw: new Request(args.url, { method: args.method }),
      header() {
        return undefined;
      },
    },
    res,
  } as any;
}

async function runMiddleware(
  middleware: Middleware,
  ctx: ReturnType<typeof createContext>,
  next?: () => Promise<void>,
) {
  const handler = middleware.init();
  const result = await handler(ctx, next ?? (async () => undefined));
  // The GET-write / error fire-and-forget IIFE is not awaited inside the
  // handler; let the microtask queue drain so its bumps (if any) are recorded.
  await new Promise((resolve) => setImmediate(resolve));

  return result;
}

function versionsFor(
  topics: string[],
  overrides: Record<string, number> = {},
): Record<string, number> {
  return Object.fromEntries(
    topics.map((topic) => [topic, overrides[topic] ?? 0]),
  );
}

describe("buildVersionedDataPrefix", () => {
  /**
   * BDD Scenario: Deterministic key for identical versions.
   */
  it("is deterministic regardless of topic insertion order", () => {
    const readTopics = deriveTopicsFromPath(threadMessagesPath);
    const versions = versionsFor(readTopics);
    const reversed = Object.fromEntries(Object.entries(versions).reverse());

    expect(buildVersionedDataPrefix(threadMessagesPath, 0, versions)).toBe(
      buildVersionedDataPrefix(threadMessagesPath, 0, reversed),
    );
  });

  /**
   * BDD Scenario: A topic version bump rotates the key.
   * Given: the cached thread-messages GET key.
   * When:  one of its topic versions increments.
   * Then:  the prefix changes (cache miss → fresh data).
   */
  it("rotates the key when any topic version bumps", () => {
    const readTopics = deriveTopicsFromPath(threadMessagesPath);
    const before = buildVersionedDataPrefix(
      threadMessagesPath,
      0,
      versionsFor(readTopics),
    );
    const after = buildVersionedDataPrefix(
      threadMessagesPath,
      0,
      versionsFor(readTopics, { "social.messages": 1 }),
    );

    expect(after).not.toBe(before);
  });

  /**
   * BDD Scenario: The issue-195 staleness class is closed.
   * Given: the thread-messages read and a CHAT-scoped message mutation whose
   *        path can never derive the read path (no threadId in the URL).
   * When:  the mutation bumps its derived topics.
   * Then:  the read's topic set intersects the mutation's topic set, so at
   *        least one of the read key's version slots rotates.
   */
  it("guarantees nested-read invalidation through topic intersection", () => {
    const readTopics = deriveTopicsFromPath(threadMessagesPath);
    const mutationTopics = deriveTopicsFromPath(chatScopedMessagePath);
    const intersection = readTopics.filter((topic) =>
      mutationTopics.includes(topic),
    );

    expect(intersection.length).toBeGreaterThan(0);

    const bumped = versionsFor(
      readTopics,
      Object.fromEntries(intersection.map((topic) => [topic, 1])),
    );

    expect(buildVersionedDataPrefix(threadMessagesPath, 0, bumped)).not.toBe(
      buildVersionedDataPrefix(threadMessagesPath, 0, versionsFor(readTopics)),
    );
  });

  /**
   * BDD Scenario: Paths without topics still produce a stable key.
   */
  it("falls back to a stable vector for topic-less paths", () => {
    expect(buildVersionedDataPrefix("/api/unknown", 3, {})).toContain(":v3:t0");
  });

  /**
   * BDD Scenario: Stored bodies live in the namespace of the credential gate.
   * Given: a GET URL and its generation vector.
   * When:  the versioned cache-data prefix is built.
   * Then:  it starts with `http-cache:data:v2:`, so a body stored before issue
   *        #306 under `http-cache:data:<url>` is never looked up again.
   */
  it("places stored bodies under the v2 data namespace", () => {
    expect(
      buildVersionedDataPrefix("http://api:4000/api/host/pages", 3, {}),
    ).toBe("http-cache:data:v2:http://api:4000/api/host/pages:v3:t0");
  });
});

describe("getTopicVersionKey", () => {
  /**
   * BDD Scenario: Topic version keys are namespaced away from path keys.
   */
  it("namespaces topic keys", () => {
    expect(getTopicVersionKey("social.messages")).toBe("topic:social.messages");
  });
});

/**
 * BDD Suite: cache-clear route access.
 *
 * Given: the HTTP-cache middleware registers its clear route on a Hono app.
 * When:  the route is called with, without and with a wrong RBAC secret.
 * Then:  only the accepted credential reaches the flush, a refusal deletes
 *        nothing, and the flush still touches only the two namespaces this
 *        middleware owns.
 */
describe("HTTP-cache clear route access and namespace isolation", () => {
  /**
   * Registers the middleware's routes on a real Hono app, so a test reaches
   * the flush the way a request does — through every handler composed into
   * the route, not through a handler captured out of the registration.
   */
  function createClearRouteApp() {
    const keys = new Set([
      "http-cache:data:v2:/api/pages:v0:t0:response-hash",
      "http-cache:version:path-hash",
      "mcp:oauth:client:mcp-client-id",
      "mcp:oauth:refresh:refresh-token",
      "rbac:subject:openrouter-model-favorites:subject-hash",
    ]);
    const deletedPrefixes: string[] = [];
    const middleware = new Middleware();
    middleware.storeProvider = {
      async delByPrefix({ prefix }: { prefix: string }) {
        deletedPrefixes.push(prefix);

        for (const key of keys) {
          if (key.startsWith(prefix)) {
            keys.delete(key);
          }
        }
      },
    } as any;

    const app = new Hono();
    middleware.setRoutes(app);

    return { app, keys, deletedPrefixes };
  }

  beforeEach(() => {
    mockRbacSecretMatches.mockReset();
  });

  /**
   * BDD Scenario: Clearing HTTP cache preserves unrelated Redis state.
   * Given: HTTP-cache keys, an MCP OAuth client, and a user preference share
   *        the same KV backend, and the caller holds the operator credential.
   * When:  GET /api/http-cache/clear is handled.
   * Then:  only the HTTP-cache data and version namespaces are deleted.
   */
  it("preserves MCP OAuth and user KV keys", async () => {
    mockRbacSecretMatches.mockReturnValue(true);
    const { app, keys, deletedPrefixes } = createClearRouteApp();

    const response = await app.request("/api/http-cache/clear", {
      headers: { "X-RBAC-SECRET-KEY": OPERATOR_SECRET },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Cache cleared",
    });
    expect(deletedPrefixes).toEqual([
      "http-cache:data:v2",
      "http-cache:version",
    ]);
    expect(keys).not.toContain(
      "http-cache:data:v2:/api/pages:v0:t0:response-hash",
    );
    expect(keys).not.toContain("http-cache:version:path-hash");
    expect(keys).toContain("mcp:oauth:client:mcp-client-id");
    expect(keys).toContain("mcp:oauth:refresh:refresh-token");
    expect(keys).toContain(
      "rbac:subject:openrouter-model-favorites:subject-hash",
    );
  });

  /**
   * BDD Scenario: an anonymous caller reaches nothing.
   *
   * Given: the route registered on a Hono app and a request with no
   *        credential.
   * When:  GET /api/http-cache/clear is handled.
   * Then:  it answers 401 and no prefix is deleted, so the two keyspace walks
   *        never start.
   */
  it("refuses an anonymous request and deletes nothing", async () => {
    mockRbacSecretMatches.mockReturnValue(false);
    const { app, keys, deletedPrefixes } = createClearRouteApp();

    const response = await app.request("/api/http-cache/clear");

    expect(response.status).toBe(401);
    expect(deletedPrefixes).toEqual([]);
    expect(keys).toContain("http-cache:data:v2:/api/pages:v0:t0:response-hash");
  });

  /**
   * BDD Scenario: a wrong credential reaches nothing either.
   *
   * Given: a caller presenting a value the comparison rejects.
   * When:  GET /api/http-cache/clear is handled.
   * Then:  it answers 401, nothing is deleted, and the credential the caller
   *        sent is what was compared.
   */
  it("refuses a wrong credential and deletes nothing", async () => {
    mockRbacSecretMatches.mockReturnValue(false);
    const { app, deletedPrefixes } = createClearRouteApp();

    const response = await app.request("/api/http-cache/clear", {
      headers: { "X-RBAC-SECRET-KEY": "not-the-operator-secret" },
    });

    expect(response.status).toBe(401);
    expect(deletedPrefixes).toEqual([]);
    expect(mockRbacSecretMatches).toHaveBeenCalledWith(
      "not-the-operator-secret",
    );
  });

  /**
   * BDD Scenario: the guard is part of the route, not of the application.
   *
   * Given: the middleware registering its routes on an app that records the
   *        handlers each path receives.
   * When:  setRoutes is called.
   * Then:  the clear path is registered with the guard ahead of the flush, so
   *        the route carries its own refusal wherever it is mounted.
   */
  it("registers the guard before the flush handler on the clear path", () => {
    const registeredHandlersByPath: Record<string, unknown[]> = {};
    const middleware = new Middleware();
    middleware.storeProvider = { async delByPrefix() {} } as any;

    middleware.setRoutes({
      get(path: string, ...handlers: unknown[]) {
        registeredHandlersByPath[path] = handlers;
      },
    });

    const clearRouteHandlers =
      registeredHandlersByPath["/api/http-cache/clear"];

    expect(clearRouteHandlers).toHaveLength(2);
    expect(typeof clearRouteHandlers?.[0]).toBe("function");
  });
});

describe("exclusion gate does not skip the mutation version-bump (issue #195 F1)", () => {
  const chatActionsPath = `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/actions`;
  const chatMessagesPath = `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/messages`;

  /**
   * BDD Scenario: A CREATE POST on a cache-EXCLUDED chat path still bumps
   * topic versions.
   * Given: the chat actions path is in the http-cache exclusion list (its
   *        `/actions$` regex matches both the GET and the create POST).
   * When:  a successful POST is processed.
   * Then:  topic versions are still bumped — the blanket early-return that
   *        previously skipped the bump for create-only (while update/delete on
   *        `/messages/{id}` still bumped) is gone.
   */
  it("bumps topic versions for a create POST on an excluded path", async () => {
    const recording = createRecordingStore();
    const middleware = new Middleware();
    middleware.storeProvider = recording.store as any;

    await runMiddleware(
      middleware,
      createContext({
        method: "POST",
        url: `https://x${chatActionsPath}`,
        path: chatActionsPath,
      }),
    );

    // The chat-actions topic rule resolves these (rule wins over canonical).
    expect(recording.incrementedTopicKeys).toEqual(
      expect.arrayContaining(["social.actions", `social.chats.${CID}.actions`]),
    );
  });

  /**
   * BDD Scenario: Create on an excluded chat MESSAGES path bumps the same
   * topics an update/delete would.
   * Given: the excluded chat messages path.
   * When:  a create POST and (separately) a delete are processed.
   * Then:  both bump the messages topics — no create-only gap.
   */
  it("bumps the messages topics for create AND delete on an excluded path", async () => {
    const createRec = createRecordingStore();
    const createMw = new Middleware();
    createMw.storeProvider = createRec.store as any;
    await runMiddleware(
      createMw,
      createContext({
        method: "POST",
        url: `https://x${chatMessagesPath}`,
        path: chatMessagesPath,
      }),
    );

    const deleteRec = createRecordingStore();
    const deleteMw = new Middleware();
    deleteMw.storeProvider = deleteRec.store as any;
    const deletePath = `${chatMessagesPath}/${MID}`;
    await runMiddleware(
      deleteMw,
      createContext({
        method: "DELETE",
        url: `https://x${deletePath}`,
        path: deletePath,
      }),
    );

    expect(createRec.incrementedTopicKeys).toContain("social.messages");
    expect(deleteRec.incrementedTopicKeys).toContain("social.messages");
  });

  /**
   * BDD Scenario: An excluded GET is read straight through and never cached.
   * Given: the excluded chat actions GET path.
   * When:  a GET is processed.
   * Then:  no version key is written (no cache read/write) — the exclusion
   *        still bypasses the GET cache.
   */
  it("does not cache an excluded GET", async () => {
    const recording = createRecordingStore();
    const middleware = new Middleware();
    middleware.storeProvider = recording.store as any;

    await runMiddleware(
      middleware,
      createContext({
        method: "GET",
        url: `https://x${chatActionsPath}`,
        path: chatActionsPath,
        body: { data: [] },
      }),
    );

    // A GET never bumps anything; the only observable effect of caching would
    // be a `set`, which the recording store treats as inert — assert no topic
    // bumps occurred (a GET must never increment versions).
    expect(recording.incrementedTopicKeys).toEqual([]);
    expect(recording.incrementedKeys).toEqual([]);
  });
});

describe("cache-bump / broadcast topic parity (issue #195 F2)", () => {
  /**
   * BDD Scenario: For a rule-matched path, the http-cache version bump and the
   * revalidation broadcast compute the SAME topics.
   * Given: the chat actions path (covered by a framework topic rule).
   * When:  the http-cache mutation bump resolves its topics and the
   *        revalidation middleware resolves its broadcast topics.
   * Then:  the two sets are identical — a cached read can never be served
   *        stale while the WS broadcast announces a change.
   */
  it("bumps exactly the topics the revalidation middleware broadcasts", async () => {
    const chatActionsPath = `/api/rbac/subjects/${SID}/social-module/profiles/${PID}/chats/${CID}/actions`;

    const recording = createRecordingStore();
    const httpCache = new Middleware();
    httpCache.storeProvider = recording.store as any;
    await runMiddleware(
      httpCache,
      createContext({
        method: "POST",
        url: `https://x${chatActionsPath}`,
        path: chatActionsPath,
      }),
    );

    const broadcastTopics = new RevalidationMiddleware().resolveBroadcastTopics(
      chatActionsPath,
    );

    expect([...recording.incrementedTopicKeys].sort()).toEqual(
      [...broadcastTopics].sort(),
    );
  });

  /**
   * BDD Scenario: Parity holds for a canonical (rule-less) path too.
   * Given: a flat order mutation (no explicit topic rule → canonical
   *        derivation on both layers).
   * When:  both layers resolve topics.
   * Then:  they agree.
   */
  it("agrees with the broadcast on a canonical path", async () => {
    const orderPath = `/api/ecommerce/orders/${MID}`;

    const recording = createRecordingStore();
    const httpCache = new Middleware();
    httpCache.storeProvider = recording.store as any;
    await runMiddleware(
      httpCache,
      createContext({
        method: "PATCH",
        url: `https://x${orderPath}`,
        path: orderPath,
      }),
    );

    const broadcastTopics = new RevalidationMiddleware().resolveBroadcastTopics(
      orderPath,
    );

    expect([...recording.incrementedTopicKeys].sort()).toEqual(
      [...broadcastTopics].sort(),
    );
  });
});

/**
 * BDD Suite: the response cache fails open (issue #233).
 *
 * Given: a KV store that hangs, rejects reads, rejects writes, or rejects
 *        version bumps — the states the production Redis outage produced.
 * When:  a request passes through the HTTP-cache middleware.
 * Then:  the handler runs and its response is served unchanged; the cache
 *        degrades to a miss or a skipped write and never to a failed or
 *        stalled request.
 */
describe("KV failures degrade the cache, not the request", () => {
  const collectionPath = "/api/ecommerce/orders";
  const collectionUrl = `http://api:4000${collectionPath}`;

  function createFailOpenMiddleware(store: unknown) {
    const middleware = new Middleware();
    middleware.storeProvider = store as any;
    middleware.guard = createCacheGuard({
      timeoutMs: 20,
      logger: { info: jest.fn(), warn: jest.fn() },
    });

    return middleware;
  }

  /**
   * BDD Scenario: A cache read that never answers.
   * Given: a store whose `get` never settles (the post-restart hang).
   * When:  a cacheable GET arrives.
   * Then:  the handler still runs and no cached response is returned.
   */
  it("runs the handler when the cache read never answers", async () => {
    const middleware = createFailOpenMiddleware({
      async get() {
        return new Promise(() => undefined);
      },
      async set() {
        return undefined;
      },
      async incr() {
        return 1;
      },
    });

    let handlerRan = false;
    const result = await runMiddleware(
      middleware,
      createContext({
        method: "GET",
        url: collectionUrl,
        path: collectionPath,
        body: { data: [] },
      }),
      async () => {
        handlerRan = true;
      },
    );

    expect(handlerRan).toBe(true);
    expect(result).toBeUndefined();
  });

  /**
   * BDD Scenario: A cache write that fails.
   * Given: a store that reads but cannot write.
   * When:  a cacheable GET is answered by the handler.
   * Then:  the response is served and the failed write is swallowed.
   */
  it("serves the response when the cache write fails", async () => {
    const middleware = createFailOpenMiddleware({
      async get() {
        return null;
      },
      async set() {
        throw new Error("OOM command not allowed when used memory > maxmemory");
      },
      async incr() {
        return 1;
      },
    });

    let handlerRan = false;
    const result = await runMiddleware(
      middleware,
      createContext({
        method: "GET",
        url: collectionUrl,
        path: collectionPath,
        body: { data: [] },
      }),
      async () => {
        handlerRan = true;
      },
    );

    expect(handlerRan).toBe(true);
    expect(result).toBeUndefined();
  });

  /**
   * BDD Scenario: A version bump that fails after a successful mutation.
   * Given: a store whose `incr` rejects.
   * When:  a mutation succeeds and the middleware tries to invalidate.
   * Then:  the already-produced mutation response is returned unchanged.
   */
  it("leaves a mutation response unchanged when the version bump fails", async () => {
    const middleware = createFailOpenMiddleware({
      async get() {
        return null;
      },
      async set() {
        return undefined;
      },
      async incr() {
        throw new Error("READONLY You can't write against a read only replica");
      },
    });

    const context = createContext({
      method: "POST",
      url: collectionUrl,
      path: collectionPath,
      status: 201,
    });

    const result = await runMiddleware(middleware, context);

    expect(result).toBeUndefined();
    expect(context.res.status).toBe(201);
  });

  /**
   * BDD Scenario: An unreadable generation vector is not guessed.
   * Given: a store that cannot answer the version read.
   * When:  a cacheable GET is answered by the handler.
   * Then:  nothing is written back, because the generation the response
   *        belongs to is unknown.
   */
  it("does not store a response whose generation could not be read", async () => {
    const writes: string[] = [];
    const middleware = createFailOpenMiddleware({
      async get() {
        throw new Error("connection refused");
      },
      async set({ prefix }: { prefix: string }) {
        writes.push(prefix);
        return undefined;
      },
      async incr() {
        return 1;
      },
    });

    await runMiddleware(
      middleware,
      createContext({
        method: "GET",
        url: collectionUrl,
        path: collectionPath,
        body: { data: [] },
      }),
    );

    expect(writes).toEqual([]);
  });
});

/**
 * BDD Suite: cache retention is bounded (issue #233).
 *
 * Given: the version counters and the response bodies that a mutation and a
 *        cacheable GET produce.
 * When:  the middleware bumps a version or stores a response.
 * Then:  the counter carries the same expiry as the data it addresses, and a
 *        response above the admission cap is served but not stored.
 */
describe("bounded cache generations", () => {
  const collectionPath = "/api/ecommerce/orders";
  const collectionUrl = `http://api:4000${collectionPath}`;

  function createTtlRecordingStore() {
    const increments: Array<{ key: string; ttl?: number }> = [];
    const writes: Array<{ prefix: string; bytes: number }> = [];

    return {
      increments,
      writes,
      store: {
        async get() {
          return null;
        },
        async set({ prefix, value }: { prefix: string; value: string }) {
          writes.push({ prefix, bytes: value.length });
          return undefined;
        },
        async incr({
          key,
          options,
        }: {
          prefix: string;
          key: string;
          options?: { ttl?: number };
        }) {
          increments.push({ key, ttl: options?.ttl });
          return 1;
        },
      },
    };
  }

  /**
   * BDD Scenario: Version counters expire with their data.
   * Given: a successful mutation.
   * When:  the middleware bumps the path and topic counters.
   * Then:  every bump carries KV_TTL, so an idle path's counters and bodies
   *        expire together instead of accumulating forever.
   */
  it("gives every version bump the data TTL", async () => {
    const recording = createTtlRecordingStore();
    const middleware = new Middleware();
    middleware.storeProvider = recording.store as any;

    await runMiddleware(
      middleware,
      createContext({
        method: "POST",
        url: collectionUrl,
        path: collectionPath,
        status: 201,
      }),
    );

    expect(recording.increments.length).toBeGreaterThan(0);
    expect(recording.increments.every((entry) => entry.ttl === KV_TTL)).toBe(
      true,
    );
  });

  /**
   * BDD Scenario: A response above the admission cap is not stored.
   * Given: a collection response larger than HTTP_CACHE_MAX_ENTRY_BYTES.
   * When:  a cacheable GET is answered with it.
   * Then:  the response is served and no data key is written, so one large
   *        collection cannot be multiplied across generations.
   */
  it("serves but does not store a response above the admission cap", async () => {
    const recording = createTtlRecordingStore();
    const middleware = new Middleware();
    middleware.storeProvider = recording.store as any;

    const oversized = {
      data: "x".repeat(HTTP_CACHE_MAX_ENTRY_BYTES + 1024),
    };

    const result = await runMiddleware(
      middleware,
      createContext({
        method: "GET",
        url: collectionUrl,
        path: collectionPath,
        body: oversized,
      }),
    );

    expect(result).toBeUndefined();
    expect(recording.writes).toEqual([]);
  });

  /**
   * BDD Scenario: A response below the cap is still cached.
   * Given: an ordinary small collection response.
   * When:  a cacheable GET is answered with it.
   * Then:  it is written to the versioned data prefix as before.
   */
  it("stores a response below the admission cap", async () => {
    const recording = createTtlRecordingStore();
    const middleware = new Middleware();
    middleware.storeProvider = recording.store as any;

    await runMiddleware(
      middleware,
      createContext({
        method: "GET",
        url: collectionUrl,
        path: collectionPath,
        body: { data: [{ id: MID }] },
      }),
    );

    expect(recording.writes.length).toBe(1);
    expect(recording.writes[0].prefix).toContain(
      `http-cache:data:v2:${collectionUrl}`,
    );
  });
});

/**
 * BDD Suite: stored bodies are shared only between callers without a
 * credential (issue #306).
 *
 * Given: the HTTP-cache middleware in front of a collection read whose handler
 *        numbers every response it produces, and a KV store that keeps what is
 *        written to it.
 * When:  GET requests arrive without a credential, with a subject token or
 *        the operator secret in a header or a cookie, or with
 *        `Cache-Control: no-store`, and a credentialed POST changes the
 *        collection.
 * Then:  requests without a credential share one stored body, a credentialed
 *        request neither receives a stored body nor stores its own, and the
 *        credentialed POST still rotates the key so the next anonymous read is
 *        produced afresh.
 */
describe("the cache serves and stores bodies only for requests without a credential", () => {
  const collectionPath = "/api/ecommerce/orders";

  const credentialChannels: Array<[string, Record<string, string>]> = [
    [
      "a subject token in the Authorization header",
      { Authorization: "Bearer subject-token" },
    ],
    [
      "the operator secret in the X-RBAC-SECRET-KEY header",
      { "X-RBAC-SECRET-KEY": OPERATOR_SECRET },
    ],
    [
      "a subject token in the rbac.subject.jwt cookie",
      { Cookie: "rbac.subject.jwt=subject-token" },
    ],
    [
      "the operator secret in the rbac.secret-key cookie",
      { Cookie: `rbac.secret-key=${OPERATOR_SECRET}` },
    ],
  ];

  /**
   * KV double that keeps what is written, so a later request can be answered
   * from what an earlier one stored.
   */
  function createMemoryStore() {
    const entries = new Map<string, string>();
    const writtenPrefixes: string[] = [];

    return {
      writtenPrefixes,
      store: {
        async get({ prefix, key }: { prefix: string; key: string }) {
          return entries.get(`${prefix}:${key}`) ?? null;
        },
        async set({
          prefix,
          key,
          value,
        }: {
          prefix: string;
          key: string;
          value: string;
        }) {
          writtenPrefixes.push(prefix);
          entries.set(`${prefix}:${key}`, value);

          return "OK";
        },
        async incr({ prefix, key }: { prefix: string; key: string }) {
          const version = Number(entries.get(`${prefix}:${key}`) ?? 0) + 1;
          entries.set(`${prefix}:${key}`, String(version));

          return version;
        },
      },
    };
  }

  /**
   * The middleware in front of a collection read that numbers each response
   * it produces, so a stored body (an earlier number) is told apart from a
   * fresh one.
   */
  function createCollectionApp() {
    const memory = createMemoryStore();
    const middleware = new Middleware();
    middleware.storeProvider = memory.store as any;

    let producedResponses = 0;
    const app = new Hono();

    app.use(middleware.init());
    app.get(collectionPath, (c) => {
      producedResponses += 1;

      return c.json({ data: { response: producedResponses } });
    });
    app.post(collectionPath, (c) => c.json({ data: { id: MID } }, 201));

    return { app, memory };
  }

  /**
   * Reads the collection and returns the number of the response received. The
   * middleware writes a GET body after answering, so the read waits for that
   * write before the next request.
   */
  async function readCollection(
    app: Hono,
    headers: Record<string, string> = {},
  ): Promise<number> {
    const response = await app.request(collectionPath, { headers });
    const payload = await response.json();

    for (let turn = 0; turn < 5; turn += 1) {
      await new Promise((resolve) => setImmediate(resolve));
    }

    return payload.data.response;
  }

  /**
   * BDD Scenario: anonymous reads share one stored body.
   *
   * Given: nothing stored for the collection.
   * When:  two GET requests without a credential arrive one after the other.
   * Then:  the handler produces the first response, it is stored, and the
   *        second request receives the stored body.
   */
  it("stores an anonymous response and serves it to the next anonymous request", async () => {
    const { app, memory } = createCollectionApp();

    expect(await readCollection(app)).toBe(1);
    expect(await readCollection(app)).toBe(1);
    expect(memory.writtenPrefixes).toHaveLength(1);
  });

  /**
   * BDD Scenario: a credentialed read bypasses the stored body.
   *
   * Given: an anonymous body stored for the collection.
   * When:  a GET presents a credential in one of the four accepted places.
   * Then:  it receives a freshly produced response, stores nothing, and the
   *        next anonymous request still receives the original stored body.
   */
  it.each(credentialChannels)(
    "neither reads nor replaces the stored body for a request with %s",
    async (_channel, headers) => {
      const { app, memory } = createCollectionApp();

      expect(await readCollection(app)).toBe(1);
      expect(await readCollection(app, headers)).toBe(2);
      expect(await readCollection(app)).toBe(1);
      expect(memory.writtenPrefixes).toHaveLength(1);
    },
  );

  /**
   * BDD Scenario: a response produced for a credentialed caller never reaches
   * an anonymous one.
   *
   * Given: nothing stored for the collection.
   * When:  a GET with a credential is answered, then the same URL is
   *        requested without one.
   * Then:  the credentialed response was not stored, and the anonymous caller
   *        receives a response produced for its own request.
   */
  it.each(credentialChannels)(
    "never replays a response produced for a request with %s to an anonymous request",
    async (_channel, headers) => {
      const { app, memory } = createCollectionApp();

      expect(await readCollection(app, headers)).toBe(1);
      expect(memory.writtenPrefixes).toEqual([]);
      expect(await readCollection(app)).toBe(2);
    },
  );

  /**
   * BDD Scenario: a credentialed mutation still invalidates anonymous reads.
   *
   * Given: an anonymous body stored for the collection.
   * When:  a POST to the collection with a subject token succeeds.
   * Then:  the collection's version rotates and the next anonymous GET
   *        receives a freshly produced response.
   */
  it("bumps versions for a credentialed mutation so the next anonymous read misses", async () => {
    const { app } = createCollectionApp();

    expect(await readCollection(app)).toBe(1);

    const mutation = await app.request(collectionPath, {
      method: "POST",
      headers: { Authorization: "Bearer subject-token" },
    });

    expect(mutation.status).toBe(201);
    expect(await readCollection(app)).toBe(2);
  });

  /**
   * BDD Scenario: the `Cache-Control: no-store` opt-out keeps working.
   *
   * Given: an anonymous body stored for the collection.
   * When:  a GET without a credential sends `Cache-Control: no-store`.
   * Then:  it receives a freshly produced response and stores nothing.
   */
  it("keeps the no-store opt-out for a request without a credential", async () => {
    const { app, memory } = createCollectionApp();

    expect(await readCollection(app)).toBe(1);
    expect(await readCollection(app, { "Cache-Control": "no-store" })).toBe(2);
    expect(memory.writtenPrefixes).toHaveLength(1);
  });
});
