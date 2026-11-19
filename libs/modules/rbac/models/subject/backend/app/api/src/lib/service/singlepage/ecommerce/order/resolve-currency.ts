import type { SubjectServiceDependencies } from "../../index";
import type { IEcommerceCartSelection } from "@sps/rbac/models/subject/sdk/model";

export interface IExecuteProps {
  productId: string;
  billingModuleCurrencyId?: string;
  offerId?: string;
  destination?: IEcommerceCartSelection["destination"];
  services?: IEcommerceCartSelection["services"];
}

interface IConstructorProps {
  storesToProducts: Pick<
    SubjectServiceDependencies["modules"]["ecommerce"]["storesToProducts"],
    "quote"
  >;
  attributeKey: Pick<
    SubjectServiceDependencies["modules"]["ecommerce"]["attributeKey"],
    "find"
  >;
  productsToAttributes: Pick<
    SubjectServiceDependencies["modules"]["ecommerce"]["productsToAttributes"],
    "find"
  >;
  attributeKeysToAttributes: Pick<
    SubjectServiceDependencies["modules"]["ecommerce"]["attributeKeysToAttributes"],
    "find"
  >;
  attributesToBillingModuleCurrencies: Pick<
    SubjectServiceDependencies["modules"]["ecommerce"]["attributesToBillingModuleCurrencies"],
    "find"
  >;
  currency: Pick<
    SubjectServiceDependencies["modules"]["billing"]["currency"],
    "find"
  >;
}

/**
 * Resolves the billing currency an order line must be created with.
 *
 * A product is buyable only in the currencies its price attributes are linked
 * to. Resolving this before any write is what keeps a rejected add-to-cart
 * request from leaving an order, an order line and a store link behind with no
 * currency attached to them.
 */
export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<string> {
    let priceCurrencyIds: string[];
    if (props.offerId) {
      const quote = await this.dependencies.storesToProducts.quote({
        offerId: props.offerId,
        quantity: 1,
        currencyId: props.billingModuleCurrencyId ?? "",
        destination: props.destination,
        services: props.services,
      });
      priceCurrencyIds = quote.currencyIds;
    } else {
      priceCurrencyIds = await this.findPriceCurrencyIds({
        productId: props.productId,
      });
    }

    if (!priceCurrencyIds.length) {
      throw new Error(
        "Validation error. Product has no price in an available currency",
      );
    }

    if (props.billingModuleCurrencyId) {
      if (!priceCurrencyIds.includes(props.billingModuleCurrencyId)) {
        throw new Error(
          "Validation error. Product has no price in an available currency",
        );
      }

      return props.billingModuleCurrencyId;
    }

    const defaultBillingModuleCurrencies =
      await this.dependencies.currency.find({
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
    const priceAttributeKeys = await this.dependencies.attributeKey.find({
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
      await this.dependencies.productsToAttributes.find({
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
      await this.dependencies.attributeKeysToAttributes.find({
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
      await this.dependencies.attributesToBillingModuleCurrencies.find({
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
