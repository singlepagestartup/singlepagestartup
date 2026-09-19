/**
 * BDD Suite: HTTP-cache fail-open guard (issue #233).
 *
 * Given: a KV operation that rejects, never settles, or recovers.
 * When:  the guard runs it on behalf of a request.
 * Then:  the caller always receives a value within the deadline, and an
 *        outage is reported once per backoff interval instead of once per
 *        request.
 */

jest.mock("@sps/backend-utils", () => {
  return {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
  };
});

import { createCacheGuard } from "./guard";

function createRecordingLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
  };
}

describe("createCacheGuard", () => {
  /**
   * BDD Scenario: A healthy store answers the caller.
   */
  it("returns the store's value when the operation succeeds", async () => {
    const guard = createCacheGuard({ logger: createRecordingLogger() });

    const value = await guard.run({
      name: "version read",
      fallback: null,
      execute: async () => "7",
    });

    expect(value).toBe("7");
  });

  /**
   * BDD Scenario: A rejected KV call becomes a miss.
   * Given: a store that rejects every command (Redis down, offline queue off).
   * When:  the guard runs the read.
   * Then:  the caller receives its fallback and no exception escapes.
   */
  it("serves the fallback when the operation rejects", async () => {
    const guard = createCacheGuard({ logger: createRecordingLogger() });

    const value = await guard.run({
      name: "version read",
      fallback: null,
      execute: async () => {
        throw new Error("Stream isn't writeable");
      },
    });

    expect(value).toBeNull();
  });

  /**
   * BDD Scenario: A hanging KV call cannot hold the request.
   * Given: an operation that never settles — the production failure mode
   *        after the Redis restart.
   * When:  the guard runs it with a deadline.
   * Then:  the caller receives its fallback once the deadline passes.
   */
  it("serves the fallback when the operation never settles", async () => {
    const guard = createCacheGuard({
      timeoutMs: 20,
      logger: createRecordingLogger(),
    });

    const value = await guard.run({
      name: "response read",
      fallback: "miss",
      execute: () => new Promise<string>(() => undefined),
    });

    expect(value).toBe("miss");
  });

  /**
   * BDD Scenario: An outage is reported once, not once per request.
   * Given: a store that keeps failing inside one backoff interval.
   * When:  many requests run their cache reads through the guard.
   * Then:  exactly one warning is written, and it names the suppressed count
   *        when the interval elapses.
   */
  it("reports one warning per backoff interval while the store is down", async () => {
    const logger = createRecordingLogger();
    let clock = 0;
    const guard = createCacheGuard({
      logIntervalMs: 1000,
      logger,
      now: () => clock,
    });

    const fail = async () =>
      guard.run({
        name: "version read",
        fallback: null,
        execute: async () => {
          throw new Error("connection refused");
        },
      });

    await fail();
    await fail();
    await fail();

    expect(logger.warn).toHaveBeenCalledTimes(1);

    clock = 2000;
    await fail();

    expect(logger.warn).toHaveBeenCalledTimes(2);
    expect(logger.warn.mock.calls[1][0]).toContain("2 similar failures");
  });

  /**
   * BDD Scenario: Recovery is announced once.
   * Given: a guard that has already reported an outage.
   * When:  the store answers again, and keeps answering.
   * Then:  one recovery line is written, not one per successful request.
   */
  it("reports recovery once after the store answers again", async () => {
    const logger = createRecordingLogger();
    const guard = createCacheGuard({ logger });

    await guard.run({
      name: "version read",
      fallback: null,
      execute: async () => {
        throw new Error("connection refused");
      },
    });

    await guard.run({
      name: "version read",
      fallback: null,
      execute: async () => "1",
    });
    await guard.run({
      name: "version read",
      fallback: null,
      execute: async () => "1",
    });

    expect(logger.info).toHaveBeenCalledTimes(1);
  });
});
