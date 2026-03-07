import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import { IModel as IEcommerceAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import { api as billingPaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
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
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Validation error. No uuid provided");
      }

      const productId = c.req.param("productId");

      if (!productId) {
        throw new Error("Validation error. No productId provided");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid body");
      }

      const entity = await this.service.findById({
        id: uuid,
      });

      if (!entity) {
        throw new Error("Not Found error. No entity found");
      }

      const subjectsToIdentities = await this.service.subjectsToIdentities.find(
        {
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
        },
      );

      if (!subjectsToIdentities?.length) {
        throw new Error("Not Found error. No subjects to identities found");
      }

      const identities = await this.service.identity.find({
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
                value: true,
              },
            ],
          },
        },
      });

      if (!identities?.length) {
        throw new Error("Not Found error. No identities found");
      }

      let price: IEcommerceAttribute | undefined;
      let interval: IEcommerceAttribute | undefined;

      const productsToAttributes =
        await this.service.ecommerceModule.productsToAttributes.find({
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
        });

      if (!productsToAttributes?.length) {
        throw new Error("Not Found error. No products to attributes found");
      }

      const attributes = await this.service.ecommerceModule.attribute.find({
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
      });

      if (!attributes?.length) {
        throw new Error("Not Found error. No attributes found");
      }

      for (const attribute of attributes) {
        const attributeKeysToAttributes =
          await this.service.ecommerceModule.attributeKeysToAttributes.find({
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
          });

        if (!attributeKeysToAttributes?.length) {
          throw new Error(
            "Not Found error. No attribute keys to attributes found",
          );
        }

        const attributeKey =
          await this.service.ecommerceModule.attributeKey.find({
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

      const ordersToProducts =
        await this.service.ecommerceModule.ordersToProducts.find({
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
        });

      if (!ordersToProducts?.length) {
        throw new Error("Not Found error. No orders to products found");
      }

      const orders = await this.service.ecommerceModule.order.find({
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
      });

      if (!orders?.length) {
        throw new Error("Not Found error. No orders found");
      }

      for (const order of orders) {
        const ordersToBillingModulePaymentIntents =
          await this.service.ecommerceModule.ordersToBillingModulePaymentIntents.find(
            {
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
            },
          );

        if (!ordersToBillingModulePaymentIntents?.length) {
          continue;
        }

        if (ordersToBillingModulePaymentIntents.length > 1) {
          throw new Error(
            "Internal error. Multiple billing module payment intents found",
          );
        }

        const paymentIntentId =
          ordersToBillingModulePaymentIntents[0].billingModulePaymentIntentId;

        const paymentIntent =
          await this.service.billingModule.paymentIntent.findById({
            id: paymentIntentId,
          });

        if (!paymentIntent) {
          throw new Error("Not Found error. Payment intent not found");
        }

        const paymentIntentsToInvoices =
          await this.service.billingModule.paymentIntentsToInvoices.find({
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
          });

        if (!paymentIntentsToInvoices?.length) {
          continue;
        }

        const invoices = await this.service.billingModule.invoice.find({
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
            await this.service.ecommerceModule.ordersToBillingModuleCurrencies.find(
              {
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
              },
            );

          if (!ecommerceOrdersToBillingModuleCurrencies?.length) {
            throw new Error(
              "Not Found error. No ecommerce orders to billing module currencies found",
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
