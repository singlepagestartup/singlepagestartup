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
import { api as ecommerceModuleProductsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { api as ecommerceModuleAttributesKeysToAttributesApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";
import { api as ecommerceModuleProductApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as ecommerceModuleAttributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import { api as ecommerceModuleAttributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { IModel as IBillingModulePaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";
import { api as billingModulePaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as ecommerceModuleOrdersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { api as ecommerceModuleOrdersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";
import { api as billingModulePaymentIntentsToCurrenciesApi } from "@sps/billing/relations/payment-intents-to-currencies/sdk/server";
import { api as broadcastModuleChannelApi } from "@sps/broadcast/models/channel/sdk/server";
import { api as billingModulePaymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as billingModuleInvoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { Service as NotificationCreateService } from "./notification-create";
import { api as ecommerceModuleAttributesToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/server";

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

    const ecommerceModuleOrders = await ecommerceModuleOrderApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
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

    if (!ecommerceModuleOrders?.length) {
      throw new HTTPException(404, {
        message: "No ecommerce module orders found",
      });
    }

    const ordersToProducts = await ecommerceModuleOrdersToProductsApi.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "inArray",
              value: ecommerceModuleOrders.map((order) => order.id),
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

    if (!ordersToProducts?.length) {
      throw new HTTPException(404, {
        message: "No orders to products found",
      });
    }

    const ecommerceModuleProducts = await ecommerceModuleProductApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: ordersToProducts.map(
                (orderToProduct) => orderToProduct.productId,
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

    if (!ecommerceModuleProducts?.length) {
      throw new HTTPException(404, {
        message: "No ecommerce module products found",
      });
    }

    const ecommerceModuleProductsToAttributes =
      await ecommerceModuleProductsToAttributesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "inArray",
                value: ecommerceModuleProducts.map(
                  (ecommerceModuleProduct) => ecommerceModuleProduct.id,
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

    if (!ecommerceModuleProductsToAttributes?.length) {
      throw new HTTPException(404, {
        message: "No ecommerce module products to attributes found",
      });
    }

    const ecommerceModuleAttributesKeysToAttributes =
      await ecommerceModuleAttributesKeysToAttributesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeId",
                method: "inArray",
                value: ecommerceModuleProductsToAttributes.map(
                  (ecommerceModuleProductToAttribute) =>
                    ecommerceModuleProductToAttribute.attributeId,
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

    if (!ecommerceModuleAttributesKeysToAttributes?.length) {
      throw new HTTPException(404, {
        message: "No ecommerce module attributes keys to attributes found",
      });
    }

    const ecommerceModuleAttributesKeys =
      await ecommerceModuleAttributeKeyApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: ecommerceModuleAttributesKeysToAttributes.map(
                  (ecommerceModuleAttributesKeysToAttribute) =>
                    ecommerceModuleAttributesKeysToAttribute.attributeKeyId,
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

    if (!ecommerceModuleAttributesKeysToAttributes?.length) {
      throw new HTTPException(404, {
        message: "No ecommerce module attributes keys to attributes found",
      });
    }

    if (!ecommerceModuleAttributesKeys?.length) {
      throw new HTTPException(404, {
        message: "No ecommerce module attributes keys found",
      });
    }

    const ecommerceModuleAttributes = await ecommerceModuleAttributeApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: ecommerceModuleProductsToAttributes.map(
                (ecommerceModuleProductToAttribute) =>
                  ecommerceModuleProductToAttribute.attributeId,
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

    if (!ecommerceModuleAttributes?.length) {
      throw new HTTPException(404, {
        message: "No ecommerce module attributes found",
      });
    }

    const ecommerceModuleAttributesToBillingModuleCurrencies =
      await ecommerceModuleAttributesToBillingModuleCurrenciesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeId",
                method: "inArray",
                value: ecommerceModuleAttributes.map(
                  (ecommerceModuleAttribute) => ecommerceModuleAttribute.id,
                ),
              },
            ],
          },
        },
      });

    const billingModuleCurrencies = await billingModuleCurrencyApi.find({});

    const metadata = {
      ecommerceModule: {
        orders: ecommerceModuleOrders.map((ecommerceModuleOrder) => {
          return {
            id: ecommerceModuleOrder.id,
            ordersToProducts: ordersToProducts
              .filter((orderToProduct) => {
                return orderToProduct.orderId === ecommerceModuleOrder.id;
              })
              .map((orderToProduct) => {
                return {
                  ...orderToProduct,
                  products: ecommerceModuleProducts
                    ?.filter((ecommerceModuleProduct) => {
                      return (
                        ecommerceModuleProduct.id === orderToProduct.productId
                      );
                    })
                    ?.map((ecommerceModuleProduct) => {
                      return {
                        ...ecommerceModuleProduct,
                        productsToAttributes:
                          ecommerceModuleProductsToAttributes
                            .filter((ecommerceModuleProductToAttribute) => {
                              return (
                                ecommerceModuleProductToAttribute.productId ===
                                ecommerceModuleProduct.id
                              );
                            })
                            .map((ecommerceModuleProductToAttribute) => {
                              return {
                                ...ecommerceModuleProductToAttribute,
                                attributes: ecommerceModuleAttributes
                                  .filter((ecommerceModuleAttribute) => {
                                    return (
                                      ecommerceModuleAttribute.id ===
                                      ecommerceModuleProductToAttribute.attributeId
                                    );
                                  })
                                  .map((ecommerceModuleAttribute) => {
                                    return {
                                      ...ecommerceModuleAttribute,
                                      attributesKeysToAttributes:
                                        ecommerceModuleAttributesKeysToAttributes
                                          .filter(
                                            (
                                              ecommerceModuleAttributesKeysToAttribute,
                                            ) => {
                                              return (
                                                ecommerceModuleAttributesKeysToAttribute.attributeId ===
                                                ecommerceModuleProductToAttribute.attributeId
                                              );
                                            },
                                          )
                                          .map(
                                            (
                                              ecommerceModuleAttributesKeysToAttribute,
                                            ) => {
                                              return {
                                                ...ecommerceModuleAttributesKeysToAttribute,
                                                attributeKey:
                                                  ecommerceModuleAttributesKeys.find(
                                                    (
                                                      ecommerceModuleAttributesKey,
                                                    ) => {
                                                      return (
                                                        ecommerceModuleAttributesKey.id ===
                                                        ecommerceModuleAttributesKeysToAttribute.attributeKeyId
                                                      );
                                                    },
                                                  ),
                                              };
                                            },
                                          ),
                                      attributesToBillingModuleCurrencies:
                                        ecommerceModuleAttributesToBillingModuleCurrencies
                                          ?.filter(
                                            (
                                              ecommerceModuleAttributeToBillingModuleCurrency,
                                            ) => {
                                              return (
                                                ecommerceModuleAttributeToBillingModuleCurrency.attributeId ===
                                                ecommerceModuleAttribute.id
                                              );
                                            },
                                          )
                                          .map(
                                            (
                                              ecommerceModuleAttributeToBillingModuleCurrency,
                                            ) => {
                                              return {
                                                ...ecommerceModuleAttributeToBillingModuleCurrency,
                                                billingModuleCurrency:
                                                  billingModuleCurrencies?.find(
                                                    (billingModuleCurrency) =>
                                                      billingModuleCurrency.id ===
                                                      ecommerceModuleAttributeToBillingModuleCurrency.billingModuleCurrencyId,
                                                  ),
                                              };
                                            },
                                          ),
                                    };
                                  }),
                              };
                            }),
                      };
                    }),
                };
              }),
          };
        }),
      },
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

        await ecommerceModuleOrdersToBillingModulePaymentIntentsApi.create({
          data: {
            orderId: order["id"],
            billingModulePaymentIntentId: updatedBillingModulePaymentIntent.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
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

    return {
      billingModule: {
        invoices: billingModuleInvoices,
      },
    };
  }
}
