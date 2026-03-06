import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { type IBillingModule, type IEcommerceModule } from "../../../../di";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { IModel as IBillingModulePaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";
import { api as billingModulePaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as ecommerceModuleOrdersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { api as broadcastModuleChannelApi } from "@sps/broadcast/models/channel/sdk/server";

export type IExecuteProps =
  | {
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
    }
  | {
      id: string;
      account: string;
      provider: "telegram-star";
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

type IConstructorProps = {
  findById: ({ id }: { id: string }) => Promise<any>;
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;
};

export class Service {
  findById: ({ id }: { id: string }) => Promise<any>;
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
    this.ecommerceModule = props.ecommerceModule;
    this.billingModule = props.billingModule;
    this.subjectsToEcommerceModuleOrders =
      props.subjectsToEcommerceModuleOrders;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is required");
    }

    const entity = await this.findById({
      id: props.id,
    });

    if (!entity) {
      throw new Error("Not Found error. No entity found");
    }

    const ecommerceModuleOrders = await this.ecommerceModule.order.find({
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
    });

    if (!ecommerceModuleOrders?.length) {
      throw new Error("Not Found error. No ecommerce module orders found");
    }

    const ordersToProducts = await this.ecommerceModule.ordersToProducts.find({
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
    });

    if (!ordersToProducts?.length) {
      throw new Error("Not Found error. No orders to products found");
    }

    const ecommerceModuleProducts = await this.ecommerceModule.product.find({
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
    });

    if (!ecommerceModuleProducts?.length) {
      throw new Error("Not Found error. No ecommerce module products found");
    }

    const ecommerceModuleProductsToAttributes =
      await this.ecommerceModule.productsToAttributes.find({
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
      });

    if (!ecommerceModuleProductsToAttributes?.length) {
      throw new Error(
        "Not Found error. No ecommerce module products to attributes found",
      );
    }

    const ecommerceModuleAttributesKeysToAttributes =
      await this.ecommerceModule.attributeKeysToAttributes.find({
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
      });

    if (!ecommerceModuleAttributesKeysToAttributes?.length) {
      throw new Error(
        "Not Found error. No ecommerce module attributes keys to attributes found",
      );
    }

    const ecommerceModuleAttributesKeys =
      await this.ecommerceModule.attributeKey.find({
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
      });

    if (!ecommerceModuleAttributesKeysToAttributes?.length) {
      throw new Error(
        "Not Found error. No ecommerce module attributes keys to attributes found",
      );
    }

    if (!ecommerceModuleAttributesKeys?.length) {
      throw new Error(
        "Not Found error. No ecommerce module attributes keys found",
      );
    }

    const ecommerceModuleAttributes = await this.ecommerceModule.attribute.find(
      {
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
      },
    );

    if (!ecommerceModuleAttributes?.length) {
      throw new Error("Not Found error. No ecommerce module attributes found");
    }

    const ecommerceModuleAttributesToBillingModuleCurrencies =
      await this.ecommerceModule.attributesToBillingModuleCurrencies.find({
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

    const billingModuleCurrencies = await this.billingModule.currency.find({});

    const metadata:
      | {
          ecommerceModule: any;
          email: string;
          comment: string;
        }
      | {
          ecommerceModule: any;
          account: string;
          comment: string;
        } = {
      ecommerceModule: {
        orders: ecommerceModuleOrders.map((ecommerceModuleOrder) => {
          return {
            ...ecommerceModuleOrder,
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
      account: props["account"],
      email: props["email"],
      comment: props["comment"],
    };

    const ordersToBillingModuleCurrencies =
      await this.ecommerceModule.ordersToBillingModuleCurrencies.find({
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
      });

    if (!ordersToBillingModuleCurrencies?.length) {
      throw new Error(
        "Not Found error. No orders to billing module currencies found",
      );
    }

    const ordersToBillingModulePaymentIntents =
      await this.ecommerceModule.ordersToBillingModulePaymentIntents.find({
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
      checkoutAttributesByCurrency: {
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
        throw new Error(
          "Not Found error. No billing module currency id found for order: " +
            order["id"],
        );
      }

      const { amount, type, interval } =
        await ecommerceModuleOrderApi.checkoutAttributesByCurrency({
          id: order["id"],
          billingModuleCurrencyId,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });

      try {
        if (type === "subscription") {
          const subjectToEcommerceModuleOrders =
            await this.subjectsToEcommerceModuleOrders.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: props.id,
                    },
                  ],
                },
              },
            });

          if (subjectToEcommerceModuleOrders?.length) {
            for (const subjectToEcommerceModuleOrder of subjectToEcommerceModuleOrders) {
              const ecommerceModuleOrder =
                await this.ecommerceModule.order.findById({
                  id: subjectToEcommerceModuleOrder.ecommerceModuleOrderId,
                });

              if (!ecommerceModuleOrder) {
                continue;
              }

              if (
                ecommerceModuleOrders
                  .map((order) => order.id)
                  .includes(ecommerceModuleOrder.id)
              ) {
                continue;
              }

              if (
                [
                  "requested_cancelation",
                  "canceling",
                  "completed",
                  "canceled",
                ].includes(ecommerceModuleOrder.status)
              ) {
                continue;
              }

              const ecommerceModuleOrderCheckoutAttributes =
                await ecommerceModuleOrderApi.checkoutAttributes({
                  id: ecommerceModuleOrder.id,
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                      "Cache-Control": "no-store",
                    },
                  },
                });

              if (
                ecommerceModuleOrderCheckoutAttributes.type !== "subscription"
              ) {
                continue;
              }

              const ordersToProducts =
                await this.ecommerceModule.ordersToProducts.find({
                  params: {
                    filters: {
                      and: [
                        {
                          column: "orderId",
                          method: "eq",
                          value: ecommerceModuleOrder.id,
                        },
                      ],
                    },
                  },
                });

              if (
                ordersToProducts?.some((orderToProduct) => {
                  return ecommerceModuleProducts
                    .map((entity) => {
                      return entity.id;
                    })
                    .includes(orderToProduct.productId);
                })
              ) {
                console.log(
                  "🚀 ~ execute ~ ecommerceModuleOrder:",
                  ecommerceModuleOrder,
                );
                throw new Error(
                  "Validation error. Checking out order has active subscription products.",
                );
              }

              await ecommerceModuleOrderApi.update({
                id: ecommerceModuleOrder.id,
                data: {
                  ...ecommerceModuleOrder,
                  status: "requested_cancelation",
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    "Cache-Control": "no-store",
                  },
                },
              });
            }
          }
        }
      } catch (error) {
        if (error?.["message"]) {
          if (
            error["message"].includes(
              "Checking out order has active subscription products.",
            )
          ) {
            for (const ecommerceModuleOrder of ecommerceModuleOrders) {
              await ecommerceModuleOrderApi.update({
                id: ecommerceModuleOrder.id,
                data: {
                  ...ecommerceModuleOrder,
                  status: "canceled",
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    "Cache-Control": "no-store",
                  },
                },
              });
            }
            throw new Error(error["message"]);
          }
        }
      }

      const existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes =
        billingModulePaymentIntents.find(
          (billingModulePaymentIntent) =>
            billingModulePaymentIntent.billingModuleCurrencyId ===
              billingModuleCurrencyId &&
            billingModulePaymentIntent.checkoutAttributesByCurrency.type ===
              type &&
            billingModulePaymentIntent.checkoutAttributesByCurrency.interval ===
              interval,
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
          checkoutAttributesByCurrency: {
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
        checkoutAttributesByCurrency: {
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
      const orderToUpdate = await this.ecommerceModule.order.findById({
        id: order["id"],
      });

      if (!orderToUpdate) {
        throw new Error(
          "Not Found error. No order found with id: " + order["id"],
        );
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
                url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/rbac/subjects/check`,
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
    }

    const billingModulePaymentIntentsToInvoices =
      await this.billingModule.paymentIntentsToInvoices.find({
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
      });

    if (!billingModulePaymentIntentsToInvoices?.length) {
      throw new Error(
        "Not Found error. No billing-module payment intent to invoices found",
      );
    }

    const billingModuleInvoices = await this.billingModule.invoice.find({
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
    });

    return {
      billingModule: {
        invoices: billingModuleInvoices,
      },
    };
  }
}
