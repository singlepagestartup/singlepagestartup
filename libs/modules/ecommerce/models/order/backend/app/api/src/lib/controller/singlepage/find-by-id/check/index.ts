import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { api } from "@sps/ecommerce/models/order/sdk/server";
import { api as billingModulePaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { getHttpErrorType, logger } from "@sps/backend-utils";

export const PAYMENT_INITIALIZATION_GRACE_PERIOD_MS = 5 * 60 * 1000;
export const PAYMENT_EXPIRATION_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async findPaymentIntentsByIds(ids: string[]): Promise<any[]> {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));

    if (!uniqueIds.length) {
      return [];
    }

    const paymentIntents = await Promise.all(
      uniqueIds.map((id) => {
        return this.service.billingModule.paymentIntent.findById({
          id,
        });
      }),
    );

    return paymentIntents.filter((paymentIntent) => Boolean(paymentIntent));
  }

  async findInvoicesByIdsAfterDate(
    ids: string[],
    afterDate: Date,
  ): Promise<any[]> {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));

    if (!uniqueIds.length) {
      return [];
    }

    const invoices = await Promise.all(
      uniqueIds.map((id) => {
        return this.service.billingModule.invoice.findById({
          id,
        });
      }),
    );

    return invoices.filter(
      (invoice): invoice is NonNullable<typeof invoice> => {
        if (!invoice) {
          return false;
        }

        return new Date(invoice.createdAt) > afterDate;
      },
    );
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC secret key not found");
      }
      const rbacSecretKey = RBAC_SECRET_KEY;

      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Validation error. Invalid id");
      }

      const entity = await this.service.findById({
        id: uuid,
      });

      if (!entity) {
        throw new Error("Not Found error. Order not found");
      }

      const ordersToBillingModuleCurrencies =
        await this.service.ordersToBillingModuleCurrencies.find({
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
        });

      if (entity.status === "paying") {
        const updatedAt = new Date(entity.updatedAt).getTime();
        const paymentInitializationExpired =
          updatedAt < Date.now() - PAYMENT_INITIALIZATION_GRACE_PERIOD_MS;
        const expiredPayment =
          updatedAt < Date.now() - PAYMENT_EXPIRATION_PERIOD_MS;

        if (expiredPayment) {
          await api.update({
            id: uuid,
            data: {
              ...entity,
              status: "canceling",
              type: "history",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        } else {
          const ordersToBillingModulePaymentIntents =
            await this.service.ordersToBillingModulePaymentIntents.find({
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
            });

          if (!ordersToBillingModulePaymentIntents?.length) {
            if (paymentInitializationExpired) {
              await api.update({
                id: uuid,
                data: {
                  ...entity,
                  status: "canceling",
                  type: "history",
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                },
              });
            }

            return c.json({
              data: {
                ok: true,
              },
            });
          }

          const paymentIntents = await this.findPaymentIntentsByIds(
            ordersToBillingModulePaymentIntents.map(
              (order) => order.billingModulePaymentIntentId,
            ),
          );

          if (!paymentIntents?.length) {
            if (paymentInitializationExpired) {
              await api.update({
                id: uuid,
                data: {
                  ...entity,
                  status: "canceling",
                  type: "history",
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                },
              });
            }

            return c.json({
              data: {
                ok: true,
              },
            });
          }

          const paymentIntentIsSucceeded = paymentIntents.find(
            (paymentIntent) => {
              return paymentIntent.status === "succeeded";
            },
          );

          if (paymentIntentIsSucceeded) {
            await api.update({
              id: uuid,
              data: {
                ...entity,
                status: "paid",
                type: "history",
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });

            return c.json({
              data: {
                ok: true,
              },
            });
          }

          const paymentIntentIsFailed = paymentIntents.every(
            (paymentIntent) => {
              return ["failed", "canceled"].includes(paymentIntent.status);
            },
          );

          if (paymentIntentIsFailed) {
            await api.update({
              id: uuid,
              data: {
                ...entity,
                status: "canceling",
                type: "history",
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });

            return c.json({
              data: {
                ok: true,
              },
            });
          }

          const paymentIntentsToInvoices =
            await this.service.billingModule.paymentIntentsToInvoices.find({
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
            });

          if (
            paymentInitializationExpired &&
            !paymentIntentsToInvoices?.length
          ) {
            await Promise.allSettled(
              paymentIntents.map((paymentIntent) => {
                return billingModulePaymentIntentApi.update({
                  id: paymentIntent.id,
                  data: {
                    ...paymentIntent,
                    status: "failed",
                  },
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": rbacSecretKey,
                    },
                  },
                });
              }),
            );

            await api.update({
              id: uuid,
              data: {
                ...entity,
                status: "canceling",
                type: "history",
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          }

          return c.json({
            data: {
              ok: true,
            },
          });
        }
      } else if (
        entity.status === "delivering" &&
        ordersToBillingModuleCurrencies?.length
      ) {
        const attributes =
          await this.service.findByIdCheckoutAttributesByCurrency({
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

          if (isExpired) {
            const ordersToBillingModulePaymentIntents =
              await this.service.ordersToBillingModulePaymentIntents.find({
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
              });

            if (ordersToBillingModulePaymentIntents?.length) {
              const paymentIntents = await this.findPaymentIntentsByIds(
                ordersToBillingModulePaymentIntents.map(
                  (order) => order.billingModulePaymentIntentId,
                ),
              );

              if (paymentIntents?.length) {
                const paymentIntentsToInvoices =
                  await this.service.billingModule.paymentIntentsToInvoices.find(
                    {
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
                    },
                  );

                if (paymentIntentsToInvoices?.length) {
                  const invoices = await this.findInvoicesByIdsAfterDate(
                    paymentIntentsToInvoices.map(
                      (paymentIntentToInvoice) =>
                        paymentIntentToInvoice.invoiceId,
                    ),
                    new Date(intervalDeadline),
                  );

                  if (invoices?.length) {
                    return c.json({
                      data: {
                        ok: true,
                      },
                    });
                  }
                }
              }
            }

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
              },
            });
          }
        }
      } else if (
        entity.status === "requested_cancelation" &&
        ordersToBillingModuleCurrencies?.length
      ) {
        const attributes =
          await this.service.findByIdCheckoutAttributesByCurrency({
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

          if (!isExpired) {
            return c.json({
              data: {
                ok: true,
              },
            });
          }

          await api.update({
            id: uuid,
            data: {
              ...entity,
              status: "canceling",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        }
      }

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
