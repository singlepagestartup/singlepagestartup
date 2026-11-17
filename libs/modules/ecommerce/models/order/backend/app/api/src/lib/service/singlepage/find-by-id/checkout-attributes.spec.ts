/**
 * BDD Suite: ecommerce order checkout intervals.
 *
 * Given: subscription products can define supported billing intervals.
 * When: checkout validates an hourly or unknown interval.
 * Then: hourly billing is accepted and unknown values remain rejected.
 */

import {
  isSupportedOrderInterval,
  isSupportedOrderType,
  Service,
} from "./checkout-attributes";

describe("ecommerce order checkout intervals", () => {
  /**
   * BDD Scenario: an hourly subscription reaches checkout.
   *
   * Given: a subscription product uses the hour interval.
   * When: checkout validates its interval attribute.
   * Then: the interval is accepted for payment-intent and invoice creation.
   */
  it("accepts the hour subscription interval", () => {
    expect(isSupportedOrderInterval("hour")).toBe(true);
  });

  /**
   * BDD Scenario: an unsupported interval reaches checkout.
   *
   * Given: a subscription product uses an unknown interval.
   * When: checkout validates its interval attribute.
   * Then: the interval remains unsupported.
   */
  it("rejects unknown subscription intervals", () => {
    expect(isSupportedOrderInterval("fortnight")).toBe(false);
  });

  /**
   * BDD Scenario: a one-off product reaches checkout.
   *
   * Given: ecommerce products persist the canonical one_off type.
   * When: checkout validates the product type.
   * Then: the product is accepted for a one-off payment intent.
   */
  it("accepts the canonical one_off product type", () => {
    expect(isSupportedOrderType("one_off")).toBe(true);
  });

  /**
   * BDD Scenario: a legacy one-time product type reaches checkout.
   *
   * Given: one-time is not part of the product or payment-intent contracts.
   * When: checkout validates the product type.
   * Then: the legacy value remains unsupported.
   */
  it("rejects the legacy one-time product type", () => {
    expect(isSupportedOrderType("one-time")).toBe(false);
  });
});

function legacyIntervalsFixture(intervals: string[] = ["day"]) {
  const intervalIds = intervals.map((_value, index) => `interval-${index}`);
  const links = [
    { attributeId: "price", attributeKeyId: "price-key" },
    ...intervalIds.map((attributeId) => ({
      attributeId,
      attributeKeyId: "product-interval-key",
    })),
  ];
  const attributeKey = {
    find: jest.fn(async ({ params }: any) =>
      params.filters.and[0].value === "price"
        ? [{ id: "price-key" }]
        : [
            { id: "unrelated-global-interval-key" },
            { id: "product-interval-key" },
          ],
    ),
  };
  const orderLines = {
    find: jest
      .fn()
      .mockResolvedValue([{ id: "line", productId: "product", quantity: 1 }]),
  };
  const products = {
    findById: jest
      .fn()
      .mockResolvedValue({ id: "product", type: "subscription" }),
  };
  const productAttributes = {
    find: jest
      .fn()
      .mockResolvedValue([
        { attributeId: "price" },
        ...intervalIds.map((attributeId) => ({ attributeId })),
      ]),
  };
  const attributeKeys = {
    find: jest.fn(async ({ params }: any) =>
      links.filter((link) =>
        params.filters.and.every((filter: any) =>
          filter.method === "inArray"
            ? filter.value.includes(
                (link as Record<string, string>)[filter.column],
              )
            : (link as Record<string, string>)[filter.column] === filter.value,
        ),
      ),
    ),
  };
  const attributes = {
    findById: jest.fn(async ({ id }: any) =>
      id === "price"
        ? { id, number: "100" }
        : { id, string: { en: intervals[intervalIds.indexOf(id)] } },
    ),
  };
  const currencies = {
    find: jest
      .fn()
      .mockResolvedValue([
        { attributeId: "price", billingModuleCurrencyId: "usd" },
      ]),
  };
  return new Service(
    attributeKey as any,
    orderLines as any,
    products as any,
    productAttributes as any,
    attributeKeys as any,
    attributes as any,
    currencies as any,
  );
}

it("resolves the Product's interval through every configured interval key", async () => {
  await expect(
    legacyIntervalsFixture().execute({
      id: "order",
      billingModuleCurrencyId: "usd",
    }),
  ).resolves.toEqual({
    amount: 100,
    type: "subscription",
    interval: "day",
  });
});

it("rejects conflicting Product intervals instead of choosing the first attribute", async () => {
  await expect(
    legacyIntervalsFixture(["day", "month"]).execute({
      id: "order",
      billingModuleCurrencyId: "usd",
    }),
  ).rejects.toThrow("multiple intervals");
});
