import { IRepository } from "@sps/shared-backend-api";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { IModel as IAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import { api as attributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { api as ordersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as productApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as productsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { api as attributeKeysToAttributesApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";
import { api as attributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import { api as attributesToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/server";
import { internationalization } from "@sps/shared-configuration";

export type IExecuteProps = {
  id: string;
  billingModuleCurrencyId: string;
};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC_SECRET_KEY is not defined");
    }

    const priceAttributeKeys = await attributeKeyApi.find({
      params: {
        filters: {
          and: [
            {
              column: "type",
              method: "eq",
              value: "price",
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

    if (!priceAttributeKeys?.length) {
      throw new Error("Price attribute key not found");
    }

    const intervalAttributeKeys = await attributeKeyApi.find({
      params: {
        filters: {
          and: [
            {
              column: "type",
              method: "eq",
              value: "interval",
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

    const intervalAttributeKey = intervalAttributeKeys?.[0];

    const priceAttributeKey = priceAttributeKeys[0];

    const orderToProducts = await ordersToProductsApi.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "eq",
              value: props.id,
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

    if (!orderToProducts?.length) {
      throw new Error("Order does not have any products");
    }

    let amount = 0;
    let type: string | undefined = undefined;
    let interval: string | undefined = undefined;

    for (const orderToProduct of orderToProducts) {
      const product = await productApi.findById({
        id: orderToProduct.productId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      if (!type) {
        type = product.type;
      } else if (type !== product.type) {
        throw new Error("Order has multiple product types");
      }

      const productToAttributes = await productsToAttributesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "eq",
                value: orderToProduct.productId,
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

      if (!productToAttributes?.length) {
        throw new Error("Product does not have any attributes");
      }

      const productPrices: IAttribute[] = [];

      const productPriceAttributes = await attributeKeysToAttributesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeId",
                method: "inArray",
                value: productToAttributes.map(
                  (productToAttribute) => productToAttribute.attributeId,
                ),
              },
              {
                column: "attributeKeyId",
                method: "eq",
                value: priceAttributeKey.id,
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

      if (!productPriceAttributes?.length) {
        throw new Error("Product does not have any price attributes");
      }

      const targetPriceAttributes =
        await attributesToBillingModuleCurrenciesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "inArray",
                  value: productPriceAttributes.map(
                    (productPriceAttribute) =>
                      productPriceAttribute.attributeId,
                  ),
                },
                {
                  column: "billingModuleCurrencyId",
                  method: "eq",
                  value: props.billingModuleCurrencyId,
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

      if (!targetPriceAttributes?.length) {
        throw new Error("Product does not have any target price attributes");
      }

      if (targetPriceAttributes.length > 1) {
        throw new Error("Product has multiple target price attributes");
      }

      const priceAttribute = await attributeApi.findById({
        id: targetPriceAttributes[0].attributeId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!priceAttribute) {
        throw new Error("Price attribute not found");
      }

      productPrices.push(priceAttribute);

      if (!productPrices.length) {
        throw new Error("Product does not have any price attributes");
      }

      amount += Number(productPrices[0].number) * orderToProduct.quantity;

      const productIntervals: IAttribute[] = [];

      for (const productToAttribute of productToAttributes) {
        if (!intervalAttributeKey) {
          continue;
        }

        const intervals = await attributeKeysToAttributesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "eq",
                  value: productToAttribute.attributeId,
                },
                {
                  column: "attributeKeyId",
                  method: "eq",
                  value: intervalAttributeKey.id,
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

        if (!intervals?.length) {
          continue;
        }

        if (intervals.length > 1) {
          throw new Error("Product has multiple interval attributes");
        }

        const intervalAttribute = await attributeApi.findById({
          id: intervals[0].attributeId,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });

        if (!intervalAttribute) {
          throw new Error("Interval attribute not found");
        }

        productIntervals.push(intervalAttribute);
      }

      if (!productIntervals.length) {
        continue;
      }

      if (!interval && productIntervals[0].string) {
        interval =
          productIntervals[0].string[internationalization.defaultLanguage.code];
      } else if (
        interval !==
        productIntervals[0].string?.[internationalization.defaultLanguage.code]
      ) {
        throw new Error("Order has multiple intervals");
      }
    }

    return { amount, type, interval };
  }
}
