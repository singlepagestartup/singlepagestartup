import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { getHttpErrorType, logger } from "@sps/backend-utils";

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

      logger.info("Ecommerce module order delete canceled started");
      const createdBefore = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const canceledOrders = await this.service.ecommerceModule.order.find({
        params: {
          filters: {
            and: [
              {
                column: "status",
                method: "eq",
                value: "canceled",
              },
              {
                column: "paymentFailureCanceledAt",
                method: "isNull",
                value: null,
              },
              {
                column: "createdAt",
                method: "lt",
                value: createdBefore.toISOString(),
              },
            ],
          },
        },
      });

      if (canceledOrders?.length) {
        for (const order of canceledOrders) {
          try {
            await this.service.ecommerceModule.order.deleteCanceledWithoutPayment(
              {
                id: order.id,
                createdBefore,
              },
            );
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
      const { status, message, details } = getHttpErrorType(error);

      throw new HTTPException(status, { message, cause: details });
    }
  }
}
