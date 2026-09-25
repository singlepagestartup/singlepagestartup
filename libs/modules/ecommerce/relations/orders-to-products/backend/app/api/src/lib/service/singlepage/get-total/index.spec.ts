/**
 * BDD Suite: order line total for products that cannot be priced.
 *
 * Given: a cart holds order lines whose products may lack a price in any billing currency.
 * When: the line total is computed.
 * Then: unpriceable lines are reported and contribute nothing, while priced lines are summed as before.
 */

const loggerWarnMock = jest.fn();
const billingModuleCurrencyFindByIdMock = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarnMock(...args),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@sps/billing/models/currency/sdk/server", () => ({
  api: {
    findById: (...args: unknown[]) =>
      billingModuleCurrencyFindByIdMock(...args),
  },
}));

import { Service } from "./index";

const PRICE_ATTRIBUTE_KEY_ID = "attribute-key-price";
const ORDER_TO_PRODUCT_ID = "order-to-product-1";
const PRODUCT_ID = "product-1";
const CURRENCY_ID = "currency-rub";

type IPriceAttribute = {
  id: string;
  number: string;
  currencyId?: string;
};

function createService(props?: {
  quantity?: number;
  productFound?: boolean;
  productAttributeIds?: string[];
  priceAttributes?: IPriceAttribute[];
}) {
  const quantity = props?.quantity ?? 2;
  const priceAttributes = props?.priceAttributes ?? [
    { id: "attribute-price", number: "510", currencyId: CURRENCY_ID },
  ];
  const productAttributeIds =
    props?.productAttributeIds ?? priceAttributes.map((a) => a.id);

  const attributesById = new Map(priceAttributes.map((a) => [a.id, a]));

  return new Service({
    findById: jest.fn().mockResolvedValue({
      id: ORDER_TO_PRODUCT_ID,
      productId: PRODUCT_ID,
      quantity,
    }) as any,
    product: {
      findById: jest
        .fn()
        .mockResolvedValue(
          props?.productFound === false ? null : { id: PRODUCT_ID },
        ),
    } as any,
    attribute: {
      findById: jest
        .fn()
        .mockImplementation(async ({ id }: { id: string }) =>
          attributesById.get(id)
            ? { id, number: attributesById.get(id)!.number }
            : null,
        ),
    } as any,
    attributeKey: {
      find: jest.fn().mockResolvedValue([{ id: PRICE_ATTRIBUTE_KEY_ID }]),
    } as any,
    productsToAttributes: {
      find: jest.fn().mockResolvedValue(
        productAttributeIds.map((attributeId) => ({
          attributeId,
          productId: PRODUCT_ID,
        })),
      ),
    } as any,
    attributeKeysToAttributes: {
      find: jest.fn().mockResolvedValue(
        priceAttributes.map((a) => ({
          attributeId: a.id,
          attributeKeyId: PRICE_ATTRIBUTE_KEY_ID,
        })),
      ),
    } as any,
    attributesToBillingModuleCurrencies: {
      find: jest.fn().mockImplementation(async (findProps: any) => {
        const attributeId = findProps.params.filters.and[0].value;
        const currencyId = attributesById.get(attributeId)?.currencyId;

        return currencyId
          ? [{ attributeId, billingModuleCurrencyId: currencyId }]
          : [];
      }),
    } as any,
  });
}

describe("Given: an order line whose product has no price in any billing currency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    billingModuleCurrencyFindByIdMock.mockResolvedValue({
      id: CURRENCY_ID,
      symbol: "₽",
    });
  });

  /**
   * BDD Scenario: a price attribute with no currency link.
   *
   * Given: the product's price attribute is not linked to any billing currency.
   * When: the line total is computed.
   * Then: it resolves with no totals, reports the line as unpriced, and warns once.
   */
  it("When: the line total is computed Then: it reports the line instead of throwing", async () => {
    const service = createService({
      priceAttributes: [{ id: "attribute-price", number: "510" }],
    });

    const result = await service.execute({ id: ORDER_TO_PRODUCT_ID });

    expect(result.totals).toEqual([]);
    expect(result.unpriced).toEqual([
      {
        ordersToProductsId: ORDER_TO_PRODUCT_ID,
        productId: PRODUCT_ID,
        reason: "Product does not have any target price attributes",
      },
    ]);
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: a product with no attributes at all.
   *
   * Given: the product carries no attribute links.
   * When: the line total is computed.
   * Then: the line is reported as unpriced without throwing.
   */
  it("When: the product has no attributes Then: the line is reported as unpriced", async () => {
    const service = createService({
      productAttributeIds: [],
      priceAttributes: [],
    });

    const result = await service.execute({ id: ORDER_TO_PRODUCT_ID });

    expect(result.totals).toEqual([]);
    expect(result.unpriced[0].reason).toBe(
      "Product does not have any attributes",
    );
  });

  /**
   * BDD Scenario: a line pointing at a product that no longer exists.
   *
   * Given: the order line references a deleted product.
   * When: the line total is computed.
   * Then: the line is reported as unpriced without throwing.
   */
  it("When: the product is gone Then: the line is reported as unpriced", async () => {
    const service = createService({ productFound: false });

    const result = await service.execute({ id: ORDER_TO_PRODUCT_ID });

    expect(result.totals).toEqual([]);
    expect(result.unpriced[0].reason).toBe("Product not found");
  });
});

describe("Given: an order line whose product is priced", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    billingModuleCurrencyFindByIdMock.mockResolvedValue({
      id: CURRENCY_ID,
      symbol: "₽",
    });
  });

  /**
   * BDD Scenario: a fully priced line.
   *
   * Given: the product's price attribute is linked to a billing currency.
   * When: the line total is computed.
   * Then: quantity times price is returned in that currency and nothing is reported.
   */
  it("When: the line total is computed Then: quantity times price is returned", async () => {
    const service = createService({ quantity: 3 });

    const result = await service.execute({ id: ORDER_TO_PRODUCT_ID });

    expect(result.totals).toEqual([
      {
        total: 1530,
        billingModuleCurrency: { id: CURRENCY_ID, symbol: "₽" },
      },
    ]);
    expect(result.unpriced).toEqual([]);
    expect(loggerWarnMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a product priced in one currency with a second, incomplete price attribute.
   *
   * Given: one price attribute carries a currency and another does not.
   * When: the line total is computed.
   * Then: the priced attribute is summed, the line is not reported, and the gap is warned once.
   */
  it("When: one price attribute has no currency Then: the priced one is still summed", async () => {
    const service = createService({
      quantity: 1,
      priceAttributes: [
        { id: "attribute-price-no-currency", number: "100" },
        { id: "attribute-price", number: "510", currencyId: CURRENCY_ID },
      ],
    });

    const result = await service.execute({ id: ORDER_TO_PRODUCT_ID });

    expect(result.totals).toEqual([
      {
        total: 510,
        billingModuleCurrency: { id: CURRENCY_ID, symbol: "₽" },
      },
    ]);
    expect(result.unpriced).toEqual([]);
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
  });
});
