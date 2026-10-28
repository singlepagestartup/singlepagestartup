import {
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization, getHttpErrorType } from "@sps/backend-utils";
import { Service } from "../../../../service";
import { getDrizzle } from "@sps/shared-backend-database-config";
import { withConsistencyDatabase } from "@sps/shared-backend-api";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const token = authorization(c);

      if (!token) {
        throw new Error("Validation error. No token");
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid body");
      }

      const data = JSON.parse(body["data"]);

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new Error("Validation error. Only order owner can update order");
      }

      if (!data["productId"]) {
        throw new Error("Validation error. No data.productId provided");
      }

      const productId = data["productId"];
      const product = await this.service.ecommerceModule.product.findById({
        id: productId,
      });
      if (!product) throw new Error("Not Found error. Product not found");
      if (product.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG)
        throw new Error(
          "Permission error. Initial Free is available only through authentication bootstrap",
        );
      let billingModuleCurrencyId = data["billingModule"]?.currency?.id;

      let storeId = data.storeId;

      if (!storeId) {
        const stores = await this.service.ecommerceModule.store.find();

        if (stores?.length === 0) {
          throw new Error("Not Found error. No stores found");
        }

        if (stores?.length && stores.length > 1) {
          throw new Error(
            "Internal error. Multiple stores found. Pass 'data.storeId'",
          );
        }

        storeId = stores?.[0]?.id;
      }

      const entity = await this.service.findById({
        id,
      });

      if (!entity) {
        throw new Error("Not Found error. No entity found");
      }

      const ecommerceModuleProductsToAttributes =
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

      const attributesToBillingModuleCurrencies =
        await this.service.ecommerceModule.attributesToBillingModuleCurrencies.find(
          {
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
          },
        );

      if (
        attributesToBillingModuleCurrencies?.length &&
        !billingModuleCurrencyId
      ) {
        const defaultBillingModuleCurrency =
          await this.service.billingModule.currency.find({
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

      const existingOrdersToProducts =
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

      const existingOrdersToSubjects =
        await this.service.subjectsToEcommerceModuleOrders.find({
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
            const ordersWithSubjectAndProduct =
              await this.service.ecommerceModule.order.find({
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
              });

            if (ordersWithSubjectAndProduct?.length) {
              const existingStoresToOrders =
                await this.service.ecommerceModule.storesToOrders.find({
                  params: {
                    filters: {
                      and: [
                        {
                          column: "storeId",
                          method: "eq",
                          value: storeId,
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
                });

              if (existingStoresToOrders?.length) {
                const ordersToBillingModuleCurrencies =
                  await this.service.ecommerceModule.ordersToBillingModuleCurrencies.find(
                    {
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
                    },
                  );

                if (ordersToBillingModuleCurrencies?.length) {
                  throw new Error("Internal error. Order already exists");
                }
              }
            }
          }
        }
      }

      await getDrizzle({}).transaction((tx) =>
        withConsistencyDatabase(tx, async () => {
          const order = await this.service.ecommerceModule.order.create({
            data: {},
          });

          if (!order) {
            throw new Error("Not Found error. No order found");
          }

          await this.service.subjectsToEcommerceModuleOrders.create({
            data: {
              subjectId: id,
              ecommerceModuleOrderId: order.id,
            },
          });

          const ordersToProducts =
            await this.service.ecommerceModule.ordersToProducts.create({
              data: {
                orderId: order.id,
                productId: productId,
                quantity: data.quantity || 1,
              },
            });

          if (!ordersToProducts) {
            throw new Error("Not Found error. No orders to products found");
          }

          const storesToOrders =
            await this.service.ecommerceModule.storesToOrders.create({
              data: {
                storeId: storeId,
                orderId: order.id,
              },
            });

          if (!storesToOrders) {
            throw new Error("Not Found error. No stores to orders found");
          }

          const ordersToBillingModuleCurrencies =
            await this.service.ecommerceModule.ordersToBillingModuleCurrencies.create(
              {
                data: {
                  orderId: order.id,
                  billingModuleCurrencyId: billingModuleCurrencyId,
                },
              },
            );

          if (!ordersToBillingModuleCurrencies) {
            throw new Error(
              "Not Found error. No orders to billing module currencies found",
            );
          }
        }),
      );

      return c.json({
        data: {
          ...entity,
          data,
        },
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
