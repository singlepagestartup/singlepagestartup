import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import QueryString from "qs";
import { getHttpErrorType } from "@sps/backend-utils";

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
      const includeBillingRequirementsRaw =
        query?.["includeBillingRequirements"];
      const includeBillingRequirements =
        includeBillingRequirementsRaw === "true" ||
        (Array.isArray(includeBillingRequirementsRaw) &&
          includeBillingRequirementsRaw.some((value) => value === "true"));

      if (!route || !method || !type) {
        throw new Error(
          "Validation error. Missing one or more permission parameters (route, method, type)",
        );
      }

      const data = await this.service.resolveByRoute({
        permission: {
          route,
          method,
          type,
        },
        includeBillingRequirements,
      });

      return c.json({ data });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
