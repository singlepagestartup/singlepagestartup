import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import QueryString from "qs";
import { api } from "@sps/rbac/models/action/sdk/server";
import { IModel } from "@sps/rbac/models/action/sdk/model";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const query = QueryString.parse(c.req.url.split("?")[1]);

      if (!query.action) {
        throw new Error("Action query parameter is required");
      }

      if (!query.action["route"]) {
        throw new Error("Route query parameter is required");
      }

      if (!query.action["method"]) {
        throw new Error("Method query parameter is required");
      }

      if (!query.action["type"]) {
        throw new Error("Type query parameter is required");
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
        throw new Error("Wrong path filter");
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
        throw new HTTPException(404, {
          message: `Action with route ${routeParameter} and method ${query.action["method"]} not found`,
        });
      }

      if (targetAction?.method !== query.action["method"]) {
        throw new HTTPException(404, {
          message: `Action with route ${routeParameter} and method ${query.action["method"]} not found`,
        });
      }

      if (targetAction?.type !== query.action["type"]) {
        throw new HTTPException(404, {
          message: `Action with route ${routeParameter}, method ${query.action["method"]} and type ${query.action["type"]} not found`,
        });
      }

      const action = await this.service.findById({
        id: targetAction.id,
      });

      return c.json({
        data: action,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
