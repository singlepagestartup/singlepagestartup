import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization } from "@sps/backend-utils";
import { Service } from "../../../service";
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
        throw new HTTPException(400, {
          message: "RBAC_JWT_SECRET not set",
        });
      }

      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC_SECRET_KEY not set",
        });
      }

      const id = c.req.param("id");

      if (!id) {
        throw new HTTPException(400, {
          message: "No id provided",
        });
      }

      const token = authorization(c);

      if (!token) {
        return c.json(
          {
            data: null,
          },
          {
            status: 401,
          },
        );
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new HTTPException(403, {
          message: "Only order owner can update order",
        });
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
        });

      if (!ecommerceModuleOrdersWithCartType?.length) {
        return c.json({
          data: [],
        });
      }

      let quantity = 0;

      for (const ecommerceModuleOrderWithCartType of ecommerceModuleOrdersWithCartType) {
        const ecommerceModuleOrderQuantity =
          await ecommerceModuleOrderApi.quantity({
            id: ecommerceModuleOrderWithCartType.id,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });

        quantity += ecommerceModuleOrderQuantity;
      }

      return c.json({
        data: quantity,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
