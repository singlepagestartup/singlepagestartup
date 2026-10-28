import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import { api } from "@sps/ecommerce/models/order/sdk/server";
import { api as billingModulePaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";

export const PAYMENT_INITIALIZATION_GRACE_PERIOD_MS = 5 * 60 * 1000;
export const PAYMENT_EXPIRATION_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export interface IPaymentSucceededProps {
  order: IOrder;
}

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  protected async onPaymentSucceeded(
    _props: IPaymentSucceededProps,
  ): Promise<void> {}

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
            await this.onPaymentSucceeded({ order: entity });

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
        ["delivering", "requested_cancelation"].includes(entity.status)
      ) {
        // Legacy rows are frozen explicitly; unrelated updates cannot restart their clock.
        const deadline = entity.subscriptionPeriodEndsAt
          ? new Date(entity.subscriptionPeriodEndsAt).getTime()
          : Number.NaN;
        if (
          Number.isFinite(deadline) &&
          Date.now() >= deadline &&
          entity.subscriptionPeriodInvoiceId
        ) {
          await this.service.expireSubscriptionPeriod({
            id: uuid,
            expectedInvoiceId: entity.subscriptionPeriodInvoiceId,
            expectedEndsAt: new Date(
              entity.subscriptionPeriodEndsAt!,
            ).toISOString(),
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
