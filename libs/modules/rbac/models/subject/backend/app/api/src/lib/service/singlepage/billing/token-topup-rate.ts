import Decimal from "decimal.js";
import type { Service as Products } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";

const Money = Decimal.clone({ precision: 56 });

/** Read both sides of the operator's reference Token pack used for wallet top-ups. */
export class TokenTopupRate {
  constructor(private readonly products: Pick<Products, "findByIdExtended">) {}

  async read(tokenCurrencyId: string) {
    const id =
      process.env.AI_WORK_TOKEN_TOPUP_PRODUCT_ID ??
      "8aab55ed-f82d-49de-87b2-9625f5261f4c";
    const product = await this.products.findByIdExtended({ id });
    const attributes = product.productsToAttributes ?? [];
    const amount = (type: "price" | "topup", currency: "usd" | "token") => {
      const values = attributes.filter(
        ({ attribute }) =>
          attribute.attributeKeysToAttribute?.some(
            ({ attributeKey }) => attributeKey?.type === type,
          ) &&
          attribute.attributesToBillingModuleCurrencies?.some(
            ({ billingModuleCurrency }) =>
              billingModuleCurrency?.slug === currency &&
              (currency !== "token" ||
                billingModuleCurrency.id === tokenCurrencyId),
          ),
      );
      const value = values.length === 1 && values[0].attribute.number;
      if (
        !value ||
        !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) ||
        !new Money(value).gt(0)
      ) {
        throw new Error(
          "Configuration error. The platform Token top-up product needs one positive USD price and Token credit",
        );
      }
      return value;
    };
    const topupUsd = amount("price", "usd");
    const topupTokens = amount("topup", "token");
    return {
      topupProductId: product.id,
      topupUsd,
      topupTokens,
      usdPerSps: new Money(topupUsd)
        .div(topupTokens)
        .toDecimalPlaces(24)
        .toFixed(),
    };
  }
}
