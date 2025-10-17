import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { getHttpErrorType, logger } from "@sps/backend-utils";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY not set");
      }

      logger.info("Ecommerce module order check started");

      const notSucceededOrders = await ecommerceModuleOrderApi.find({
        params: {
          filters: {
            and: [
              {
                column: "status",
                method: "ne",
                value: "paid",
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

      if (notSucceededOrders?.length) {
        for (const order of notSucceededOrders) {
          try {
            await ecommerceModuleOrderApi.check({
              id: order.id,
              data: {},
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

      logger.info("Ecommerce module order check finished");

      return c.json({
        data: {
          ok: true,
        },
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);

      throw new HTTPException(status, { message, cause: details });
    }
  }
}
