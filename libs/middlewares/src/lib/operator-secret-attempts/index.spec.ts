/**
 * BDD Suite: counting wrong operator secrets.
 *
 * Given: every API request passes a middleware that knows the configured
 *        operator secret and counts failures per client address in a KV store.
 * When: requests arrive without a secret, with a wrong one in a header or a
 *       cookie, or with the right one, from public and private addresses, with
 *       the limiter on or off.
 * Then: a wrong secret is logged without its value and counted, a request
 *       within the budget continues, an address over the budget is answered
 *       429 with Retry-After even for the right secret, the right secret from
 *       another address passes without spending an attempt, a private address
 *       is logged and never counted, and a disabled limiter only logs.
 */

const mockConfiguredSecret = "3f1c8a0d5e7b2946af13c0d8e5b7a2946f1c8a0d";
const mockWarn = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    RBAC_SECRET_KEY: mockConfiguredSecret,
  };
});

jest.mock("@sps/backend-utils", () => {
  return {
    ...jest.requireActual("@sps/backend-utils"),
    logger: {
      info: jest.fn(),
      warn: (...args: unknown[]) => mockWarn(...args),
      error: jest.fn(),
      debug: jest.fn(),
    },
  };
});

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Middleware } from "./index";

const WRONG_SECRET = "0000000000000000000000000000000000000000";

function createStore() {
  const counters = new Map<string, number>();

  return {
    counters,
    storeProvider: {
      incr: jest.fn(async (props: { prefix: string; key: string }) => {
        const counter = `${props.prefix}:${props.key}`;
        const value = (counters.get(counter) || 0) + 1;

        counters.set(counter, value);

        return value;
      }),
      get: jest.fn(async (props: { prefix: string; key: string }) => {
        const value = counters.get(`${props.prefix}:${props.key}`);

        return value === undefined ? null : String(value);
      }),
    },
  };
}

function createApi(props: {
  storeProvider: ReturnType<typeof createStore>["storeProvider"];
  enabled?: boolean;
}) {
  const handler = jest.fn((c: any) => c.json({ data: [] }));
  const app = new Hono();

  // Answers like the API exception filter: the thrown status, with the
  // headers already set on the context.
  app.onError((error, c) => {
    const status = error instanceof HTTPException ? error.status : 500;

    return c.json({ status, error: error.message }, status);
  });
  app.use(
    new Middleware({
      storeProvider: props.storeProvider,
      enabled: props.enabled ?? true,
      windowInSeconds: 60,
      trustedProxies: 1,
      failuresPerAddress: 2,
    }).init(),
  );
  app.get("/api/rbac/permissions", handler);

  return { app, handler };
}

function request(
  app: Hono,
  props: { address: string; secret?: string; cookie?: string },
) {
  const headers: Record<string, string> = { "X-Forwarded-For": props.address };

  if (props.secret) {
    headers["X-RBAC-SECRET-KEY"] = props.secret;
  }

  if (props.cookie) {
    headers["Cookie"] = `rbac.secret-key=${props.cookie}`;
  }

  return app.request("/api/rbac/permissions", { headers });
}

describe("Given: requests that present an operator secret", () => {
  beforeEach(() => {
    mockWarn.mockClear();
  });

  /**
   * BDD Scenario
   * Given: a request without any operator secret.
   * When: it passes the middleware.
   * Then: it reaches the handler, nothing is counted and nothing is logged.
   */
  it("leaves a request without a secret untouched", async () => {
    const { storeProvider } = createStore();
    const { app, handler } = createApi({ storeProvider });

    const response = await request(app, { address: "203.0.113.9" });

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(storeProvider.incr).not.toHaveBeenCalled();
    expect(storeProvider.get).not.toHaveBeenCalled();
    expect(mockWarn).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a request with a wrong secret from an address within its budget.
   * When: it passes the middleware.
   * Then: it continues to the handler, one attempt is counted, and one
   *       warning names the path and the address but not the presented value.
   */
  it("logs and counts a wrong secret, then lets the request continue", async () => {
    const { storeProvider } = createStore();
    const { app, handler } = createApi({ storeProvider });

    const response = await request(app, {
      address: "203.0.113.9",
      secret: WRONG_SECRET,
    });

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(storeProvider.incr).toHaveBeenCalledTimes(1);
    expect(mockWarn).toHaveBeenCalledTimes(1);

    const line = String(mockWarn.mock.calls[0][0]);

    expect(line).toContain("/api/rbac/permissions");
    expect(line).toContain("203.0.113.9");
    expect(line).toContain("attempt 1 of 2");
    expect(line).not.toContain(WRONG_SECRET);
    expect(line).not.toContain(mockConfiguredSecret);
  });

  /**
   * BDD Scenario
   * Given: an address that presented two wrong secrets, its whole budget.
   * When: it presents a third.
   * Then: the request is answered 429 with Retry-After before the handler.
   */
  it("refuses an address over its budget with 429 and Retry-After", async () => {
    const { storeProvider } = createStore();
    const { app, handler } = createApi({ storeProvider });

    await request(app, { address: "203.0.113.9", secret: WRONG_SECRET });
    await request(app, { address: "203.0.113.9", secret: WRONG_SECRET });

    const refused = await request(app, {
      address: "203.0.113.9",
      secret: WRONG_SECRET,
    });

    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  /**
   * BDD Scenario
   * Given: an address over its budget of wrong secrets.
   * When: it presents the right secret.
   * Then: the request is refused as well, so a guess cannot be confirmed.
   */
  it("refuses even the right secret from an address over its budget", async () => {
    const { storeProvider } = createStore();
    const { app, handler } = createApi({ storeProvider });

    for (let attempt = 0; attempt < 3; attempt++) {
      await request(app, { address: "203.0.113.9", secret: WRONG_SECRET });
    }

    const response = await request(app, {
      address: "203.0.113.9",
      secret: mockConfiguredSecret,
    });

    expect(response.status).toBe(429);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  /**
   * BDD Scenario
   * Given: one address is over its budget.
   * When: another address presents the right secret several times.
   * Then: every request passes, nothing is logged and no attempt is spent.
   */
  it("lets the right secret from another address pass without spending attempts", async () => {
    const { storeProvider } = createStore();
    const { app } = createApi({ storeProvider });

    for (let attempt = 0; attempt < 3; attempt++) {
      await request(app, { address: "203.0.113.9", secret: WRONG_SECRET });
    }

    mockWarn.mockClear();
    storeProvider.incr.mockClear();

    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await request(app, {
        address: "198.51.100.7",
        secret: mockConfiguredSecret,
      });

      expect(response.status).toBe(200);
    }

    expect(storeProvider.incr).not.toHaveBeenCalled();
    expect(mockWarn).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a wrong secret in the rbac.secret-key cookie rather than the header.
   * When: the address presents it past its budget.
   * Then: it is logged, counted and refused like the header.
   */
  it("counts a wrong secret presented in the cookie", async () => {
    const { storeProvider } = createStore();
    const { app } = createApi({ storeProvider });

    await request(app, { address: "203.0.113.9", cookie: WRONG_SECRET });
    await request(app, { address: "203.0.113.9", cookie: WRONG_SECRET });

    const refused = await request(app, {
      address: "203.0.113.9",
      cookie: WRONG_SECRET,
    });

    expect(refused.status).toBe(429);
    expect(mockWarn).toHaveBeenCalledTimes(3);
  });
});

describe("Given: wrong secrets the middleware logs but does not count", () => {
  beforeEach(() => {
    mockWarn.mockClear();
  });

  /**
   * BDD Scenario
   * Given: wrong secrets forwarded from a private network address.
   * When: more arrive than the budget allows.
   * Then: each is logged, none is counted and none is refused.
   */
  it("logs a private network address without counting or refusing it", async () => {
    const { storeProvider } = createStore();
    const { app, handler } = createApi({ storeProvider });

    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await request(app, {
        address: "10.0.0.2",
        secret: WRONG_SECRET,
      });

      expect(response.status).toBe(200);
    }

    expect(handler).toHaveBeenCalledTimes(4);
    expect(storeProvider.incr).not.toHaveBeenCalled();
    expect(mockWarn).toHaveBeenCalledTimes(4);
    expect(String(mockWarn.mock.calls[0][0])).toContain("10.0.0.2");
  });

  /**
   * BDD Scenario
   * Given: the limiter is turned off, as for a load test.
   * When: an address presents more wrong secrets than the budget.
   * Then: none is refused or counted, and each is still logged.
   */
  it("only logs when disabled", async () => {
    const { storeProvider } = createStore();
    const { app, handler } = createApi({ storeProvider, enabled: false });

    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await request(app, {
        address: "203.0.113.9",
        secret: WRONG_SECRET,
      });

      expect(response.status).toBe(200);
    }

    expect(handler).toHaveBeenCalledTimes(4);
    expect(storeProvider.incr).not.toHaveBeenCalled();
    expect(mockWarn).toHaveBeenCalledTimes(4);
  });
});
