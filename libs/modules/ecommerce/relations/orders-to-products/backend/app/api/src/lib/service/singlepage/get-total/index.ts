import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { IModel as IOrderToProduct } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";

export type IExecuteProps = {
  id: string;
};

type IConstructorProps = {
  findById: (props: { id: string }) => Promise<IOrderToProduct | null>;
  product: ProductService;
  attribute: AttributeService;
  attributeKey: AttributeKeyService;
  productsToAttributes: ProductsToAttributesService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;
};

export class Service {
  findById: IConstructorProps["findById"];
  product: ProductService;
  attribute: AttributeService;
  attributeKey: AttributeKeyService;
  productsToAttributes: ProductsToAttributesService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
    this.product = props.product;
    this.attribute = props.attribute;
    this.attributeKey = props.attributeKey;
    this.productsToAttributes = props.productsToAttributes;
    this.attributeKeysToAttributes = props.attributeKeysToAttributes;
    this.attributesToBillingModuleCurrencies =
      props.attributesToBillingModuleCurrencies;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
    }

    const entity = await this.findById({
      id: props.id,
    });

    if (!entity) {
      throw new Error("Not Found error. Entity not found");
    }

    const priceAttributeKeys = await this.attributeKey.find({
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
    });

    if (!priceAttributeKeys?.length) {
      throw new Error("Price attribute key not found");
    }

    const priceAttributeKey = priceAttributeKeys[0];

    const result: {
      total: number;
      billingModuleCurrency: IBillingModuleCurrency;
    }[] = [];

    const product = await this.product.findById({
      id: entity.productId,
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const productToAttributes = await this.productsToAttributes.find({
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
    });

    if (!productToAttributes?.length) {
      throw new Error("Product does not have any attributes");
    }

    const productPriceAttributeKeysToAttributes =
      await this.attributeKeysToAttributes.find({
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
      });

    if (!productPriceAttributeKeysToAttributes?.length) {
      throw new Error("Product does not have any price attributes");
    }

    for (const productPriceAttributeKeyToAttribute of productPriceAttributeKeysToAttributes) {
      const priceAttribute = await this.attribute.findById({
        id: productPriceAttributeKeyToAttribute.attributeId,
      });

      if (!priceAttribute) {
        throw new Error("Price attribute not found");
      }

      const attributesToBillingModuleCurrencies =
        await this.attributesToBillingModuleCurrencies.find({
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
