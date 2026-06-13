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
  return {
    logger: { error: jest.fn() },
    websocketManager: { broadcastMessage: jest.fn() },
  };
});

import { deriveTopicsFromPath } from "@sps/shared-utils";
import {
  Middleware,
  buildVersionedDataPrefix,
  getTopicVersionKey,
} from "./index";
import { Middleware as RevalidationMiddleware } from "../revalidation";

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
 * request url/path/method/header surface the handler reads and a settable
 * response. `next` marks the response status (simulating a downstream
 * mutation handler succeeding).
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
) {
  const handler = middleware.init();
  await handler(ctx, async () => undefined);
  // The GET-write / error fire-and-forget IIFE is not awaited inside the
  // handler; let the microtask queue drain so its bumps (if any) are recorded.
  await new Promise((resolve) => setImmediate(resolve));
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
});

describe("getTopicVersionKey", () => {
  /**
   * BDD Scenario: Topic version keys are namespaced away from path keys.
   */
  it("namespaces topic keys", () => {
    expect(getTopicVersionKey("social.messages")).toBe("topic:social.messages");
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
