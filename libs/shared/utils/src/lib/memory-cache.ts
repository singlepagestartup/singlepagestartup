type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

export type MemoryCacheOptions = {
  ttlMs: number;
  maxSize?: number;
};

export function util(options: MemoryCacheOptions) {
  const cache = new Map<string, CacheEntry<unknown>>();
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

    return entry.value as T;
  }

  function set<T>(key: string, value: T) {
    if (maxSize && cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }

    cache.set(key, { expiresAt: Date.now() + ttlMs, value });
  }

  function del(key: string) {
    cache.delete(key);
  }

  function clear() {
    cache.clear();
  }

  return { get, set, del, clear };
}
