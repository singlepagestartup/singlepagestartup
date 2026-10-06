/**
 * BDD Suite: attempt budgets on subject authentication routes.
 *
 * Given: a route guarded by a per-address budget and, for sign-in, a
 *        per-account budget, counted in a shared KV store.
 * When: clients send requests from public and private addresses, for one or
 *       several accounts, across windows, with the limiter on, off or without
 *       a working store.
 * Then: requests within a budget reach the handler, the first request over a
 *       budget is answered 429 with Retry-After before the handler runs, a new
 *       window admits requests again, an account budget holds across
 *       addresses and letter case, a private address is never counted, and a
 *       disabled limiter or a failing store refuses nothing.
 */

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type IRateLimitStoreProvider } from "@sps/backend-utils";
import { Middleware, type IMiddlewareRule } from ".";

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
      get: jest.fn(async () => null),
    },
  };
}

function createRoute(props: {
  rule: IMiddlewareRule;
  storeProvider: IRateLimitStoreProvider;
  enabled?: boolean;
}) {
  const handler = jest.fn((c: any) => c.json({ ok: true }, 201));
  const app = new Hono();

  // Answers like the API exception filter: the thrown status, with the
  // headers already set on the context.
  app.onError((error, c) => {
    const status = error instanceof HTTPException ? error.status : 500;

    return c.json({ status, error: error.message }, status);
  });

  app.post(
    "/login",
    new Middleware({
      storeProvider: props.storeProvider,
      enabled: props.enabled ?? true,
      windowInSeconds: 60,
      trustedProxies: 1,
    }).init(props.rule),
    handler,
  );

  return { app, handler };
}

function signIn(app: Hono, props: { address?: string; login?: string }) {
  const form = new FormData();

  form.set(
    "data",
    JSON.stringify({
      login: props.login ?? "owner@example.com",
      password: "not-the-password",
    }),
  );

  return app.request("/login", {
    method: "POST",
    body: form,
    headers: props.address ? { "X-Forwarded-For": props.address } : {},
  });
}

const ADDRESS_RULE: IMiddlewareRule = {
  name: "email-and-password-authentication",
  attemptsPerAddress: 3,
};

const ACCOUNT_RULE: IMiddlewareRule = {
  name: "email-and-password-authentication",
  attemptsPerAddress: 100,
  attemptsPerAccount: 2,
  accountField: "login",
};

describe("Given: a route with a per-address budget", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario
   * Given: a budget of three attempts per address.
   * When: one public address sends three requests.
   * Then: all three reach the handler.
   */
  it("lets requests within the budget reach the handler", async () => {
    const { storeProvider } = createStore();
    const { app, handler } = createRoute({ rule: ADDRESS_RULE, storeProvider });

    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await signIn(app, { address: "203.0.113.9" });

      expect(response.status).toBe(201);
    }

    expect(handler).toHaveBeenCalledTimes(3);
  });

  /**
   * BDD Scenario
   * Given: an address that spent its budget of three.
   * When: it sends a fourth request.
   * Then: the request is answered 429 with Retry-After and never reaches the handler.
   */
  it("answers the request over the budget with 429 and Retry-After", async () => {
    const { storeProvider } = createStore();
    const { app, handler } = createRoute({ rule: ADDRESS_RULE, storeProvider });

    for (let attempt = 0; attempt < 3; attempt++) {
      await signIn(app, { address: "203.0.113.9" });
    }

    const refused = await signIn(app, { address: "203.0.113.9" });

    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  /**
   * BDD Scenario
   * Given: an address refused in one window.
   * When: the next window begins.
   * Then: its next request reaches the handler again.
   */
  it("admits the address again once the window is over", async () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const { storeProvider } = createStore();
    const { app } = createRoute({ rule: ADDRESS_RULE, storeProvider });

    for (let attempt = 0; attempt < 3; attempt++) {
      await signIn(app, { address: "203.0.113.9" });
    }

    expect((await signIn(app, { address: "203.0.113.9" })).status).toBe(429);

    now.mockReturnValue(61_000);

    expect((await signIn(app, { address: "203.0.113.9" })).status).toBe(201);
  });

  /**
   * BDD Scenario
   * Given: one address spent its budget.
   * When: another public address sends a request.
   * Then: that request reaches the handler.
   */
  it("keeps one budget per address", async () => {
    const { storeProvider } = createStore();
    const { app } = createRoute({ rule: ADDRESS_RULE, storeProvider });

    for (let attempt = 0; attempt < 4; attempt++) {
      await signIn(app, { address: "203.0.113.9" });
    }

    expect((await signIn(app, { address: "198.51.100.7" })).status).toBe(201);
  });

  /**
   * BDD Scenario
   * Given: requests forwarded from a private network address, such as the
   *        swarm ingress that stands in for every visitor.
   * When: that address sends more requests than the budget.
   * Then: every request reaches the handler and no address counter is written.
   */
  it("never counts a private network address", async () => {
    const { storeProvider } = createStore();
    const { app, handler } = createRoute({ rule: ADDRESS_RULE, storeProvider });

    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await signIn(app, { address: "10.0.0.2" })).status).toBe(201);
    }

    expect(handler).toHaveBeenCalledTimes(5);
    expect(storeProvider.incr).not.toHaveBeenCalled();
  });
});

describe("Given: a sign-in route with a per-account budget", () => {
  /**
   * BDD Scenario
   * Given: a budget of two attempts per account.
   * When: three different addresses try the same account.
   * Then: the third attempt is answered 429, while another account still
   *       reaches the handler.
   */
  it("holds the account budget across addresses", async () => {
    const { storeProvider } = createStore();
    const { app } = createRoute({ rule: ACCOUNT_RULE, storeProvider });

    expect((await signIn(app, { address: "203.0.113.1" })).status).toBe(201);
    expect((await signIn(app, { address: "203.0.113.2" })).status).toBe(201);
    expect((await signIn(app, { address: "203.0.113.3" })).status).toBe(429);
    expect(
      (
        await signIn(app, {
          address: "203.0.113.4",
          login: "someone-else@example.com",
        })
      ).status,
    ).toBe(201);
  });

  /**
   * BDD Scenario
   * Given: the same account written in two letter cases.
   * When: both spellings are tried past the budget.
   * Then: they share one budget.
   */
  it("counts an account once whatever its letter case", async () => {
    const { storeProvider } = createStore();
    const { app } = createRoute({ rule: ACCOUNT_RULE, storeProvider });

    await signIn(app, { address: "203.0.113.1", login: "Owner@Example.com" });
    await signIn(app, { address: "203.0.113.2", login: "owner@example.com" });

    expect(
      (
        await signIn(app, {
          address: "203.0.113.3",
          login: " OWNER@example.com ",
        })
      ).status,
    ).toBe(429);
  });

  /**
   * BDD Scenario
   * Given: requests from a private network address.
   * When: they try one account past its budget.
   * Then: the account budget still applies.
   */
  it("applies the account budget to private network addresses", async () => {
    const { storeProvider } = createStore();
    const { app } = createRoute({ rule: ACCOUNT_RULE, storeProvider });

    await signIn(app, { address: "10.0.0.2" });
    await signIn(app, { address: "10.0.0.2" });

    expect((await signIn(app, { address: "10.0.0.2" })).status).toBe(429);
  });
});

describe("Given: the limiter cannot or may not count", () => {
  /**
   * BDD Scenario
   * Given: the limiter is turned off, as for a load test.
   * When: one address sends more requests than any budget.
   * Then: every request reaches the handler and the store is not used.
   */
  it("refuses nothing when disabled", async () => {
    const { storeProvider } = createStore();
    const { app, handler } = createRoute({
      rule: ACCOUNT_RULE,
      storeProvider,
      enabled: false,
    });

    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await signIn(app, { address: "203.0.113.9" })).status).toBe(201);
    }

    expect(handler).toHaveBeenCalledTimes(5);
    expect(storeProvider.incr).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a KV store that rejects every call.
   * When: one address sends more requests than its budget.
   * Then: every request reaches the handler.
   */
  it("lets requests through when the store fails", async () => {
    const storeProvider = {
      incr: jest.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
      get: jest.fn(async () => null),
    };
    const { app, handler } = createRoute({ rule: ADDRESS_RULE, storeProvider });

    for (let attempt = 0; attempt < 5; attempt++) {
      expect((await signIn(app, { address: "203.0.113.9" })).status).toBe(201);
    }

    expect(handler).toHaveBeenCalledTimes(5);
  });
});
