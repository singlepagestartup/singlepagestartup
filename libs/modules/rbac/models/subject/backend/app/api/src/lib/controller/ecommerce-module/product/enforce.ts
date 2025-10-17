import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { IModel as IEcommerceAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import { api as ecommerceOrdersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { api as billingPaymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as billingInvoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { api as ecommerceAttributeKeysToAttributesApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";
import { api as ecommerceProductsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { api as ecommerceAttributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { api as ecommerceAttributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import { api as billingPaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as ecommerceOrdersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";
import { api as ecommerceOrdersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { getHttpErrorType, logger } from "@sps/backend-utils";

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

      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("No uuid provided");
      }

      const productId = c.req.param("productId");

      if (!productId) {
        throw new Error("No productId provided");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        return c.json(
          {
            message: "Invalid body",
          },
          {
            status: 400,
          },
        );
      }

      const data = JSON.parse(body["data"]);

      const entity = await this.service.findById({
        id: uuid,
      });

      if (!entity) {
        throw new Error("No entity found");
      }

      const subjectsToIdentities = await subjectsToIdentitiesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
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

      if (!subjectsToIdentities?.length) {
        throw new Error("No subjects to identities found");
      }

      const identities = await identityApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: subjectsToIdentities.map((item) => item.identityId),
              },
              {
                column: "email",
                method: "isNotNull",
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

      if (!identities?.length) {
        throw new Error("No identities found");
      }

      let price: IEcommerceAttribute | undefined;
      let interval: IEcommerceAttribute | undefined;

      const productsToAttributes = await ecommerceProductsToAttributesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "eq",
                value: productId,
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

      if (!productsToAttributes?.length) {
        throw new Error("No products to attributes found");
      }

      const attributes = await ecommerceAttributeApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: productsToAttributes.map((pta) => pta.attributeId),
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

      if (!attributes?.length) {
        throw new Error("No attributes found");
      }

      for (const attribute of attributes) {
        const attributeKeysToAttributes =
          await ecommerceAttributeKeysToAttributesApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "attributeId",
                    method: "eq",
                    value: attribute.id,
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

        if (!attributeKeysToAttributes?.length) {
          throw new Error("No attribute keys to attributes found");
        }

        const attributeKey = await ecommerceAttributeKeyApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "eq",
                  value: attributeKeysToAttributes[0].attributeKeyId,
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

        if (!attributeKey?.length) {
          continue;
        }

        if (attributeKey[0].type === "price") {
          price = attribute;
        }

        if (attributeKey[0].type === "interval") {
          interval = attribute;
        }
      }

      logger.debug("🚀 ~ prolongate ~ price:", price);
      logger.debug("🚀 ~ prolongate ~ interval:", interval);

      const ordersToProducts = await ecommerceOrdersToProductsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "eq",
                value: productId,
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

      if (!ordersToProducts?.length) {
        throw new Error("No orders to products found");
      }

      const orders = await ecommerceOrderApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: ordersToProducts.map((otp) => otp.orderId),
              },
              {
                column: "status",
                method: "inArray",
                value: ["approving", "packaging", "delivering", "canceled"],
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

      if (!orders?.length) {
        throw new Error("No orders found");
      }

      for (const order of orders) {
        const ordersToBillingModulePaymentIntents =
          await ecommerceOrdersToBillingModulePaymentIntentsApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "orderId",
                    method: "eq",
                    value: order.id,
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

        if (!ordersToBillingModulePaymentIntents?.length) {
          continue;
        }

        if (ordersToBillingModulePaymentIntents.length > 1) {
          throw new Error("Multiple billing module payment intents found");
        }

        const paymentIntentId =
          ordersToBillingModulePaymentIntents[0].billingModulePaymentIntentId;

        const paymentIntent = await billingPaymentIntentApi.findById({
          id: paymentIntentId,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (!paymentIntent) {
          throw new Error("Payment intent not found");
        }

        const paymentIntentsToInvoices =
          await billingPaymentIntentsToInvoicesApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "paymentIntentId",
                    method: "eq",
                    value: paymentIntent.id,
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

        if (!paymentIntentsToInvoices?.length) {
          continue;
        }

        const invoices = await billingInvoiceApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: paymentIntentsToInvoices?.map((pti) => pti.invoiceId),
                },
                // {
                //   column: "status",
                //   method: "eq",
                //   value: "paid",
                // },
              ],
            },
            orderBy: {
              and: [
                {
                  column: "updatedAt",
                  method: "desc",
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

        if (!invoices?.length) {
          continue;
        }

        const latestInvoice = invoices[0];

        logger.debug("🚀 ~ enforce ~ latestInvoice:", latestInvoice);

        let durationInMiliseconds = 31540000000;

        switch (interval?.string?.["en"]) {
          case "minute":
            durationInMiliseconds = 60000;
            break;
          case "hour":
            durationInMiliseconds = 3600000;
            break;
          case "day":
            durationInMiliseconds = 60000;
            // durationInMiliseconds = 86400000;
            break;
          case "week":
            durationInMiliseconds = 604800000;
            break;
          case "month":
            durationInMiliseconds = 2628000000;
            break;
          case "year":
            durationInMiliseconds = 31540000000;
            break;
        }

        const finishAt =
          new Date(latestInvoice.updatedAt).getTime() + durationInMiliseconds;

        logger.debug("🚀 ~ enforce ~ finishAt:", new Date(finishAt));

        if (finishAt < new Date().getTime()) {
          if (order.status === "canceled") {
            await ecommerceOrderApi.update({
              id: order.id,
              data: {
                status: "delivered",
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
            continue;
          }

          const providesWithSubscriptions = ["stripe", "payselection"];

          await billingPaymentIntentApi.update({
            id: paymentIntentId,
            data: {
              ...paymentIntent,
              status: "requires_confirmation",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });

          // await orderApi.update({
          //   id: order.id,
          //   data: {
          //     status: "paying",
          //   },
          //   options: {
          //     headers: {
          //       "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          //     },
          //   },
          // });

          const ecommerceOrdersToBillingModuleCurrencies =
            await ecommerceOrdersToBillingModuleCurrenciesApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "orderId",
                      method: "eq",
                      value: order.id,
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

          if (!ecommerceOrdersToBillingModuleCurrencies?.length) {
            throw new Error(
              "No ecommerce orders to billing module currencies found",
            );
          }

          if (
            latestInvoice.provider &&
            providesWithSubscriptions.includes(latestInvoice.provider)
          ) {
            continue;
          }

          if (!latestInvoice.provider) {
            continue;
          }

          // await billingPaymentIntentApi.provider({
          //   id: paymentIntentId,
          //   data: {
          //     provider: latestInvoice.provider,
          //     currencyId:
          //       ecommerceOrdersToBillingModuleCurrencies[0]
          //         .billingModuleCurrencyId,
          //     metadata: {
          //       email: identities[0].email,
          //     },
          //   },
          //   options: {
          //     headers: {
          //       "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          //     },
          //     next: {
          //       cache: "no-store",
          //     },
          //   },
          // });
        }
      }

      return c.json({
        data: {},
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
