import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { KV_COMMAND_TIMEOUT_MS } from "@sps/shared-utils";
import { util as logger } from "../logger";

/**
 * The part of the KV provider a limiter uses. `@sps/providers-kv` depends on
 * this package for its logger, so the provider is handed in, not imported.
 */
export interface IRateLimitStoreProvider {
  incr: (props: {
    prefix: string;
    key: string;
    options?: { ttl?: number };
  }) => Promise<number>;
  get: (props: { prefix: string; key: string }) => Promise<string | null>;
}

/**
 * Minimal logging surface, so a test can pass a recorder instead of the
 * backend logger.
 */
export interface IRateLimiterLogger {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
}

export interface IRateLimiterOptions {
  storeProvider: IRateLimitStoreProvider;
  timeoutMs?: number;
  logIntervalMs?: number;
  logger?: IRateLimiterLogger;
  now?: () => number;
}

export interface IRateLimitWindow {
  /** Namespace of the counter in the KV store, such as `rate-limit:operator-secret`. */
  prefix: string;
  /** What is counted inside the namespace: a client address or an account. */
  key: string;
  /** Attempts allowed in one window. */
  limit: number;
  windowInSeconds: number;
}

export interface IRateLimitAttempts {
  attempts: number;
  limited: boolean;
  retryAfterInSeconds: number;
}

export interface IRateLimiter {
  /** Spends one attempt and reports the window after it. */
  count: (window: IRateLimitWindow) => Promise<IRateLimitAttempts | undefined>;
  /** Reports the window without spending an attempt. */
  read: (window: IRateLimitWindow) => Promise<IRateLimitAttempts | undefined>;
}

/**
 * How long the limiter stays quiet after reporting that the store failed.
 * While Redis is down every limited request would otherwise log its own line.
 */
export const DEFAULT_RATE_LIMITER_LOG_INTERVAL_MS = 60_000;

const RATE_LIMITED_MESSAGE = "Too many requests. Try again later";

/**
 * Fixed-window attempt counters in the KV store (issue #310).
 *
 * A window is `windowInSeconds` long and every counter lives under its own key
 * per window, written with `incr` and a TTL of one window, the same primitive
 * as the HTTP cache version counters. Every API process therefore spends one
 * shared budget, and a counter disappears once its window is over.
 *
 * A limit is a protection, not a dependency: when the store rejects a call or
 * does not answer within `timeoutMs` (the KV command timeout by default), the
 * limiter reports nothing and the caller lets the request through. The first
 * failure in a log interval is reported at warn level, and the first answer
 * after a failure reports recovery.
 */
export function createRateLimiter(options: IRateLimiterOptions): IRateLimiter {
  const timeoutMs = options.timeoutMs ?? KV_COMMAND_TIMEOUT_MS;
  const logIntervalMs =
    options.logIntervalMs ?? DEFAULT_RATE_LIMITER_LOG_INTERVAL_MS;
  const log = options.logger ?? logger;
  const now = options.now ?? (() => Date.now());

  let lastReportedAt: number | undefined;
  let suppressedFailures = 0;
  let isDegraded = false;

  function reportFailure(error: unknown): void {
    const timestamp = now();

    if (
      isDegraded &&
      lastReportedAt !== undefined &&
      timestamp - lastReportedAt < logIntervalMs
    ) {
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
      `Rate limit store unavailable, requests are let through: ${reason}${suppressed}`,
    );
  }

  function reportRecovery(): void {
    if (!isDegraded) {
      return;
    }

    isDegraded = false;
    lastReportedAt = undefined;
    suppressedFailures = 0;

    log.info("Rate limit store available again.");
  }

  async function withinDeadline<T>(execute: () => Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      const pending = execute();
      // The losing member of the race must not surface as an unhandled
      // rejection once the deadline has answered the caller.
      pending.catch(() => undefined);

      return await Promise.race([
        pending,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`timed out after ${timeoutMs}ms`)),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  function locate(window: IRateLimitWindow, at: number) {
    const windowInSeconds = Math.max(1, Math.floor(window.windowInSeconds));
    const windowMs = windowInSeconds * 1000;
    const index = Math.floor(at / windowMs);

    return {
      windowInSeconds,
      key: `${window.key}:${index}`,
      retryAfterInSeconds: Math.max(
        1,
        Math.ceil(((index + 1) * windowMs - at) / 1000),
      ),
    };
  }

  return {
    async count(window) {
      const at = now();
      const located = locate(window, at);

      try {
        const attempts = await withinDeadline(() =>
          options.storeProvider.incr({
            prefix: window.prefix,
            key: located.key,
            options: { ttl: located.windowInSeconds },
          }),
        );

        reportRecovery();

        return {
          attempts,
          limited: attempts > window.limit,
          retryAfterInSeconds: located.retryAfterInSeconds,
        };
      } catch (error) {
        reportFailure(error);

        return undefined;
      }
    },

    async read(window) {
      const at = now();
      const located = locate(window, at);

      try {
        const value = await withinDeadline(() =>
          options.storeProvider.get({
            prefix: window.prefix,
            key: located.key,
          }),
        );
        const attempts = Number(value) || 0;

        reportRecovery();

        return {
          attempts,
          limited: attempts > window.limit,
          retryAfterInSeconds: located.retryAfterInSeconds,
        };
      } catch (error) {
        reportFailure(error);

        return undefined;
      }
    },
  };
}

/**
 * Refuses a request whose window is over its budget: 429 with `Retry-After`
 * set to the seconds left in the window. The header is set on the context
 * before the throw, so the exception filter's response carries it. Nothing
 * happens for a window within budget or one the store could not report.
 */
export function assertWithinRateLimit(
  c: Context,
  attempts?: IRateLimitAttempts,
): void {
  if (!attempts?.limited) {
    return;
  }

  c.header("Retry-After", String(attempts.retryAfterInSeconds));

  throw new HTTPException(429, { message: RATE_LIMITED_MESSAGE });
}
