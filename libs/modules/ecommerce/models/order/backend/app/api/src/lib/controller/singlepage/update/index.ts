import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import { api as productApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as ordersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";
import { api as ordersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as ordersToFileStorageModuleFilesApi } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/sdk/server";
import { api as productsToFileStorageModuleFilesApi } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/server";
import { api as billingCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api } from "@sps/ecommerce/models/order/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC secret key not found");
      }

      const uuid = c.req.param("uuid");
      const body = await c.req.parseBody();

      if (!uuid) {
        throw new Error("Validation error. Invalid id. Got: " + uuid);
      }

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Invalid body['data']: " +
            body["data"] +
            ". Expected string, got: " +
            typeof body["data"],
        );
      }

      const previousEntity = await this.service.findById({ id: uuid });

      const data = JSON.parse(body["data"]);

      let entity = await this.service.update({ id: uuid, data });

      if (data.ordersToProducts) {
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
          },
        });

        if (!ordersToProducts?.length) {
          throw new Error("Not Found error. No orders to products found");
        }

        for (const orderToProduct of data.ordersToProducts) {
          const existingOrderToProduct = ordersToProducts.find(
            (item) => item.id === orderToProduct.id,
          );

          if (existingOrderToProduct) {
            await api.ordersToProductsUpdate({
              id: uuid,
              orderToProductId: orderToProduct.id,
              data: {
                ...existingOrderToProduct,
                quantity: orderToProduct.quantity,
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          }
        }

        return c.json({
          data: entity,
        });
      }

      if (
        entity?.status === "approving" &&
        previousEntity?.status === "paying"
      ) {
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
          throw new Error(
            "Not Found error. Orders to billing module currencies not found",
          );
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
          },
        });

        if (!billingCurrencies?.length) {
          throw new Error("Not Found error. Billing currencies not found");
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

        const fileStorageReceiptTemplateFiles = await fileStorageFileApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "variant",
                  method: "ilike",
                  value: "generate-template-ecommerce-order-receipt-",
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

        if (fileStorageReceiptTemplateFiles?.length) {
          for (const fileStorageReceiptTemplateFile of fileStorageReceiptTemplateFiles) {
            const receiptFile = await fileStorageFileApi.generate({
              data: {
                variant: fileStorageReceiptTemplateFile.variant,
                width: fileStorageReceiptTemplateFile.width,
                height: fileStorageReceiptTemplateFile.height,
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
                fileStorage: {
                  file: fileStorageReceiptTemplateFile,
                },
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });

            await ordersToFileStorageModuleFilesApi.create({
              data: {
                orderId: uuid,
                fileStorageModuleFileId: receiptFile.id,
                variant: "receipt-default",
              },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          }
        }

        const productsToFileStorageModuleFiles =
          await productsToFileStorageModuleFilesApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "productId",
                    method: "inArray",
                    value: products.map((products) => products.id),
                  },
                  {
                    column: "variant",
                    method: "eq",
                    value: "attachment-default",
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

        if (productsToFileStorageModuleFiles?.length) {
          const fileStorageModuleFiles = await fileStorageFileApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: productsToFileStorageModuleFiles.map(
                      (productToFileStorageModuleFile) => {
                        return productToFileStorageModuleFile.fileStorageModuleFileId;
                      },
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

          if (fileStorageModuleFiles?.length) {
            for (const fileStorageModuleFile of fileStorageModuleFiles) {
              if (fileStorageModuleFile.variant === "default") {
                await ordersToFileStorageModuleFilesApi.create({
                  data: {
                    orderId: uuid,
                    fileStorageModuleFileId: fileStorageModuleFile.id,
                    variant: "attachment-default",
                  },
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    },
                  },
                });
              } else if (
                fileStorageModuleFile.variant.includes("generate-template-")
              ) {
                const generatedFile = await fileStorageFileApi.generate({
                  data: {
                    variant: fileStorageModuleFile.variant,
                    width: fileStorageModuleFile.width,
                    height: fileStorageModuleFile.height,
                    ecommerce: {
                      order: {
                        ...entity,
                        checkoutAttributes,
                        ordersToProducts: ordersToProducts.map(
                          (orderToProduct) => {
                            return {
                              ...orderToProduct,
                              product: products.find(
                                (product) =>
                                  product.id === orderToProduct.productId,
                              ),
                            };
                          },
                        ),
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
                    fileStorage: {
                      file: fileStorageModuleFile,
                    },
                  },
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    },
                  },
                });

                await ordersToFileStorageModuleFilesApi.create({
                  data: {
                    orderId: uuid,
                    fileStorageModuleFileId: generatedFile.id,
                    variant: "attachment-default",
                  },
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    },
                  },
                });
              }
            }
          }
        }
      }

      return c.json({
        data: entity,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
