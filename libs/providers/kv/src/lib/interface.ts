export interface IProvider {
  connect: () => Promise<void>;
  hashKey: (props: { prefix: string; key: string }) => Promise<string>;
  get: (props: { prefix: string; key: string }) => Promise<string | null>;
  incr: (props: {
    prefix: string;
    key: string;
    options?: { ttl?: number };
  }) => Promise<number>;
  set: (props: {
    prefix: string;
    key: string;
    value: string;
    options: { ttl: number };
  }) => Promise<string | undefined | null>;
  del: (props: { prefix: string; key: string }) => Promise<void>;
  /**
   * Destructive administrative operation: deletes every key in the selected
   * KV backend, including namespaces owned by other services. Never use this
   * for cache invalidation; use `delByPrefix` with the cache-owned prefix.
   */
  flushall: () => Promise<void>;
  delByPrefix: (props: { prefix: string }) => Promise<void>;
}
