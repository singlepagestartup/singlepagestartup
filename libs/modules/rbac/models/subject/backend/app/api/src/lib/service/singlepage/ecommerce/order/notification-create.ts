import { IRepository } from "@sps/shared-backend-api";
import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { HTTPException } from "hono/http-exception";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as subjectsToEcommerceModuleOrdersApi } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server";
import { api as ecommerceOrdersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { api as billingPaymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as billingInvoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { api as broadcastChannelApi } from "@sps/broadcast/models/channel/sdk/server";
import { api as productApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as ordersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as ordersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { api as roleApi } from "@sps/rbac/models/role/sdk/server";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { api as notificationTemplateApi } from "@sps/notification/models/template/sdk/server";

export type IExecuteProps = {
  orderId: string;
  id: string;
  data: {
    comment: string;
  };
};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is required");
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
      throw new Error("Not Found error. No entity found");
    }

    const updatedOrder = await ecommerceOrderApi.findById({
      id: props.orderId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    const subjectToEcommerceModuleOrder =
      await subjectsToEcommerceModuleOrdersApi.findOrCreate({
        data: {
          subjectId: props.id,
          ecommerceModuleOrderId: props.orderId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

    const ordersToBillingModulePaymentIntents =
      await ecommerceOrdersToBillingModulePaymentIntentsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "eq",
                value: props.orderId,
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

    if (!ordersToBillingModulePaymentIntents?.length) {
      throw new Error("Not Found error. No payment intents found");
    }

    const billingPaymentIntentsToInvoices =
      await billingPaymentIntentsToInvoicesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "paymentIntentId",
                method: "inArray",
                value: ordersToBillingModulePaymentIntents.map(
                  (item) => item.billingModulePaymentIntentId,
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

    if (!billingPaymentIntentsToInvoices?.length) {
      throw new Error("Not Found error. No payment intents to invoices found");
    }

    const invoices = await billingInvoiceApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: billingPaymentIntentsToInvoices.map(
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

    if (!invoices?.length) {
      throw new Error("Not Found error. No invoices found");
    }

    if (!updatedOrder) {
      throw new Error("Not Found error. No updated order found");
    }

    const ordersToProducts = await ordersToProductsApi.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "eq",
              value: updatedOrder.id,
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
      throw new Error("Not Found error. Orders to products not found");
    }

    const products = await productApi.find({
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
        },
      },
    });

    if (!products?.length) {
      throw new Error("Not Found error. Products not found");
    }

    const ecommerceOrdersToBillingModuleCurrencies =
      await ordersToBillingModuleCurrenciesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "eq",
                value: updatedOrder.id,
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

    if (!ecommerceOrdersToBillingModuleCurrencies?.length) {
      throw new Error(
        "Not Found error. Orders to billing module currencies not found",
      );
    }

    const billingModuleCurrencies = await billingModuleCurrencyApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: ecommerceOrdersToBillingModuleCurrencies.map(
                (ecommerceOrderToBillingModuleCurrency) =>
                  ecommerceOrderToBillingModuleCurrency.billingModuleCurrencyId,
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

    if (!billingModuleCurrencies?.length) {
      throw new Error("Not Found error. Billing module currencies not found");
    }

    const checkoutAttributes = await ecommerceOrderApi.checkoutAttributes({
      id: props.orderId,
      billingModuleCurrencyId:
        ecommerceOrdersToBillingModuleCurrencies[0].billingModuleCurrencyId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    const notificationEcommerceNotificationTemplates =
      await notificationTemplateApi.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "ilike",
                value: "-ecommerce-order-status-changed-",
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

    const adminRoles = await roleApi.find({
      params: {
        filters: {
          and: [
            {
              column: "slug",
              method: "ilike",
              value: "admin",
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

    if (notificationEcommerceNotificationTemplates?.length) {
      for (const notificationEcommerceNotificationTemplate of notificationEcommerceNotificationTemplates) {
        if (
          notificationEcommerceNotificationTemplate.variant.includes("default")
        ) {
          await broadcastChannelApi.pushMessage({
            data: {
              slug: "observer",
              payload: JSON.stringify({
                trigger: {
                  type: "request",
                  method: "PATCH",
                  url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${updatedOrder.id}`,
                },
                pipe: [
                  {
                    type: "request",
                    method: "GET",
                    url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${updatedOrder.id}`,
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    },
                  },
                  {
                    type: "request",
                    method: "POST",
                    url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/rbac/subjects/${props.id}/notify`,
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    },
                    body: {
                      data: {
                        ecommerce: {
                          order: {
                            id: updatedOrder.id,
                          },
                        },
                        notification: {
                          topic: {
                            slug: "information",
                          },
                          template: {
                            variant:
                              notificationEcommerceNotificationTemplate.variant,
                          },
                          notification: {
                            method: "email",
                            data: JSON.stringify({
                              ecommerce: {
                                order: {
                                  ...updatedOrder,
                                  status: "[triggerResult.data.status]",
                                  checkoutAttributes,
                                  ordersToBillingModuleCurrencies:
                                    ecommerceOrdersToBillingModuleCurrencies.map(
                                      (
                                        ecommerceOrderToBillingModuleCurrency,
                                      ) => {
                                        return {
                                          ...ecommerceOrderToBillingModuleCurrency,
                                          billingModuleCurrency:
                                            billingModuleCurrencies.find(
                                              (billingModuleCurrency) =>
                                                billingModuleCurrency.id ===
                                                ecommerceOrderToBillingModuleCurrency.billingModuleCurrencyId,
                                            ),
                                        };
                                      },
                                    ),
                                  ordersToProducts: ordersToProducts.map(
                                    (orderToProduct) => {
                                      return {
                                        ...orderToProduct,
                                        product: products.find(
                                          (product) =>
                                            product.id ===
                                            orderToProduct.productId,
                                        ),
                                      };
                                    },
                                  ),
                                  ordersToFileStorageModuleFiles: [],
                                },
                              },
                              comment: props.data.comment,
                            }),
                          },
                        },
                      },
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

        if (
          notificationEcommerceNotificationTemplate.variant.includes("admin")
        ) {
          if (adminRoles?.length) {
            for (const adminRole of adminRoles) {
              const subjectsToAdminRoles = await subjectsToRolesApi.find({
                params: {
                  filters: {
                    and: [
                      {
                        column: "roleId",
                        method: "eq",
                        value: adminRole.id,
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

              if (subjectsToAdminRoles?.length) {
                for (const subjectToAdminRole of subjectsToAdminRoles) {
                  await broadcastChannelApi.pushMessage({
                    data: {
                      slug: "observer",
                      payload: JSON.stringify({
                        trigger: {
                          type: "request",
                          method: "PATCH",
                          url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${updatedOrder.id}`,
                        },
                        pipe: [
                          {
                            type: "request",
                            method: "GET",
                            url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/${updatedOrder.id}`,
                            headers: {
                              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                            },
                          },
                          {
                            type: "request",
                            method: "POST",
                            url: `${NEXT_PUBLIC_API_SERVICE_URL}/api/rbac/subjects/${subjectToAdminRole.subjectId}/notify`,
                            headers: {
                              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                            },
                            body: {
                              data: {
                                ecommerce: {
                                  order: {
                                    id: updatedOrder.id,
                                  },
                                },
                                notification: {
                                  topic: {
                                    slug: "information",
                                  },
                                  template: {
                                    variant:
                                      notificationEcommerceNotificationTemplate.variant,
                                  },
                                  notification: {
                                    method: "email",
                                    data: JSON.stringify({
                                      ecommerce: {
                                        order: {
                                          ...updatedOrder,
                                          status: "[triggerResult.data.status]",
                                          checkoutAttributes,
                                          ordersToBillingModuleCurrencies:
                                            ecommerceOrdersToBillingModuleCurrencies.map(
                                              (
                                                ecommerceOrderToBillingModuleCurrency,
                                              ) => {
                                                return {
                                                  ...ecommerceOrderToBillingModuleCurrency,
                                                  billingModuleCurrency:
                                                    billingModuleCurrencies.find(
                                                      (billingModuleCurrency) =>
                                                        billingModuleCurrency.id ===
                                                        ecommerceOrderToBillingModuleCurrency.billingModuleCurrencyId,
                                                    ),
                                                };
                                              },
                                            ),
                                          ordersToProducts:
                                            ordersToProducts.map(
                                              (orderToProduct) => {
                                                return {
                                                  ...orderToProduct,
                                                  product: products.find(
                                                    (product) =>
                                                      product.id ===
                                                      orderToProduct.productId,
                                                  ),
                                                };
                                              },
                                            ),
                                          ordersToFileStorageModuleFiles: [],
                                        },
                                      },
                                      comment: props.data.comment,
                                    }),
                                  },
                                },
                              },
                            },
                          },
                        ],
                      }),
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
                }
              }
            }
          }
        }
      }
    }

    return {
      ...entity,
      subjectsToEcommerceModuleOrders: [
        {
          ...subjectToEcommerceModuleOrder,
          order: {
            ...updatedOrder,
            ordersToBillingModulePaymentIntents:
              ordersToBillingModulePaymentIntents.map(
                (orderToBillingModulePaymentIntent) => {
                  return {
                    ...orderToBillingModulePaymentIntent,
                    billingModulePaymentIntent: {
                      id: orderToBillingModulePaymentIntent.billingModulePaymentIntentId,
                      invoices: invoices.map((invoice) => {
                        return {
                          ...invoice,
                        };
                      }),
                    },
                  };
                },
              ),
          },
        },
      ],
    };
  }
}
