import { KV_COMMAND_TIMEOUT_MS } from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";

/**
 * Minimal logging surface the guard needs, so a test can pass a recorder
 * without constructing the backend logger.
 */
export interface ICacheGuardLogger {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
}

export interface ICacheGuardOptions {
  timeoutMs?: number;
  logIntervalMs?: number;
  logger?: ICacheGuardLogger;
  now?: () => number;
}

export interface ICacheGuardOperation<T> {
  name: string;
  fallback: T;
  execute: () => Promise<T>;
}

export interface ICacheGuard {
  run: <T>(operation: ICacheGuardOperation<T>) => Promise<T>;
}

/**
 * How long the guard stays quiet after reporting a cache failure. While Redis
 * is down every request would otherwise produce its own warning, which buries
 * the outage in its own noise (issue #233).
 */
export const DEFAULT_CACHE_GUARD_LOG_INTERVAL_MS = 60_000;

/**
 * Fail-open wrapper for every KV call on the HTTP-cache path (issue #233).
 *
 * The response cache is an optimization: a request must reach its handler even
 * when the cache cannot answer. `run` therefore resolves to the caller's
 * fallback — "miss" for a read, "skip" for a write or a version bump — on any
 * rejection AND on its own deadline, which also covers a client that neither
 * resolves nor rejects. The deadline defaults to the KV command timeout, so
 * the guard never waits materially longer than the client itself.
 *
 * Failures are reported at warn level with a per-process interval backoff, and
 * the first success after a failure reports recovery, so an outage and its end
 * are each one line.
 */
export function createCacheGuard(options?: ICacheGuardOptions): ICacheGuard {
  const timeoutMs = options?.timeoutMs ?? KV_COMMAND_TIMEOUT_MS;
  const logIntervalMs =
    options?.logIntervalMs ?? DEFAULT_CACHE_GUARD_LOG_INTERVAL_MS;
  const log = options?.logger ?? logger;
  const now = options?.now ?? Date.now;

  let lastReportedAt: number | undefined;
  let suppressedFailures = 0;
  let isDegraded = false;

  function reportFailure(name: string, error: unknown): void {
    const timestamp = now();
    const isBackedOff =
      lastReportedAt !== undefined &&
      timestamp - lastReportedAt < logIntervalMs;

    if (isDegraded && isBackedOff) {
      suppressedFailures += 1;
      return;
    }

    const reason = error instanceof Error ? error.message : String(error);
    const suppressed = suppressedFailures
      ? ` (${suppressedFailures} similar failures suppressed)`
      : "";

    isDegraded = true;
    lastReportedAt = timestamp;
    suppressedFailures = 0;

    log.warn(
      `HTTP cache unavailable, serving uncached: ${name}: ${reason}${suppressed}`,
    );
  }

  function reportRecovery(): void {
    if (!isDegraded) {
      return;
    }

    const suppressed = suppressedFailures
      ? ` (${suppressedFailures} similar failures suppressed)`
      : "";

    isDegraded = false;
    lastReportedAt = undefined;
    suppressedFailures = 0;

    log.info(`HTTP cache available again.${suppressed}`);
  }

  return {
    async run<T>(operation: ICacheGuardOperation<T>): Promise<T> {
      let timer: ReturnType<typeof setTimeout> | undefined;

      try {
        const pending = operation.execute();
        // A late rejection of the losing race member must not surface as an
        // unhandled rejection; the guard has already answered the caller.
        pending.catch(() => undefined);

        const result = await Promise.race([
          pending,
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () => reject(new Error(`timed out after ${timeoutMs}ms`)),
              timeoutMs,
            );
          }),
        ]);

        reportRecovery();

        return result;
      } catch (error) {
        reportFailure(operation.name, error);

        return operation.fallback;
      } finally {
        if (timer) {
          clearTimeout(timer);
        }
      }
    },
  };
}
