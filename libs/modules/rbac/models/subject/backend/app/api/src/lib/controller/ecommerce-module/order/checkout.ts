import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
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

      const id = c.req.param("id");

      if (!id) {
        throw new Error("No id provided");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let data;
      try {
        data = JSON.parse(body["data"]);
      } catch (error) {
        throw new Error("Invalid JSON in body['data']. Got: " + body["data"]);
      }

      if (!data["provider"]) {
        throw new Error("No provider provided");
      }

      if (!data["email"]) {
        throw new Error("No email provided");
      }

      if (!data["ecommerceModule"]) {
        throw new Error("No ecommerceModule provided");
      }

      if (!data["ecommerceModule"]["orders"]?.length) {
        throw new Error("No ecommerceModule.orders provided");
      }

      if (
        !data["ecommerceModule"]["orders"].every((order: { id: string }) => {
          return order.id;
        })
      ) {
        throw new Error("No ecommerceModule.orders[number].id provided");
      }

      const entity = await this.service.findById({ id });

      if (!entity) {
        throw new Error("No entity found with id:" + id);
      }

      await this.service.deanonymize({ id, email: data.email });

      let billingModuleCurrencyId = data["billingModule"]?.["currency"]?.["id"];

      if (!data["billingModule"]["currency"]["id"]) {
        const currencies = await billingModuleCurrencyApi.find({
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (currencies?.length === 0) {
          throw new Error("No currencies found");
        }

        if (currencies?.length && currencies.length > 1) {
          throw new Error(
            "Multiple currencies found. Pass 'data.billingModuleCurrencyId'",
          );
        }

        billingModuleCurrencyId = currencies?.[0]?.id;
      }

      const metadata = {
        orders: data["ecommerceModule"]["orders"].map(
          (order: { id: string }) => {
            return {
              id: order.id,
            };
          },
        ),
        email: data["email"],
      };

      let total = 0;
      const types: string[] = [];
      const intervals: string[] = [];
      for (const order of data["ecommerceModule"]["orders"]) {
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
                  value: data["ecommerceModule"]["orders"].map(
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

      for (const order of data["ecommerceModule"]["orders"]) {
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
          provider: data["provider"],
          metadata,
          currencyId: billingModuleCurrencyId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      for (const order of data["ecommerceModule"]["orders"]) {
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
                url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/billing/payment-intents/${data["provider"]}/webhook`,
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
                  url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/rbac/subjects/${id}/check`,
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

        await this.service.ecommerceOrderNotificationCreate({
          id,
          orderId: order["id"],
          data: {
            comment: data.comment,
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

      return c.json({
        data: {
          billingModule: {
            invoices: billingModuleInvoices,
          },
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
