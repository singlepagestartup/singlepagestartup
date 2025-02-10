import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { api as ordersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";
import { api as ordersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { api } from "@sps/ecommerce/models/order/sdk/server";
import { api as billingInvoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { api as billingPaymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as billingPaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { logger } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC secret key not found");
      }

      const uuid = c.req.param("uuid");

      if (!uuid) {
        return c.json(
          {
            message: "Invalid id",
          },
          {
            status: 400,
          },
        );
      }

      const entity = await this.service.findById({
        id: uuid,
      });

      if (!entity) {
        throw new Error("Order not found");
      }

      const ordersToBillingModuleCurrencies =
        await ordersToBillingModuleCurrenciesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "orderId",
                  method: "eq",
                  value: uuid,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });

      if (!ordersToBillingModuleCurrencies?.length) {
        throw new Error("Orders to billing module currencies not found");
      }

      if (entity.status === "paying") {
        const updatedAt = new Date(entity.updatedAt).getTime();
        const expiredPayment =
          updatedAt < new Date(Date.now() - 1000 * 60 * 24).getTime();

        if (expiredPayment) {
          await api.update({
            id: uuid,
            data: {
              ...entity,
              status: "canceled",
              type: "history",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
              next: {
                cache: "no-store",
              },
            },
          });
        } else {
          const ordersToBillingModulePaymentIntents =
            await ordersToBillingModulePaymentIntentsApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "orderId",
                      method: "eq",
                      value: uuid,
                    },
                  ],
                },
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
                next: {
                  cache: "no-store",
                },
              },
            });

          if (!ordersToBillingModulePaymentIntents?.length) {
            throw new Error(
              "Orders to billing module payment intents not found",
            );
          }

          const paymentIntents = await billingPaymentIntentApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: ordersToBillingModulePaymentIntents.map(
                      (order) => order.billingModulePaymentIntentId,
                    ),
                  },
                ],
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
              next: {
                cache: "no-store",
              },
            },
          });

          if (!paymentIntents?.length) {
            throw new Error("Payment intents not found");
          }

          const paymentIntentIsSucceeded = paymentIntents.find(
            (paymentIntent) => {
              return paymentIntent.status === "succeeded";
            },
          );

          if (!paymentIntentIsSucceeded) {
            throw new Error("Payment intent is not succeeded");
          }

          const attributes = await this.service.getCheckoutAttributes({
            id: uuid,
            billingModuleCurrencyId:
              ordersToBillingModuleCurrencies[0].billingModuleCurrencyId,
          });

          await api.update({
            id: uuid,
            data: {
              ...entity,
              status:
                attributes.type === "subscription" ? "delivering" : "approving",
              type: "history",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
              next: {
                cache: "no-store",
              },
            },
          });
        }
      } else if (entity.status === "delivering") {
        const attributes = await this.service.getCheckoutAttributes({
          id: uuid,
          billingModuleCurrencyId:
            ordersToBillingModuleCurrencies[0].billingModuleCurrencyId,
        });

        if (attributes.interval) {
          const minuteIntervalDeadline = new Date(
            new Date(entity.updatedAt).setMinutes(
              new Date(entity.updatedAt).getMinutes() + 1,
            ),
          );
          const hourIntervalDeadline = new Date(
            new Date(entity.updatedAt).setHours(
              new Date(entity.updatedAt).getHours() + 1,
            ),
          );
          const dayIntervalDeadline = new Date(
            new Date(entity.updatedAt).setDate(
              new Date(entity.updatedAt).getDate() + 1,
            ),
          );
          const weekIntervalDeadline = new Date(
            new Date(entity.updatedAt).setDate(
              new Date(entity.updatedAt).getDate() + 7,
            ),
          );
          const monthIntervalDeadline = new Date(
            new Date(entity.updatedAt).setMonth(
              new Date(entity.updatedAt).getMonth() + 1,
            ),
          );
          const yearIntervalDeadline = new Date(
            new Date(entity.updatedAt).setFullYear(
              new Date(entity.updatedAt).getFullYear() + 1,
            ),
          );

          const intervalDeadline =
            attributes.interval === "minute"
              ? minuteIntervalDeadline
              : attributes.interval === "hour"
                ? hourIntervalDeadline
                : attributes.interval === "day"
                  ? dayIntervalDeadline
                  : attributes.interval === "week"
                    ? weekIntervalDeadline
                    : attributes.interval === "month"
                      ? monthIntervalDeadline
                      : yearIntervalDeadline;

          const isExpired = new Date() > intervalDeadline;

          logger.debug("🚀 ~ check ~ new Date():", new Date());
          logger.debug("🚀 ~ check ~ intervalDeadline:", intervalDeadline);
          logger.debug("🚀 ~ check ~ isExpired:", isExpired);

          if (isExpired) {
            const ordersToBillingModulePaymentIntents =
              await ordersToBillingModulePaymentIntentsApi.find({
                params: {
                  filters: {
                    and: [
                      {
                        column: "orderId",
                        method: "eq",
                        value: uuid,
                      },
                    ],
                  },
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                  next: {
                    cache: "no-store",
                  },
                },
              });

            if (!ordersToBillingModulePaymentIntents?.length) {
              throw new Error(
                "Orders to billing module payment intents not found",
              );
            }

            const paymentIntents = await billingPaymentIntentApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: ordersToBillingModulePaymentIntents.map(
                        (order) => order.billingModulePaymentIntentId,
                      ),
                    },
                  ],
                },
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  "Cache-Control": "no-store",
                },
                next: {
                  cache: "no-store",
                },
              },
            });

            if (!paymentIntents?.length) {
              throw new Error("Payment intents not found");
            }

            const paymentIntentsToInvoices =
              await billingPaymentIntentsToInvoicesApi.find({
                params: {
                  filters: {
                    and: [
                      {
                        column: "paymentIntentId",
                        method: "inArray",
                        value: paymentIntents.map(
                          (paymentIntent) => paymentIntent.id,
                        ),
                      },
                    ],
                  },
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                  next: {
                    cache: "no-store",
                  },
                },
              });

            if (!paymentIntentsToInvoices?.length) {
              throw new Error("Payment intents to invoices not found");
            }

            const invoices = await billingInvoiceApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: paymentIntentsToInvoices.map(
                        (paymentIntentToInvoice) =>
                          paymentIntentToInvoice.invoiceId,
                      ),
                    },
                    {
                      column: "createdAt",
                      method: "gt",
                      value: new Date(intervalDeadline).toISOString(),
                    },
                  ],
                },
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
                next: {
                  cache: "no-store",
                },
              },
            });

            logger.debug("🚀 ~ check ~ invoices:", invoices);

            if (!invoices?.length) {
              await api.update({
                id: uuid,
                data: {
                  ...entity,
                  status: "delivered",
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                  next: {
                    cache: "no-store",
                  },
                },
              });
            }
          }
        }
      }

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
