import { HOST_SERVICE_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { logger } from "@sps/backend-utils";
import { api as paymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";

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

      logger.info("Billing module payment intent check started");

      const notSucceededPaymentIntents = await paymentIntentApi.find({
        params: {
          filters: {
            and: [
              {
                column: "status",
                method: "ne",
                value: "succeeded",
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

      if (notSucceededPaymentIntents?.length) {
        for (const paymentIntent of notSucceededPaymentIntents) {
          try {
            await paymentIntentApi.check({
              id: paymentIntent.id,
              data: {},
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          } catch (error: any) {
            // logger.error("Billing module payment intent check failed", {
            //   error: error,
            // });
          }
        }
      }

      logger.info("Billing module payment intent check finished");

      return c.json({ data: { ok: true } });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
