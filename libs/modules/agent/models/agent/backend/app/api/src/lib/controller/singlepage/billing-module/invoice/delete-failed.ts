import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { getHttpErrorType, logger } from "@sps/backend-utils";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";

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

      logger.info("Billing module invoice delete failed started");

      const notSucceededInvoices = await invoiceApi.find({
        params: {
          filters: {
            and: [
              {
                column: "status",
                method: "eq",
                value: "failed",
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

      if (notSucceededInvoices?.length) {
        for (const invoice of notSucceededInvoices) {
          try {
            await invoiceApi.delete({
              id: invoice.id,
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

      logger.info("Billing module invoice delete failed finished");

      return c.json({ data: { ok: true } });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);

      throw new HTTPException(status, { message, cause: details });
    }
  }
}
