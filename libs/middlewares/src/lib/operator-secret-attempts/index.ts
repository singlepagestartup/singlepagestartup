import { createMiddleware } from "hono/factory";
import { MiddlewareHandler } from "hono";
import { Provider as StoreProvider } from "@sps/providers-kv";
import {
  KV_PROVIDER,
  RBAC_RATE_LIMIT_ENABLED,
  RBAC_RATE_LIMIT_OPERATOR_SECRET_FAILURES_PER_ADDRESS,
  RBAC_RATE_LIMIT_TRUSTED_PROXIES,
  RBAC_RATE_LIMIT_WINDOW_IN_SECONDS,
} from "@sps/shared-utils";
import {
  assertWithinRateLimit,
  createRateLimiter,
  isPrivateNetworkAddress,
  logger,
  rbacSecretMatches,
  readClientAddress,
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
  trustedProxies?: number;
  failuresPerAddress?: number;
}

const COUNTER_PREFIX = "rate-limit:operator-secret:address";

/**
 * Counts requests that present an operator secret which does not match
 * (issue #310).
 *
 * Each such request writes one warning with its method, path, client address
 * and request id, never the presented value, and spends one attempt of its
 * address's budget; within the budget it continues to the usual
 * authorization. Once an address is over its budget, every request from it
 * that presents an operator secret, the right one included, is answered 429
 * until the window ends, so a caller guessing the secret cannot tell from the
 * answer that a guess was right. A right secret only reads the counter.
 *
 * A request without a secret is not touched. A private network address is
 * logged but never counted: the API's own calls and the services on the
 * internal network use it, and so does the swarm ingress that stands in for
 * every browser behind the routing mesh.
 */
export class Middleware {
  private readonly rateLimiter: IRateLimiter;
  private readonly enabled: boolean;
  private readonly windowInSeconds: number;
  private readonly trustedProxies: number;
  private readonly failuresPerAddress: number;

  constructor(options: IMiddlewareOptions = {}) {
    this.rateLimiter = createRateLimiter({
      storeProvider:
        options.storeProvider ?? new StoreProvider({ type: KV_PROVIDER }),
    });
    this.enabled = options.enabled ?? RBAC_RATE_LIMIT_ENABLED;
    this.windowInSeconds =
      options.windowInSeconds ?? RBAC_RATE_LIMIT_WINDOW_IN_SECONDS;
    this.trustedProxies =
      options.trustedProxies ?? RBAC_RATE_LIMIT_TRUSTED_PROXIES;
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
      const address = readClientAddress(c, this.trustedProxies);
      const window =
        this.enabled && address && !isPrivateNetworkAddress(address)
          ? {
              prefix: COUNTER_PREFIX,
              key: address,
              limit: this.failuresPerAddress,
              windowInSeconds: this.windowInSeconds,
            }
          : undefined;
      const attempts = window
        ? matches
          ? await this.rateLimiter.read(window)
          : await this.rateLimiter.count(window)
        : undefined;

      if (!matches) {
        const counted = attempts
          ? `, attempt ${attempts.attempts} of ${this.failuresPerAddress} in this window`
          : "";

        logger.warn(
          `Operator secret mismatch: ${c.req.method} ${c.req.path} from ${address ?? "an unknown address"}${counted} (request ${c.req.header("x-request-id") ?? "unknown"})`,
        );
      }

      assertWithinRateLimit(c, attempts);

      return next();
    });
  }
}
