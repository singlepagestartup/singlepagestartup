/**
 * @deprecated
 */
import { Context } from "hono";
import { Service } from "../../service";
import { Table } from "@sps/rbac/models/action/backend/repository/database";
import {
  API_SERVICE_URL,
  buildTreePaths,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { api } from "@sps/rbac/models/action/sdk/server";
import { HTTPException } from "hono/http-exception";

type ActionWithSaturatedRoutes = typeof Table.$inferSelect & {
  routes: string[];
};

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  /**
   * @deprecated
   */
  async execute(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY not found");
    }

    const { uuid } = c.req.param();

    const result = await api.findById({
      id: uuid,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!result) {
      throw new HTTPException(404, {
        message: `Not found. Entity with id ${uuid} not found`,
      });
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

          const headers = {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          };

          if (moduleName === "rbac" && modelName === "subject") {
            headers["Cache-Control"] = "no-store";
          }

          const moduleData = await fetch(
            `${API_SERVICE_URL}/api/${moduleName}/${modelName}`,
            {
              headers,
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
      return c.json({
        data: {
          ...result,
          routes: ["/"],
        },
      });
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

    return c.json({
      data: {
        ...result,
        routes,
      },
    });
  }
}
