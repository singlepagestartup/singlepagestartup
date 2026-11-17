import { Service } from "./index";
import type { IOfferAttribute, IOfferCatalog } from "../../../repository";
import type {
  IOfferQuoteInput,
  IOfferServiceOption,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";

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
function fixture(digits = 2) {
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
    precision: () => digits,
    routing: () => routing,
    now: new Date("2026-11-17T00:00:00Z"),
  });
  function addOption(
    id: string,
    role: IOfferServiceOption["role"],
    receiptMethod: IOfferServiceOption["receiptMethod"],
    prices: Record<string, string>,
    expression = "unit_price * serviced_qty",
  ) {
    catalog.products.set(id, { ...catalog.products.get("assembly")!, id });
    catalog.offers.set(id, {
      ...catalog.offers.get("assembly")!,
      id,
      productId: id,
      settings: { receiptMethod },
    });
    catalog.links.push({
      ...catalog.links[1],
      sourceOfferId: "wardrobe",
      targetOfferId: id,
      variant: role,
    });
    catalog.offerAttributes.set(
      id,
      Object.entries(prices).map(([currency, value]) =>
        attr("price", value, currency),
      ),
    );
    catalog.productAttributes.set(id, formula(expression));
  }
  return { service, catalog, held, routing, attr, formula, addOption };
}
describe("per-offer quote", () => {
  it("rejects two independently valid fulfillment services in a direct request", async () => {
    const { service, catalog, addOption } = fixture();
    addOption("pickup", "delivery", "pickup", { rub: "0" }, "unit_price");
    catalog.offers.get("pickup")!.settings.pickupPointIds = ["point"];
    const destination = { address: "Test address", pickupPointId: "point" };
    const one = await service.execute({
      ...input,
      destination,
      services: [{ offerId: "pickup", quantity: 1 }],
    });
    expect(one.issues).toEqual([]);
    expect(one.amount).toBe("5000.00");
    const two = await service.execute({
      ...input,
      destination,
      services: [
        { offerId: "courier", quantity: 1 },
        { offerId: "pickup", quantity: 1 },
      ],
    });
    expect(two.amount).toBeNull();
    expect(two.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unavailable",
          offerId: "pickup",
          message: "Choose one delivery method",
        }),
      ]),
    );
  });
  it("quotes a one-item amount separately from the merchandise and service totals", async () => {
    const { service } = fixture();
    const quote = await service.execute({ ...input, quantity: 2 });
    expect(quote.charges[0]).toMatchObject({
      quantity: 2,
      amount: "10000.00",
      unitAmount: "5000.00",
    });
    expect(quote.charges[1].unitAmount).toBeUndefined();
    expect(quote.amount).toBe("13000.00");
  });

  it("calculates quantity-one formula and package inputs rather than dividing a nonlinear total", async () => {
    const { service, catalog, attr, formula } = fixture();
    catalog.productAttributes.set(
      "wardrobe",
      formula("unit_price * quantity + rate_per_kg * total_weight_kg"),
    );
    catalog.storeAttributes.set("seller", [attr("rate_per_kg", "2.5", "rub")]);
    catalog.offers.get("wardrobe")!.settings.packages = [
      { count: 2, weight_kg: "2" },
    ];
    let quote = await service.execute({ ...input, quantity: 2, services: [] });
    expect(quote.charges[0]).toMatchObject({
      amount: "10020.00",
      unitAmount: "5010.00",
    });
    catalog.productAttributes.set(
      "wardrobe",
      formula("unit_price * quantity - discount"),
    );
    catalog.storeAttributes.set("seller", [attr("discount", "10", "rub")]);
    quote = await service.execute({ ...input, quantity: 2, services: [] });
    expect(quote.charges[0]).toMatchObject({
      amount: "9990.00",
      unitAmount: "4990.00",
    });
  });

  it("retains zero and eight-decimal unit amounts as exact currency strings", async () => {
    const { service, catalog, attr } = fixture(8);
    catalog.offerAttributes.set("wardrobe", [
      attr("price", "0.00000001", "rub"),
    ]);
    let quote = await service.execute({ ...input, quantity: 3, services: [] });
    expect(quote.charges[0]).toMatchObject({
      amount: "0.00000003",
      unitAmount: "0.00000001",
    });
    catalog.offerAttributes.set("wardrobe", [attr("price", "0", "rub")]);
    quote = await service.execute({ ...input, quantity: 3, services: [] });
    expect(quote.charges[0]).toMatchObject({
      amount: "0.00000000",
      unitAmount: "0.00000000",
    });
  });

  it("quotes the selected currency and rounds the one-item formula at its precision", async () => {
    const { service, catalog, attr } = fixture();
    const dollars = await service.execute({
      ...input,
      quantity: 2,
      currencyId: "usd",
      services: [],
    });
    expect(dollars.charges[0]).toMatchObject({
      amount: "120.00",
      unitAmount: "60.00",
    });
    catalog.offerAttributes.set("wardrobe", [attr("price", "1.005", "rub")]);
    const roubles = await service.execute({
      ...input,
      quantity: 2,
      services: [],
    });
    expect(roubles.charges[0]).toMatchObject({
      amount: "2.01",
      unitAmount: "1.01",
    });
  });

  it("marks an unpriceable one-item configuration without failing a valid larger purchase", async () => {
    const { service, catalog, attr, formula } = fixture();
    catalog.offerAttributes.set("wardrobe", [attr("price", "10", "rub")]);
    catalog.productAttributes.set(
      "wardrobe",
      formula("unit_price * quantity - discount"),
    );
    catalog.storeAttributes.set("seller", [attr("discount", "15", "rub")]);
    const quote = await service.execute({
      ...input,
      quantity: 2,
      services: [],
    });
    expect(quote.charges[0]).toMatchObject({
      amount: "5.00",
      unitAmount: null,
    });
    expect(quote.amount).toBe("5.00");
  });

  it("keeps derived unit-price display metadata out of purchase consent versions", async () => {
    const { service } = fixture();
    const before = await service.execute({ ...input, services: [] });
    Object.defineProperty(service, "unitAmount", { value: () => "1.23" });
    const after = await service.execute({ ...input, services: [] });
    expect(after.charges[0].unitAmount).toBe("1.23");
    expect(after.version).toBe(before.version);
  });
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

  it.each([
    { currencyId: "rub", delivery: "20.00", addOn: "50.00", pickup: "400.00" },
    { currencyId: "usd", delivery: "0.25", addOn: "0.60", pickup: "5.00" },
  ])(
    "previews the demo electronic, add-on and pickup tariffs in $currencyId without network discovery",
    async (test) => {
      const { service, addOption, routing } = fixture();
      addOption("electronic", "delivery", "electronic", {
        rub: "20",
        usd: "0.25",
      });
      addOption("setup", "add-on", undefined, { rub: "50", usd: "0.60" });
      addOption(
        "pickup",
        "delivery",
        "pickup",
        { rub: "400", usd: "5" },
        "unit_price",
      );
      const quote = await service.execute({
        ...input,
        currencyId: test.currencyId,
        quantity: 1,
        services: [],
        destination: undefined,
      });
      const option = (id: string) =>
        quote.serviceOptions.find((entry) => entry.offerId === id)!;
      expect(option("electronic").pricePreview).toEqual({
        kind: "fixed",
        amount: test.delivery,
      });
      expect(option("setup").pricePreview).toEqual({
        kind: "from",
        amount: test.addOn,
      });
      expect(option("pickup").pricePreview).toEqual({
        kind: "fixed",
        amount: test.pickup,
      });
      expect(routing.geocode).not.toHaveBeenCalled();
      expect(routing.distance).not.toHaveBeenCalled();
    },
  );

  it.each([
    { currencyId: "rub", dispatch: "400", rate: "25", minimum: "400.00" },
    { currencyId: "usd", dispatch: "5", rate: "0.30", minimum: "5.00" },
  ])(
    "proves the distance-tariff minimum in $currencyId without requesting an unknown route",
    async (test) => {
      const { service, catalog, attr, formula, routing } = fixture();
      catalog.productAttributes.set(
        "courier",
        formula("dispatch_fee + rate_per_km * distance_km"),
      );
      catalog.storeAttributes.set("seller", [
        attr("dispatch_fee", test.dispatch, test.currencyId),
        attr("rate_per_km", test.rate, test.currencyId),
      ]);
      catalog.offers.get("courier")!.settings.origin = {
        latitude: 59,
        longitude: 30,
      };
      const quote = await service.execute({
        ...input,
        currencyId: test.currencyId,
        services: [],
        destination: undefined,
      });
      expect(
        quote.serviceOptions.find((option) => option.offerId === "courier"),
      ).toMatchObject({
        pricePreview: { kind: "from", amount: test.minimum },
        deliveryTariff: { basis: "distance" },
      });
      expect(quote.amount).toBe(
        test.currencyId === "rub" ? "5000.00" : "60.00",
      );
      expect(routing.geocode).not.toHaveBeenCalled();
      expect(routing.distance).not.toHaveBeenCalled();
    },
  );

  it.each([
    { currencyId: "rub", amount: "500.00" },
    { currencyId: "usd", amount: "6.00" },
  ])(
    "uses apportioned merchandise value for a percentage preview in $currencyId",
    async (test) => {
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
        attr("discount", "0.01", test.currencyId),
        attr("assembly_percent", "10"),
      ]);
      const quote = await service.execute({
        ...input,
        currencyId: test.currencyId,
        quantity: 2,
        services: [{ offerId: "assembly", quantity: 1 }],
        destination: undefined,
      });
      expect(
        quote.serviceOptions.find((option) => option.offerId === "assembly")
          ?.pricePreview,
      ).toEqual({ kind: "from", amount: test.amount });
      expect(
        quote.charges.find((charge) => charge.offerId === "assembly")?.amount,
      ).toBe(test.amount);
    },
  );

  it("previews known package and quantity inputs while retaining their variable tariff label", async () => {
    const { service, catalog, attr, formula } = fixture();
    catalog.productAttributes.set(
      "courier",
      formula("dispatch_fee + rate_per_kg * total_weight_kg"),
    );
    catalog.storeAttributes.set("seller", [
      attr("dispatch_fee", "400", "rub"),
      attr("rate_per_kg", "2.5", "rub"),
    ]);
    catalog.offers.get("wardrobe")!.settings.packages = [
      { count: 2, weight_kg: "2.0" },
      { count: 1, weight_kg: "0.5" },
    ];
    const quote = await service.execute({
      ...input,
      quantity: 2,
      services: [],
      destination: undefined,
    });
    expect(
      quote.serviceOptions.find((option) => option.offerId === "courier"),
    ).toMatchObject({
      pricePreview: { kind: "from", amount: "422.50" },
      deliveryTariff: { basis: "calculated" },
    });
    catalog.productAttributes.set("courier", formula("unit_price * quantity"));
    const byQuantity = await service.execute({
      ...input,
      quantity: 2,
      services: [],
      destination: undefined,
    });
    expect(
      byQuantity.serviceOptions.find((option) => option.offerId === "courier")
        ?.pricePreview,
    ).toEqual({ kind: "from", amount: "2000.00" });
  });

  it("uses the lowest attainable price for bounded decreasing add-ons and respects service stock", async () => {
    const { service, catalog, attr, formula, held } = fixture();
    catalog.productAttributes.set(
      "assembly",
      formula("unit_price * (3 - serviced_qty)"),
    );
    catalog.offerAttributes.get("assembly")!.push(attr("stock_quantity", "3"));
    const discover = () =>
      service.execute({
        ...input,
        quantity: 2,
        services: [],
        destination: undefined,
      });
    expect(
      (await discover()).serviceOptions.find(
        (option) => option.offerId === "assembly",
      )?.pricePreview,
    ).toEqual({ kind: "from", amount: "2000.00" });
    held.assembly = 2;
    expect(
      (await discover()).serviceOptions.find(
        (option) => option.offerId === "assembly",
      )?.pricePreview,
    ).toEqual({ kind: "from", amount: "4000.00" });
  });

  it.each([
    "1000 - distance_km * unit_price",
    "100 / (distance_km + 1)",
    "1 / 0",
    "total_weight_kg * unit_price",
  ])(
    "omits unproved or unavailable optional price inputs for %s",
    async (expression) => {
      const { service, catalog, formula, routing } = fixture();
      catalog.productAttributes.set("courier", formula(expression));
      catalog.offers.get("courier")!.settings.origin = {
        latitude: 59,
        longitude: 30,
      };
      const quote = await service.execute({
        ...input,
        services: [],
        destination: undefined,
      });
      expect(
        quote.serviceOptions.find((option) => option.offerId === "courier")
          ?.pricePreview,
      ).toBeUndefined();
      expect(quote.amount).toBe("5000.00");
      expect(quote.issues).toEqual([]);
      expect(routing.distance).not.toHaveBeenCalled();
    },
  );

  it("does not publish a route price with missing or invalid origin configuration", async () => {
    const { service, catalog, formula, routing } = fixture();
    catalog.productAttributes.set(
      "courier",
      formula("unit_price + distance_km"),
    );
    const discover = () =>
      service.execute({ ...input, services: [], destination: undefined });
    expect(
      (await discover()).serviceOptions.find(
        (option) => option.offerId === "courier",
      )?.pricePreview,
    ).toBeUndefined();
    catalog.offers.get("courier")!.settings.origin = {
      latitude: 100,
      longitude: 30,
    };
    expect(
      (await discover()).serviceOptions.find(
        (option) => option.offerId === "courier",
      )?.pricePreview,
    ).toBeUndefined();
    catalog.offers.get("courier")!.settings.origin = {
      latitude: 59,
      longitude: 30,
    };
    Object.assign(catalog.offers.get("courier")!.settings, {
      routeProfile: "unknown",
    });
    expect(
      (await discover()).serviceOptions.find(
        (option) => option.offerId === "courier",
      )?.pricePreview,
    ).toBeUndefined();
    expect(routing.distance).not.toHaveBeenCalled();
  });

  it("preserves explicit free delivery previews without treating malformed optional formulas as free", async () => {
    const { service, catalog, attr, formula } = fixture();
    catalog.offerAttributes.set("courier", [attr("price", "0", "rub")]);
    const discover = () =>
      service.execute({ ...input, services: [], destination: undefined });
    expect(
      (await discover()).serviceOptions.find(
        (option) => option.offerId === "courier",
      ),
    ).toMatchObject({
      pricePreview: { kind: "fixed", amount: "0.00" },
      deliveryTariff: { basis: "fixed", fixedAmount: "0.00" },
    });
    catalog.productAttributes.set(
      "courier",
      formula("unit_price + missing_coefficient"),
    );
    expect(
      (await discover()).serviceOptions.find(
        (option) => option.offerId === "courier",
      ),
    ).toBeUndefined();
    expect((await discover()).amount).toBe("5000.00");
  });
});
