import {
  HOST_SERVICE_URL,
  RBAC_SECRET_KEY,
  STALE_TIME,
  UUID_PATH_SUFFIX_REGEX,
} from "@sps/shared-utils";
import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { websocketManager } from "@sps/backend-utils";
import { match } from "path-to-regexp";
import { topicRules } from "./topic-rules";

export type IMiddlewareGeneric = unknown;

/**
 * Routes that are allowed to be accessed without authentication
 * @type {Array<{ regexPath: RegExp; methods: string[] }>}
 *
 * [..., {
 *   regexPath: /\/api\/rbac\/identities\/[a-zA-Z0-9-]+/,
 *   methods: ["GET"],
 * }]
 */
const notRevalidatingRoutes: { regexPath: RegExp; methods: string[] }[] = [
  {
    regexPath: /\/api\/rbac\/subjects\/(authentication)\/(\w+)?/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/broadcast\/(\w+)?/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/rbac\/actions/,
    methods: ["POST"],
  },
  {
    regexPath: /\/api\/rbac\/actions\/(\w+)?/,
    methods: ["POST"],
  },
];

interface ICompiledTopicRule {
  matcher: ReturnType<typeof match>;
  topics: string[];
  stop: boolean;
  paramNamesByPlaceholder: Map<string, string>;
}

export class Middleware {
  private notRevalidatingRoutes: Map<string, Set<string>>;
  private compiledTopicRules: ICompiledTopicRule[];

  constructor() {
    this.notRevalidatingRoutes = new Map();
    this.compiledTopicRules = topicRules.map((rule) => {
      const paramNamesByPlaceholder = new Map<string, string>();
      const template = rule.routeTemplate.replace(/\[(.+?)\]/g, (_, p1) => {
        const paramName = p1.replace(/[.\-]/g, "_");
        paramNamesByPlaceholder.set(p1, paramName);
        return `:${paramName}`;
      });

      return {
        matcher: match(template, {
          decode: decodeURIComponent,
          end: false,
        }),
        topics: rule.topics,
        stop: Boolean(rule.stop),
        paramNamesByPlaceholder,
      };
    });

    notRevalidatingRoutes.forEach(({ regexPath, methods }) => {
      this.notRevalidatingRoutes.set(regexPath.source, new Set(methods));
    });
  }

  private resolveTopicsFromRules(path: string): string[] {
    const topics = new Set<string>();

    for (const rule of this.compiledTopicRules) {
      const matchResult = rule.matcher(path);
      if (!matchResult) {
        continue;
      }

      for (const topicTemplate of rule.topics) {
        const topic = topicTemplate.replace(/\[(.+?)\]/g, (_, p1) => {
          const paramName = rule.paramNamesByPlaceholder.get(p1);
          if (!paramName) {
            return "";
          }

          const paramValue =
            matchResult.params?.[paramName as keyof typeof matchResult.params];
          if (Array.isArray(paramValue)) {
            return paramValue[0] || "";
          }

          return typeof paramValue === "string" ? paramValue : "";
        });

        const isMalformedTopic =
          !topic ||
          topic.includes("..") ||
          topic.startsWith(".") ||
          topic.endsWith(".");

        if (!isMalformedTopic) {
          topics.add(topic);
        }
      }

      if (rule.stop) {
        break;
      }
    }

    return Array.from(topics);
  }

  private getGenericTopics(path: string): string[] {
    const segments = path.split("/").filter(Boolean);
    const topics = new Set<string>();
    const moduleIndex = segments.findIndex((segment) =>
      segment.endsWith("-module"),
    );
    if (moduleIndex < 0) {
      return [];
    }

    const moduleName = segments[moduleIndex].replace(/-module$/, "");
    const modelSegments = segments.slice(moduleIndex + 1);
    topics.add(moduleName);

    const isLikelyId = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      ) || /^\d+$/.test(value);

    let lastEntityTopic: string | undefined;

    for (let index = 0; index < modelSegments.length; index++) {
      const segment = modelSegments[index];
      const nextSegment = modelSegments[index + 1];
      if (!segment) {
        continue;
      }

      if (nextSegment && isLikelyId(nextSegment)) {
        const entityTopic = `${moduleName}.${segment}.${nextSegment}`;
        topics.add(entityTopic);
        if (lastEntityTopic) {
          topics.add(`${lastEntityTopic}.${segment}.${nextSegment}`);
        }
        lastEntityTopic = entityTopic;
        index += 1;
      } else {
        topics.add(`${moduleName}.${segment}`);
        if (lastEntityTopic) {
          topics.add(`${lastEntityTopic}.${segment}`);
        }
      }
    }

    return Array.from(topics);
  }

  private getTopics(path: string): string[] {
    const normalizedPath = path.split("?")[0];
    const topicsFromRules = this.resolveTopicsFromRules(normalizedPath);
    if (topicsFromRules.length) {
      return topicsFromRules;
    }

    return this.getGenericTopics(normalizedPath);
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

      for (const [pattern, methods] of this.notRevalidatingRoutes.entries()) {
        if (new RegExp(pattern).test(reqPath) && methods.has(method)) {
          return;
        }
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
