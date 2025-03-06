import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { api as ordersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as billingPaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as billingPaymentIntentsToCurrenciesApi } from "@sps/billing/relations/payment-intents-to-currencies/sdk/server";
import { api as broadcastChannelApi } from "@sps/broadcast/models/channel/sdk/server";
import { api as ordersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { api as ordersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";
import { api } from "@sps/ecommerce/models/order/sdk/server";

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
      const body = await c.req.parseBody();

      if (!uuid) {
        throw new Error("Invalid id");
      }

      if (typeof body["data"] !== "string") {
        throw new HTTPException(422, {
          message:
            "Invalid body['data']: " +
            body["data"] +
            ". Expected string, got: " +
            typeof body["data"],
        });
      }

      api.clearOldOrders({
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      const data = JSON.parse(body["data"]);

      const provider = data["provider"] ?? "stripe";

      if (!data["email"]) {
        throw new HTTPException(400, {
          message: "Email is not provided",
        });
      }

      if (!data["billingModuleCurrencyId"]) {
        throw new HTTPException(400, {
          message: "CurrencyId is not provided",
        });
      }

      const metadata = {
        orderId: uuid,
        email: data["email"],
      };

      const existing = await this.service.findById({
        id: uuid,
      });

      if (!existing) {
        throw new HTTPException(404, {
          message: "Not Found entity with id: " + uuid,
        });
      }

      const orderToProducts = await ordersToProductsApi.find({
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

      if (!orderToProducts?.length) {
        throw new HTTPException(404, {
          message: "No products found for order: " + uuid,
        });
      }

      const { amount, type, interval } =
        await this.service.getCheckoutAttributes({
          id: uuid,
          billingModuleCurrencyId: data["billingModuleCurrencyId"],
        });

      const paymentIntent = await billingPaymentIntentApi.create({
        data: {
          amount,
          interval,
          type,
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

      if (ordersToBillingModulePaymentIntents?.length) {
        for (const orderToBillingModulePaymentIntent of ordersToBillingModulePaymentIntents) {
          await ordersToBillingModulePaymentIntentsApi.delete({
            id: orderToBillingModulePaymentIntent.id,
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

      await ordersToBillingModulePaymentIntentsApi.create({
        data: {
          orderId: uuid,
          billingModulePaymentIntentId: paymentIntent.id,
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

      await ordersToBillingModuleCurrenciesApi.create({
        data: {
          orderId: uuid,
          billingModuleCurrencyId: data["billingModuleCurrencyId"],
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

      await billingPaymentIntentsToCurrenciesApi.create({
        data: {
          paymentIntentId: paymentIntent.id,
          currencyId: data["billingModuleCurrencyId"],
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

      await billingPaymentIntentApi.provider({
        id: paymentIntent.id,
        data: {
          provider,
          metadata,
          currencyId: data["billingModuleCurrencyId"],
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

      const entity = await this.service.update({
        id: uuid,
        data: {
          ...existing,
          status: "paying",
        },
      });

      await broadcastChannelApi.pushMessage({
        data: {
          slug: "observer",
          payload: JSON.stringify({
            trigger: {
              type: "request",
              method: "POST",
              url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/billing/payment-intents/${provider}/webhook`,
            },
            pipe: [
              {
                type: "request",
                method: "POST",
                url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${uuid}/check`,
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

      return c.json({
        data: entity,
      });
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }
}
