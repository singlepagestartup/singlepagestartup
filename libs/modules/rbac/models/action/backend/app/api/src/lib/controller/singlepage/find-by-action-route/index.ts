import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import QueryString from "qs";
import { api } from "@sps/rbac/models/action/sdk/server";
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
        throw new Error("Environment error. RBAC_SECRET_KEY not found");
      }

      const query = QueryString.parse(c.req.url.split("?")[1]);

      const route = query.action?.["route"] as string;
      const method = query.action?.["method"] as string;
      const type = query.action?.["type"] as string;

      if (!route || !method || !type) {
        throw new Error(
          "Missing one or more action parameters (route, method, type)",
        );
      }

      const actions = await api.find({
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

      if (!actions?.length) {
        throw new Error(
          `Not found. No matching action for route: ${route}, method: ${method}, type: ${type}`,
        );
      }

      for (const action of actions) {
        if (action.path === "*") {
          return c.json({ data: action });
        }

        if (!action.path) {
          continue;
        }

        const template = action.path.replace(
          /\[(.+?)\]/g,
          (_, p1) => `:${p1.replace(/[.\-]/g, "_")}`,
        );
        const matcher = match(template, {
          decode: decodeURIComponent,
          end: true,
        });

        const result = matcher(route);
        if (result) {
          return c.json({ data: action });
        }
      }

      throw new Error(
        `Not found. No matching action for route: ${route}, method: ${method}, type: ${type}`,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
