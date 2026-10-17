import { Hono } from "hono";
const values = new Map<string, string>();
jest.mock("@sps/providers-kv", () => ({
  Provider: class {
    async get({ prefix, key }: any) {
      return values.get(prefix + key);
    }
    async set({ prefix, key, value }: any) {
      values.set(prefix + key, value);
    }
  },
}));
jest.mock("@sps/providers-db", () => ({ ConsistencyStore: jest.fn() }));
import { createConsistencyRuntime } from "./consistency";
import { consistencyContext } from "../repository/database/context";

it("keeps sending heartbeats while Next invalidation is failing", async () => {
  const status = { epoch: "test", cursor: "0", oldest: "0", degraded: true };
  const store: any = {
    status: async () => status,
    queries: async () => [],
    changed: async () => [],
    events: async () => [],
    renew: async () => ({
      refs: [],
      renewedRefs: [],
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    }),
    dispatch: async () => {
      throw new Error("Next unavailable");
    },
  };
  const runtime = createConsistencyRuntime({
    store,
    verifyAuthorization: async () => {},
  });
  const send = jest.fn();
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await runtime.receive(
      { send, close: jest.fn() },
      JSON.stringify({
        type: "subscribe",
        refs: [],
        cursor: "0",
        epoch: "test",
      }),
    );
    send.mockClear();
    jest.useFakeTimers({ now: Date.now() + 16000 });
    await runtime.tick();
    expect(runtime.metrics().dispatchFailures).toBe(1);
    expect(
      send.mock.calls.some(([body]) => JSON.parse(body).type === "heartbeat"),
    ).toBe(true);
  } finally {
    jest.useRealTimers();
    log.mockRestore();
  }
});

it("checks authorization and PostgreSQL versions before a private cache hit, including a late stale SET", async () => {
  values.clear();
  let generation = "0",
    reads = 0,
    denied = false;
  const key = "public.fixture|id|record";
  const store: any = {
    status: async () => ({
      epoch: "test",
      cursor: "0",
      oldest: "0",
      degraded: false,
    }),
    versions: async () => ({ [key]: generation }),
    register: async () => ({
      protocol: 1,
      ref: "ref",
      epoch: "test",
      cursor: "0",
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    }),
    covered: async () => true,
  };
  const runtime = createConsistencyRuntime({
    store,
    verifyAuthorization: async () => {},
  });
  const app = new Hono();
  app.use(runtime.middleware());
  app.use(async (c, next) => {
    if (denied) return c.json({ error: "Forbidden" }, 403);
    await next();
  });
  app.use(runtime.cache());
  let release!: () => void, started!: () => void;
  let wait = false;
  const gate = new Promise<void>((resolve) => (release = resolve)),
    ready = new Promise<void>((resolve) => (started = resolve));
  app.get("/api/fixture", async (c) => {
    reads++;
    const observed = generation;
    consistencyContext.getStore()!.dependencies.set(key, observed);
    const body = {
      data: { owner: c.req.header("Authorization"), version: observed },
    };
    if (wait) {
      wait = false;
      started();
      await gate;
    }
    return c.json(body);
  });
  const request = (token = "actor-a") =>
    app.request("/api/fixture", { headers: { Authorization: token } });
  expect((await request()).status).toBe(200);
  expect((await request()).headers.get("X-SPS-Cache")).toBe("hit");
  expect(reads).toBe(1);
  expect((await (await request("actor-b")).json()).data.owner).toBe("actor-b");
  expect(reads).toBe(2);
  denied = true;
  expect((await request()).status).toBe(403);
  expect(reads).toBe(2);
  denied = false;
  values.clear();
  wait = true;
  const stale = request();
  await ready;
  generation = "1";
  await request();
  release();
  await stale;
  const reconciled = await request();
  expect((await reconciled.json()).data.version).toBe("1");
  expect(reconciled.headers.get("X-SPS-Cache")).not.toBe("hit");
});

it("observe mode always reads fresh data and reports an untracked cached-body difference", async () => {
  values.clear();
  const key = "public.fixture|reset";
  const store: any = {
    status: async () => ({
      epoch: "observe",
      cursor: "0",
      oldest: "0",
      degraded: false,
    }),
    versions: async () => ({ [key]: "0" }),
    register: async () => ({
      protocol: 1,
      ref: "shadow",
      epoch: "observe",
      cursor: "0",
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    }),
    covered: async () => true,
  };
  const runtime = createConsistencyRuntime({
    store,
    verifyAuthorization: async () => {},
  });
  const app = new Hono();
  app.use(runtime.middleware({ metadata: false }));
  app.use(runtime.cache({ observe: true }));
  let reads = 0,
    value = "before";
  app.get("/api/fixture", (c) => {
    reads++;
    consistencyContext.getStore()!.dependencies.set(key, "0");
    return c.json({ data: value });
  });
  await app.request("/api/fixture");
  const matching = await app.request("/api/fixture");
  expect(matching.headers.get("X-SPS-Cache")).toBeNull();
  expect(matching.headers.get("X-SPS-Consistency")).toBeNull();
  value = "untracked change";
  expect(await (await app.request("/api/fixture")).json()).toEqual({
    data: value,
  });
  expect(reads).toBe(3);
  expect(runtime.metrics()).toMatchObject({
    shadowMatches: 1,
    shadowMismatches: 1,
    cacheHits: 0,
  });
});
