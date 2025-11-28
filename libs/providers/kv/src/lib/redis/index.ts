import type { IProvider } from "../interface";
import { Redis, RedisOptions } from "ioredis";
import {
  KV_PORT,
  KV_USERNAME,
  KV_PASSWORD,
  KV_HOST,
  hash,
} from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";

export class Provider implements IProvider {
  private static instance: Redis;
  private static isShutdownHookSet = false;

  client: Redis;

  constructor() {
    if (!Provider.instance) {
      const connectionCredentials: RedisOptions = {
        host: KV_HOST,
        port: KV_PORT,
        username: KV_USERNAME,
        password: KV_PASSWORD,
        maxRetriesPerRequest: 10,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        reconnectOnError: (err) => {
          logger.error("Redis error:", err);
          return true;
        },
      };

      Provider.instance = new Redis(connectionCredentials);
      this.client = Provider.instance;

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
