import { Service } from "./index";
import type { IOfferAttribute, IOfferCatalog } from "../../../repository";
import type { IOfferQuoteInput } from "@sps/ecommerce/relations/stores-to-products/sdk/model";

const input: IOfferQuoteInput = {
  offerId: "wardrobe",
  quantity: 1,
  currencyId: "rub",
  destination: { address: "Test address" },
  services: [
    { offerId: "courier", quantity: 1 },
    { offerId: "assembly", quantity: 1 },
  ],
};
function fixture() {
  function attr(
    key: string,
    value: string | null,
    currency?: string,
    field = "number",
  ): IOfferAttribute {
    return {
      id: key,
      key,
      type: key === "price" ? "price" : "feature",
      field,
      number: field === "number" ? value : null,
      text: field === "string" ? (value ?? undefined) : undefined,
      currencyIds: currency ? [currency] : [],
    };
  }
  const formula = (expression: string) => [
    attr("price_formula", expression, undefined, "string"),
    attr("formula_version", "1", undefined, "string"),
  ];
  const products = ["wardrobe", "courier", "assembly"].map(
    (id) =>
      [
        id,
        {
          id,
          title: { en: id },
          kind: id === "wardrobe" ? "physical" : "service",
        },
      ] as const,
  );
  const offers = products.map(
    ([id]) =>
      [
        id,
        {
          id,
          productId: id,
          storeId: "seller",
          variant: "default",
          settings: {},
        },
      ] as const,
  );
  const catalog = {
    products: new Map(products),
    offers: new Map(offers),
    providers: [],
    links: [
      {
        sourceOfferId: "wardrobe",
        targetOfferId: "courier",
        variant: "delivery",
        recurrence: "each",
      },
      {
        sourceOfferId: "wardrobe",
        targetOfferId: "assembly",
        variant: "add-on",
        recurrence: "first",
      },
    ],
    currencies: [
      { id: "rub", slug: "rub" },
      { id: "usd", slug: "usd" },
    ],
    offerAttributes: new Map([
      [
        "wardrobe",
        [
          attr("price", "5000", "rub"),
          attr("price", "60", "usd"),
          attr("stock_quantity", "3"),
        ],
      ],
      ["courier", [attr("price", "1000", "rub")]],
      ["assembly", [attr("price", "2000", "rub"), attr("price", "25", "usd")]],
    ]),
    productAttributes: new Map([
      ["wardrobe", formula("unit_price * quantity")],
      ["courier", formula("unit_price")],
      ["assembly", formula("unit_price * serviced_qty")],
    ]),
    storeAttributes: new Map<string, IOfferAttribute[]>(),
  } as unknown as IOfferCatalog;
  const routing = {
    geocode: jest.fn(async () => ({
      latitude: 60,
      longitude: 30,
      regions: ["SPB"],
    })),
    distance: jest.fn(async () => 24000),
  };
  const held: Record<string, number> = {};
  const service = new Service({
    catalog,
    held,
    precision: () => 2,
    routing: () => routing,
    now: new Date("2026-11-17T00:00:00Z"),
  });
  return { service, catalog, held, routing, attr, formula };
}
describe("per-offer quote", () => {
  it.each([
    [1, 1, "8000.00"],
    [2, 1, "13000.00"],
    [2, 2, "15000.00"],
  ])(
    "prices %i units and %i assemblies",
    async (quantity, assemblies, total) => {
      const { service, routing } = fixture();
      const quote = await service.execute({
        ...input,
        quantity: Number(quantity),
        services: [
          input.services![0],
          { offerId: "assembly", quantity: Number(assemblies) },
        ],
      });
      expect(quote.amount).toBe(total);
      expect(quote.currencyIds).toEqual(["rub"]);
      expect(routing.distance).not.toHaveBeenCalled();
    },
  );
  it("intersects selected options, subtracts held stock and preserves the requested quantity", async () => {
    const { service, held } = fixture();
    held.wardrobe = 2;
    const quote = await service.execute({
      ...input,
      quantity: 2,
      services: [],
    });
    expect(quote.currencyIds).toEqual(["rub", "usd"]);
    expect(quote.availableQuantity).toBe(1);
    expect(quote.quantity).toBe(2);
    expect(quote.amount).toBeNull();
    expect(quote.issues).toContainEqual(
      expect.objectContaining({ code: "insufficient_stock", available: 1 }),
    );
  });
  it("charges road distance and a percentage of serviced items", async () => {
    const { service, catalog, attr, formula, routing } = fixture();
    catalog.productAttributes.set(
      "courier",
      formula("dispatch_fee + rate_per_km * distance_km"),
    );
    catalog.productAttributes.set(
      "assembly",
      formula("assembly_percent * serviced_subtotal / 100"),
    );
    catalog.storeAttributes.set("seller", [
      attr("dispatch_fee", "400", "rub"),
      attr("rate_per_km", "25", "rub"),
      attr("assembly_percent", "10"),
    ]);
    catalog.offers.get("courier")!.settings.origin = {
      latitude: 59,
      longitude: 30,
    };
    const quote = await service.execute(input);
    expect(quote.amount).toBe("6500.00");
    expect(routing.distance).toHaveBeenCalledTimes(1);
    expect(quote.charges[1].inputs.distance_km).toBe("24");
    expect(
      quote.serviceOptions.find((option) => option.offerId === "courier")
        ?.deliveryTariff,
    ).toEqual({ basis: "distance" });
  });
  it("distinguishes free, unpriced, and a missing required package measurement", async () => {
    const { service, catalog, attr, formula } = fixture();
    const discover = () =>
      service.execute({ ...input, services: [], destination: undefined });
    expect(
      (await discover()).serviceOptions.find(
        (option) => option.offerId === "courier",
      )?.deliveryTariff,
    ).toEqual({ basis: "fixed", fixedAmount: "1000.00" });
    catalog.offerAttributes.set("courier", [attr("price", "0", "rub")]);
    expect(
      (await discover()).serviceOptions.find(
        (option) => option.offerId === "courier",
      )?.deliveryTariff,
    ).toEqual({ basis: "fixed", fixedAmount: "0.00" });
    expect((await service.execute(input)).amount).toBe("7000.00");
    catalog.offerAttributes.set("courier", [attr("price", null, "rub")]);
    expect((await service.execute(input)).amount).toBeNull();
    catalog.productAttributes.set(
      "courier",
      formula("rate_per_kg * total_weight_kg"),
    );
    catalog.storeAttributes.set("seller", [attr("rate_per_kg", "2.5", "rub")]);
    expect(
      (await discover()).serviceOptions.find(
        (option) => option.offerId === "courier",
      )?.deliveryTariff,
    ).toEqual({ basis: "calculated" });
    expect((await service.execute(input)).issues[0]?.message).toContain(
      "package",
    );
    catalog.offers.get("wardrobe")!.settings.packages = [
      { count: 2, weight_kg: "2.0" },
      { count: 1, weight_kg: "0.5" },
    ];
    expect((await service.execute({ ...input, quantity: 2 })).amount).toBe(
      "12022.50",
    );
  });
  it("filters geographically unavailable delivery choices using the verified address", async () => {
    const { service, catalog } = fixture();
    catalog.offers.get("courier")!.settings.regionIds = ["different-region"];
    const quote = await service.execute({
      ...input,
      destination: { address: "Test address", region: "different-region" },
      services: [],
    });
    expect(quote.serviceOptions.map((option) => option.offerId)).toEqual([
      "assembly",
    ]);
    expect(quote.amount).toBe("5000.00");
    expect((await service.execute(input)).amount).toBeNull();
  });
  it("keeps unrelated offers in a batch out of the selected product's services", async () => {
    const { service, catalog } = fixture();
    catalog.products.get("courier")!.title = { en: "Courier", ru: "Курьер" };
    catalog.links[1] = { ...catalog.links[1], sourceOfferId: "other-product" };
    const quote = await service.execute(input);
    expect(quote.serviceOptions).toEqual([
      expect.objectContaining({
        offerId: "courier",
        title: "Courier",
        titles: { en: "Courier", ru: "Курьер" },
      }),
    ]);
    expect(quote.issues).toContainEqual(
      expect.objectContaining({ offerId: "assembly" }),
    );
  });
  it("reports available service stock after concurrent holds", async () => {
    const { service, catalog, held, attr } = fixture();
    catalog.offerAttributes.get("assembly")!.push(attr("stock_quantity", "3"));
    held.assembly = 2;
    const quote = await service.execute(input);
    expect(
      quote.charges.find((charge) => charge.role === "add-on"),
    ).toMatchObject({ stockQuantity: 3, availableQuantity: 1 });
  });
  it("reports missing product formulas to the purchaser", async () => {
    const { service, catalog } = fixture();
    catalog.productAttributes.set("wardrobe", []);
    const quote = await service.execute(input);
    expect(quote.amount).toBeNull();
    expect(quote.issues[0].message).toContain("price_formula");
  });
  it("apportions the discounted subtotal to the serviced units before rounding the charge", async () => {
    const { service, catalog, attr, formula } = fixture();
    catalog.productAttributes.set(
      "wardrobe",
      formula("unit_price * quantity - discount"),
    );
    catalog.productAttributes.set(
      "assembly",
      formula("assembly_percent * serviced_subtotal / 100"),
    );
    catalog.storeAttributes.set("seller", [
      attr("discount", "0.01", "rub"),
      attr("assembly_percent", "10"),
    ]);
    const selected = {
      ...input,
      quantity: 2,
      services: [{ offerId: "assembly", quantity: 1 }],
    };
    const one = await service.execute(selected);
    expect(one.charges.map((charge) => charge.amount)).toEqual([
      "9999.99",
      "500.00",
    ]);
    expect(one.amount).toBe("10499.99");
    const both = await service.execute({
      ...selected,
      services: [{ offerId: "assembly", quantity: 2 }],
    });
    expect(both.charges[1].inputs.serviced_subtotal).toBe("9999.99");
    expect(both.amount).toBe("10999.99");
  });
});
