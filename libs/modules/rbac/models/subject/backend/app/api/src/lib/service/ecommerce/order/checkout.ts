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

    let billingModuleCurrencyId = props.billingModule?.["currency"]?.["id"];

    if (!billingModuleCurrencyId) {
      const billingModuleCurrencies = await billingModuleCurrencyApi.find({
        params: {
          filters: {
            and: [
              {
                column: "isDefault",
                method: "eq",
                value: true,
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

      if (billingModuleCurrencies?.length === 0) {
        throw new Error("No currencies found");
      }

      if (
        billingModuleCurrencies?.length &&
        billingModuleCurrencies.length > 1
      ) {
        throw new Error(
          "Multiple currencies found. Pass 'data.billingModuleCurrencyId'",
        );
      }

      billingModuleCurrencyId = billingModuleCurrencies?.[0]?.id;
    }

    if (!billingModuleCurrencyId) {
      throw new Error("No billing module currency id found");
    }

    const metadata = {
      orders: props.ecommerceModule.orders.map((order: { id: string }) => {
        return {
          id: order.id,
        };
      }),
      email: props.email,
    };

    let total = 0;
    const types: string[] = [];
    const intervals: string[] = [];
    for (const order of props.ecommerceModule.orders) {
      const orderToProducts = await ecommerceModuleOrdersToProductsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "eq",
                value: order["id"],
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

      if (!orderToProducts?.length) {
        throw new HTTPException(404, {
          message: "No products found for order: " + order["id"],
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

      total += amount;
      types.push(type);
      intervals.push(interval);
    }

    if (!types.every((type) => type === types[0])) {
      throw new Error("All types must be the same");
    }

    if (!intervals.every((interval) => interval === intervals[0])) {
      throw new Error("All intervals must be the same");
    }

    const type = types[0];
    const interval = intervals[0];

    const billingModulePaymentIntent =
      await billingModulePaymentIntentApi.create({
        data: {
          amount: total,
          interval,
          type,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

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

    for (const order of props.ecommerceModule.orders) {
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

      await ecommerceModuleOrdersToBillingModuleCurrenciesApi.create({
        data: {
          orderId: order["id"],
          billingModuleCurrencyId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      await billingModulePaymentIntentsToCurrenciesApi.create({
        data: {
          paymentIntentId: billingModulePaymentIntent.id,
          currencyId: billingModuleCurrencyId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });
    }

    await billingModulePaymentIntentApi.provider({
      id: billingModulePaymentIntent.id,
      data: {
        provider: props.provider,
        metadata,
        currencyId: billingModuleCurrencyId,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

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
                method: "eq",
                value: billingModulePaymentIntent.id,
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

    return {
      billingModule: {
        invoices: billingModuleInvoices,
      },
    };
  }
}
