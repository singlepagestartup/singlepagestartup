import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { logger } from "@sps/backend-utils";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC_SECRET_KEY not set",
        });
      }

      logger.info("Ecommerce module order delete canceled started");

      const canceledOrders = await ecommerceModuleOrderApi.find({
        params: {
          filters: {
            and: [
              {
                column: "status",
                method: "eq",
                value: "canceled",
              },
              {
                column: "createdAt",
                method: "lt",
                value: new Date(
                  Date.now() - 2 * 24 * 60 * 60 * 1000,
                ).toISOString(),
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

      if (canceledOrders?.length) {
        for (const order of canceledOrders) {
          try {
            await ecommerceModuleOrderApi.delete({
              id: order.id,
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          } catch (error: any) {
            // logger.error("Ecommerce module order check failed", {
            //   error: error,
            // });
          }
        }
      }

      logger.info("Ecommerce module order delete canceled finished");

      return c.json({
        data: {
          ok: true,
        },
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
