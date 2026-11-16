import { Service as CheckoutClaim } from "../../../startup/ecommerce/order/checkout-claim";
import type { Repository } from "../../../../repository";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import {
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { type IBillingModule, type IEcommerceModule } from "../../../../di";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { IModel as IBillingModulePaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";
import { api as billingModulePaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as broadcastModuleChannelApi } from "@sps/broadcast/models/channel/sdk/server";

export const ACTIVE_SUBSCRIPTION_ORDER_STATUSES = [
  "paying",
  "paid",
  "approving",
  "packaging",
  "delivering",
  "delivered",
];

export type IExecuteProps =
  | {
      id: string;
      email?: string;
      provider: string;
      account?: string | null;
      comment?: string;
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
      account?: string | null;
      provider: "telegram-star";
      comment?: string;
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

export interface IConstructorProps {
  repository: Pick<Repository, "withSubjectLock">;
  settledOrderIds: (props: { orderIds: string[] }) => Promise<Set<string>>;
  findById: ({ id }: { id: string }) => Promise<any>;
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;
}

export class Service {
  findById: ({ id }: { id: string }) => Promise<any>;
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;

  constructor(private readonly dependencies: IConstructorProps) {
    const props = dependencies;
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
    const rbacSecretKey = RBAC_SECRET_KEY;

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

    if (
      ecommerceModuleProducts.some(
        (product) => product.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
      )
    ) {
      throw new Error(
        "Permission error. Initial Free is available only through authentication bootstrap",
      );
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
      account: props.account || "",
      email: props["email"],
      comment: props.comment || "",
    };

    const ordersToBillingModuleCurrencies =
      await this.ecommerceModule.ordersToBillingModuleCurrencies.find({
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

    if (!ordersToBillingModuleCurrencies?.length) {
      throw new Error(
        "Not Found error. No orders to billing module currencies found",
      );
    }

    const checkoutAttributesByOrderId = new Map<
      string,
      {
        amount: number;
        type: string;
        interval?: string;
      }
    >();
    for (const order of ecommerceModuleOrders) {
      if (
        !ordersToProducts.some(
          (line) => line.orderId === order.id && line.productId,
        )
      ) {
        throw new Error(
          "Validation error. Every checkout order must have products",
        );
      }
      const currencyLinks = ordersToBillingModuleCurrencies.filter(
        (link: { orderId: string }) => link.orderId === order.id,
      );
      if (
        currencyLinks.length !== 1 ||
        !currencyLinks[0].billingModuleCurrencyId
      ) {
        throw new Error(
          "Validation error. Checkout order must have one currency",
        );
      }
      const attributes =
        await this.ecommerceModule.order.findByIdCheckoutAttributesByCurrency({
          id: order.id,
          billingModuleCurrencyId: currencyLinks[0].billingModuleCurrencyId,
        });
      checkoutAttributesByOrderId.set(order.id, attributes);
    }
    const billingModulePaymentIntents: {
      orderIds: string[];
      billingModulePaymentIntent: IBillingModulePaymentIntent;
      billingModuleCurrencyId: string;
      checkoutAttributesByCurrency: {
        type: string;
        interval?: string;
      };
    }[] = [];
    // Claim and prepare locally so a pre-provider failure rolls back the cart.
    const claim = await this.dependencies.repository.withSubjectLock(
      { subjectId: props.id },
      async () => {
        const claim = await new CheckoutClaim({
          repository: this.dependencies.repository,
          ecommerceModule: this.ecommerceModule,
          billingModule: this.billingModule,
          subjectsToEcommerceModuleOrders: this.subjectsToEcommerceModuleOrders,
          settledOrderIds: this.dependencies.settledOrderIds,
        }).execute({
          subjectId: props.id,
          orderIds: ecommerceModuleOrders.map((order) => order.id),
          comment: props.comment,
          expectedLines: ordersToProducts,
          expectedCurrencies: ordersToBillingModuleCurrencies,
        });
        if (claim.invoices) {
          return claim;
        }

        for (const order of ecommerceModuleOrders) {
          const checkoutOrderProductIds = new Set(
            ordersToProducts
              .filter((orderToProduct) => {
                return orderToProduct.orderId === order["id"];
              })
              .map((orderToProduct) => {
                return orderToProduct.productId;
              })
              .filter((productId): productId is string => Boolean(productId)),
          );

          if (!checkoutOrderProductIds.size) {
            throw new Error(
              "Not Found error. No checkout products found for order: " +
                order["id"],
            );
          }

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

          const { amount, type, interval } = checkoutAttributesByOrderId.get(
            order.id,
          )!;

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
                  !ACTIVE_SUBSCRIPTION_ORDER_STATUSES.includes(
                    ecommerceModuleOrder.status,
                  )
                ) {
                  continue;
                }

                if (
                  ecommerceModuleOrder.status === "paying" &&
                  !ecommerceModuleOrder.subscriptionPeriodInvoiceId &&
                  !ecommerceModuleOrder.subscriptionPeriodStartsAt &&
                  !ecommerceModuleOrder.subscriptionPeriodEndsAt
                ) {
                  const settled = await this.dependencies.settledOrderIds({
                    orderIds: [ecommerceModuleOrder.id],
                  });
                  if (!settled.has(ecommerceModuleOrder.id)) {
                    continue;
                  }
                }

                const ecommerceModuleOrderCheckoutAttributes =
                  await this.ecommerceModule.order.findByIdCheckoutAttributes({
                    id: ecommerceModuleOrder.id,
                  });

                if (
                  ecommerceModuleOrderCheckoutAttributes.type !== "subscription"
                ) {
                  continue;
                }

                const existingOrdersToProducts =
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
                  existingOrdersToProducts?.some((orderToProduct) => {
                    return checkoutOrderProductIds.has(
                      orderToProduct.productId,
                    );
                  })
                ) {
                  throw new Error(
                    "Validation error. Checking out order has active subscription products.",
                  );
                }
              }
            }
          }

          const existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes =
            billingModulePaymentIntents.find(
              (billingModulePaymentIntent) =>
                type !== "subscription" &&
                billingModulePaymentIntent.billingModuleCurrencyId ===
                  billingModuleCurrencyId &&
                billingModulePaymentIntent.checkoutAttributesByCurrency.type ===
                  type &&
                billingModulePaymentIntent.checkoutAttributesByCurrency
                  .interval === interval,
            );

          if (
            existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes
          ) {
            const updatedBillingModulePaymentIntent =
              await this.billingModule.paymentIntent.update({
                id: existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes
                  .billingModulePaymentIntent.id,
                data: {
                  ...existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes.billingModulePaymentIntent,
                  amount:
                    amount +
                    existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes
                      .billingModulePaymentIntent.amount,
                },
              });

            billingModulePaymentIntents.splice(
              billingModulePaymentIntents.indexOf(
                existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes,
              ),
              1,
            );

            billingModulePaymentIntents.push({
              orderIds: [
                ...existingBillingModulePaymentIntentWithSameBillingModuleCurrencyAndCheckoutAttributes.orderIds,
                order.id,
              ],
              billingModulePaymentIntent: updatedBillingModulePaymentIntent,
              billingModuleCurrencyId,
              checkoutAttributesByCurrency: {
                type,
                interval,
              },
            });

            await this.ecommerceModule.ordersToBillingModulePaymentIntents.create(
              {
                data: {
                  orderId: order["id"],
                  billingModulePaymentIntentId:
                    updatedBillingModulePaymentIntent.id,
                },
              },
            );

            continue;
          }

          const billingModulePaymentIntent =
            await this.billingModule.paymentIntent.create({
              data: {
                amount,
                interval,
                type,
              },
            });

          billingModulePaymentIntents.push({
            orderIds: [order.id],
            billingModulePaymentIntent,
            billingModuleCurrencyId,
            checkoutAttributesByCurrency: {
              type,
              interval,
            },
          });

          await this.ecommerceModule.ordersToBillingModulePaymentIntents.create(
            {
              data: {
                orderId: order["id"],
                billingModulePaymentIntentId: billingModulePaymentIntent.id,
              },
            },
          );
        }

        return claim;
      },
    );
    const exposedPaymentIntentIds = new Set<string>();
    const preserveFailedCheckout = async (error: unknown): Promise<never> => {
      await Promise.allSettled(
        billingModulePaymentIntents.map(
          async ({ billingModulePaymentIntent }) => {
            if (exposedPaymentIntentIds.has(billingModulePaymentIntent.id)) {
              return;
            }
            const current = await this.billingModule.paymentIntent.findById({
              id: billingModulePaymentIntent.id,
            });
            if (
              current &&
              !["succeeded", "failed", "canceled"].includes(current.status)
            ) {
              await this.billingModule.paymentIntent.failUnpaidIntent(
                current.id,
                current.status,
              );
            }
          },
        ),
      );
      // Committed attempts stay in history; later cart changes must survive.
      throw error;
    };

    const settledFreeOrderIds = new Set(
      billingModulePaymentIntents
        .filter((attempt) => attempt.billingModulePaymentIntent.amount === 0)
        .flatMap((attempt) => attempt.orderIds),
    );
    const observerProvider = claim.invoices?.[0]?.provider || props.provider;
    for (const order of ecommerceModuleOrders) {
      if (!settledFreeOrderIds.has(order.id)) {
        await broadcastModuleChannelApi
          .pushMessage({
            data: {
              slug: "observer",
              payload: JSON.stringify({
                expiresAt: new Date(
                  Date.now() + 1000 * 60 * 60 * 24,
                ).toISOString(),
                trigger: {
                  type: "request",
                  method: "POST",
                  url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/billing/payment-intents/${observerProvider}/webhook`,
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
          })
          .catch(preserveFailedCheckout);
      }

      const subjectCheckTriggers = [
        {
          method: "PATCH",
          url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${order.id}`,
        },
        {
          method: "POST",
          url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${order.id}/check`,
        },
      ];
      for (const trigger of subjectCheckTriggers) {
        await broadcastModuleChannelApi
          .pushMessage({
            data: {
              expiresAt: new Date(
                Date.now() + 1000 * 60 * 60 * 24,
              ).toISOString(),
              slug: "observer",
              payload: JSON.stringify({
                trigger: { type: "request", ...trigger },
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
          })
          .catch(preserveFailedCheckout);
      }
    }

    if (claim.invoices) {
      return { billingModule: { invoices: claim.invoices } };
    }

    for (const billingModulePaymentIntent of billingModulePaymentIntents) {
      exposedPaymentIntentIds.add(
        billingModulePaymentIntent.billingModulePaymentIntent.id,
      );
      await billingModulePaymentIntentApi
        .provider({
          id: billingModulePaymentIntent.billingModulePaymentIntent.id,
          data: {
            provider: props.provider,
            metadata: {
              ...metadata,
              ecommerceModule: {
                ...metadata.ecommerceModule,
                orders: metadata.ecommerceModule.orders.filter(
                  (order: { id: string }) =>
                    billingModulePaymentIntent.orderIds.includes(order.id),
                ),
              },
            },
            currencyId: billingModulePaymentIntent.billingModuleCurrencyId,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": rbacSecretKey,
            },
          },
        })
        .catch(preserveFailedCheckout);
    }

    for (const id of settledFreeOrderIds) {
      await ecommerceModuleOrderApi.check({
        id,
        data: {},
        options: { headers: { "X-RBAC-SECRET-KEY": rbacSecretKey } },
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
