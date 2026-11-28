import Decimal from "decimal.js";
import { compileTariffFormula } from "@sps/backend-utils";
import type { Service as Products } from "@sps/ecommerce/models/product/backend/app/api/src/lib/service";
import type { IProviderTerms } from "@sps/rbac/models/subject/sdk/model/src/lib/provider-connections";
import type { IOfferWorkTokenTariff } from "@sps/ecommerce/relations/stores-to-products/sdk/model";

const Money = Decimal.clone({ precision: 56 });
const workTariff = compileTariffFormula(
  "provider_usd * topup_tokens / topup_usd * multiplier",
);

/** Read both sides of the operator's reference Token pack used for wallet top-ups. */
export class TokenTopupRate {
  constructor(
    private readonly products: Pick<Products, "findByIdExtended" | "find">,
  ) {}

  static workCharge(
    usd: string,
    {
      topupTokens,
      topupUsd,
      usdPerSps,
      workMultiplier,
      workTokenTariff,
    }: Pick<
      IProviderTerms,
      | "topupTokens"
      | "topupUsd"
      | "usdPerSps"
      | "workMultiplier"
      | "workTokenTariff"
    >,
    multiplier?: string,
  ) {
    const rate =
      topupTokens && topupUsd
        ? { topup_tokens: topupTokens, topup_usd: topupUsd }
        : { topup_tokens: "1", topup_usd: usdPerSps };
    if (workTokenTariff && multiplier === undefined) {
      const tariff: IOfferWorkTokenTariff = JSON.parse(workTokenTariff);
      return compileTariffFormula(tariff.formula).evaluate({
        ...tariff.inputs,
        ...rate,
        provider_usd: usd,
      });
    }
    return workTariff.evaluate({
      ...rate,
      provider_usd: usd,
      multiplier: multiplier ?? workMultiplier,
    });
  }

  private async referenceProduct() {
    const override = process.env.AI_WORK_TOKEN_TOPUP_PRODUCT_ID;
    const id = override ?? "8aab55ed-f82d-49de-87b2-9625f5261f4c";
    try {
      return await this.products.findByIdExtended({ id });
    } catch (error) {
      if (
        override ||
        !(error instanceof Error) ||
        error.message !== "Not found error. 'product' not found."
      ) {
        throw error;
      }
    }
    const [seeded] = await this.products.find({
      params: {
        limit: 1,
        filters: {
          and: [
            { column: "slug", method: "eq", value: "ai-chat-tokens-100-rub" },
          ],
        },
      },
    });
    if (!seeded) {
      throw new Error(
        "Configuration error. The platform Token top-up product is missing",
      );
    }
    return this.products.findByIdExtended({ id: seeded.id });
  }

  async read(tokenCurrencyId: string) {
    const product = await this.referenceProduct();
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
