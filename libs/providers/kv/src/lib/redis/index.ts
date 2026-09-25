import type { IProvider } from "../interface";
import { Redis, RedisOptions } from "ioredis";
import {
  KV_PORT,
  KV_USERNAME,
  KV_PASSWORD,
  KV_HOST,
  KV_COMMAND_TIMEOUT_MS,
  KV_CONNECT_TIMEOUT_MS,
  KV_ENABLE_OFFLINE_QUEUE,
  KV_MAX_RETRIES_PER_REQUEST,
  hash,
} from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";

/**
 * Bounded client options (issue #233).
 *
 * The production incident turned a Redis outage into a permanently hanging
 * API process: without `commandTimeout` a sent command could wait forever,
 * and with ioredis's default offline queue a command issued while the socket
 * was down was buffered instead of failing. Every option below exists to make
 * a failing cache fail FAST, so the caller can fall back to the handler:
 *
 * - `connectTimeout` / `commandTimeout` — hard deadlines, from the env.
 * - `maxRetriesPerRequest` — small, so a command is not resent across many
 *   reconnect cycles before it is failed.
 * - `enableOfflineQueue` — off by default, so a command issued while the
 *   connection is down rejects at once instead of waiting for the reconnect.
 *   This also covers the window between `new Redis()` and `ready`. A project
 *   that prefers absorbing short reconnects sets `KV_ENABLE_OFFLINE_QUEUE`;
 *   `commandTimeout` bounds a queued command too, so the wait stays bounded.
 * - `reconnectOnError` — still always reconnects, but no longer logs per
 *   error; connection-state logging is attached once per client below.
 */
export function buildRedisOptions(): RedisOptions {
  return {
    host: KV_HOST,
    port: KV_PORT,
    username: KV_USERNAME,
    password: KV_PASSWORD,
    connectTimeout: KV_CONNECT_TIMEOUT_MS,
    commandTimeout: KV_COMMAND_TIMEOUT_MS,
    maxRetriesPerRequest: KV_MAX_RETRIES_PER_REQUEST,
    enableOfflineQueue: KV_ENABLE_OFFLINE_QUEUE,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    reconnectOnError: () => true,
  };
}

/**
 * Reports connection state changes once each (issue #233). While Redis is
 * down ioredis emits an `error` per reconnect attempt and every consumer
 * emits one per failed command; logging all of them buries the outage in its
 * own noise. A repeated identical error while already degraded is dropped.
 */
export function attachConnectionStateLogging(client: Redis): void {
  let lastReportedError: string | undefined;
  let isDegraded = false;

  client.on("error", (error: Error) => {
    const message = error?.message || String(error);

    if (isDegraded && message === lastReportedError) {
      return;
    }

    isDegraded = true;
    lastReportedError = message;

    logger.warn(`KV connection error: ${message}`);
  });

  client.on("ready", () => {
    if (!isDegraded) {
      return;
    }

    isDegraded = false;
    lastReportedError = undefined;

    logger.info("KV connection restored.");
  });
}

export class Provider implements IProvider {
  private static instance: Redis;
  private static isShutdownHookSet = false;

  client: Redis;

  constructor() {
    if (!Provider.instance) {
      Provider.instance = new Redis(buildRedisOptions());
      this.client = Provider.instance;

      attachConnectionStateLogging(Provider.instance);

      if (!Provider.isShutdownHookSet) {
        Provider.isShutdownHookSet = true;

        const shutdown = async () => {
          if (Provider.instance) {
            await Provider.instance.quit();
            logger.debug("Redis connection closed.");
          }
          process.exit(0);
        };

        process.removeAllListeners("SIGINT");
        process.removeAllListeners("SIGTERM");

        process.once("SIGINT", shutdown);
        process.once("SIGTERM", shutdown);
      }
    } else {
      this.client = Provider.instance;
    }
  }

  async connect(): Promise<void> {
    //
  }

  async hashKey(props: { key: string }): Promise<string> {
    return hash.sha256(props.key);
  }

  async get(props: { prefix: string; key: string }): Promise<string | null> {
    const hashedKey = await this.hashKey({ key: props.key });
    return this.client.get(`${props.prefix}:${hashedKey}`);
  }

  async incr(props: {
    prefix: string;
    key: string;
    options?: { ttl?: number };
  }): Promise<number> {
    const hashedKey = await this.hashKey({ key: props.key });
    const redisKey = `${props.prefix}:${hashedKey}`;
    const value = await this.client.incr(redisKey);

    // Issue #233: refresh the expiry on EVERY increment, not only when the
    // counter is created. A counter that is bumped forever used to keep its
    // missing (or first) TTL forever, which is how `http-cache:version:*`
    // became the part of the key space nothing could reclaim.
    if (props.options?.ttl) {
      await this.client.expire(redisKey, props.options.ttl);
    }

    return value;
  }

  async set(props: {
    prefix: string;
    key: string;
    value: string;
    options: { ttl: number };
  }): Promise<string | undefined | null> {
    const hashedKey = await this.hashKey({ key: props.key });
    return this.client.set(
      `${props.prefix}:${hashedKey}`,
      props.value,
      "EX",
      props.options.ttl,
    );
  }

  async delByPrefix(props: { prefix: string }): Promise<void> {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        "MATCH",
        `${props.prefix}*`,
        "COUNT",
        100,
      );
      if (keys.length) {
        await this.client.del(...keys);
      }
      cursor = nextCursor;
    } while (cursor !== "0");
  }

  async del(props: { prefix: string; key: string }): Promise<void> {
    const hashedKey = await this.hashKey({ key: props.key });
    await this.client.del(`${props.prefix}:${hashedKey}`);
  }

  async flushall(): Promise<void> {
    await this.client.flushall();
  }
}
