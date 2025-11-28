import { IRepository } from "@sps/shared-backend-api";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api as attributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { api } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as productApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as productsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { api as attributeKeysToAttributesApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";
import { api as attributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import { api as attributesToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/server";

export type IExecuteProps = {
  id: string;
};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
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
      throw new Error("Not Found error. Entity not found");
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
      },
    });

    if (!priceAttributeKeys?.length) {
      throw new Error("Price attribute key not found");
    }

    const priceAttributeKey = priceAttributeKeys[0];

    const result: {
      total: number;
      billingModuleCurrency: IBillingModuleCurrency;
    }[] = [];

    const product = await productApi.findById({
      id: entity.productId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const productToAttributes = await productsToAttributesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "productId",
              method: "eq",
              value: entity.productId,
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

    if (!productToAttributes?.length) {
      throw new Error("Product does not have any attributes");
    }

    const productPriceAttributeKeysToAttributes =
      await attributeKeysToAttributesApi.find({
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
        },
      });

    if (!productPriceAttributeKeysToAttributes?.length) {
      throw new Error("Product does not have any price attributes");
    }

    for (const productPriceAttributeKeyToAttribute of productPriceAttributeKeysToAttributes) {
      const priceAttribute = await attributeApi.findById({
        id: productPriceAttributeKeyToAttribute.attributeId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!priceAttribute) {
        throw new Error("Price attribute not found");
      }

      const attributesToBillingModuleCurrencies =
        await attributesToBillingModuleCurrenciesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "eq",
                  value: priceAttribute.id,
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

      if (!attributesToBillingModuleCurrencies?.length) {
        throw new Error("Product does not have any target price attributes");
      }

      const billingModuleCurrency = await billingModuleCurrencyApi.findById({
        id: attributesToBillingModuleCurrencies[0].billingModuleCurrencyId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!billingModuleCurrency) {
        throw new Error("Billing module currency not found");
      }

      result.push({
        total: entity.quantity * Number(priceAttribute.number),
        billingModuleCurrency,
      });
    }

    return result;
  }
}
