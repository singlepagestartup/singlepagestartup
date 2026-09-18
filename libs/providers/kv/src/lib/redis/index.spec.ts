/**
 * BDD Suite: bounded shared Redis client (issue #233).
 *
 * Given: the process-wide KV client the API uses for its response cache.
 * When:  it is configured, it reports connection state, or it bumps a counter.
 * Then:  every command carries a deadline and fails fast instead of queueing,
 *        an outage is reported once per state change, and a counter with a TTL
 *        has that TTL refreshed on every increment.
 */

jest.mock("ioredis", () => {
  const instances: any[] = [];

  class FakeRedis {
    options: any;
    listeners: Record<string, Array<(...args: any[]) => void>> = {};
    incr = jest.fn(async () => 5);
    expire = jest.fn(async () => 1);
    get = jest.fn(async () => null);
    set = jest.fn(async () => "OK");
    del = jest.fn(async () => 1);
    quit = jest.fn(async () => "OK");

    constructor(options: any) {
      this.options = options;
      instances.push(this);
    }

    on(event: string, listener: (...args: any[]) => void) {
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push(listener);

      return this;
    }

    emit(event: string, ...args: any[]) {
      (this.listeners[event] || []).forEach((listener) => listener(...args));
    }
  }

  return { Redis: FakeRedis, __instances: instances };
});

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

import {
  KV_COMMAND_TIMEOUT_MS,
  KV_CONNECT_TIMEOUT_MS,
  KV_ENABLE_OFFLINE_QUEUE,
  KV_MAX_RETRIES_PER_REQUEST,
} from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";
import {
  Provider,
  attachConnectionStateLogging,
  buildRedisOptions,
} from "./index";

const redisMock = jest.requireMock("ioredis") as { __instances: any[] };

function createFakeClient() {
  const listeners: Record<string, Array<(...args: any[]) => void>> = {};

  return {
    on(event: string, listener: (...args: any[]) => void) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(listener);

      return this;
    },
    emit(event: string, ...args: any[]) {
      (listeners[event] || []).forEach((listener) => listener(...args));
    },
  };
}

describe("buildRedisOptions", () => {
  /**
   * BDD Scenario: Every command carries a deadline.
   * Given: the KV timeout environment knobs.
   * When:  the client options are built.
   * Then:  the connection and command deadlines and the retry budget come
   *        from those knobs.
   */
  it("bounds connection, command, and retries from the environment", () => {
    const options = buildRedisOptions();

    expect(options.connectTimeout).toBe(KV_CONNECT_TIMEOUT_MS);
    expect(options.commandTimeout).toBe(KV_COMMAND_TIMEOUT_MS);
    expect(options.maxRetriesPerRequest).toBe(KV_MAX_RETRIES_PER_REQUEST);
  });

  /**
   * BDD Scenario: A command issued while the connection is down fails fast.
   * Given: ioredis buffers commands in an offline queue by default, which is
   *        how a Redis outage became an indefinitely pending request.
   * When:  the client options are built.
   * Then:  the offline queue is disabled and reconnection still happens.
   */
  it("disables the offline queue while still reconnecting", () => {
    const options = buildRedisOptions();

    expect(options.enableOfflineQueue).toBe(KV_ENABLE_OFFLINE_QUEUE);
    expect(KV_ENABLE_OFFLINE_QUEUE).toBe(false);
    expect(
      (options.reconnectOnError as (error: Error) => boolean)(
        new Error("READONLY"),
      ),
    ).toBe(true);
  });
});

describe("attachConnectionStateLogging", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: An outage is logged once, not once per reconnect attempt.
   * Given: a client that emits the same error repeatedly while Redis is down.
   * When:  the errors arrive.
   * Then:  one warning is written.
   */
  it("reports a repeated connection error once", () => {
    const client = createFakeClient();
    attachConnectionStateLogging(client as any);

    client.emit("error", new Error("connect ECONNREFUSED"));
    client.emit("error", new Error("connect ECONNREFUSED"));
    client.emit("error", new Error("connect ECONNREFUSED"));

    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: Recovery is visible without a restart.
   * Given: a client that has reported an outage.
   * When:  it becomes ready again.
   * Then:  one recovery line is written, and a later ready event is quiet.
   */
  it("reports recovery once when the client is ready again", () => {
    const client = createFakeClient();
    attachConnectionStateLogging(client as any);

    client.emit("error", new Error("connect ECONNREFUSED"));
    client.emit("ready");
    client.emit("ready");

    expect(logger.info).toHaveBeenCalledTimes(1);
  });
});

describe("Provider.incr", () => {
  /**
   * BDD Scenario: A counter's expiry is refreshed on every bump.
   * Given: a counter that already exists (the increment does not return 1).
   * When:  it is incremented with a TTL.
   * Then:  the expiry is set again, so a counter that keeps being bumped
   *        still expires once its path goes idle.
   */
  it("refreshes the expiry on an existing counter", async () => {
    const provider = new Provider();
    const client = redisMock.__instances[0];

    await provider.incr({
      prefix: "http-cache:version",
      key: "/api/rbac/subjects",
      options: { ttl: 30 },
    });

    expect(client.incr).toHaveBeenCalledTimes(1);
    expect(client.expire).toHaveBeenCalledWith(expect.any(String), 30);
  });

  /**
   * BDD Scenario: A counter without a TTL is left alone.
   */
  it("does not set an expiry when no TTL is supplied", async () => {
    const provider = new Provider();
    const client = redisMock.__instances[0];
    client.expire.mockClear();

    await provider.incr({
      prefix: "http-cache:version",
      key: "/api/rbac/subjects",
    });

    expect(client.expire).not.toHaveBeenCalled();
  });
});
