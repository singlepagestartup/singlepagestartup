import { createMiddleware } from "hono/factory";
import { Context, MiddlewareHandler } from "hono";
import { Provider as StoreProvider } from "@sps/providers-kv";
import {
  KV_PROVIDER,
  RBAC_RATE_LIMIT_ENABLED,
  RBAC_RATE_LIMIT_TRUSTED_PROXIES,
  RBAC_RATE_LIMIT_WINDOW_IN_SECONDS,
} from "@sps/shared-utils";
import {
  assertWithinRateLimit,
  createRateLimiter,
  isPrivateNetworkAddress,
  readClientAddress,
  type IRateLimiter,
  type IRateLimitStoreProvider,
} from "@sps/backend-utils";

export interface IMiddlewareGeneric {}

/**
 * Project extension seam: the settings every route budget shares. Each one
 * defaults to its `RBAC_RATE_LIMIT_*` environment value, and the store to the
 * KV provider.
 */
export interface IMiddlewareOptions {
  storeProvider?: IRateLimitStoreProvider;
  enabled?: boolean;
  windowInSeconds?: number;
  trustedProxies?: number;
}

/**
 * The budget of one route.
 */
export interface IMiddlewareRule {
  /** Names the route's counters in the KV store. */
  name: string;
  /** Attempts one client address may make per window. */
  attemptsPerAddress: number;
  /** Attempts per window for one account, named by `accountField`. */
  attemptsPerAccount?: number;
  /** Field of the JSON `data` form value that names the account. */
  accountField?: string;
}

const COUNTER_PREFIX = "rate-limit:rbac-subject";

/**
 * The account a request names in its `data` form value, lowercased the way
 * identities store addresses. A body the handler will refuse names none.
 */
async function readAccount(
  c: Context,
  field: string,
): Promise<string | undefined> {
  try {
    const body = await c.req.parseBody();

    if (typeof body["data"] !== "string") {
      return undefined;
    }

    const value = JSON.parse(body["data"])?.[field];

    if (typeof value !== "string") {
      return undefined;
    }

    return value.trim().toLowerCase() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Spends one attempt of a route's budget per request, before the handler runs
 * (issue #310): one from the client address and, when the route names an
 * account, one from that account. A request over either budget is answered 429
 * with `Retry-After` until its window ends.
 *
 * A private network address is not counted. It belongs to a proxy, the swarm
 * ingress, another service or a developer machine, and counting it would put
 * every client behind it into one budget. A KV store that fails lets the
 * request through.
 */
export class Middleware {
  private readonly rateLimiter: IRateLimiter;
  private readonly enabled: boolean;
  private readonly windowInSeconds: number;
  private readonly trustedProxies: number;

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
  }

  init(rule: IMiddlewareRule): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      if (!this.enabled) {
        return next();
      }

      const address = readClientAddress(c, this.trustedProxies);

      if (
        address &&
        !isPrivateNetworkAddress(address) &&
        rule.attemptsPerAddress > 0
      ) {
        assertWithinRateLimit(
          c,
          await this.rateLimiter.count({
            prefix: `${COUNTER_PREFIX}:${rule.name}:address`,
            key: address,
            limit: rule.attemptsPerAddress,
            windowInSeconds: this.windowInSeconds,
          }),
        );
      }

      if (rule.accountField && rule.attemptsPerAccount) {
        const account = await readAccount(c, rule.accountField);

        if (account) {
          assertWithinRateLimit(
            c,
            await this.rateLimiter.count({
              prefix: `${COUNTER_PREFIX}:${rule.name}:account`,
              key: account,
              limit: rule.attemptsPerAccount,
              windowInSeconds: this.windowInSeconds,
            }),
          );
        }
      }

      return next();
    });
  }
}
