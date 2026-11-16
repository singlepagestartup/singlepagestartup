import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import { getHttpErrorType } from "@sps/backend-utils";
import { Handler as UpdateHandler } from "../../update";

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

  private async transitionPaymentStatus(order: IOrder, status: "canceling") {
    await this.service.transitionPaymentStatus({
      id: order.id,
      status,
      expectedStatus: order.status,
      expectedUpdatedAt: order.updatedAt,
    });
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

      const entity = await this.service.findById({
        id: uuid,
      });

      if (!entity) {
        throw new Error("Not Found error. Order not found");
      }

      const recoverablePaymentFailure =
        entity.type === "history" &&
        Boolean(entity.paymentFailureCanceledAt) &&
        ["canceling", "canceled"].includes(entity.status) &&
        !entity.subscriptionPeriodInvoiceId &&
        !entity.subscriptionPeriodStartsAt &&
        !entity.subscriptionPeriodEndsAt &&
        !entity.subscriptionRevokedAt;

      if (entity.status === "paying" || recoverablePaymentFailure) {
        const updatedAt = new Date(entity.updatedAt).getTime();
        const paymentInitializationExpired =
          updatedAt < Date.now() - PAYMENT_INITIALIZATION_GRACE_PERIOD_MS;
        const expiredPayment =
          updatedAt < Date.now() - PAYMENT_EXPIRATION_PERIOD_MS;
        const orderIntents =
          await this.service.ordersToBillingModulePaymentIntents.find({
            params: {
              filters: {
                and: [{ column: "orderId", method: "eq", value: uuid }],
              },
            },
          });
        const paymentIntents = await this.findPaymentIntentsByIds(
          (orderIntents ?? []).map((link) => link.billingModulePaymentIntentId),
        );
        // Confirmation wins even after the recovery timeout or unpaid cleanup.
        if (paymentIntents.some((intent) => intent.status === "succeeded")) {
          const paid = await this.service.completePaymentStatus({
            id: entity.id,
            expectedStatus: entity.status,
            expectedUpdatedAt: entity.updatedAt,
            onPaymentSucceeded: (order) => this.onPaymentSucceeded({ order }),
          });
          if (paid) {
            await new UpdateHandler(this.service).onPaymentStatusUpdated({
              previousEntity: entity,
              entity: paid,
            });
          }
        } else if (entity.status === "paying") {
          const allFailed =
            paymentIntents.length > 0 &&
            paymentIntents.every((intent) =>
              ["failed", "canceled"].includes(intent.status),
            );
          if (expiredPayment || allFailed) {
            await this.transitionPaymentStatus(entity, "canceling");
          } else if (paymentInitializationExpired) {
            const invoiceLinks = paymentIntents.length
              ? await this.service.billingModule.paymentIntentsToInvoices.find({
                  params: {
                    filters: {
                      and: [
                        {
                          column: "paymentIntentId",
                          method: "inArray",
                          value: paymentIntents.map((intent) => intent.id),
                        },
                      ],
                    },
                  },
                })
              : [];
            if (!invoiceLinks?.length) {
              await Promise.all(
                paymentIntents.map((intent) =>
                  this.service.billingModule.paymentIntent.failUninitializedPaymentIntent(
                    intent.id,
                    new Date(
                      Date.now() - PAYMENT_INITIALIZATION_GRACE_PERIOD_MS,
                    ),
                  ),
                ),
              );
              await this.transitionPaymentStatus(entity, "canceling");
            }
          }
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
