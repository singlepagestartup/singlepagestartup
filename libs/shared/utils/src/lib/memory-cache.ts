type CacheEntry<T> = {
  expiresAt: number;
  value: T;
  metadata: Map<symbol, unknown>;
};

type MemoryCacheObserver = (event: {
  type: "get" | "set" | "validate";
  metadata: Map<symbol, unknown>;
}) => void | boolean | Promise<boolean>;
const observers = new Set<MemoryCacheObserver>();
const instances = new Set<WeakRef<Map<string, CacheEntry<unknown>>>>();
export function observeMemoryCache(observer: MemoryCacheObserver) {
  observers.add(observer);
  return () => {
    observers.delete(observer);
  };
}
export function invalidateMemoryCacheEntries(
  predicate: (metadata: Map<symbol, unknown>) => boolean,
) {
  for (const ref of instances) {
    const cache = ref.deref();
    if (!cache) {
      instances.delete(ref);
      continue;
    }
    for (const [key, entry] of cache)
      if (predicate(entry.metadata)) cache.delete(key);
  }
}

export type MemoryCacheOptions = {
  ttlMs: number;
  maxSize?: number;
};

export function util(options: MemoryCacheOptions) {
  const cache = new Map<string, CacheEntry<unknown>>();
  instances.add(new WeakRef(cache));
  const { ttlMs, maxSize } = options;

  function get<T>(key: string): T | undefined {
    const entry = cache.get(key);
    if (!entry) {
      return;
    }

    if (entry.expiresAt <= Date.now()) {
      cache.delete(key);
      return;
    }

    for (const observer of observers)
      observer({ type: "get", metadata: entry.metadata });
    return entry.value as T;
  }

  async function getAsync<T>(key: string): Promise<T | undefined> {
    const entry = cache.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      cache.delete(key);
      return;
    }
    for (const observer of observers) {
      if (
        (await observer({ type: "validate", metadata: entry.metadata })) ===
        false
      ) {
        cache.delete(key);
        return;
      }
    }
    return get<T>(key);
  }

  function set<T>(key: string, value: T) {
    if (maxSize && cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }

    const metadata = new Map<symbol, unknown>();
    for (const observer of observers) observer({ type: "set", metadata });
    cache.set(key, { expiresAt: Date.now() + ttlMs, value, metadata });
  }

  function del(key: string) {
    cache.delete(key);
  }

  function clear() {
    cache.clear();
  }

  return { get, getAsync, set, del, clear };
}
