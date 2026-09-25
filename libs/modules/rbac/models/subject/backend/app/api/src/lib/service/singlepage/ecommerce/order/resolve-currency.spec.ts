/**
 * BDD Suite: add-to-cart order currency resolution.
 *
 * Given: a product catalog with price attributes that may or may not be linked to a billing currency.
 * When: the add-to-cart flow resolves the currency an order must be created with.
 * Then: a buyable currency is returned, or the request is rejected before any write happens.
 */

import {
  Service,
  NO_PRICE_IN_AVAILABLE_CURRENCY_ERROR,
} from "./resolve-currency";

const PRICE_ATTRIBUTE_KEY_ID = "attribute-key-price";
const PRODUCT_ID = "product-1";
const DEFAULT_CURRENCY_ID = "currency-default";
const OTHER_CURRENCY_ID = "currency-other";

type ILink = {
  attributeId: string;
  billingModuleCurrencyId?: string;
};

function createTestContext(props?: {
  priceAttributeKeys?: { id: string }[];
  productAttributeIds?: string[];
  priceAttributeIds?: string[];
  currencyLinks?: ILink[];
  defaultCurrencyIds?: string[];
}) {
  const priceAttributeKeys = props?.priceAttributeKeys ?? [
    { id: PRICE_ATTRIBUTE_KEY_ID },
  ];
  const productAttributeIds = props?.productAttributeIds ?? ["attribute-price"];
  const priceAttributeIds = props?.priceAttributeIds ?? productAttributeIds;
  const currencyLinks = props?.currencyLinks ?? [
    {
      attributeId: "attribute-price",
      billingModuleCurrencyId: DEFAULT_CURRENCY_ID,
    },
  ];
  const defaultCurrencyIds = props?.defaultCurrencyIds ?? [DEFAULT_CURRENCY_ID];

  const ecommerceModule = {
    attributeKey: {
      find: jest.fn().mockResolvedValue(priceAttributeKeys),
    },
    productsToAttributes: {
      find: jest.fn().mockResolvedValue(
        productAttributeIds.map((attributeId) => ({
          attributeId,
          productId: PRODUCT_ID,
        })),
      ),
    },
    attributeKeysToAttributes: {
      find: jest.fn().mockResolvedValue(
        priceAttributeIds.map((attributeId) => ({
          attributeId,
          attributeKeyId: PRICE_ATTRIBUTE_KEY_ID,
        })),
      ),
    },
    attributesToBillingModuleCurrencies: {
      find: jest.fn().mockResolvedValue(currencyLinks),
    },
  } as any;

  const billingModule = {
    currency: {
      find: jest
        .fn()
        .mockResolvedValue(defaultCurrencyIds.map((id) => ({ id }))),
    },
  } as any;

  return {
    ecommerceModule,
    billingModule,
    service: new Service({ ecommerceModule, billingModule }),
  };
}

describe("Given: a product whose price attributes carry no billing currency", () => {
  /**
   * BDD Scenario: unpriced product is rejected.
   *
   * Given: the product has price attributes but none is linked to a currency.
   * When: the order currency is resolved.
   * Then: resolution is rejected with the validation error the handler turns into a 400.
   */
  it("When: the order currency is resolved Then: it rejects with the no-price validation error", async () => {
    const { service } = createTestContext({ currencyLinks: [] });

    await expect(service.execute({ productId: PRODUCT_ID })).rejects.toThrow(
      NO_PRICE_IN_AVAILABLE_CURRENCY_ERROR,
    );
  });

  /**
   * BDD Scenario: product with no price attribute at all is rejected.
   *
   * Given: the product's attributes are all outside the price attribute key.
   * When: the order currency is resolved.
   * Then: resolution is rejected.
   */
  it("When: the product has no price attribute Then: it rejects with the no-price validation error", async () => {
    const { service } = createTestContext({
      productAttributeIds: ["attribute-interval"],
      priceAttributeIds: [],
    });

    await expect(service.execute({ productId: PRODUCT_ID })).rejects.toThrow(
      NO_PRICE_IN_AVAILABLE_CURRENCY_ERROR,
    );
  });

  /**
   * BDD Scenario: a missing price attribute key is rejected rather than guessed around.
   *
   * Given: no attribute key of type price is configured.
   * When: the order currency is resolved.
   * Then: resolution is rejected.
   */
  it("When: no price attribute key is configured Then: it rejects with the no-price validation error", async () => {
    const { service } = createTestContext({ priceAttributeKeys: [] });

    await expect(service.execute({ productId: PRODUCT_ID })).rejects.toThrow(
      NO_PRICE_IN_AVAILABLE_CURRENCY_ERROR,
    );
  });
});

describe("Given: a product priced in one or more billing currencies", () => {
  /**
   * BDD Scenario: a currency the product is not priced in is refused.
   *
   * Given: the caller asks for a currency outside the product's price currencies.
   * When: the order currency is resolved.
   * Then: resolution is rejected instead of silently substituting another currency.
   */
  it("When: the requested currency is not one the product is priced in Then: it rejects", async () => {
    const { service } = createTestContext();

    await expect(
      service.execute({
        productId: PRODUCT_ID,
        billingModuleCurrencyId: OTHER_CURRENCY_ID,
      }),
    ).rejects.toThrow(NO_PRICE_IN_AVAILABLE_CURRENCY_ERROR);
  });

  /**
   * BDD Scenario: a requested currency the product is priced in is honoured.
   *
   * Given: the caller asks for one of the product's price currencies.
   * When: the order currency is resolved.
   * Then: that currency is returned without consulting the default currency.
   */
  it("When: the requested currency is one the product is priced in Then: it is returned unchanged", async () => {
    const { service, billingModule } = createTestContext({
      currencyLinks: [
        {
          attributeId: "attribute-price",
          billingModuleCurrencyId: DEFAULT_CURRENCY_ID,
        },
        {
          attributeId: "attribute-price-2",
          billingModuleCurrencyId: OTHER_CURRENCY_ID,
        },
      ],
    });

    await expect(
      service.execute({
        productId: PRODUCT_ID,
        billingModuleCurrencyId: OTHER_CURRENCY_ID,
      }),
    ).resolves.toBe(OTHER_CURRENCY_ID);
    expect(billingModule.currency.find).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the default currency wins when the product offers it.
   *
   * Given: the product is priced in several currencies, one of them the default.
   * When: the order currency is resolved without a requested currency.
   * Then: the default currency is chosen.
   */
  it("When: no currency is requested and the product offers the default Then: the default currency is chosen", async () => {
    const { service } = createTestContext({
      currencyLinks: [
        {
          attributeId: "attribute-price-2",
          billingModuleCurrencyId: OTHER_CURRENCY_ID,
        },
        {
          attributeId: "attribute-price",
          billingModuleCurrencyId: DEFAULT_CURRENCY_ID,
        },
      ],
    });

    await expect(service.execute({ productId: PRODUCT_ID })).resolves.toBe(
      DEFAULT_CURRENCY_ID,
    );
  });

  /**
   * BDD Scenario: the only price currency is used when the default is not offered.
   *
   * Given: the product is priced in a single currency that is not the default.
   * When: the order currency is resolved without a requested currency.
   * Then: that single currency is chosen.
   */
  it("When: the product is not priced in the default currency Then: its own price currency is chosen", async () => {
    const { service } = createTestContext({
      currencyLinks: [
        {
          attributeId: "attribute-price",
          billingModuleCurrencyId: OTHER_CURRENCY_ID,
        },
      ],
    });

    await expect(service.execute({ productId: PRODUCT_ID })).resolves.toBe(
      OTHER_CURRENCY_ID,
    );
  });

  /**
   * BDD Scenario: only price attributes contribute currencies.
   *
   * Given: a currency is linked to an attribute that is not under the price key.
   * When: the order currency is resolved.
   * Then: that currency is not considered and resolution is rejected.
   */
  it("When: the only currency sits on a non-price attribute Then: it is not treated as a price currency", async () => {
    const { ecommerceModule, service } = createTestContext({
      productAttributeIds: ["attribute-topup"],
      priceAttributeIds: [],
    });

    await expect(service.execute({ productId: PRODUCT_ID })).rejects.toThrow(
      NO_PRICE_IN_AVAILABLE_CURRENCY_ERROR,
    );
    expect(
      ecommerceModule.attributesToBillingModuleCurrencies.find,
    ).not.toHaveBeenCalled();
  });
});
