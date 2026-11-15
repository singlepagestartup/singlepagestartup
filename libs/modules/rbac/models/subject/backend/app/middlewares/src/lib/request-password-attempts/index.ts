import { createMiddleware } from "hono/factory";
import { Provider } from "@sps/providers-kv";
import {
  KV_PROVIDER,
  RBAC_RATE_LIMIT_ENABLED,
  RBAC_RATE_LIMIT_CREDENTIAL_ATTEMPTS_PER_ACCOUNT,
  RBAC_RATE_LIMIT_PASSWORD_FAILURES_PER_HOUR,
} from "@sps/shared-utils";
import {
  AuthenticationAttempts,
  SecurityEvents,
  assertWithinRateLimit,
  logger,
  type IAtomicStore,
} from "@sps/backend-utils";

export interface IMiddlewareOptions {
  storeProvider?: IAtomicStore;
  enabled?: boolean;
  minuteLimit?: number;
  hourLimit?: number;
}

let reportAfter = 0;

export class Middleware {
  private readonly attempts: AuthenticationAttempts;
  private readonly events: SecurityEvents;
  private readonly enabled: boolean;

  constructor(options: IMiddlewareOptions = {}) {
    const store = options.storeProvider ?? new Provider({ type: KV_PROVIDER });
    this.enabled = options.enabled ?? RBAC_RATE_LIMIT_ENABLED;
    this.attempts = new AuthenticationAttempts(
      store,
      options.minuteLimit ?? RBAC_RATE_LIMIT_CREDENTIAL_ATTEMPTS_PER_ACCOUNT,
      options.hourLimit ?? RBAC_RATE_LIMIT_PASSWORD_FAILURES_PER_HOUR,
    );
    this.events = new SecurityEvents(store);
  }

  init() {
    return createMiddleware(async (c, next) => {
      if (!this.enabled) {
        return next();
      }
      let account: string | undefined;
      try {
        const body = await c.req.parseBody();
        if (typeof body["data"] === "string") {
          const login = JSON.parse(body["data"])?.login;
          if (typeof login === "string") {
            account = login.trim().toLowerCase();
          }
        }
      } catch {
        // The handler owns malformed-body validation; the IP guard still applies.
      }
      if (!account) {
        return next();
      }
      const reservation = await this.attempts.reserve(account);
      if (!reservation.allowed) {
        if (reservation.firstExceeded) {
          await this.events.record("password-limited");
        }
        assertWithinRateLimit(
          c,
          {
            attempts: 0,
            limited: true,
            firstExceeded: reservation.firstExceeded,
            retryAfterInSeconds: reservation.retryAfterInSeconds,
          },
          { scope: "authentication:password:account" },
        );
      }

      let status = 500;
      try {
        await next();
        status = c.res.status;
      } finally {
        try {
          const outcome = await this.attempts.finish(
            account,
            reservation.receipt,
            status === 401,
          );
          if (status === 401) {
            await this.events.record("password-failed");
          } else if (
            status >= 200 &&
            status < 300 &&
            outcome.previousFailures > 0
          ) {
            await this.events.record("password-recovered");
          }
        } catch {
          // Do not replace an issued session or an existing error with telemetry
          // failure. An unfinished reservation expires with its original window.
          if (Date.now() >= reportAfter) {
            reportAfter = Date.now() + 60000;
            logger.warn({ event: "security.password-attempt.finish-failed" });
          }
        }
      }
    });
  }
}
