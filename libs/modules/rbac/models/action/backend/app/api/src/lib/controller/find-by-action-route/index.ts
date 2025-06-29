import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import QueryString from "qs";
import { api } from "@sps/rbac/models/action/sdk/server";
import { IModel } from "@sps/rbac/models/action/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Evironment error. RBAC_SECRET_KEY not found");
      }

      const query = QueryString.parse(c.req.url.split("?")[1]);

      if (!query.action) {
        throw new Error("Request error. Action query parameter is required");
      }

      if (!query.action["route"]) {
        throw new Error("Request error. Route query parameter is required");
      }

      if (!query.action["method"]) {
        throw new Error("Request error. Method query parameter is required");
      }

      if (!query.action["type"]) {
        throw new Error("Request error. Type query parameter is required");
      }

      const findResult = await api.find({
        params: {
          filters: {
            and: [
              {
                column: "path",
                method: "eq",
                value: query.action["route"],
              },
              {
                column: "method",
                method: "eq",
                value: query.action["method"],
              },
              {
                column: "type",
                method: "eq",
                value: query.action["type"],
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (findResult && findResult?.length > 0) {
        return c.json({
          data: findResult[0],
        });
      }

      const routeParameter = query.action["route"];

      const splittedUrl = routeParameter
        .split("/")
        .filter((url: string) => url !== "");

      if (!splittedUrl.length) {
        throw new Error("Request error. Wrong path filter");
      }

      const actions = await api.find();

      const actionsWithEqualPathParts = actions?.filter((action) => {
        const actionPathParts = action.path
          ?.split("/")
          .filter((url) => url !== "");

        if (splittedUrl.length !== actionPathParts?.length) {
          return false;
        }

        return true;
      });

      const filledActions: (IModel & { routes: string[] })[] = [];

      if (actionsWithEqualPathParts && actionsWithEqualPathParts?.length) {
        for (const actionsWithEqualPathPart of actionsWithEqualPathParts) {
          const entityWithRoutes = await api.findByIdRoutes({
            id: actionsWithEqualPathPart.id,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });

          if (!entityWithRoutes) {
            continue;
          }

          filledActions.push(entityWithRoutes);
        }
      }

      const targetAction = filledActions.find((action) => {
        if (
          action.routes.find((route) => {
            if (
              route === routeParameter &&
              query.action?.["method"] === action.method
            ) {
              return true;
            }

            return false;
          })
        ) {
          return true;
        }

        return false;
      });

      if (!targetAction) {
        throw new Error(
          `Not found. Action with route ${routeParameter} and method ${query.action["method"]} not found`,
        );
      }

      if (targetAction?.method !== query.action["method"]) {
        throw new Error(
          `Not found. Action with route ${routeParameter} and method ${query.action["method"]} not found`,
        );
      }

      if (targetAction?.type !== query.action["type"]) {
        throw new Error(
          `Not found. Action with route ${routeParameter}, method ${query.action["method"]} and type ${query.action["type"]} not found`,
        );
      }

      const action = await api.findById({
        id: targetAction.id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return c.json({
        data: action,
      });
    } catch (error: any) {
      if (error.message.includes("Not found")) {
        throw new HTTPException(404, {
          message: error.message || "Not Found",
          cause: error,
        });
      }

      if (error.message.includes("Request error")) {
        throw new HTTPException(400, {
          message: error.message || "Bad Request",
          cause: error,
        });
      }

      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
