/**
 * BDD Suite: fixed-window attempt counters in the KV store.
 *
 * Given: a limiter over a KV store and a clock the test controls.
 * When: attempts are counted and read within and across windows, the store
 *       fails, and a request over its budget is refused.
 * Then: the attempt that exceeds a budget is reported with the seconds left in
 *       its window, a new window starts empty, reading spends nothing, a
 *       failing or silent store reports nothing and is logged once per
 *       interval, and the refusal answers 429 with Retry-After.
 */

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  assertWithinRateLimit,
  createRateLimiter,
  type IRateLimitAttempts,
  type IRateLimitStoreProvider,
} from "./index";

const WINDOW = {
  prefix: "rate-limit:test",
  key: "203.0.113.9",
  limit: 3,
  windowInSeconds: 60,
};

function createStore() {
  const counters = new Map<string, number>();
  const ttls: number[] = [];
  const storeProvider: IRateLimitStoreProvider = {
    async incr({ prefix, key, options }) {
      const counter = `${prefix}:${key}`;
      const value = (counters.get(counter) || 0) + 1;

      counters.set(counter, value);

      if (options?.ttl) {
        ttls.push(options.ttl);
      }

      return value;
    },
    async get({ prefix, key }) {
      const value = counters.get(`${prefix}:${key}`);

      return value === undefined ? null : String(value);
    },
  };

  return { counters, ttls, storeProvider };
}

function createLogger() {
  return { info: jest.fn(), warn: jest.fn() };
}

describe("Given: a limiter over a working store", () => {
  /**
   * BDD Scenario
   * Given: a budget of three attempts per window.
   * When: four attempts are counted in one window.
   * Then: the first three are within budget and the fourth is reported limited.
   */
  it("reports the attempt that exceeds the budget as limited", async () => {
    const { storeProvider } = createStore();
    const limiter = createRateLimiter({ storeProvider, now: () => 0 });

    const results: IRateLimitAttempts[] = [];

    for (let attempt = 0; attempt < 4; attempt++) {
      results.push((await limiter.count(WINDOW))!);
    }

    expect(results.map((result) => result.attempts)).toEqual([1, 2, 3, 4]);
    expect(results.map((result) => result.limited)).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });

  /**
   * BDD Scenario
   * Given: an attempt made 30 seconds into a 60-second window.
   * When: it is counted.
   * Then: the report gives 30 seconds until the window ends, and the counter is
   *       written with a TTL of one window.
   */
  it("reports the seconds left in the window and expires the counter with it", async () => {
    const { storeProvider, ttls } = createStore();
    const limiter = createRateLimiter({ storeProvider, now: () => 90_000 });

    const result = await limiter.count(WINDOW);

    expect(result?.retryAfterInSeconds).toBe(30);
    expect(ttls).toEqual([60]);
  });

  /**
   * BDD Scenario
   * Given: a window whose budget was exceeded.
   * When: the next window begins and an attempt is counted.
   * Then: the attempt is the first of the new window and within budget.
   */
  it("starts a new window with no attempts", async () => {
    const { storeProvider } = createStore();
    let clock = 0;
    const limiter = createRateLimiter({ storeProvider, now: () => clock });

    for (let attempt = 0; attempt < 4; attempt++) {
      await limiter.count(WINDOW);
    }

    clock = 60_000;

    await expect(limiter.count(WINDOW)).resolves.toMatchObject({
      attempts: 1,
      limited: false,
    });
  });

  /**
   * BDD Scenario
   * Given: two attempts counted in a window.
   * When: the window is read twice.
   * Then: both reads report two attempts, and nothing was spent by reading.
   */
  it("reads a window without spending an attempt", async () => {
    const { storeProvider } = createStore();
    const limiter = createRateLimiter({ storeProvider, now: () => 0 });

    await limiter.count(WINDOW);
    await limiter.count(WINDOW);

    await expect(limiter.read(WINDOW)).resolves.toMatchObject({
      attempts: 2,
      limited: false,
    });
    await expect(limiter.read(WINDOW)).resolves.toMatchObject({ attempts: 2 });
  });

  /**
   * BDD Scenario
   * Given: a window nobody has counted in.
   * When: it is read.
   * Then: it reports no attempts.
   */
  it("reads an untouched window as empty", async () => {
    const { storeProvider } = createStore();
    const limiter = createRateLimiter({ storeProvider, now: () => 0 });

    await expect(limiter.read(WINDOW)).resolves.toMatchObject({
      attempts: 0,
      limited: false,
    });
  });
});

describe("Given: a limiter over a store that fails", () => {
  /**
   * BDD Scenario
   * Given: a store that rejects every call.
   * When: attempts are counted twice within one log interval and once after it.
   * Then: nothing is reported, so the caller lets the request through, and a
   *       warning is written once per interval with the suppressed count.
   */
  it("reports nothing and warns once per interval while the store rejects", async () => {
    const logger = createLogger();
    let clock = 0;
    const limiter = createRateLimiter({
      storeProvider: {
        incr: async () => {
          throw new Error("ECONNREFUSED");
        },
        get: async () => null,
      },
      logger,
      logIntervalMs: 1000,
      now: () => clock,
    });

    await expect(limiter.count(WINDOW)).resolves.toBeUndefined();
    await expect(limiter.count(WINDOW)).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn.mock.calls[0][0]).toContain("ECONNREFUSED");

    clock = 2000;

    await expect(limiter.count(WINDOW)).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledTimes(2);
    expect(logger.warn.mock.calls[1][0]).toContain("1 similar failures");
  });

  /**
   * BDD Scenario
   * Given: a store that never answers.
   * When: a window is read.
   * Then: the limiter gives up at its deadline and reports nothing.
   */
  it("reports nothing when the store does not answer before the deadline", async () => {
    const logger = createLogger();
    const limiter = createRateLimiter({
      storeProvider: {
        incr: () => new Promise<number>(() => undefined),
        get: () => new Promise<string | null>(() => undefined),
      },
      logger,
      timeoutMs: 5,
    });

    await expect(limiter.read(WINDOW)).resolves.toBeUndefined();
    expect(logger.warn.mock.calls[0][0]).toContain("timed out after 5ms");
  });

  /**
   * BDD Scenario
   * Given: a store that failed once and answers again.
   * When: the next attempt is counted.
   * Then: it is counted and the recovery is logged once.
   */
  it("logs recovery once when the store answers again", async () => {
    const logger = createLogger();
    const { storeProvider } = createStore();
    let failing = true;
    const limiter = createRateLimiter({
      storeProvider: {
        ...storeProvider,
        incr: async (props) => {
          if (failing) {
            throw new Error("ECONNRESET");
          }

          return storeProvider.incr(props);
        },
      },
      logger,
      now: () => 0,
    });

    await limiter.count(WINDOW);
    failing = false;

    await expect(limiter.count(WINDOW)).resolves.toMatchObject({
      attempts: 1,
    });
    await limiter.count(WINDOW);

    expect(logger.info).toHaveBeenCalledTimes(1);
  });
});

describe("Given: a request checked against its window", () => {
  function createApp(attempts?: IRateLimitAttempts) {
    const app = new Hono();

    app.onError((error, c) => {
      const status = error instanceof HTTPException ? error.status : 500;

      return c.json({ error: error.message }, status);
    });
    app.post("/login", (c) => {
      assertWithinRateLimit(c, attempts);

      return c.json({ ok: true });
    });

    return app;
  }

  /**
   * BDD Scenario
   * Given: a window over its budget with 30 seconds left.
   * When: the request is checked.
   * Then: it is answered 429 with Retry-After: 30.
   */
  it("answers 429 with Retry-After when the window is over its budget", async () => {
    const response = await createApp({
      attempts: 4,
      limited: true,
      retryAfterInSeconds: 30,
    }).request("/login", { method: "POST" });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
  });

  /**
   * BDD Scenario
   * Given: a window within budget, or one the store could not report.
   * When: the request is checked.
   * Then: it continues without a Retry-After header.
   */
  it.each([
    [{ attempts: 3, limited: false, retryAfterInSeconds: 30 }],
    [undefined],
  ])("lets the request continue for %p", async (attempts) => {
    const response = await createApp(attempts).request("/login", {
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Retry-After")).toBeNull();
  });
});
