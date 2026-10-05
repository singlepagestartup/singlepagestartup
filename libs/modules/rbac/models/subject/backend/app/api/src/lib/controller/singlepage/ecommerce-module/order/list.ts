import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../service";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const token = authorization(c);

      if (!token) {
        throw new Error("Validation error. No token");
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new Error("Validation error. Only order owner can update order");
      }

      const subjectsToEcommerceModuleOrders =
        await this.service.subjectsToEcommerceModuleOrders.find({
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: id,
                },
              ],
            },
          },
        });

      if (!subjectsToEcommerceModuleOrders?.length) {
        return c.json({
          data: [],
        });
      }

      /**
       * Without filters the route answers the active cart. A caller's filters
       * replace that default but only narrow the subject's own orders, because
       * the id constraint is always applied (issue #303).
       */
      const queryFilters = c.get("parsedQuery")?.filters?.["and"];

      const ecommerceModuleOrders =
        await this.service.ecommerceModule.order.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: subjectsToEcommerceModuleOrders.map(
                    (subjectToEcommerceModuleOrder) =>
                      subjectToEcommerceModuleOrder.ecommerceModuleOrderId,
                  ),
                },
                ...(queryFilters?.length
                  ? queryFilters
                  : [
                      {
                        column: "type",
                        method: "eq",
                        value: "cart",
                      },
                      {
                        column: "status",
                        method: "eq",
                        value: "new",
                      },
                    ]),
              ],
            },
          },
        });

      if (!ecommerceModuleOrders?.length) {
        return c.json({
          data: [],
        });
      }

      return c.json({
        data: ecommerceModuleOrders,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
