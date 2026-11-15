import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType } from "@sps/backend-utils";

export const PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS = 5 * 60 * 1000;

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC secret key not found");
      }

      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Validation error. Invalid id");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid data");
      }

      const entity = await this.service.findById({ id: uuid });

      const data = JSON.parse(body["data"]);

      if (!data) {
        throw new Error("Validation error. Invalid data");
      }

      if (!entity) {
        throw new Error("Not Found error. Not found");
      }

      if (["succeeded", "failed", "canceled"].includes(entity.status)) {
        return c.json({
          data: entity,
        });
      }

      const paymentIntentsToInvoices =
        await this.service.billingModule.paymentIntentsToInvoices.find({
          params: {
            filters: {
              and: [
                {
                  column: "paymentIntentId",
                  method: "eq",
                  value: uuid,
                },
              ],
            },
          },
        });

      if (!paymentIntentsToInvoices?.length) {
        const updatedAt = new Date(
          entity.updatedAt ?? entity.createdAt,
        ).getTime();
        const initializationExpired =
          updatedAt <
          Date.now() - PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS;

        if (initializationExpired) {
          const failedEntity =
            await this.service.failUninitializedPaymentIntent(
              entity.id,
              new Date(
                Date.now() - PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS,
              ),
            );

          return c.json({
            data: failedEntity,
          });
        }

        return c.json({
          data: entity,
        });
      }

      const invoiceIds = paymentIntentsToInvoices.map((link) => link.invoiceId);
      const invoices = await this.service.billingModule.invoice.find({
        params: {
          filters: {
            and: [{ column: "id", method: "inArray", value: invoiceIds }],
          },
        },
      });

      const expiresBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      for (const invoice of invoices) {
        if (invoice.provider === "cloudpayments") {
          await this.service.checkCloudpaymentsInvoice(invoice);
        } else if (new Date(invoice.createdAt) < expiresBefore) {
          await this.service.expireInvoice({
            invoiceId: invoice.id,
            provider: invoice.provider,
            expiresBefore,
          });
        }
      }
      const currentIntent = await this.service.findById({ id: entity.id });
      return c.json({ data: currentIntent });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
