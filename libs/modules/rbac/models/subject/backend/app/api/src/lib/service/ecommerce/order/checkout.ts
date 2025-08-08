import { IRepository } from "@sps/shared-backend-api";
import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { HTTPException } from "hono/http-exception";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api as ecommerceModuleOrdersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { IModel as IBillingModulePaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";
import { api as billingModulePaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as ecommerceModuleOrdersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { api as ecommerceModuleOrdersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";
import { api as billingModulePaymentIntentsToCurrenciesApi } from "@sps/billing/relations/payment-intents-to-currencies/sdk/server";
import { api as broadcastModuleChannelApi } from "@sps/broadcast/models/channel/sdk/server";
import { api as billingModulePaymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as billingModuleInvoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { Service as NotificationCreateService } from "./notification-create";

export type IExecuteProps = {
  id: string;
  email: string;
  provider: string;
  comment: string;
  billingModule?: {
    currency?: {
      id?: string;
    };
  };
  ecommerceModule: {
    orders: {
      id: string;
    }[];
  };
};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined in the service");
    }

    const entity = await api.findById({
      id: props.id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!entity) {
      throw new HTTPException(404, {
        message: "No entity found",
      });
    }

    const metadata = {
      orders: props.ecommerceModule.orders.map((order: { id: string }) => {
        return {
          id: order.id,
        };
      }),
      email: props.email,
    };

    const ordersToBillingModuleCurrencies =
      await ecommerceModuleOrdersToBillingModuleCurrenciesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "inArray",
                value: props.ecommerceModule.orders.map(
                  (order: { id: string }) => order.id,
                ),
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

    if (!ordersToBillingModuleCurrencies?.length) {
      throw new HTTPException(404, {
        message: "No orders to billing module currencies found",
      });
    }

    const ordersToBillingModulePaymentIntents =
      await ecommerceModuleOrdersToBillingModulePaymentIntentsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "inArray",
                value: props.ecommerceModule.orders.map(
                  (order: { id: string }) => order.id,
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
        },
      });

    if (ordersToBillingModulePaymentIntents?.length) {
      for (const orderToBillingModulePaymentIntent of ordersToBillingModulePaymentIntents) {
        await ecommerceModuleOrdersToBillingModulePaymentIntentsApi.delete({
          id: orderToBillingModulePaymentIntent.id,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      }
    }

    const billingModulePaymentIntents: {
      billingModulePaymentIntent: IBillingModulePaymentIntent;
      billingModuleCurrencyId: string;
      checkoutAttributes: {
        type: string;
        interval: string;
      };
    }[] = [];

    for (const order of props.ecommerceModule.orders) {
      const billingModuleCurrencyId = ordersToBillingModuleCurrencies.find(
        (orderToBillingModuleCurrency) =>
          orderToBillingModuleCurrency.orderId === order["id"],
      )?.billingModuleCurrencyId;

      if (!billingModuleCurrencyId) {
        throw new HTTPException(404, {
          message:
            "No billing module currency id found for order: " + order["id"],
        });
      }

      const { amount, type, interval } =
        await ecommerceModuleOrderApi.checkoutAttributes({
          id: order["id"],
          billingModuleCurrencyId,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });

      const existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes =
        billingModulePaymentIntents.find(
          (billingModulePaymentIntent) =>
            billingModulePaymentIntent.billingModuleCurrencyId ===
              billingModuleCurrencyId &&
            billingModulePaymentIntent.checkoutAttributes.type === type &&
            billingModulePaymentIntent.checkoutAttributes.interval === interval,
        );

      if (
        existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes
      ) {
        const updatedBillingModulePaymentIntent =
          await billingModulePaymentIntentApi.update({
            id: existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes
              .billingModulePaymentIntent.id,
            data: {
              ...existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes.billingModulePaymentIntent,
              amount:
                amount +
                existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes
                  .billingModulePaymentIntent.amount,
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });

        billingModulePaymentIntents.splice(
          billingModulePaymentIntents.indexOf(
            existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes,
          ),
          1,
        );

        billingModulePaymentIntents.push({
          billingModulePaymentIntent: updatedBillingModulePaymentIntent,
          billingModuleCurrencyId,
          checkoutAttributes: {
            type,
            interval,
          },
        });

        continue;
      }

      const billingModulePaymentIntent =
        await billingModulePaymentIntentApi.create({
          data: {
            amount,
            interval,
            type,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

      await ecommerceModuleOrdersToBillingModulePaymentIntentsApi.create({
        data: {
          orderId: order["id"],
          billingModulePaymentIntentId: billingModulePaymentIntent.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      billingModulePaymentIntents.push({
        billingModulePaymentIntent,
        billingModuleCurrencyId,
        checkoutAttributes: {
          type,
          interval,
        },
      });
    }

    for (const billingModulePaymentIntent of billingModulePaymentIntents) {
      await billingModulePaymentIntentApi.provider({
        id: billingModulePaymentIntent.billingModulePaymentIntent.id,
        data: {
          provider: props.provider,
          metadata,
          currencyId: billingModulePaymentIntent.billingModuleCurrencyId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });
    }

    for (const order of props.ecommerceModule.orders) {
      const orderToUpdate = await ecommerceModuleOrderApi.findById({
        id: order["id"],
        options: {
          headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
        },
      });

      if (!orderToUpdate) {
        throw new Error("No order found with id: " + order["id"]);
      }

      await ecommerceModuleOrderApi.update({
        id: order["id"],
        data: {
          ...orderToUpdate,
          status: "paying",
        },
        options: {
          headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
        },
      });

      await broadcastModuleChannelApi.pushMessage({
        data: {
          slug: "observer",
          payload: JSON.stringify({
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
            trigger: {
              type: "request",
              method: "POST",
              url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/billing/payment-intents/${props.provider}/webhook`,
            },
            pipe: [
              {
                type: "request",
                method: "POST",
                url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${order["id"]}/check`,
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            ],
          }),
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      await broadcastModuleChannelApi.pushMessage({
        data: {
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          slug: "observer",
          payload: JSON.stringify({
            trigger: {
              type: "request",
              method: "PATCH",
              url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${order["id"]}`,
            },
            pipe: [
              {
                type: "request",
                method: "POST",
                url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/rbac/subjects/${props.id}/check`,
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            ],
          }),
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const notificationCreateService = new NotificationCreateService(
        this.repository,
      );
      await notificationCreateService.execute({
        id: props.id,
        orderId: order["id"],
        data: {
          comment: props.comment,
        },
      });
    }

    const billingModulePaymentIntentsToInvoices =
      await billingModulePaymentIntentsToInvoicesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "paymentIntentId",
                method: "inArray",
                value: billingModulePaymentIntents.map(
                  (billingModulePaymentIntent) =>
                    billingModulePaymentIntent.billingModulePaymentIntent.id,
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
        },
      });

    if (!billingModulePaymentIntentsToInvoices?.length) {
      throw new Error("No billing-module payment intent to invoices found");
    }

    const billingModuleInvoices = await billingModuleInvoiceApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: billingModulePaymentIntentsToInvoices.map(
                (item) => item.invoiceId,
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
      },
    });

    console.log("🚀 ~ execute ~ billingModuleInvoices:", billingModuleInvoices);

    return {
      billingModule: {
        invoices: billingModuleInvoices,
      },
    };
  }
}
