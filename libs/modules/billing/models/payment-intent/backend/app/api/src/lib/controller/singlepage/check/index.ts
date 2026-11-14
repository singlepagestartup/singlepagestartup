import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { api as api } from "@sps/billing/models/payment-intent/sdk/server";
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
          const failedEntity = await api.update({
            id: entity.id,
            data: {
              ...entity,
              status: "failed",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });

          return c.json({
            data: failedEntity,
          });
        }

        return c.json({
          data: entity,
        });
      }

      const invoiceIds = paymentIntentsToInvoices.map((link) => link.invoiceId);
      const readInvoices = () =>
        this.service.billingModule.invoice.find({
          params: {
            filters: {
              and: [{ column: "id", method: "inArray", value: invoiceIds }],
            },
          },
        });
      const invoices = await readInvoices();

      const hasCloudpaymentsInvoice = invoices?.some(
        (invoice) => invoice.provider === "cloudpayments",
      );
      if (invoices?.length) {
        for (const invoice of invoices) {
          if (invoice.provider === "cloudpayments") {
            await this.service.checkCloudpaymentsInvoice(invoice);
            continue;
          }

          if (
            new Date(invoice.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000 <
            Date.now()
          ) {
            if (hasCloudpaymentsInvoice) {
              await this.service.billingModule.invoice.failOpenInvoice(
                invoice.id,
              );
              continue;
            }
            await invoiceApi.update({
              id: invoice.id,
              data: {
                ...invoice,
                status: "failed",
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });

            await api.update({
              id: entity.id,
              data: {
                ...entity,
                status: "failed",
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          }
        }
      }

      if (hasCloudpaymentsInvoice) {
        const currentInvoices = await readInvoices();
        if (
          currentInvoices?.length === new Set(invoiceIds).size &&
          currentInvoices.every((invoice) => invoice.status === "failed")
        ) {
          await this.service.failUnpaidIntent(entity.id, entity.status);
        }
        const currentIntent = await this.service.findById({ id: entity.id });
        return c.json({ data: currentIntent });
      }

      return c.json({
        data: entity,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
