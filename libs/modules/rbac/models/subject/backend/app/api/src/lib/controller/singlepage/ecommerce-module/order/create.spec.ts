/** Subject add-to-cart validates the exact retail offer before graph writes. */
const authorizationMock = jest.fn();
const verifyMock = jest.fn();
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_JWT_SECRET: "jwt-secret",
  RBAC_SECRET_KEY: "rbac-secret",
}));
jest.mock("@sps/backend-utils", () => ({
  ...jest.requireActual("@sps/backend-utils"),
  authorization: (...args: unknown[]) => authorizationMock(...args),
  verifyJwt: (...args: unknown[]) => verifyMock(...args),
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));
import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";
import { ecommerceCartSelectionSchema } from "@sps/rbac/models/subject/sdk/model";
import { Handler } from "./create";
import { Service as CreateCartOrder } from "../../../../service/singlepage/ecommerce/order/create";
import { Service as OfferQuotes } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/service";
import { Service as CalculateQuote } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/service/singlepage/quote";

function fixture() {
  const writes = {
    order: jest.fn().mockResolvedValue({ id: "order-new" }),
    owner: jest.fn(),
    line: jest.fn().mockResolvedValue({ id: "primary" }),
    store: jest.fn().mockResolvedValue({ id: "store-link" }),
    currency: jest.fn().mockResolvedValue({ id: "currency-link" }),
  };
  const offer = {
    id: "offer-a",
    productId: "product",
    storeId: "store-a",
    variant: "default",
    configurationKey: "oak-120",
  };
  const quote = jest.fn(async (input: any) => ({
    ...input,
    productId: "product",
    storeId: "store-a",
    amount: "5000",
    availableQuantity: null,
    currencyIds: ["currency-rub"],
    serviceOptions: [],
    charges: [],
    issues: [],
    version: "terms-1",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  }));
  const service: any = {
    ecommerceModuleProductInitialGrantIncludes: jest
      .fn()
      .mockResolvedValue(false),
    findById: jest.fn().mockResolvedValue({ id: "subject" }),
    ecommerceModuleFindOpenCartOrderWithProduct: jest
      .fn()
      .mockResolvedValue(null),
    ecommerceModuleCartQuote: jest.fn(
      async ({ preparedQuotes }) => preparedQuotes,
    ),
    module: {
      subjectsToEcommerceModuleOrders: { create: writes.owner },
    },
    modules: {
      ecommerce: {
        product: {
          findById: jest
            .fn()
            .mockResolvedValue({ id: "product", slug: "wardrobe" }),
        },
        storesToProducts: {
          offersForProduct: jest.fn().mockResolvedValue([offer]),
          quote,
          findById: jest.fn(),
          quotesUnderLock: async (_inputs: any[], previews: any[]) => previews,
        },
        ordersToProducts: { create: writes.line },
        storesToOrders: { create: writes.store },
        ordersToBillingModuleCurrencies: { create: writes.currency },
        order: {
          create: writes.order,
          ordersToBillingModulePaymentIntents: { lockOffers: jest.fn() },
        },
      },
      billing: {
        currency: {
          find: jest.fn().mockResolvedValue([{ id: "currency-rub" }]),
        },
      },
    },
  };
  service.ecommerceModuleOrderCreate = (props: any) =>
    new CreateCartOrder({
      repository: { withSubjectLock: async (_scope, operation) => operation() },
      service,
    }).execute(props);
  const context = (data: any = {}) =>
    ({
      req: {
        param: () => "subject",
        parseBody: async () => ({
          data: JSON.stringify({ productId: "product", quantity: 1, ...data }),
        }),
      },
      json: (value: any) => value,
    }) as any;
  const noWrites = () => {
    for (const write of Object.values(writes))
      expect(write).not.toHaveBeenCalled();
  };
  return { service, writes, offer, quote, context, noWrites };
}
beforeEach(() => {
  jest.clearAllMocks();
  authorizationMock.mockReturnValue("token");
  verifyMock.mockResolvedValue({ subject: { id: "subject" } });
});

it("stores the exact offer and its owning store instead of an unrelated default store", async () => {
  const f = fixture();
  await new Handler(f.service).execute(
    f.context({
      offerId: "offer-a",
      billingModule: { currency: { id: "currency-rub" } },
    }),
    undefined,
  );
  expect(f.writes.line).toHaveBeenCalledWith({
    data: expect.objectContaining({
      productId: "product",
      offerId: "offer-a",
      quantity: 1,
    }),
  });
  expect(f.writes.store).toHaveBeenCalledWith({
    data: { storeId: "store-a", orderId: "order-new" },
  });
});
it("rejects an ambiguous legacy add until the buyer chooses an offer", async () => {
  const f = fixture();
  f.service.modules.ecommerce.storesToProducts.offersForProduct.mockResolvedValue(
    [f.offer, { ...f.offer, id: "offer-b" }],
  );
  await expect(
    new Handler(f.service).execute(f.context(), undefined),
  ).rejects.toThrow("Choose one available store offer");
  f.noWrites();
});
it("rejects an offer outside the requested product/store retail choices", async () => {
  const f = fixture();
  await expect(
    new Handler(f.service).execute(
      f.context({ offerId: "foreign-offer" }),
      undefined,
    ),
  ).rejects.toThrow("Choose one available store offer");
  f.noWrites();
});
it.each([
  ["shipping", "first", undefined],
  ["pickup", "each", undefined],
  [
    "pickup",
    "each",
    {
      address: "Previous shipping address",
      region: "Previous region",
      coordinates: { latitude: 60, longitude: 30 },
      pickupPointId: "old-depot",
    },
  ],
] as const)(
  "stores the server-default %s method with recurrence %s and destination %j",
  async (receiptMethod, recurrence, destination) => {
    const f = fixture();
    const serviceId = "7341680e-08e1-4984-bc97-c8072d3d968a";
    const attribute = (key: string, value: string, currencyId?: string) => ({
      id: key,
      key,
      type: key === "price" ? "price" : "feature",
      field: key === "price" ? "number" : "string",
      number: key === "price" ? value : null,
      text: key === "price" ? undefined : value,
      currencyIds: currencyId ? [currencyId] : [],
    });
    const formula = [
      attribute("price_formula", "unit_price * quantity"),
      attribute("formula_version", "1"),
    ];
    const calculate = new CalculateQuote({
      catalog: {
        products: new Map([
          [
            "product",
            { id: "product", title: { en: "Wardrobe" }, kind: "physical" },
          ],
          [
            "delivery-product",
            {
              id: "delivery-product",
              title: { en: "Delivery" },
              kind: "service",
            },
          ],
        ]),
        offers: new Map([
          [f.offer.id, { ...f.offer, settings: {} }],
          [
            serviceId,
            {
              id: serviceId,
              productId: "delivery-product",
              storeId: "contractor",
              variant: "default",
              settings: { receiptMethod },
            },
          ],
        ]),
        links: [
          {
            sourceOfferId: f.offer.id,
            targetOfferId: serviceId,
            variant: "delivery",
            recurrence,
          },
        ],
        providers: [],
        currencies: [{ id: "currency-rub", slug: "rub" }],
        offerAttributes: new Map([
          [f.offer.id, [attribute("price", "5000", "currency-rub")]],
          [serviceId, [attribute("price", "1000", "currency-rub")]],
        ]),
        productAttributes: new Map([
          ["product", formula],
          ["delivery-product", formula],
        ]),
        storeAttributes: new Map(),
      } as any,
      held: {},
      precision: () => 2,
      routing: () => ({
        geocode: jest.fn(),
        distance: jest.fn(),
      }),
      now: new Date(),
    });
    const quotes: OfferQuotes = Object.create(OfferQuotes.prototype);
    Object.defineProperty(quotes, "calculateMany", {
      value: async (inputs: any[]) =>
        Promise.all(inputs.map((input) => calculate.execute(input))),
    });
    f.service.modules.ecommerce.storesToProducts.quotesUnderLock =
      quotes.quotesUnderLock.bind(quotes);
    f.quote.mockImplementation((input) => quotes.quote(input));
    await new Handler(f.service).execute(f.context({ destination }), undefined);
    const prepared =
      await f.quote.mock.results[f.quote.mock.results.length - 1].value;
    if (receiptMethod === "shipping") {
      expect(prepared.amount).toBeNull();
      expect(prepared.issues).toContainEqual(
        expect.objectContaining({
          offerId: serviceId,
          code: "address_required",
        }),
      );
      expect(
        prepared.charges.some((charge) => charge.offerId === serviceId),
      ).toBe(false);
    } else {
      expect(prepared.amount).toBe("6000.00");
      expect(prepared.issues).toEqual([]);
      expect(prepared.destination).toEqual({});
      expect(
        prepared.charges.some((charge) => charge.offerId === serviceId),
      ).toBe(true);
      expect(f.writes.line).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({ destination: {} }),
      });
      expect(f.quote).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: destination
            ? expect.not.objectContaining({ pickupPointId: expect.anything() })
            : undefined,
        }),
      );
    }
    expect(prepared.selectedServices).toEqual([
      { offerId: serviceId, quantity: 1 },
    ]);
    expect(f.writes.order).toHaveBeenCalledTimes(1);
    expect(f.writes.line).toHaveBeenCalledTimes(2);
    expect(f.writes.line).toHaveBeenNthCalledWith(2, {
      data: {
        orderId: "order-new",
        productId: "delivery-product",
        offerId: serviceId,
        parentLineId: "primary",
        quantity: 1,
        recurrence,
        selectionUpdatedAt: expect.any(Date),
      },
    });
  },
);

it("keeps a compatible contractor alias and its schedule in an incomplete draft", async () => {
  const f = fixture();
  const selected = "7341680e-08e1-4984-bc97-c8072d3d968a";
  const originalQuote = f.quote.getMockImplementation()!;
  f.quote.mockImplementation(
    async (input: any) =>
      ({
        ...(await originalQuote(input)),
        selectedServices: [{ offerId: selected, quantity: 1 }],
        serviceOptions: [
          {
            offerId: "canonical-option",
            compatibleOfferIds: [selected],
            productId: "delivery-product",
            role: "delivery",
            receiptMethod: "shipping",
            recurrence: "each",
            currencyIds: ["currency-rub"],
          },
        ],
        charges: [],
        amount: null,
        issues: [
          {
            offerId: selected,
            code: "address_required",
            message: "Enter address",
          },
        ],
      }) as any,
  );
  await new Handler(f.service).execute(f.context(), undefined);
  expect(f.writes.line).toHaveBeenNthCalledWith(2, {
    data: {
      orderId: "order-new",
      productId: "delivery-product",
      offerId: selected,
      parentLineId: "primary",
      quantity: 1,
      recurrence: "each",
      selectionUpdatedAt: expect.any(Date),
    },
  });
});

it("rejects an unquoted service even when another method needs an address", async () => {
  const f = fixture();
  const selected = "7341680e-08e1-4984-bc97-c8072d3d968a";
  f.quote.mockImplementation(
    async (input: any) =>
      ({
        ...input,
        productId: "product",
        currencyIds: ["currency-rub"],
        selectedServices: [{ offerId: selected, quantity: 1 }],
        serviceOptions: [
          {
            offerId: selected,
            productId: "delivery-product",
            role: "delivery",
            receiptMethod: "shipping",
            recurrence: "first",
            currencyIds: ["currency-rub"],
          },
        ],
        charges: [],
        amount: null,
        issues: [
          {
            offerId: "another-service",
            code: "address_required",
            message: "Enter its address",
          },
        ],
        version: "terms-1",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }) as any,
  );
  await expect(
    new Handler(f.service).execute(f.context(), undefined),
  ).rejects.toThrow("Selected service has no quoted charge");
  f.noWrites();
});
it.each([
  "insufficient_stock",
  "configuration",
  "currency_unavailable",
  "delivery_required",
  "pickup_required",
])("blocks %s before graph writes", async (code) => {
  const f = fixture();
  f.service.ecommerceModuleCartQuote.mockResolvedValue([
    {
      currencyIds: ["currency-rub"],
      issues: [{ code, message: "Cannot purchase this selection" }],
    },
  ]);
  await expect(
    new Handler(f.service).execute(f.context(), undefined),
  ).rejects.toThrow("Cannot purchase this selection");
  f.noWrites();
});
it("rejects a duplicate of the same offer under the subject lock", async () => {
  const f = fixture();
  f.service.ecommerceModuleFindOpenCartOrderWithProduct.mockResolvedValue(
    "existing",
  );
  await expect(
    new Handler(f.service).execute(f.context(), undefined),
  ).rejects.toThrow("already in the cart");
  expect(
    f.service.ecommerceModuleFindOpenCartOrderWithProduct,
  ).toHaveBeenCalledWith({
    subjectId: "subject",
    productId: "product",
    offerId: "offer-a",
  });
  f.noWrites();
});
it("sends the requested currency through the offer quote", async () => {
  const f = fixture();
  await new Handler(f.service).execute(
    f.context({ billingModule: { currency: { id: "currency-rub" } } }),
    undefined,
  );
  expect(f.quote).toHaveBeenCalledWith(
    expect.objectContaining({
      offerId: "offer-a",
      quantity: 1,
      currencyId: "currency-rub",
    }),
  );
});
it.each([0, -1, 1.5, quantityBounds.max + 1])(
  "rejects quantity %s before writes",
  async (quantity) => {
    const f = fixture();
    await expect(
      new Handler(f.service).execute(f.context({ quantity }), undefined),
    ).rejects.toThrow("Quantity");
    f.noWrites();
  },
);
it("rejects another subject's access token before writes", async () => {
  const f = fixture();
  verifyMock.mockResolvedValue({ subject: { id: "other" } });
  await expect(
    new Handler(f.service).execute(f.context(), undefined),
  ).rejects.toThrow("Only order owner");
  f.noWrites();
});

it("stores exactly the quoted destination, quantity, currency and selected service graph once", async () => {
  const f = fixture();
  const serviceId = "7341680e-08e1-4984-bc97-c8072d3d968a";
  const quote = f.quote.getMockImplementation()!;
  f.quote.mockImplementation(
    async (selection) =>
      ({
        ...(await quote(selection)),
        serviceOptions: [{ offerId: serviceId }],
        charges: [
          {
            offerId: serviceId,
            productId: "delivery-product",
            role: "delivery",
            recurrence: "first",
          },
        ],
      }) as any,
  );
  f.service.modules.ecommerce.storesToProducts.findById.mockResolvedValue({
    id: serviceId,
    productId: "delivery-product",
  });
  const destination = {
    address: "City Street 10",
    region: "Area",
    coordinates: { latitude: 60, longitude: 30 },
  };
  const services = [{ offerId: serviceId, quantity: 1 }];
  await new Handler(f.service).execute(
    f.context({
      offerId: "offer-a",
      quantity: 2,
      billingModuleCurrencyId: "currency-rub",
      destination,
      services,
      expectedQuoteVersion: "terms-1",
      comment: "Call first",
    }),
    undefined,
  );
  expect(f.quote).toHaveBeenCalledWith({
    offerId: "offer-a",
    quantity: 2,
    currencyId: "currency-rub",
    destination,
    services,
  });
  expect(f.writes.order).toHaveBeenCalledTimes(1);
  expect(f.writes.order).toHaveBeenCalledWith({
    data: { comment: "Call first" },
  });
  expect(f.writes.line).toHaveBeenCalledTimes(2);
  expect(f.writes.line).toHaveBeenNthCalledWith(1, {
    data: expect.objectContaining({
      productId: "product",
      offerId: "offer-a",
      quantity: 2,
      destination,
      quoteVersion: "terms-1",
    }),
  });
  expect(f.writes.line).toHaveBeenNthCalledWith(2, {
    data: expect.objectContaining({
      productId: "delivery-product",
      offerId: serviceId,
      parentLineId: "primary",
      quantity: 1,
      recurrence: "first",
    }),
  });
  expect(f.writes.currency).toHaveBeenCalledWith({
    data: { orderId: "order-new", billingModuleCurrencyId: "currency-rub" },
  });
});

it("rejects stale page terms before any graph writes", async () => {
  const f = fixture();
  await expect(
    new Handler(f.service).execute(
      f.context({ expectedQuoteVersion: "old-terms" }),
      undefined,
    ),
  ).rejects.toThrow("Offer terms changed");
  f.noWrites();
});

it("rejects a malformed quote version instead of silently discarding it", async () => {
  const f = fixture();
  await expect(
    new Handler(f.service).execute(
      f.context({ expectedQuoteVersion: 123 }),
      undefined,
    ),
  ).rejects.toThrow("Invalid order purchase selection");
  expect(f.quote).not.toHaveBeenCalled();
  f.noWrites();
});

it("leaves the graph untouched when locked quote validation detects changed terms", async () => {
  const f = fixture();
  f.service.modules.ecommerce.storesToProducts.quotesUnderLock = jest
    .fn()
    .mockRejectedValue(new Error("Conflict error. Offer conditions changed"));
  await expect(
    new Handler(f.service).execute(
      f.context({ expectedQuoteVersion: "terms-1" }),
      undefined,
    ),
  ).rejects.toThrow("Offer conditions changed");
  f.noWrites();
});

it("checks page-accepted terms again through the real locked-quote comparison before graph writes", async () => {
  const f = fixture();
  let current = await f.quote({
    offerId: "offer-a",
    quantity: 1,
    currencyId: "currency-rub",
  });
  const quotes: OfferQuotes = Object.create(OfferQuotes.prototype);
  const calculate = jest.fn(async () => [current]);
  Object.defineProperty(quotes, "calculateMany", { value: calculate });
  f.service.modules.ecommerce.storesToProducts.quote =
    quotes.quote.bind(quotes);
  f.service.modules.ecommerce.storesToProducts.quotesUnderLock =
    quotes.quotesUnderLock.bind(quotes);
  f.service.modules.ecommerce.order.ordersToBillingModulePaymentIntents.lockOffers.mockImplementation(
    async () => {
      current = { ...current, version: "terms-2" };
    },
  );
  await expect(
    new Handler(f.service).execute(
      f.context({
        billingModuleCurrencyId: "currency-rub",
        expectedQuoteVersion: "terms-1",
      }),
      undefined,
    ),
  ).rejects.toThrow("Offer conditions changed");
  expect(calculate).toHaveBeenCalledTimes(2);
  f.noWrites();
});

it.each([undefined, {}])(
  "accepts pickup cart selection without destination details: %j",
  (destination) => {
    const parsed = ecommerceCartSelectionSchema.safeParse({
      action: "preview",
      lineId: "7341680e-08e1-4984-bc97-c8072d3d968a",
      selections: [
        {
          offerId: "50122f84-462d-45f6-bf3e-6e45eea0bd70",
          currencyId: "a5e746ea-fbc7-4763-8159-1a685e0fa467",
          quantity: 1,
          destination,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  },
);

it("accepts a legacy cart point field while retaining validated shipping fields and stripping the point", () => {
  const destination = {
    address: "City Street 10",
    region: "Area",
    coordinates: { latitude: 60, longitude: 30 },
  };
  const input = {
    action: "preview",
    lineId: "7341680e-08e1-4984-bc97-c8072d3d968a",
    selections: [
      {
        offerId: "50122f84-462d-45f6-bf3e-6e45eea0bd70",
        currencyId: "a5e746ea-fbc7-4763-8159-1a685e0fa467",
        quantity: 1,
        destination: { ...destination, pickupPointId: "old-depot" },
      },
    ],
  };
  const parsed = ecommerceCartSelectionSchema.parse(input);
  expect(parsed.selections[0].destination).toEqual(destination);
  expect(
    ecommerceCartSelectionSchema.safeParse({
      ...input,
      selections: [
        {
          ...input.selections[0],
          destination: {
            ...input.selections[0].destination,
            coordinates: { latitude: 91, longitude: 30 },
          },
        },
      ],
    }).success,
  ).toBe(false);
});

it("rejects database-configured registration Products through the Subject capability", async () => {
  const f = fixture();
  f.service.ecommerceModuleProductInitialGrantIncludes.mockResolvedValue(true);
  await expect(
    new Handler(f.service).execute(f.context(), undefined),
  ).rejects.toThrow("authentication bootstrap");
  expect(
    f.service.ecommerceModuleProductInitialGrantIncludes,
  ).toHaveBeenCalledWith({ productId: "product" });
  f.noWrites();
});
