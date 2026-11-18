import { Service } from "./index";
import { Service as Facade } from "../index";
import type { Repository } from "../../../repository";
import type {
  IOfferAttribute,
  IOfferCatalog,
  Service as Catalog,
} from "../catalog";
const reservedQuantities = jest.fn(async () => ({}));
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
function fixture(digits = 2, fulfillmentAlreadySatisfied = false) {
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
    fulfillmentAlreadySatisfied,
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
  it("excludes registration grants from retail quotes while keeping ordinary digital offers", async () => {
    const { catalog, service } = fixture();
    const digital = catalog.products.get("wardrobe")!;
    digital.kind = "digital";
    const offer = catalog.offers.get("wardrobe")!;
    offer.settings = { standalone: false };
    expect((await service.execute(input)).amount).not.toBeNull();
    offer.settings = { ...offer.settings, initialGrant: true };
    await expect(service.execute(input)).rejects.toThrow(
      "Retail offer is unavailable",
    );
  });

  it("rejects two independently valid fulfillment services in a direct request", async () => {
    const { service, catalog, addOption } = fixture();
    addOption("pickup", "delivery", "pickup", { rub: "0" }, "unit_price");
    const destination = { address: "Test address" };
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
    expect(quote.amount).toBe("1005.00");
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
    expect(quote.currencyIds).toEqual(["rub"]);
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
    expect(quote.amount).toBeNull();
    expect(quote.issues).toContainEqual(
      expect.objectContaining({ code: "delivery_required" }),
    );
    const selected = await service.execute(input);
    expect(selected.amount).toBeNull();
    expect(selected.serviceOptions).toContainEqual(
      expect.objectContaining({ offerId: "courier" }),
    );
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
      "1000.00",
    ]);
    expect(one.amount).toBe("11499.99");
    const both = await service.execute({
      ...selected,
      services: [{ offerId: "assembly", quantity: 2 }],
    });
    expect(both.charges[1].inputs.serviced_subtotal).toBe("9999.99");
    expect(both.amount).toBe("11999.99");
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
      expect(quote.amount).toBeNull();
      expect(quote.selectedServices).toEqual([
        { offerId: "courier", quantity: 1 },
      ]);
      expect(quote.issues).toContainEqual(
        expect.objectContaining({ code: "address_required" }),
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
      expect(quote.amount).toBeNull();
      expect(quote.issues).toContainEqual(
        expect.objectContaining({ code: "address_required" }),
      );
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
    expect((await discover()).amount).toBeNull();
    expect((await discover()).issues).toContainEqual(
      expect.objectContaining({ code: "delivery_required" }),
    );
  });
  it("shares contractors across sibling sellers and keeps existing exact choices", async () => {
    const { service, catalog, attr } = fixture();
    catalog.offers.set("other-seller", {
      ...catalog.offers.get("wardrobe")!,
      id: "other-seller",
      storeId: "other-store",
    });
    catalog.offerAttributes.set("other-seller", [attr("price", "4500", "rub")]);
    catalog.offers.get("courier")!.storeId = "delivery-contractor";
    catalog.offers.get("assembly")!.storeId = "assembly-contractor";
    const original = await service.execute(input);
    const switched = await service.execute({
      ...input,
      offerId: "other-seller",
    });
    expect(switched.serviceOptions).toEqual(original.serviceOptions);
    expect(switched.selectedServices).toEqual(input.services);
    expect(switched.amount).toBe("7500.00");
    expect(
      switched.charges.slice(1).map((charge) => charge.providerStoreId),
    ).toEqual(["delivery-contractor", "assembly-contractor"]);
    catalog.offers.get("wardrobe")!.variant = "hidden";
    const archivedSource = await service.execute({
      ...input,
      offerId: "other-seller",
    });
    expect(archivedSource.serviceOptions).toEqual(original.serviceOptions);
    expect(archivedSource.amount).toBe("7500.00");
  });

  it("deduplicates equivalent contractor aliases while retaining their exact persisted IDs", async () => {
    const { service, catalog } = fixture();
    catalog.offers.set("courier-alias", {
      ...catalog.offers.get("courier")!,
      id: "courier-alias",
    });
    catalog.offerAttributes.set(
      "courier-alias",
      catalog.offerAttributes.get("courier")!,
    );
    catalog.links.push({ ...catalog.links[0], targetOfferId: "courier-alias" });
    catalog.links.push({ ...catalog.links[0] });
    const quote = await service.execute({
      ...input,
      services: [{ offerId: "courier-alias", quantity: 1, lineId: "saved" }],
    });
    expect(
      quote.serviceOptions.filter((option) => option.role === "delivery"),
    ).toEqual([
      expect.objectContaining({
        compatibleOfferIds: ["courier", "courier-alias"],
      }),
    ]);
    expect(quote.selectedServices).toEqual([
      { offerId: "courier-alias", quantity: 1, lineId: "saved" },
    ]);
    expect(quote.charges[1]).toMatchObject({
      offerId: "courier-alias",
      lineId: "saved",
    });
    expect(quote.amount).toBe("6000.00");
    const duplicated = await service.execute({
      ...input,
      services: [
        { offerId: "courier", quantity: 1 },
        { offerId: "courier-alias", quantity: 1 },
      ],
    });
    expect(duplicated.amount).toBeNull();
  });

  it("retains distinct contractor SKUs and tariffs for the same service product", async () => {
    const { service, catalog, attr } = fixture();
    catalog.offers.set("courier-other-tariff", {
      ...catalog.offers.get("courier")!,
      id: "courier-other-tariff",
    });
    catalog.offerAttributes.set("courier-other-tariff", [
      attr("price", "700", "rub"),
    ]);
    catalog.links.push({
      ...catalog.links[0],
      targetOfferId: "courier-other-tariff",
    });
    const quote = await service.execute({ ...input, services: [] });
    expect(
      quote.serviceOptions.filter((option) => option.role === "delivery"),
    ).toHaveLength(2);
    expect(quote.selectedServices).toEqual([
      { offerId: "courier-other-tariff", quantity: 1 },
    ]);
    expect(quote.amount).toBe("5700.00");
  });

  it("chooses the cheapest real fulfillment in each currency and keeps an explicit paid choice", async () => {
    const { service, addOption } = fixture();
    addOption("electronic", "delivery", "electronic", {
      rub: "20",
      usd: "0.25",
    });
    addOption("premium", "delivery", "electronic", { rub: "50", usd: "0.60" });
    const roubles = await service.execute({
      ...input,
      services: [],
      destination: undefined,
    });
    expect(roubles.selectedServices).toEqual([
      { offerId: "electronic", quantity: 1 },
    ]);
    expect(roubles.amount).toBe("5020.00");
    const dollars = await service.execute({
      ...input,
      currencyId: "usd",
      services: [],
    });
    expect(dollars.selectedServices).toEqual([
      { offerId: "electronic", quantity: 1 },
    ]);
    expect(dollars.amount).toBe("60.25");
    const explicit = await service.execute({
      ...input,
      services: [{ offerId: "premium", quantity: 1 }],
    });
    expect(explicit.selectedServices).toEqual([
      { offerId: "premium", quantity: 1 },
    ]);
    expect(explicit.amount).toBe("5050.00");
    const confirmed = await service.execute({
      ...input,
      destination: undefined,
      services: roubles.selectedServices,
    });
    expect(confirmed.version).toBe(roubles.version);
  });

  it("selects a sole paid method and keeps its required address visible", async () => {
    const { service } = fixture();
    const quote = await service.execute({
      ...input,
      services: [],
      destination: undefined,
    });
    expect(quote.selectedServices).toEqual([
      { offerId: "courier", quantity: 1 },
    ]);
    expect(quote.amount).toBeNull();
    expect(quote.issues).toEqual([
      expect.objectContaining({ code: "address_required", offerId: "courier" }),
    ]);
    const completed = await service.execute({
      ...input,
      services: quote.selectedServices,
    });
    expect(completed.amount).toBe("6000.00");
  });

  it("compares exact route charges rather than starting prices after an address is available", async () => {
    const { service, catalog, attr, formula, addOption } = fixture();
    catalog.productAttributes.set(
      "courier",
      formula("dispatch_fee + rate_per_km * distance_km"),
    );
    catalog.storeAttributes.set("seller", [
      attr("dispatch_fee", "100", "rub"),
      attr("rate_per_km", "100", "rub"),
    ]);
    catalog.offers.get("courier")!.settings.origin = {
      latitude: 59,
      longitude: 30,
    };
    addOption("fixed-electronic", "delivery", "electronic", { rub: "500" });
    const withoutAddress = await service.execute({
      ...input,
      destination: undefined,
      services: [],
    });
    expect(withoutAddress.selectedServices).toEqual([
      { offerId: "courier", quantity: 1 },
    ]);
    expect(withoutAddress.amount).toBeNull();
    const withAddress = await service.execute({ ...input, services: [] });
    expect(withAddress.selectedServices).toEqual([
      { offerId: "fixed-electronic", quantity: 1 },
    ]);
    expect(withAddress.amount).toBe("5500.00");
    catalog.offers.get("courier")!.settings.origin = undefined;
    const unknown = await service.execute({
      ...input,
      destination: undefined,
      services: [],
    });
    expect(unknown.selectedServices).toEqual([
      { offerId: "fixed-electronic", quantity: 1 },
    ]);
  });

  it.each(["stock", "currency", "provider"])(
    "blocks configured fulfillment when every method is unavailable by %s",
    async (cause) => {
      const { service, catalog, attr } = fixture();
      if (cause === "stock") {
        catalog.offerAttributes
          .get("courier")!
          .push(attr("stock_quantity", "0"));
      } else if (cause === "currency") {
        catalog.offerAttributes.set("courier", [attr("price", "10", "usd")]);
      } else {
        catalog.providers.push({
          ...catalog.links[0],
          sourceOfferId: "courier",
          targetOfferId: "missing",
          variant: "fulfilled-by",
        });
      }
      const quote = await service.execute({ ...input, services: [] });
      expect(quote.selectedServices).toEqual([]);
      expect(quote.amount).toBeNull();
      expect(quote.issues).toContainEqual(
        expect.objectContaining({ code: "delivery_required" }),
      );
      expect(quote.currencyIds).not.toContain("rub");
    },
  );

  it("uses implicit normal fulfillment only when the product has no delivery links", async () => {
    const { service, catalog } = fixture();
    catalog.links = catalog.links.filter((link) => link.variant !== "delivery");
    catalog.offers.get("wardrobe")!.settings.requiredDelivery = true;
    const quote = await service.execute({
      ...input,
      services: [],
      destination: undefined,
    });
    expect(quote.selectedServices).toEqual([]);
    expect(quote.issues).toEqual([]);
    expect(quote.amount).toBe("5000.00");
  });
  it("omits first-only fulfillment on an internally verified later subscription period", async () => {
    const { service, catalog } = fixture(2, true);
    catalog.links[0].recurrence = "first";
    const quote = await service.execute({
      ...input,
      services: [],
      destination: undefined,
    });
    expect(quote.selectedServices).toEqual([]);
    expect(quote.charges.map((charge) => charge.role)).toEqual(["product"]);
    expect(quote.fulfillmentAlreadySatisfied).toBe(true);
    expect(quote.amount).toBe("5000.00");
    expect(quote.issues).toEqual([]);
    const confirmed = await service.execute({
      ...input,
      services: quote.selectedServices,
      destination: undefined,
    });
    expect(confirmed.version).toBe(quote.version);
  });

  it("does not accept a public input flag as proof of completed fulfillment", async () => {
    const { service } = fixture();
    const quote = await service.execute({
      ...input,
      services: [],
      fulfillmentAlreadySatisfied: true,
    } as IOfferQuoteInput);
    expect(quote.selectedServices).toEqual([
      { offerId: "courier", quantity: 1 },
    ]);
    expect(quote.amount).toBe("6000.00");
    expect(quote.fulfillmentAlreadySatisfied).toBe(false);
  });
  it("revalidates an authoritative default under lock with identical confirmed terms", async () => {
    const { catalog, routing } = fixture();
    const facade = new Facade(
      {} as Repository,
      { catalog: async () => catalog } as Catalog,
      { reservedQuantities },
    );
    Object.defineProperty(facade, "resolveDeliveryRouting", {
      value: () => routing,
    });
    const selection = {
      ...input,
      lineId: "main-line",
      destination: undefined,
      services: [],
    };
    const preview = await facade.quote(selection);
    const [locked] = await facade.quotesUnderLock(
      [{ ...selection, services: preview.selectedServices }],
      [preview],
      { allowIncompleteDelivery: true },
    );
    expect(locked.version).toBe(preview.version);
    expect(locked.selectedServices).toEqual([
      { offerId: "courier", quantity: 1 },
    ]);
    catalog.offerAttributes
      .get("courier")!
      .push(fixture().attr("stock_quantity", "0"));
    await expect(
      facade.quotesUnderLock(
        [{ ...selection, services: preview.selectedServices }],
        [preview],
        { allowIncompleteDelivery: true },
      ),
    ).rejects.toThrow("Offer conditions changed");
  });

  it("keeps verified renewal context per line across batch, currency and locked quotes", async () => {
    const { catalog, routing } = fixture();
    catalog.links[0].recurrence = "first";
    const facade = new Facade(
      {} as Repository,
      { catalog: async () => catalog } as Catalog,
      { reservedQuantities },
    );
    Object.defineProperty(facade, "resolveDeliveryRouting", {
      value: () => routing,
    });
    const selections = ["renewal", "ordinary"].map((lineId) => ({
      ...input,
      lineId,
      services: [],
    }));
    const options = { fulfilledLineIds: ["renewal"] };
    const previews = await facade.quoteMany(selections, options);
    expect(previews.map((quote) => quote.amount)).toEqual([
      "5000.00",
      "6000.00",
    ]);
    expect(previews.map((quote) => quote.fulfillmentAlreadySatisfied)).toEqual([
      true,
      false,
    ]);
    const locked = await facade.quotesUnderLock(
      selections.map((selection, index) => ({
        ...selection,
        services: previews[index].selectedServices,
      })),
      previews,
      options,
    );
    expect(locked.map((quote) => quote.version)).toEqual(
      previews.map((quote) => quote.version),
    );
    expect(locked.map((quote) => quote.fulfillmentAlreadySatisfied)).toEqual([
      true,
      false,
    ]);
    const currencies = await facade.quoteCurrencies(selections[0], options);
    expect(currencies.map(({ quote }) => quote.selectedServices)).toEqual([
      [],
      [],
    ]);
    expect(currencies.map(({ quote }) => quote.amount)).toEqual([
      "5000.00",
      "60.00",
    ]);
    await expect(facade.quotesUnderLock(selections, previews)).rejects.toThrow(
      "Offer conditions changed",
    );
  });
  it("blocks conflicting product-wide roles or recurrence for the same service offer", async () => {
    const { service, catalog } = fixture();
    catalog.links.push({ ...catalog.links[0], recurrence: "first" });
    const quote = await service.execute(input);
    expect(
      quote.serviceOptions.some((option) => option.offerId === "courier"),
    ).toBe(false);
    expect(quote.amount).toBeNull();
    expect(quote.issues).toContainEqual(
      expect.objectContaining({
        offerId: "courier",
        message: "Service configuration is ambiguous for this product",
      }),
    );
  });
  it("revalidates retained alias stock after switching seller away from an archived source", async () => {
    const { catalog, routing, attr } = fixture();
    catalog.offers.set("other-seller", {
      ...catalog.offers.get("wardrobe")!,
      id: "other-seller",
      storeId: "other-store",
    });
    catalog.offerAttributes.set("other-seller", [attr("price", "4500", "rub")]);
    catalog.offers.get("wardrobe")!.variant = "hidden";
    catalog.offers.set("courier-alias", {
      ...catalog.offers.get("courier")!,
      id: "courier-alias",
    });
    catalog.offerAttributes.set("courier-alias", [
      attr("price", "1000", "rub"),
      attr("stock_quantity", "1"),
    ]);
    catalog.links.push({ ...catalog.links[0], targetOfferId: "courier-alias" });
    const facade = new Facade(
      {} as Repository,
      { catalog: async () => catalog } as Catalog,
      { reservedQuantities },
    );
    Object.defineProperty(facade, "resolveDeliveryRouting", {
      value: () => routing,
    });
    const selection = {
      ...input,
      offerId: "other-seller",
      lineId: "main-line",
      services: [
        { offerId: "courier-alias", quantity: 1, lineId: "saved-child" },
      ],
    };
    const preview = await facade.quote(selection);
    expect(preview.amount).toBe("5500.00");
    expect(
      preview.serviceOptions.find((option) => option.offerId === "courier")
        ?.compatibleOfferIds,
    ).toContain("courier-alias");
    expect(preview.charges[1]).toMatchObject({
      offerId: "courier-alias",
      lineId: "saved-child",
      availableQuantity: 1,
    });
    const checked = await facade.quoteUnderLock(
      { ...selection, services: preview.selectedServices },
      preview,
    );
    expect(checked.version).toBe(preview.version);
    expect(checked.charges[1].offerId).toBe("courier-alias");
    expect(reservedQuantities).toHaveBeenLastCalledWith(
      expect.objectContaining({
        offerIds: expect.arrayContaining([
          "wardrobe",
          "other-seller",
          "courier",
          "courier-alias",
        ]),
      }),
    );
    (reservedQuantities as jest.Mock).mockResolvedValueOnce({
      "courier-alias": 1,
    });
    await expect(
      facade.quoteUnderLock(
        { ...selection, services: preview.selectedServices },
        preview,
      ),
    ).rejects.toThrow("Offer conditions changed");
  });
  it("ignores legacy pickup point IDs without changing shipping quote terms", async () => {
    const { service } = fixture();
    const current = await service.execute(input);
    const legacy = await service.execute({
      ...input,
      destination: { ...input.destination, pickupPointId: "retired-point" },
    } as IOfferQuoteInput);
    expect(legacy.destination).toEqual(current.destination);
    expect(legacy.destination).not.toHaveProperty("pickupPointId");
    expect(legacy.version).toBe(current.version);
    expect(legacy.amount).toBe(current.amount);
  });

  it("quotes paid pickup at the selected retail store without buyer address or routing", async () => {
    const { service, catalog, addOption, attr, routing } = fixture();
    addOption("pickup", "delivery", "pickup", { rub: "400" }, "unit_price");
    catalog.offers.set("other-seller", {
      ...catalog.offers.get("wardrobe")!,
      id: "other-seller",
      storeId: "collection-store",
    });
    catalog.offerAttributes.set("other-seller", [attr("price", "4500", "rub")]);
    catalog.offers.get("pickup")!.storeId = "pickup-fee-seller";
    catalog.offers.get("pickup")!.settings.regionIds = ["different-region"];
    Object.assign(catalog.offers.get("pickup")!.settings, {
      pickupPointIds: ["retired-point"],
    });
    catalog.offers.get("other-seller")!.settings.regionIds = [
      "different-region",
    ];
    catalog.offers.set("pickup-provider", {
      ...catalog.offers.get("pickup")!,
      id: "pickup-provider",
      storeId: "fee-provider",
      variant: "provider",
    });
    catalog.providers.push({
      ...catalog.links[0],
      sourceOfferId: "pickup",
      targetOfferId: "pickup-provider",
      variant: "fulfilled-by",
    });
    const legacyDestination = {
      address: "Stale buyer address",
      region: "elsewhere",
      pickupPointId: "retired-point",
      coordinates: { latitude: 60, longitude: 30 },
    };
    const quote = await service.execute({
      ...input,
      offerId: "other-seller",
      destination: legacyDestination,
      services: [{ offerId: "pickup", quantity: 1 }],
    });
    expect(quote.storeId).toBe("collection-store");
    expect(quote.destination).toEqual({});
    expect(quote.issues).toEqual([]);
    expect(quote.amount).toBe("4900.00");
    expect(quote.charges[1]).toMatchObject({
      storeId: "pickup-fee-seller",
      providerStoreId: "fee-provider",
      amount: "400.00",
    });
    expect(
      quote.serviceOptions.find((option) => option.offerId === "pickup"),
    ).not.toHaveProperty("pickupPointIds");
    expect(
      quote.serviceOptions.find((option) => option.offerId === "pickup")
        ?.regionIds,
    ).toBeUndefined();
    expect(routing.geocode).not.toHaveBeenCalled();
    expect(routing.distance).not.toHaveBeenCalled();
    const normalized = await service.execute({
      ...input,
      offerId: "other-seller",
      destination: {},
      services: [{ offerId: "pickup", quantity: 1 }],
    });
    expect(normalized.version).toBe(quote.version);
    expect(legacyDestination.address).toBe("Stale buyer address");
  });

  it("selects and charges a sole paid pickup method without an extra destination choice", async () => {
    const { service, catalog, addOption, routing } = fixture();
    catalog.links = catalog.links.filter((link) => link.variant !== "delivery");
    addOption("pickup", "delivery", "pickup", { rub: "400" }, "unit_price");
    const quote = await service.execute({
      ...input,
      destination: undefined,
      services: [],
    });
    expect(quote.selectedServices).toEqual([
      { offerId: "pickup", quantity: 1 },
    ]);
    expect(quote.destination).toEqual({});
    expect(quote.amount).toBe("5400.00");
    expect(quote.issues).toEqual([]);
    expect(routing.geocode).not.toHaveBeenCalled();
    expect(routing.distance).not.toHaveBeenCalled();
  });

  it("rejects a pickup tariff that depends on buyer road distance without inventing a fee", async () => {
    const { service, catalog, addOption, routing } = fixture();
    addOption(
      "pickup",
      "delivery",
      "pickup",
      { rub: "400" },
      "unit_price + distance_km",
    );
    catalog.offers.get("pickup")!.settings.origin = {
      latitude: 59,
      longitude: 30,
    };
    const quote = await service.execute({
      ...input,
      services: [{ offerId: "pickup", quantity: 1 }],
    });
    expect(quote.destination).toEqual({});
    expect(quote.amount).toBeNull();
    expect(quote.charges.some((charge) => charge.offerId === "pickup")).toBe(
      false,
    );
    expect(
      quote.serviceOptions.find((option) => option.offerId === "pickup")
        ?.pricePreview,
    ).toBeUndefined();
    expect(quote.issues).toContainEqual(
      expect.objectContaining({
        code: "unavailable",
        message: "Pickup tariff cannot use buyer delivery distance",
      }),
    );
    expect(routing.geocode).not.toHaveBeenCalled();
    expect(routing.distance).not.toHaveBeenCalled();
  });
  it.each([
    undefined,
    {
      address: "Stale address",
      region: "old-region",
      coordinates: { latitude: 60, longitude: 30 },
    },
  ])(
    "keeps automatic pickup identical to its explicit locked quote with main region restrictions: %o",
    async (destination) => {
      const { catalog, routing, addOption } = fixture();
      addOption("pickup", "delivery", "pickup", { rub: "400" }, "unit_price");
      catalog.offers.get("wardrobe")!.settings.regionIds = ["different-region"];
      const facade = new Facade(
        {} as Repository,
        { catalog: async () => catalog } as Catalog,
        { reservedQuantities },
      );
      Object.defineProperty(facade, "resolveDeliveryRouting", {
        value: () => routing,
      });
      const selection = { ...input, destination, services: [] };
      const automatic = await facade.quote(selection);
      const explicitInput = {
        ...selection,
        services: [{ offerId: "pickup", quantity: 1 }],
      };
      const explicit = await facade.quote(explicitInput);
      expect(automatic.destination).toEqual({});
      expect(automatic.amount).toBe("5400.00");
      expect(automatic.issues).toEqual([]);
      expect(automatic.version).toBe(explicit.version);
      const locked = await facade.quoteUnderLock(explicitInput, automatic);
      expect(locked.version).toBe(automatic.version);
      expect(locked.amount).toBe("5400.00");
    },
  );

  it("fails closed on an unpriceable main distance formula when automatic pickup wins", async () => {
    const { service, catalog, formula, addOption } = fixture();
    addOption("pickup", "delivery", "pickup", { rub: "400" }, "unit_price");
    catalog.productAttributes.set(
      "wardrobe",
      formula("unit_price + distance_km"),
    );
    const selection = { ...input, destination: undefined, services: [] };
    const automatic = await service.execute(selection);
    const explicit = await service.execute({
      ...selection,
      services: [{ offerId: "pickup", quantity: 1 }],
    });
    expect(automatic.destination).toEqual({});
    expect(automatic.amount).toBeNull();
    expect(automatic.issues).toEqual(explicit.issues);
    expect(automatic.version).toBe(explicit.version);
    expect(automatic.issues).toContainEqual(
      expect.objectContaining({
        offerId: "wardrobe",
        message: "Pickup tariff cannot use buyer delivery distance",
      }),
    );
  });
  it("preserves the previously accepted nonpickup consent hash", async () => {
    const { service } = fixture();
    const quote = await service.execute(input);
    expect(quote.version).toBe(
      "9ce0bbfbdc4c8600f3b46a8fc0154ecfca6badce8ff065fa147efa7e68a94533",
    );
  });
});
