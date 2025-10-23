import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../service";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as subjectsToEcommerceModuleOrdersApi } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server";

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
        await subjectsToEcommerceModuleOrdersApi.find({
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
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });

      if (!subjectsToEcommerceModuleOrders?.length) {
        return c.json({
          data: [],
        });
      }

      const ecommerceModuleOrdersWithCartType =
        await ecommerceModuleOrderApi.find({
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
                {
                  column: "type",
                  method: "eq",
                  value: "cart",
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });

      if (!ecommerceModuleOrdersWithCartType?.length) {
        return c.json({
          data: [],
        });
      }

      return c.json({
        data: ecommerceModuleOrdersWithCartType,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
