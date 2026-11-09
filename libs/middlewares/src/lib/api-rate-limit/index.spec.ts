import { Hono } from "hono";
import { Middleware, type IMiddlewareOptions } from "./index";
import { ExceptionFilter } from "@sps/shared-backend-api";
import { logger } from "@sps/backend-utils";

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-operator-secret",
}));

function store() {
  const values = new Map<string, number>();
  return {
    incr: jest.fn(async ({ prefix, key }) => {
      const id = `${prefix}:${key}`;
      const count = (values.get(id) ?? 0) + 1;
      values.set(id, count);
      return count;
    }),
    get: jest.fn(async () => null),
  };
}

function setup(options: Partial<IMiddlewareOptions> = {}) {
  const backend = options.storeProvider ?? store();
  const resolveSubjectId = jest.fn(async (token: string) => {
    if (token.startsWith("access:")) {
      return token.split(":")[1];
    }
    throw new Error("Authentication error. Invalid token");
  });
  const middleware = new Middleware({
    enabled: true,
    storeProvider: backend,
    resolveSubjectId,
    burstPerAddress: 20,
    minutePerAddress: 100,
    burstPerSubject: 2,
    minutePerSubject: 10,
    trustedProxyCidrs: [],
    ...options,
  });
  const app = new Hono();
  const filter = new ExceptionFilter();
  app.onError((error, c) => filter.catch(error, c));
  app.use(middleware.init());
  const handler = jest.fn((c) => c.json({ ok: true }));
  app.all("*", handler);
  return { app, handler, backend, resolveSubjectId };
}

function request(
  app: Hono,
  options: {
    token?: string;
    address?: string;
    path?: string;
    method?: string;
    forwarded?: string;
    secret?: string;
    cookie?: string;
  } = {},
) {
  const headers = new Headers();
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  if (options.forwarded) {
    headers.set("X-Forwarded-For", options.forwarded);
  }
  if (options.secret) {
    headers.set("X-RBAC-SECRET-KEY", options.secret);
  }
  if (options.cookie) {
    headers.set("Cookie", `rbac.subject.jwt=${options.cookie}`);
  }
  return app.request(
    options.path ?? "/api/social/chats",
    {
      headers,
      method: options.method ?? "GET",
    },
    { requestIP: () => ({ address: options.address ?? "192.0.2.10" }) },
  );
}

beforeEach(() => {
  jest.spyOn(logger, "warn").mockImplementation(() => undefined);
  jest.spyOn(logger, "errorEvent").mockImplementation(() => undefined);
});
afterEach(() => {
  jest.restoreAllMocks();
});

it("shares one Subject budget between devices, refreshed tokens and API instances", async () => {
  const backend = store();
  const first = setup({ storeProvider: backend });
  const second = setup({ storeProvider: backend });
  expect((await request(first.app, { token: "access:alice:old" })).status).toBe(
    200,
  );
  expect(
    (
      await request(second.app, {
        token: "access:alice:new",
        address: "192.0.2.11",
      })
    ).status,
  ).toBe(200);
  const refused = await request(first.app, { cookie: "access:alice:new" });
  expect(refused.status).toBe(429);
  expect(Number(refused.headers.get("Retry-After"))).toBeGreaterThan(0);
  expect(refused.headers.get("Cache-Control")).toBe("no-store");
  expect(await refused.json()).toMatchObject({
    status: 429,
    error: expect.stringContaining("Rate limit error."),
  });
  expect((await request(first.app, { token: "access:bob" })).status).toBe(200);
  expect(first.handler).toHaveBeenCalledTimes(2);
});

it("counts changing accounts, invalid tokens and anonymous requests in the same IP budget", async () => {
  const { app, resolveSubjectId } = setup({ burstPerAddress: 3 });
  expect((await request(app, { token: "forged:alice" })).status).toBe(200);
  expect((await request(app, { token: "access:bob" })).status).toBe(200);
  expect((await request(app)).status).toBe(200);
  expect((await request(app, { token: "access:carol" })).status).toBe(429);
  expect(resolveSubjectId).toHaveBeenCalledTimes(2);
});

it("does not let private IPs, forged forwarding headers or IPv6 privacy addresses evade limits", async () => {
  const { app } = setup({ burstPerAddress: 1 });
  expect(
    (await request(app, { address: "127.0.0.1", forwarded: "1.1.1.1" })).status,
  ).toBe(200);
  expect(
    (await request(app, { address: "127.0.0.1", forwarded: "8.8.8.8" })).status,
  ).toBe(429);
  expect((await request(app, { address: "2001:db8:1:2::1" })).status).toBe(200);
  expect(
    (await request(app, { address: "2001:0db8:0001:0002::2" })).status,
  ).toBe(429);
});

it("counts all methods, public content and missing routes before their handlers", async () => {
  const { app, handler } = setup({ burstPerAddress: 3 });
  expect((await request(app, { path: "/public/a.svg" })).status).toBe(200);
  expect(
    (await request(app, { method: "POST", path: "/api/file-storage/files" }))
      .status,
  ).toBe(200);
  expect(
    (await request(app, { method: "DELETE", path: "/api/social/messages/id" }))
      .status,
  ).toBe(200);
  expect((await request(app, { path: "/missing" })).status).toBe(429);
  expect(handler).toHaveBeenCalledTimes(3);
});

it("counts sustained traffic across short windows and releases the subject automatically", async () => {
  const clock = jest.spyOn(Date, "now");
  clock.mockReturnValue(60000);
  const { app } = setup({ minutePerSubject: 2 });
  expect((await request(app, { token: "access:alice" })).status).toBe(200);
  clock.mockReturnValue(71000);
  expect((await request(app, { token: "access:alice" })).status).toBe(200);
  clock.mockReturnValue(82000);
  const refused = await request(app, { token: "access:alice" });
  expect(refused.status).toBe(429);
  expect(refused.headers.get("Retry-After")).toBe("38");
  clock.mockReturnValue(120000);
  expect((await request(app, { token: "access:alice" })).status).toBe(200);
});

it("logs one threshold transition instead of processing every refusal as a server error", async () => {
  const { app } = setup({ burstPerSubject: 1 });
  for (const attempt of [1, 2, 3, 4, 5]) {
    await request(app, { token: `access:alice:${attempt}` });
  }
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn).toHaveBeenCalledWith(
    expect.objectContaining({
      event: "rate_limit.exceeded",
      scope: "subject",
      subjectId: "alice",
    }),
  );
  expect(logger.errorEvent).not.toHaveBeenCalled();
  expect(JSON.stringify(jest.mocked(logger.warn).mock.calls)).not.toContain(
    "access:",
  );
});

it("fails closed without queuing repeated requests while the shared store is unavailable", async () => {
  const backend = store();
  backend.incr.mockRejectedValue(new Error("Redis unavailable"));
  const { app, handler } = setup({ storeProvider: backend });
  for (const attempt of [1, 2, 3]) {
    const response = await request(app, { path: `/api/items/${attempt}` });
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("1");
  }
  expect(handler).not.toHaveBeenCalled();
  expect(backend.incr).toHaveBeenCalledTimes(2);
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.errorEvent).not.toHaveBeenCalled();
});

it("exempts only verified operator calls; a wrong secret still spends the budget", async () => {
  const { app, backend } = setup({ burstPerAddress: 1 });
  for (const path of ["/api/rbac/subjects", "/api/social/messages"]) {
    expect(
      (await request(app, { path, secret: "test-operator-secret" })).status,
    ).toBe(200);
  }
  expect(backend.incr).not.toHaveBeenCalled();
  expect((await request(app, { secret: "wrong" })).status).toBe(200);
  expect((await request(app, { secret: "wrong" })).status).toBe(429);
});

it("refuses mixed header/cookie identities instead of charging a different user", async () => {
  const { app, handler, resolveSubjectId } = setup();
  const response = await request(app, {
    token: "access:alice",
    cookie: "access:bob",
  });
  expect(response.status).toBe(401);
  expect(handler).not.toHaveBeenCalled();
  expect(resolveSubjectId).not.toHaveBeenCalled();
});
