import { catalogCreateOfferSchema } from "./ecommerce-catalog";

describe("seller Product classification", () => {
  it.each(["tax", "commission", "startup-membership"])(
    "accepts %s when creating a Product with its offer",
    (kind) => {
      const parsed = catalogCreateOfferSchema.parse({
        product: {
          title: { en: "Example" },
          kind,
          formula: "unit_price * quantity",
        },
        prices: [
          { currencyId: "12345678-1234-4234-8234-123456789012", amount: "10" },
        ],
      });
      expect(parsed.product?.kind).toBe(kind);
    },
  );

  it("rejects an empty classification", () => {
    expect(
      catalogCreateOfferSchema.safeParse({
        product: {
          title: { en: "Example" },
          kind: " ",
          formula: "unit_price * quantity",
        },
        prices: [
          { currencyId: "12345678-1234-4234-8234-123456789012", amount: "10" },
        ],
      }).success,
    ).toBe(false);
  });
});
