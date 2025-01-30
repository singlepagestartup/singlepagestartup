import { BACKEND_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../service";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import QueryString from "qs";
import { api as productApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as ordersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";
import { userStories } from "@sps/shared-configuration";
import pako from "pako";
import { api as ordersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as billingCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api } from "@sps/ecommerce/models/order/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC secret key not found",
      });
    }

    try {
      const uuid = c.req.param("uuid");
      const body = await c.req.parseBody();

      if (!uuid) {
        return c.json(
          {
            message: "Invalid id",
          },
          {
            status: 400,
          },
        );
      }

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

      let entity = await this.service.update({ id: uuid, data });

      if (entity?.status === "approving") {
        const ordersToBillingModuleCurrencies =
          await ordersToBillingModuleCurrenciesApi.find({
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

        if (!ordersToBillingModuleCurrencies?.length) {
          throw new HTTPException(404, {
            message: "Orders to billing module currencies not found",
          });
        }

        const billingCurrencies = await billingCurrencyApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: ordersToBillingModuleCurrencies.map(
                    (order) => order.billingModuleCurrencyId,
                  ),
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

        if (!billingCurrencies?.length) {
          throw new HTTPException(404, {
            message: "Billing currencies not found",
          });
        }

        const checkoutAttributes = await api.checkoutAttributes({
          id: uuid,
          billingModuleCurrencyId:
            ordersToBillingModuleCurrencies[0].billingModuleCurrencyId,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });

        const ordersToProducts = await ordersToProductsApi.find({
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

        if (!ordersToProducts?.length) {
          throw new HTTPException(404, {
            message: "Orders to products not found",
          });
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
            next: {
              cache: "no-store",
            },
          },
        });

        if (!products?.length) {
          throw new HTTPException(404, {
            message: "Products not found",
          });
        }

        const deflatedData = pako.deflate(
          JSON.stringify({
            ecommerce: {
              order: {
                ...entity,
                checkoutAttributes,
                ordersToProducts: ordersToProducts.map((orderToProduct) => {
                  return {
                    ...orderToProduct,
                    product: products.find(
                      (product) => product.id === orderToProduct.productId,
                    ),
                  };
                }),
                ordersToBillingModuleCurrencies:
                  ordersToBillingModuleCurrencies.map(
                    (orderToBillingModuleCurrency) => {
                      return {
                        ...orderToBillingModuleCurrency,
                        billingModuleCurrency: billingCurrencies.find(
                          (billingCurrency) =>
                            billingCurrency.id ===
                            orderToBillingModuleCurrency.billingModuleCurrencyId,
                        ),
                      };
                    },
                  ),
              },
            },
          }),
        );

        const queryData = Buffer.from(deflatedData).toString("base64");

        const query = QueryString.stringify({
          variant:
            userStories.subjectCreateOrder.order.update.approving.receipt
              .variant,
          width:
            userStories.subjectCreateOrder.order.update.approving.receipt.width,
          height:
            userStories.subjectCreateOrder.order.update.approving.receipt
              .height,
          data: queryData,
        });

        const receiptFile = await fileStorageFileApi.createFromUrl({
          data: {
            url: `${BACKEND_URL}/api/image-generator/image.png?${query}`,
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

        entity = await this.service.update({
          id: uuid,
          data: {
            ...entity,
            receipt: receiptFile.file,
          },
        });
      }

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
