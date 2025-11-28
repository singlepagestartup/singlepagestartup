import { Provider as RedisProvider } from "./redis";
import { Provider as VercelKVProvider } from "./vercel-kv";
import { IProvider } from "./interface";

export class Provider implements IProvider {
  prefix: string;
  client: RedisProvider | VercelKVProvider;

  constructor(props: { type: "redis" | "vercel-kv"; prefix?: string }) {
    this.prefix = props.prefix || "";

    if (props.type === "redis") {
      const redis = new RedisProvider();
      this.client = redis;

      return;
    } else if (props.type === "vercel-kv") {
      const vercelKV = new VercelKVProvider();
      this.client = vercelKV;

      return;
    }

    throw new Error("Not Found error. Provider not found");
  }

  async connect(): Promise<void> {
    return await this.client.connect();
  }

  async hashKey(props: { key: string }) {
    return await this.client.hashKey(props);
  }

  async get(props: { prefix: string; key: string }) {
    return await this.client.get(props);
  }

  async set(props: {
    prefix: string;
    key: string;
    value: string;
    options: { ttl: number };
  }) {
    return await this.client.set(props);
  }

  async delByPrefix(props: { prefix: string }) {
    return await this.client.delByPrefix(props);
  }

  async del(props: { prefix: string; key: string }) {
    return await this.client.del(props);
  }

  async flushall() {
    return await this.client.flushall();
  }
}
