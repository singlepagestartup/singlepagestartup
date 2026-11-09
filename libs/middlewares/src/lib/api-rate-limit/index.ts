import { Context, MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { Provider as StoreProvider } from "@sps/providers-kv";
import {
  API_RATE_LIMIT_BURST_PER_ADDRESS,
  API_RATE_LIMIT_MINUTE_PER_ADDRESS,
  API_RATE_LIMIT_BURST_PER_SUBJECT,
  API_RATE_LIMIT_MINUTE_PER_SUBJECT,
  KV_PROVIDER,
  RBAC_RATE_LIMIT_ENABLED,
  RBAC_RATE_LIMIT_TRUSTED_PROXY_CIDRS,
} from "@sps/shared-utils";
import {
  assertWithinRateLimit,
  authorization,
  clientAddressRateLimitKey,
  createClientAddressReader,
  createRateLimiter,
  getHttpErrorType,
  rbacSecretMatches,
  readRbacSecret,
  type IRateLimiter,
  type IRateLimitStoreProvider,
} from "@sps/backend-utils";

export interface IMiddlewareOptions {
  resolveSubjectId: (token: string) => Promise<string>;
  storeProvider?: IRateLimitStoreProvider;
  enabled?: boolean;
  trustedProxyCidrs?: string[];
  burstPerAddress?: number;
  minutePerAddress?: number;
  burstPerSubject?: number;
  minutePerSubject?: number;
}

/** Admission runs before bodies, observers, permission lookups and HTTP caches. */
export class Middleware {
  private readonly rateLimiter: IRateLimiter;
  private readonly readAddress: ReturnType<typeof createClientAddressReader>;
  private readonly enabled: boolean;
  private readonly addressLimits: { burst: number; minute: number };
  private readonly subjectLimits: { burst: number; minute: number };

  constructor(private readonly options: IMiddlewareOptions) {
    this.rateLimiter = createRateLimiter({
      storeProvider:
        options.storeProvider ?? new StoreProvider({ type: KV_PROVIDER }),
      failureMode: "closed",
    });
    this.readAddress = createClientAddressReader(
      options.trustedProxyCidrs ?? RBAC_RATE_LIMIT_TRUSTED_PROXY_CIDRS,
    );
    this.enabled = options.enabled ?? RBAC_RATE_LIMIT_ENABLED;
    this.addressLimits = {
      burst: options.burstPerAddress ?? API_RATE_LIMIT_BURST_PER_ADDRESS,
      minute: options.minutePerAddress ?? API_RATE_LIMIT_MINUTE_PER_ADDRESS,
    };
    this.subjectLimits = {
      burst: options.burstPerSubject ?? API_RATE_LIMIT_BURST_PER_SUBJECT,
      minute: options.minutePerSubject ?? API_RATE_LIMIT_MINUTE_PER_SUBJECT,
    };
    for (const limit of [
      ...Object.values(this.addressLimits),
      ...Object.values(this.subjectLimits),
    ]) {
      if (!Number.isSafeInteger(limit) || limit < 1) {
        throw new Error(
          "Configuration error. API rate limits must be positive integers",
        );
      }
    }
  }

  private async check(
    c: Context,
    scope: "address" | "subject",
    key: string,
    limits: { burst: number; minute: number },
  ) {
    // Count both windows even when the short window is exhausted. Sustained
    // abuse must spend the minute budget too; no per-request task is queued.
    const [burst, minute] = await Promise.all([
      this.rateLimiter.count({
        prefix: `rate-limit:api:${scope}:burst`,
        key,
        limit: limits.burst,
        windowInSeconds: 10,
      }),
      this.rateLimiter.count({
        prefix: `rate-limit:api:${scope}:minute`,
        key,
        limit: limits.minute,
        windowInSeconds: 60,
      }),
    ]);
    const details = {
      scope,
      subjectId: scope === "subject" ? key : undefined,
      address: scope === "address" ? key : undefined,
    };
    // A minute refusal gives the caller the longer, actionable retry delay.
    assertWithinRateLimit(c, minute, details);
    assertWithinRateLimit(c, burst, details);
  }

  init(): MiddlewareHandler {
    return createMiddleware(async (c, next) => {
      // Verified operator traffic includes nested SDK calls. Counting it as a
      // visitor would exhaust one shared budget for all server-side activity.
      if (!this.enabled || rbacSecretMatches(readRbacSecret(c))) {
        return next();
      }
      const address = this.readAddress(c) ?? "unknown";
      await this.check(
        c,
        "address",
        clientAddressRateLimitKey(address),
        this.addressLimits,
      );

      const cookie = getCookie(c, "rbac.subject.jwt");
      const bearer = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
      if (cookie && bearer && cookie !== bearer) {
        throw new HTTPException(401, {
          message: "Authentication error. Conflicting credentials",
        });
      }
      const token = authorization(c);
      let subjectId: string | undefined;
      if (token) {
        try {
          // RBAC owns signature/type/expiry and logout revocation checks.
          subjectId = await this.options.resolveSubjectId(token);
        } catch (error) {
          const { status } = getHttpErrorType(error);
          if (status !== 401 && status !== 400) {
            throw error;
          }
          // Invalid credentials still spend the IP budget. The route retains
          // its existing public/private authentication behavior.
        }
      }
      if (subjectId) {
        await this.check(c, "subject", subjectId, this.subjectLimits);
      }
      return next();
    });
  }
}
