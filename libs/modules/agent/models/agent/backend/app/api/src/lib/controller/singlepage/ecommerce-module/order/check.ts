import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { getHttpErrorType, logger } from "@sps/backend-utils";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";

export const ECOMMERCE_ORDER_CHECK_BATCH_LIMIT = 100;

export const ECOMMERCE_ORDER_CHECK_STATUSES = [
  "paying",
  "delivering",
  "requested_cancelation",
];

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      logger.info("Ecommerce module order check started");

      const currentOrders = await this.service.ecommerceModule.order.find({
        params: {
          filters: {
            and: [
              {
                column: "status",
                method: "inArray",
                value: ECOMMERCE_ORDER_CHECK_STATUSES,
              },
            ],
          },
          limit: ECOMMERCE_ORDER_CHECK_BATCH_LIMIT,
          orderBy: {
            and: [
              {
                column: "updatedAt",
                method: "asc",
              },
            ],
          },
        },
      });

      if (currentOrders?.length) {
        for (const order of currentOrders) {
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
