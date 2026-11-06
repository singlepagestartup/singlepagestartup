/**
 * Given: two TCP WebSocket clients and an API GET warmed in the production HTTP cache.
 * When: an owner service publishes a committed mutation through the production publisher.
 * Then: version validation makes both clients' immediate HTTP refetches fresh.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

it("delivers fresh cached data to two real WebSocket clients after a service mutation", () => {
  const root = resolve(__dirname, "../../../..");
  const scenario = String.raw`
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { connect } from "node:net";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { ConsistencyMiddleware, HTTPCacheMiddleware } from "@sps/middlewares";
import { createConsistencyRuntime, createMutationEffectsPublisher, consistencyContext } from "@sps/shared-backend-api";
import { websocketManager } from "@sps/backend-utils";
import { Provider as KVProvider } from "@sps/providers-kv";
import { KV_HOST, CONSISTENCY_CACHE_PREFIX } from "@sps/shared-utils";

if (!["localhost", "127.0.0.1", "::1"].includes(KV_HOST)) {
  throw new Error("The transport fixture requires local Redis");
}
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const deadline = async (promise, label) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + " timed out")), 5000); }),
    ]);
  } finally { clearTimeout(timer); }
};
const namespace = "sps:pr374:transport:" + randomUUID() + ":";
const moduleName = "transport-" + randomUUID();
const route = "/api/" + moduleName + "/items";
const topic = moduleName + ".items";
const dependency = "public.transport_fixture|collection|0";
let generation = "0";
const provider = new KVProvider({ type: "redis" });
const redis = provider.client.client;
const firstStored = deferred();
const freshStored = deferred();
const bumpStarted = deferred();
const allowBump = deferred();
const scoped = (props) => ({ ...props, prefix: namespace + props.prefix });
const writtenKeys = new Set();
const remember = async (props) => writtenKeys.add(namespace + props.prefix + ":" + await provider.hashKey({ key: props.key }));
let pauseBump = false;
let bumpComplete = false;
const cache = {
  get: (props) => provider.get(scoped(props)),
  set: async (props) => {
    const result = await provider.set(scoped(props));
    await remember(props);
    if (props.prefix === CONSISTENCY_CACHE_PREFIX) {
      try {
        const envelope = JSON.parse(props.value);
        if (envelope.body) {
          const body = JSON.parse(envelope.body);
          if (body.data.value === 10) firstStored.resolve();
          if (body.data.value === 20) freshStored.resolve();
        }
      } catch { /* A pointer stores an envelope key, not JSON. */ }
    }
    return result;
  },
  delByPrefix: (props) => provider.delByPrefix(scoped(props)),
};
const runtime = createConsistencyRuntime({
  cache,
  store: {
    status: async () => ({epoch: "fixture"}),
    versions: async () => ({[dependency]: generation}),
    covered: async () => true,
    register: async () => ({protocol: 1,ref: "ref",epoch: "fixture",cursor: "0",expiresAt: new Date(Date.now()+60000).toISOString()}),
  },
  verifyAuthorization: async () => {},
});
const publish = createMutationEffectsPublisher({
  invalidateTopics: async () => {
    if (pauseBump) {
      bumpStarted.resolve();
      await allowBump.promise;
    }
    bumpComplete = true;
  },
});
let value = 10;
let handlerCalls = 0;
class FixtureOwnerService {
  async update() {
    // This fixture's in-memory owner commit has no database or user-record effects.
    value = 20;
    generation = "1";
    await publish({ topics: [topic], payload: route });
  }
}
const app = new Hono();
const consistencyMiddleware = new ConsistencyMiddleware({ runtime, revalidation: { revalidateTags: async () => {} } });
const httpCacheMiddleware = new HTTPCacheMiddleware({ runtime });
app.use(consistencyMiddleware.init());
consistencyMiddleware.registerRoutes(app);
httpCacheMiddleware.registerRoutes(app);
app.use(httpCacheMiddleware.init());
app.get(route, (c) => {
  handlerCalls += 1;
  consistencyContext.getStore().dependencies.set(dependency, generation);
  return c.json({ data: { value } });
});
const connected = new Set();
const bothConnected = deferred();
const allClosed = deferred();
let server;
const clients = [];
let events = 0;
let evidence;
try {
  if (redis.status !== "ready") {
    await deadline(new Promise((resolve, reject) => {
      redis.once("ready", resolve);
      redis.once("error", reject);
    }), "Redis readiness");
  }
  assert.equal(await redis.ping(), "PONG");
  const addClient = websocketManager.addClient.bind(websocketManager);
  const removeClient = websocketManager.removeClient.bind(websocketManager);
  websocketManager.addClient = (id, socket) => {
    addClient(id, socket);
    connected.add(id);
    if (connected.size === 2) bothConnected.resolve();
  };
  websocketManager.removeClient = (id) => {
    removeClient(id);
    connected.delete(id);
    if (!connected.size) allClosed.resolve();
  };
  const { websocket } = createBunWebSocket();
  server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: app.fetch, websocket });
  const base = "http://127.0.0.1:" + server.port;
  const read = async () => {
    const response = await fetch(base + route, { headers: { Connection: "close" } });
    assert.equal(response.status, 200);
    return (await response.json()).data.value;
  };
  assert.equal(await read(), 10);
  await deadline(firstStored.promise, "initial Redis cache body");
  assert.equal(handlerCalls, 1);
  const before = [];
  const refreshed = [];
  for (const id of ["first", "second"]) {
    const socket = new WebSocket("ws://127.0.0.1:" + server.port + "/ws/revalidation?client=" + id);
    clients.push(socket);
    refreshed.push(new Promise((resolve, reject) => {
      socket.addEventListener("error", () => reject(new Error("WebSocket client " + id + " failed")));
      socket.addEventListener("message", async (event) => {
        try {
          const message = JSON.parse(String(event.data));
          if (message.slug !== "revalidation" || !message.topics?.includes(topic)) return;
          events += 1;
          assert.equal(bumpComplete, true, "WebSocket event preceded mutation-effect completion");
          // No jitter or wait: emulate the earliest possible subscriber refetch.
          resolve({ client: id, value: await read() });
        } catch (error) { reject(error); }
      });
    }));
    before.push(await read());
  }
  await deadline(bothConnected.promise, "two WebSocket connections");
  assert.deepEqual(before, [10, 10]);
  assert.equal(handlerCalls, 1, "warmed GET must be a Redis cache HIT");

  pauseBump = true;
  const mutation = new FixtureOwnerService().update();
  await deadline(bumpStarted.promise, "generation bump start");
  await Bun.sleep(40);
  assert.equal(events, 0, "publisher broadcast while cache invalidation was pending");
  allowBump.resolve();
  await deadline(mutation, "owner mutation publication");
  const after = await deadline(Promise.all(refreshed), "both subscriber refetches");
  assert.deepEqual(after, [{ client: "first", value: 20 }, { client: "second", value: 20 }]);
  assert.equal(events, 2);
  await deadline(freshStored.promise, "fresh Redis cache body");
  const callsAfterRefetch = handlerCalls;
  assert.equal(await read(), 20);
  assert.equal(handlerCalls, callsAfterRefetch, "fresh generation must be cached again");
  evidence = { transport: "Bun TCP + WebSocket", cache: "consistencyRuntime + local Redis", clients: 2, before, after, warmCacheHit: true, freshCacheHit: true, heldBumpEvents: 0 };
} finally {
  allowBump.resolve();
  try {
    for (const socket of clients) socket.close();
    if (clients.length) await deadline(allClosed.promise, "socket cleanup");
    if (server) {
      const port = server.port;
      // Bun 1.3 may leave stop() pending after both close callbacks. Check
      // the actual TCP listener; the subprocess owns any remaining handles.
      void server.stop(true);
      await deadline(new Promise((resolve, reject) => {
        const socket = connect({ host: "127.0.0.1", port });
        socket.once("connect", () => {
          socket.destroy();
          reject(new Error("fixture TCP listener is still open"));
        });
        socket.once("error", (error) => {
          socket.destroy();
          if (error.code === "ECONNREFUSED") resolve();
          else reject(error);
        });
      }), "TCP listener cleanup");
    }
    if (evidence) {
      evidence.closedClients = clients.length;
      evidence.closedTcpListener = true;
    }
  } finally {
    try {
      if (writtenKeys.size) await redis.del(...writtenKeys);
      const remainingKeys = writtenKeys.size ? await redis.exists(...writtenKeys) : 0;
      assert.equal(remainingKeys, 0, "fixture Redis keys were not removed");
      if (evidence) evidence.remainingRedisKeys = remainingKeys;
    } finally { await redis.quit(); }
  }
}
if (evidence) console.log("TRANSPORT_EVIDENCE " + JSON.stringify(evidence));
process.exit(0);
`;
  const result = spawnSync(
    "bun",
    [
      "--tsconfig-override",
      resolve(root, "tsconfig.base.json"),
      "--eval",
      scenario,
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        KV_PROVIDER: "redis",
        MIDDLEWARE_HTTP_CACHE: "true",
      },
      encoding: "utf8",
      timeout: 25_000,
    },
  );
  if (result.error || result.status !== 0) {
    throw new Error(
      [result.error?.message, result.stdout, result.stderr]
        .filter(Boolean)
        .join("\n"),
    );
  }
  const line = result.stdout
    .split("\n")
    .find((value) => value.startsWith("TRANSPORT_EVIDENCE "));
  expect(line).toBeDefined();
  const evidence = JSON.parse(line!.slice("TRANSPORT_EVIDENCE ".length));
  expect(evidence).toMatchObject({
    clients: 2,
    before: [10, 10],
    after: [
      { client: "first", value: 20 },
      { client: "second", value: 20 },
    ],
    warmCacheHit: true,
    freshCacheHit: true,
    heldBumpEvents: 0,
    closedClients: 2,
    closedTcpListener: true,
    remainingRedisKeys: 0,
  });
  console.log("Real transport verification:", JSON.stringify(evidence));
}, 30_000);
