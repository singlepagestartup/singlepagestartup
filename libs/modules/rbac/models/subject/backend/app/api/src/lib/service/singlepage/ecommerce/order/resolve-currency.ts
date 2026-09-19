import { type IBillingModule, type IEcommerceModule } from "../../../../di";

export const NO_PRICE_IN_AVAILABLE_CURRENCY_ERROR =
  "Validation error. Product has no price in an available currency";

export type IExecuteProps = {
  productId: string;
  billingModuleCurrencyId?: string;
};

type IConstructorProps = {
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
};

/**
 * Resolves the billing currency an order line must be created with.
 *
 * A product is buyable only in the currencies its price attributes are linked
 * to. Resolving this before any write is what keeps a rejected add-to-cart
 * request from leaving an order, an order line and a store link behind with no
 * currency attached to them.
 */
export class Service {
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;

  constructor(props: IConstructorProps) {
    this.ecommerceModule = props.ecommerceModule;
    this.billingModule = props.billingModule;
  }

  async execute(props: IExecuteProps): Promise<string> {
    const priceCurrencyIds = await this.findPriceCurrencyIds({
      productId: props.productId,
    });

    if (!priceCurrencyIds.length) {
      throw new Error(NO_PRICE_IN_AVAILABLE_CURRENCY_ERROR);
    }

    if (props.billingModuleCurrencyId) {
      if (!priceCurrencyIds.includes(props.billingModuleCurrencyId)) {
        throw new Error(NO_PRICE_IN_AVAILABLE_CURRENCY_ERROR);
      }

      return props.billingModuleCurrencyId;
    }

    const defaultBillingModuleCurrencies =
      await this.billingModule.currency.find({
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

    const defaultBillingModuleCurrencyId = defaultBillingModuleCurrencies?.find(
      (billingModuleCurrency: { id: string }) =>
        priceCurrencyIds.includes(billingModuleCurrency.id),
    )?.id;

    return defaultBillingModuleCurrencyId || priceCurrencyIds[0];
  }

  private async findPriceCurrencyIds(props: {
    productId: string;
  }): Promise<string[]> {
    const priceAttributeKeys = await this.ecommerceModule.attributeKey.find({
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
      return [];
    }

    const productsToAttributes =
      await this.ecommerceModule.productsToAttributes.find({
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "eq",
                value: props.productId,
              },
            ],
          },
        },
      });

    if (!productsToAttributes?.length) {
      return [];
    }

    const priceAttributeKeysToAttributes =
      await this.ecommerceModule.attributeKeysToAttributes.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeKeyId",
                method: "inArray",
                value: priceAttributeKeys.map(
                  (priceAttributeKey: { id: string }) => priceAttributeKey.id,
                ),
              },
              {
                column: "attributeId",
                method: "inArray",
                value: productsToAttributes.map(
                  (productToAttribute: { attributeId: string }) =>
                    productToAttribute.attributeId,
                ),
              },
            ],
          },
        },
      });

    if (!priceAttributeKeysToAttributes?.length) {
      return [];
    }

    const attributesToBillingModuleCurrencies =
      await this.ecommerceModule.attributesToBillingModuleCurrencies.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeId",
                method: "inArray",
                value: priceAttributeKeysToAttributes.map(
                  (priceAttributeKeyToAttribute: { attributeId: string }) =>
                    priceAttributeKeyToAttribute.attributeId,
                ),
              },
            ],
          },
        },
      });

    if (!attributesToBillingModuleCurrencies?.length) {
      return [];
    }

    const currencyIds: string[] = [];

    for (const attributeToBillingModuleCurrency of attributesToBillingModuleCurrencies) {
      const currencyId =
        attributeToBillingModuleCurrency.billingModuleCurrencyId;

      if (currencyId && !currencyIds.includes(currencyId)) {
        currencyIds.push(currencyId);
      }
    }

    return currencyIds;
  }
}
