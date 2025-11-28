import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import QueryString from "qs";
import { api } from "@sps/rbac/models/permission/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { match } from "path-to-regexp";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not found");
      }

      const query = QueryString.parse(c.req.url.split("?")[1]);

      const route = query.permission?.["route"] as string;
      const method = query.permission?.["method"] as string;
      const type = query.permission?.["type"] as string;

      if (!route || !method || !type) {
        throw new Error(
          "Validation error. Missing one or more permission parameters (route, method, type)",
        );
      }

      const permissions = await api.find({
        params: {
          filters: {
            and: [
              { column: "type", method: "eq", value: type },
              { column: "method", method: "eq", value: method },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!permissions?.length) {
        throw new Error(
          `Not Found error. No matching permission for route: ${route}, method: ${method}, type: ${type}`,
        );
      }

      for (const permission of permissions) {
        if (permission.path === "*") {
          return c.json({ data: permission });
        }

        if (!permission.path) {
          continue;
        }

        const template = permission.path.replace(
          /\[(.+?)\]/g,
          (_, p1) => `:${p1.replace(/[.\-]/g, "_")}`,
        );
        const matcher = match(template, {
          decode: decodeURIComponent,
          end: true,
        });

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
