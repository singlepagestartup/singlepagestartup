import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization } from "@sps/backend-utils";
import { Service } from "../../../service";
import { api as subjectsToEcommerceModuleOrdersApi } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server";
import { api as ecommerceOrdersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as ecommerceStoresToOrdersApi } from "@sps/ecommerce/relations/stores-to-orders/sdk/server";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as ecommerceModuleStoreApi } from "@sps/ecommerce/models/store/sdk/server";
import { api as ecommerceModuleProductsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { api as ecommerceOrdersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api as attributesToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new HTTPException(400, {
          message: "RBAC_JWT_SECRET not set",
        });
      }

      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC_SECRET_KEY not set",
        });
      }

      const id = c.req.param("id");

      if (!id) {
        throw new HTTPException(400, {
          message: "No id provided",
        });
      }

      const token = authorization(c);

      if (!token) {
        return c.json(
          {
            data: null,
          },
          {
            status: 401,
          },
        );
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

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

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new HTTPException(403, {
          message: "Only order owner can update order",
        });
      }

      if (!data["productId"]) {
        throw new HTTPException(400, {
          message: "No data.productId provided",
        });
      }

      const productId = data["productId"];
      let billingModuleCurrencyId = data["billingModule"]?.currency?.id;

      let storeId = data.storeId;

      if (!storeId) {
        const stores = await ecommerceModuleStoreApi.find({
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (stores?.length === 0) {
          throw new Error("No stores found");
        }

        if (stores?.length && stores.length > 1) {
          throw new Error("Multiple stores found. Pass 'data.storeId'");
        }

        storeId = stores?.[0]?.id;
      }

      const entity = await this.service.findById({
        id,
      });

      if (!entity) {
        throw new HTTPException(404, {
          message: "No entity found",
        });
      }

      const ecommerceModuleProductsToAttributes =
        await ecommerceModuleProductsToAttributesApi.find({
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

      const attributesToBillingModuleCurrencies =
        await attributesToBillingModuleCurrenciesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "inArray",
                  value:
                    ecommerceModuleProductsToAttributes?.map(
                      (productToAttribute) => productToAttribute.attributeId,
                    ) || [],
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

      if (
        attributesToBillingModuleCurrencies?.length &&
        !billingModuleCurrencyId
      ) {
        const defaultBillingModuleCurrency =
          await billingModuleCurrencyApi.find({
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

        if (defaultBillingModuleCurrency?.length) {
          billingModuleCurrencyId = attributesToBillingModuleCurrencies.find(
            (attributeToBillingModuleCurrency) =>
              attributeToBillingModuleCurrency.billingModuleCurrencyId ===
              defaultBillingModuleCurrency[0].id,
          )?.billingModuleCurrencyId;

          if (!billingModuleCurrencyId) {
            billingModuleCurrencyId =
              attributesToBillingModuleCurrencies[0]?.billingModuleCurrencyId;
          }
        }
      }

      const existingOrdersToProducts = await ecommerceOrdersToProductsApi.find({
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

      const existingOrdersToSubjects =
        await subjectsToEcommerceModuleOrdersApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: id,
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

      if (existingOrdersToProducts?.length) {
        if (existingOrdersToSubjects?.length) {
          const subjectToProductOrders = existingOrdersToProducts.filter(
            (orderToProduct) => {
              return existingOrdersToSubjects.find((orderToSubject) => {
                return (
                  orderToProduct.orderId ===
                  orderToSubject.ecommerceModuleOrderId
                );
              });
            },
          );

          if (subjectToProductOrders.length) {
            const ordersWithSubjectAndProduct = await ecommerceOrderApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: subjectToProductOrders.map(
                        (orderToProduct) => orderToProduct.orderId,
                      ),
                    },
                    {
                      column: "status",
                      method: "eq",
                      value: "new",
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

            if (ordersWithSubjectAndProduct?.length) {
              const existingStoresToOrders =
                await ecommerceStoresToOrdersApi.find({
                  params: {
                    filters: {
                      and: [
                        {
                          column: "storeId",
                          method: "eq",
                          value: id,
                        },
                        {
                          column: "orderId",
                          method: "inArray",
                          value: ordersWithSubjectAndProduct?.map((order) => {
                            return order.id;
                          }),
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

              if (existingStoresToOrders?.length) {
                const ordersToBillingModuleCurrencies =
                  await ecommerceOrdersToBillingModuleCurrenciesApi.find({
                    params: {
                      filters: {
                        and: [
                          {
                            column: "orderId",
                            method: "inArray",
                            value:
                              existingStoresToOrders?.map(
                                (storeToOrder) => storeToOrder.orderId,
                              ) || [],
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

                if (ordersToBillingModuleCurrencies?.length) {
                  throw new HTTPException(400, {
                    message: "Order already exists",
                  });
                }
              }
            }
          }
        }
      }

      const order = await ecommerceOrderApi.create({
        data: {},
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!order) {
        throw new HTTPException(404, {
          message: "No order found",
        });
      }

      await subjectsToEcommerceModuleOrdersApi.create({
        data: {
          subjectId: id,
          ecommerceModuleOrderId: order.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const ordersToProducts = await ecommerceOrdersToProductsApi.create({
        data: {
          orderId: order.id,
          productId: productId,
          quantity: data.quantity || 1,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!ordersToProducts) {
        throw new HTTPException(404, {
          message: "No orders to products found",
        });
      }

      const storesToOrders = await ecommerceStoresToOrdersApi.create({
        data: {
          storeId: storeId,
          orderId: order.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!storesToOrders) {
        throw new HTTPException(404, {
          message: "No stores to orders found",
        });
      }

      const ordersToBillingModuleCurrencies =
        await ecommerceOrdersToBillingModuleCurrenciesApi.create({
          data: {
            orderId: order.id,
            billingModuleCurrencyId: billingModuleCurrencyId,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

      if (!ordersToBillingModuleCurrencies) {
        throw new HTTPException(404, {
          message: "No orders to billing module currencies found",
        });
      }

      return c.json({
        data: {
          ...entity,
          data,
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
