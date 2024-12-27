import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/action/backend/repository/database";
import { Service } from "./service";
import { Context } from "hono";
import QueryString from "qs";
import {
  BACKEND_URL,
  buildTreePaths,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { HTTPException } from "hono/http-exception";

type ActionWithSaturatedRoutes = typeof Table.$inferSelect & {
  routes: string[];
};

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.service = service;

    this.bindHttpRoutes([
      {
        method: "GET",
        path: "/find-by-action-route",
        handler: this.findByActionRoute,
      },
      {
        method: "GET",
        path: "/",
        handler: this.find,
      },
      {
        method: "GET",
        path: "/dump",
        handler: this.dump,
      },
      {
        method: "GET",
        path: "/:uuid",
        handler: this.findById,
      },
      {
        method: "POST",
        path: "/",
        handler: this.create,
      },
      {
        method: "PATCH",
        path: "/:uuid",
        handler: this.update,
      },
      {
        method: "DELETE",
        path: "/:uuid",
        handler: this.delete,
      },
    ]);
  }

  public async findByActionRoute(c: Context, next: any): Promise<Response> {
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

    const findResult = await this.service.find({
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

    if (findResult?.length > 0) {
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

    const actions = await this.service.find();

    const actionsWithEqualPathParts = actions?.filter((action) => {
      const actionPathParts = action.path
        ?.split("/")
        .filter((url) => url !== "");

      if (splittedUrl.length !== actionPathParts?.length) {
        return false;
      }

      return true;
    });

    const filledActions: ActionWithSaturatedRoutes[] = [];

    for (const actionsWithEqualPathPart of actionsWithEqualPathParts) {
      const entityWithRoutes = await this.withRoutes({
        id: actionsWithEqualPathPart.id,
      });

      if (!entityWithRoutes) {
        continue;
      }

      filledActions.push(entityWithRoutes);
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
  }

  async withRoutes(props: { id: string }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY not found");
    }

    const result = await this.service.findById({
      id: props.id,
    });

    if (!result) {
      throw new Error(`Entity with id ${props.id} not found`);
    }

    const segments = result.path?.split("/").filter((url) => url !== "");

    const saturatedSegments: Array<string | string[]> = [];

    if (segments?.length) {
      for (const segment of segments) {
        if (segment.includes("[")) {
          const moduleSegment = segment.replace("[", "").replace("]", "");
          const moduleName = moduleSegment.split(".")[0];
          const modelName = moduleSegment.split(".")[1];
          const param = moduleSegment.split(".")[2];
          const moduleSegmentPaths: string[] = [];

          const moduleData = await fetch(
            `${BACKEND_URL}/api/${moduleName}/${modelName}`,
            {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          ).then((res) => res.json());

          if (moduleData?.data?.length) {
            moduleData.data.forEach((entity: unknown) => {
              if (!entity?.[param]) {
                throw new Error(`Entity with param ${param} not found`);
              }

              moduleSegmentPaths.push(entity[param]);
            });
          }

          saturatedSegments.push(moduleSegmentPaths);
          continue;
        }

        saturatedSegments.push(segment);
      }
    }

    if (saturatedSegments.length === 0) {
      return { ...result, routes: ["/"] };
    }

    const constructedUrls = buildTreePaths({
      segments: saturatedSegments,
    });

    const routes: ActionWithSaturatedRoutes["routes"] = constructedUrls.map(
      (route) => {
        return route.join("/").startsWith("/")
          ? route.join("/")
          : `/${route.join("/")}`;
      },
    );

    return { ...result, routes };
  }
}
