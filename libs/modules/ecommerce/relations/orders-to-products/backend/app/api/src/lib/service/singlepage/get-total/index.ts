import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { logger } from "@sps/backend-utils";
import type {
  IModel as IOrderToProduct,
  IUnpricedOrderToProduct,
  IOrderLineTotal,
  IOrderLineTotals,
} from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";

export type IExecuteProps = {
  id: string;
};

export type { IUnpricedOrderToProduct } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
export interface IExecuteResult extends IOrderLineTotals {}

type IConstructorProps = {
  findById: (props: { id: string }) => Promise<IOrderToProduct | null>;
  product: ProductService;
  billingModule: ProductService["billingModule"];
  attribute: AttributeService;
  attributeKey: AttributeKeyService;
  productsToAttributes: ProductsToAttributesService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;
};

/**
 * Computes the total of a single order line.
 *
 * A line whose product carries no price in any billing currency yields no
 * total and is reported instead of throwing: one such line, left behind by a
 * failed add-to-cart or by incomplete catalog data, must not take the whole
 * cart down with it.
 */
export class Service {
  findById: IConstructorProps["findById"];
  product: ProductService;
  billingModule: ProductService["billingModule"];
  attribute: AttributeService;
  attributeKey: AttributeKeyService;
  productsToAttributes: ProductsToAttributesService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
    this.product = props.product;
    this.billingModule = props.billingModule;
    this.attribute = props.attribute;
    this.attributeKey = props.attributeKey;
    this.productsToAttributes = props.productsToAttributes;
    this.attributeKeysToAttributes = props.attributeKeysToAttributes;
    this.attributesToBillingModuleCurrencies =
      props.attributesToBillingModuleCurrencies;
  }

  async execute(props: IExecuteProps): Promise<IExecuteResult> {
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

    const totals: IOrderLineTotal[] = [];

    const product = await this.product.findById({
      id: entity.productId,
    });

    if (!product) {
      return this.unpriced({ entity, reason: "Product not found" });
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
      return this.unpriced({
        entity,
        reason: "Product does not have any attributes",
      });
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
                method: "inArray",
                value: priceAttributeKeys.map((key) => key.id),
              },
            ],
          },
        },
      });

    if (!productPriceAttributeKeysToAttributes?.length) {
      return this.unpriced({
        entity,
        reason: "Product does not have any price attributes",
      });
    }

    let skippedPriceAttributes = 0;

    for (const productPriceAttributeKeyToAttribute of productPriceAttributeKeysToAttributes) {
      const priceAttribute = await this.attribute.findById({
        id: productPriceAttributeKeyToAttribute.attributeId,
      });

      if (!priceAttribute) {
        skippedPriceAttributes += 1;
        continue;
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
        skippedPriceAttributes += 1;
        continue;
      }

      const billingModuleCurrency = await this.billingModule.currency.findById({
        id: attributesToBillingModuleCurrencies[0].billingModuleCurrencyId,
      });

      if (!billingModuleCurrency) {
        skippedPriceAttributes += 1;
        continue;
      }

      totals.push({
        total: entity.quantity * Number(priceAttribute.number),
        billingModuleCurrency,
      });
    }

    if (!totals.length) {
      return this.unpriced({
        entity,
        reason: "Product does not have any target price attributes",
      });
    }

    if (skippedPriceAttributes) {
      logger.warn(
        "ecommerce/orders-to-products/get-total: skipped price attributes without a billing currency",
        {
          ordersToProductsId: entity.id,
          productId: entity.productId,
          skippedPriceAttributes,
        },
      );
    }

    return {
      totals,
      unpriced: [],
    };
  }

  private unpriced(props: {
    entity: IOrderToProduct;
    reason: string;
  }): IExecuteResult {
    logger.warn(
      "ecommerce/orders-to-products/get-total: order line has no price in an available currency",
      {
        ordersToProductsId: props.entity.id,
        productId: props.entity.productId,
        reason: props.reason,
      },
    );

    return {
      totals: [],
      unpriced: [
        {
          ordersToProductsId: props.entity.id,
          productId: props.entity.productId,
          reason: props.reason,
        },
      ],
    };
  }
}
