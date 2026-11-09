import { createMiddleware } from "hono/factory";
import { MiddlewareHandler } from "hono";
import { Provider as StoreProvider } from "@sps/providers-kv";
import {
  KV_PROVIDER,
  RBAC_RATE_LIMIT_ENABLED,
  RBAC_RATE_LIMIT_OPERATOR_SECRET_FAILURES_PER_ADDRESS,
  RBAC_RATE_LIMIT_TRUSTED_PROXY_CIDRS,
  RBAC_RATE_LIMIT_WINDOW_IN_SECONDS,
} from "@sps/shared-utils";
import {
  assertWithinRateLimit,
  createRateLimiter,
  clientAddressRateLimitKey,
  logger,
  rbacSecretMatches,
  createClientAddressReader,
  readRbacSecret,
  type IRateLimiter,
  type IRateLimitStoreProvider,
} from "@sps/backend-utils";

export type IMiddlewareGeneric = unknown;

/**
 * Project extension seam: each setting defaults to its `RBAC_RATE_LIMIT_*`
 * environment value, and the store to the KV provider.
 */
export interface IMiddlewareOptions {
  storeProvider?: IRateLimitStoreProvider;
  enabled?: boolean;
  windowInSeconds?: number;
  trustedProxyCidrs?: string[];
  failuresPerAddress?: number;
}

const COUNTER_PREFIX = "rate-limit:operator-secret:address";

/**
 * Counts requests that present an operator secret which does not match
 * (issue #310).
 *
 * The first mismatch in a window is logged without its value. Wrong guesses
 * spend an address budget. Once exhausted, even a matching secret is refused
 * until the window ends, preventing confirmation of a successful guess.
 * Private addresses are counted too; only a request without a secret skips
 * this guard. The global visitor limiter separately exempts verified operators.
 */
export class Middleware {
  private readonly rateLimiter: IRateLimiter;
  private readonly enabled: boolean;
  private readonly windowInSeconds: number;
  private readonly readAddress: ReturnType<typeof createClientAddressReader>;
  private readonly failuresPerAddress: number;

  constructor(options: IMiddlewareOptions = {}) {
    this.rateLimiter = createRateLimiter({
      storeProvider:
        options.storeProvider ?? new StoreProvider({ type: KV_PROVIDER }),
    });
    this.enabled = options.enabled ?? RBAC_RATE_LIMIT_ENABLED;
    this.windowInSeconds =
      options.windowInSeconds ?? RBAC_RATE_LIMIT_WINDOW_IN_SECONDS;
    this.readAddress = createClientAddressReader(
      options.trustedProxyCidrs ?? RBAC_RATE_LIMIT_TRUSTED_PROXY_CIDRS,
    );
    this.failuresPerAddress =
      options.failuresPerAddress ??
      RBAC_RATE_LIMIT_OPERATOR_SECRET_FAILURES_PER_ADDRESS;
  }

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const secret = readRbacSecret(c);

      if (!secret) {
        return next();
      }

      const matches = rbacSecretMatches(secret);
      const address = this.readAddress(c) ?? "unknown";
      const window =
        this.enabled && address
          ? {
              prefix: COUNTER_PREFIX,
              key: clientAddressRateLimitKey(address),
              limit: this.failuresPerAddress,
              windowInSeconds: this.windowInSeconds,
            }
          : undefined;
      let attempts;
      if (window) {
        if (matches) {
          attempts = await this.rateLimiter.read(window);
        } else {
          attempts = await this.rateLimiter.count(window);
        }
      }

      if (!matches && attempts?.attempts === 1) {
        const counted = attempts
          ? `, attempt ${attempts.attempts} of ${this.failuresPerAddress} in this window`
          : "";

        logger.warn(
          `Operator secret mismatch: ${c.req.method} ${c.req.path} from ${address ?? "an unknown address"}${counted} (request ${c.req.header("x-request-id") ?? "unknown"})`,
        );
      }

      assertWithinRateLimit(c, attempts, { scope: "operator-secret", address });

      return next();
    });
  }
}
