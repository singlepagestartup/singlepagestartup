import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import QueryString from "qs";
import { createMemoryCache } from "@sps/shared-utils";
import { match } from "path-to-regexp";
import { getHttpErrorType } from "@sps/backend-utils";

const cache = createMemoryCache({ ttlMs: 30_000, maxSize: 200 });
const matcherCache = new Map<string, ReturnType<typeof match>>();

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const query = QueryString.parse(c.req.url.split("?")[1]);

      const route = query.permission?.["route"] as string;
      const method = query.permission?.["method"] as string;
      const type = query.permission?.["type"] as string;

      if (!route || !method || !type) {
        throw new Error(
          "Validation error. Missing one or more permission parameters (route, method, type)",
        );
      }

      const permissionsCacheKey = "permissions:all";
      let permissions =
        cache.get<Awaited<ReturnType<Service["find"]>>>(permissionsCacheKey);

      if (!permissions) {
        permissions = await this.service.find();
        cache.set(permissionsCacheKey, permissions);
      }

      if (!permissions?.length) {
        throw new Error(
          `Not Found error. No matching permission for route: ${route}, method: ${method}, type: ${type}`,
        );
      }

      const filteredPermissions = permissions.filter((permission) => {
        return (
          permission.method.toUpperCase() === method.toUpperCase() &&
          permission.type === type
        );
      });

      for (const permission of filteredPermissions) {
        if (permission.path === "*") {
          return c.json({ data: permission });
        }

        if (!permission.path) {
          continue;
        }

        const matcherCacheKey = permission.path;
        let matcher = matcherCache.get(matcherCacheKey);

        if (!matcher) {
          const template = permission.path.replace(
            /\[(.+?)\]/g,
            (_, p1) => `:${p1.replace(/[.\-]/g, "_")}`,
          );

          matcher = match(template, {
            decode: decodeURIComponent,
            end: true,
          });

          matcherCache.set(matcherCacheKey, matcher);
        }

        const result = matcher(route);
        if (result) {
          return c.json({ data: permission });
        }
      }

      throw new Error(
        `Not Found error. No matching permission for route: ${route}, method: ${method}, type: ${type}`,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
