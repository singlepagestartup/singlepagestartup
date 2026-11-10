import { hash, KV_REST_API_TOKEN, KV_REST_API_URL } from "@sps/shared-utils";
import type { IProvider } from "../interface";
import { kv, createClient } from "@vercel/kv";

export class Provider implements IProvider {
  prefix: string;
  client: typeof kv;

  constructor() {
    this.client = kv;
  }

  async connect(): Promise<void> {
    createClient({
      url: KV_REST_API_URL,
      token: KV_REST_API_TOKEN,
    });
  }

  async eval(props: {
    prefix: string;
    key: string;
    script: string;
    args: string[];
  }) {
    await this.connect();
    const hashedKey = await this.hashKey({ key: props.key });
    return this.client.eval(
      props.script,
      [`${props.prefix}${hashedKey}`],
      props.args,
    );
  }

  async hashKey(props: { key: string }): Promise<string> {
    return hash.sha256(props.key);
  }

  async get(props: { prefix: string; key: string }): Promise<string | null> {
    await this.connect();

    const hasedKey = await this.hashKey({ key: props.key });
    const value = await this.client.get<object>(`${props.prefix}${hasedKey}`);

    if (value) {
      return JSON.stringify(value);
    }

    return null;
  }

  async incr(props: {
    prefix: string;
    key: string;
    options?: { ttl?: number };
  }): Promise<number> {
    await this.connect();

    const hasedKey = await this.hashKey({ key: props.key });
    const cacheKey = `${props.prefix}${hasedKey}`;
    if (!props.options?.ttl) {
      return this.client.incr(cacheKey);
    }

    const result = await this.client
      .multi()
      .incr(cacheKey)
      .expire(cacheKey, props.options.ttl)
      .exec();
    return Number(result[0]);
  }

  async set(props: {
    prefix: string;
    key: string;
    value: string;
    options: { ttl: number };
  }): Promise<string | undefined | null> {
    await this.connect();

    const hasedKey = await this.hashKey({ key: props.key });

    return await this.client.set(`${props.prefix}${hasedKey}`, props.value, {
      ex: props.options.ttl,
    });
  }

  async delByPrefix(props: { prefix: string }): Promise<void> {
    await this.connect();

    let cursor = "0";

    do {
      const reply = await this.client.scan(cursor, {
        match: `${props.prefix}*`,
      });

      cursor = reply[0];
      const keys = reply[1];

      for (const key of keys) {
        await this.client.del(key);
      }
    } while (cursor !== "0");

    return;
  }

  async del(props: { prefix: string; key: string }): Promise<void> {
    await this.connect();

    const hasedKey = await this.hashKey({ key: props.key });

    await this.client.del(`${props.prefix}${hasedKey}`);

    return;
  }

  async flushall(): Promise<void> {
    await this.connect();

    await this.client.flushall();

    return;
  }
}
