import { inject, injectable } from "inversify";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { IModel as IAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import { internationalization } from "@sps/shared-configuration";
import { Service as AttributeService } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/service";
import { Service as AttributeKeyService } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/service";
import { Service as ProductService } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import { Service as AttributeKeysToAttributesService } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/service";
import { Service as AttributesToBillingModuleCurrenciesService } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as OrdersToProductsService } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service";
import { Service as ProductsToAttributesService } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/service";
import { OrderDI } from "../../di";

export type IExecuteProps = {
  id: string;
  billingModuleCurrencyId?: string;
};

export type IResult = {
  amount: number;
  type: "subscription" | "one-time";
  interval?: "minute" | "hour" | "day" | "week" | "month" | "year";
};

@injectable()
export class Service {
  attributeKey: AttributeKeyService;
  ordersToProducts: OrdersToProductsService;
  product: ProductService;
  productsToAttributes: ProductsToAttributesService;
  attributeKeysToAttributes: AttributeKeysToAttributesService;
  attribute: AttributeService;
  attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService;

  constructor(
    @inject(OrderDI.IAttributeKeysService) attributeKey: AttributeKeyService,
    @inject(OrderDI.IOrdersToProductsService)
    ordersToProducts: OrdersToProductsService,
    @inject(OrderDI.IProductsService) product: ProductService,
    @inject(OrderDI.IProductsToAttributesService)
    productsToAttributes: ProductsToAttributesService,
    @inject(OrderDI.IAttributeKeysToAttributesService)
    attributeKeysToAttributes: AttributeKeysToAttributesService,
    @inject(OrderDI.IAttributesService) attribute: AttributeService,
    @inject(OrderDI.IAttributesToBillingModuleCurrenciesService)
    attributesToBillingModuleCurrencies: AttributesToBillingModuleCurrenciesService,
  ) {
    this.attributeKey = attributeKey;
    this.ordersToProducts = ordersToProducts;
    this.product = product;
    this.productsToAttributes = productsToAttributes;
    this.attributeKeysToAttributes = attributeKeysToAttributes;
    this.attribute = attribute;
    this.attributesToBillingModuleCurrencies =
      attributesToBillingModuleCurrencies;
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
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
      throw new Error("Not Found error. Price attribute key not found");
    }

    const intervalAttributeKeys = await this.attributeKey.find({
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
    });

    const intervalAttributeKey = intervalAttributeKeys?.[0];

    const priceAttributeKey = priceAttributeKeys[0];

    const orderToProducts = await this.ordersToProducts.find({
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
    });

    if (!orderToProducts?.length) {
      throw new Error("Internal error. Order does not have any products");
    }

    let amount = 0;
    let type: IResult["type"] | undefined = undefined;
    let interval: IResult["interval"] = undefined;

    for (const orderToProduct of orderToProducts) {
      const product = await this.product.findById({
        id: orderToProduct.productId,
      });

      if (!product) {
        throw new Error("Not Found error. Product not found");
      }

      if (product.type !== "subscription" && product.type !== "one-time") {
        throw new Error(
          "Validation error. Unsupported product.type value: " + product.type,
        );
      }

      if (!type) {
        type = product.type;
      } else if (type !== product.type) {
        throw new Error("Not Found error. Order has multiple product types");
      }

      const productToAttributes = await this.productsToAttributes.find({
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
      });

      if (!productToAttributes?.length) {
        throw new Error(
          "Not Found error. Product does not have any attributes",
        );
      }

      const productPrices: IAttribute[] = [];

      const productPriceAttributes = await this.attributeKeysToAttributes.find({
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

      if (!productPriceAttributes?.length) {
        throw new Error(
          "Not Found error. Product does not have any price attributes",
        );
      }

      if (props.billingModuleCurrencyId) {
        const targetPriceAttributes =
          await this.attributesToBillingModuleCurrencies.find({
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
          });

        if (!targetPriceAttributes?.length) {
          throw new Error(
            "Not Found error. Product does not have any target price attributes",
          );
        }

        if (targetPriceAttributes.length > 1) {
          throw new Error(
            "Internal error. Product has multiple target price attributes",
          );
        }

        const priceAttribute = await this.attribute.findById({
          id: targetPriceAttributes[0].attributeId,
        });

        if (!priceAttribute) {
          throw new Error("Not Found error. Price attribute not found");
        }

        productPrices.push(priceAttribute);

        if (!productPrices.length) {
          throw new Error(
            "Not Found error. Product does not have any price attributes",
          );
        }

        amount += Number(productPrices[0].number) * orderToProduct.quantity;
      }

      const productIntervals: IAttribute[] = [];

      for (const productToAttribute of productToAttributes) {
        if (!intervalAttributeKey) {
          continue;
        }

        const intervals = await this.attributeKeysToAttributes.find({
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
        });

        if (!intervals?.length) {
          continue;
        }

        if (intervals.length > 1) {
          throw new Error(
            "Internal error. Product has multiple interval attributes",
          );
        }

        const intervalAttribute = await this.attribute.findById({
          id: intervals[0].attributeId,
        });

        if (!intervalAttribute) {
          throw new Error("Not Found error. Interval attribute not found");
        }

        productIntervals.push(intervalAttribute);
      }

      if (!productIntervals.length) {
        continue;
      }

      const nextIntervalRaw =
        productIntervals[0].string?.[internationalization.defaultLanguage.code];

      if (
        nextIntervalRaw &&
        !["minute", "day", "week", "month", "year"].includes(nextIntervalRaw)
      ) {
        throw new Error(
          "Validation error. Unsupported interval value: " + nextIntervalRaw,
        );
      }

      const nextInterval = nextIntervalRaw as IResult["interval"];

      if (!interval && nextInterval) {
        interval = nextInterval;
      } else if (interval !== nextInterval) {
        throw new Error("Internal error. Order has multiple intervals");
      }
    }

    if (!type) {
      throw new Error("Not Found error. Order type not found");
    }

    return { amount, type, interval };
  }
}
