import {
  compileTopicRules,
  HOST_SERVICE_URL,
  ICompiledTopicRule,
  IRouteRule,
  ITopicRule,
  RBAC_SECRET_KEY,
  resolveTopicsForPath,
  RouteMatcher,
  singlepageTopicRules,
  startupTopicRules,
  STALE_TIME,
  UUID_PATH_SUFFIX_REGEX,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { websocketManager } from "@sps/backend-utils";
import { createNotRevalidatingRoutesMatcher } from "./routes";

export type IMiddlewareGeneric = unknown;

/** @deprecated use IRouteRule from the shared routes primitive. */
export type INotRevalidatingRoute = IRouteRule;

/**
 * Project extension seam (issue #195): framework consumers register their own
 * topic rules and revalidation skip-routes from `apps/api/app.ts` without
 * forking the middleware. Project topic rules are evaluated BEFORE the
 * built-in defaults, so a project rule with `stop: true` overrides them.
 * Skip-routes are merged through the shared route matcher.
 */
export interface IMiddlewareOptions {
  topicRules?: ITopicRule[];
  notRevalidatingRoutes?: IRouteRule[];
}

export class Middleware {
  private notRevalidatingRoutesMatcher: RouteMatcher;
  private compiledTopicRules: ICompiledTopicRule[];

  constructor(options?: IMiddlewareOptions) {
    // Topic rules precedence: constructor options -> project startup layer ->
    // framework defaults. A more specific rule with `stop: true` wins. The
    // resolver + the singlepage/startup rule layers live in @sps/shared-utils
    // (NOT this middleware), so http-cache consumes the same resolver without
    // coupling to revalidation, and broadcast + cache-version bump always agree.
    this.compiledTopicRules = compileTopicRules([
      ...(options?.topicRules || []),
      ...startupTopicRules,
      ...singlepageTopicRules,
    ]);

    // Skip-routes composed through the shared matcher
    // (routes/singlepage.ts + routes/startup.ts + options).
    this.notRevalidatingRoutesMatcher = createNotRevalidatingRoutesMatcher(
      options?.notRevalidatingRoutes,
    );
  }

  /**
   * Public for tests and diagnostics: resolves the topic set a mutation on
   * `path` will broadcast (explicit rules first, canonical derivation as the
   * default).
   */
  resolveBroadcastTopics(path: string): string[] {
    return this.getTopics(path);
  }

  private getTopics(path: string): string[] {
    return resolveTopicsForPath(path, this.compiledTopicRules);
  }

  private getNormalizedPaths(path: string): string[] {
    const normalizedPath = path.split("?")[0];
    const pathWithoutLastId = normalizedPath.replace(
      UUID_PATH_SUFFIX_REGEX,
      "",
    );

    return Array.from(new Set([normalizedPath, pathWithoutLastId])).filter(
      Boolean,
    );
  }

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const reqPath = c.req.path.toLowerCase();
      const path = c.req.path;
      const method = c.req.method;

      await next();

      if (this.notRevalidatingRoutesMatcher.matches(reqPath, method)) {
        return;
      }

      if (c.res.status >= 200 && c.res.status < 300) {
        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          if (!RBAC_SECRET_KEY) {
            throw Error(
              "RBAC_SECRET_KEY is not defined, broadcast middleware 'revalidation' can't request to service.",
            );
          }

          const pathsToRevalidate = this.getNormalizedPaths(path);
          const topics = this.getTopics(path);
          const timestamp = new Date().toISOString();
          const expiresAt = new Date(Date.now() + STALE_TIME * 5).toISOString();

          pathsToRevalidate.forEach((payload) => {
            websocketManager.broadcastMessage({
              slug: "revalidation",
              payload,
              topics,
              createdAt: timestamp,
              expiresAt,
            });

            void this.revalidateTag(payload);
          });
        }
      }
    });
  }

  async revalidateTag(tag: string) {
    try {
      await fetch(HOST_SERVICE_URL + "/api/revalidate?tag=" + tag);
    } catch (error) {
      console.log("🚀 ~ revalidateTag ~ error:", error);
    }
  }
}
