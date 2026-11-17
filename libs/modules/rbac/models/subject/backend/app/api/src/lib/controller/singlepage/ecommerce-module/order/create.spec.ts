/** Subject add-to-cart validates the exact retail offer before graph writes. */
const authorizationMock = jest.fn();
const verifyMock = jest.fn();
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_JWT_SECRET: "jwt-secret",
  RBAC_SECRET_KEY: "rbac-secret",
}));
jest.mock("@sps/backend-utils", () => ({
  authorization: (...args: unknown[]) => authorizationMock(...args),
  verifyJwt: (...args: unknown[]) => verifyMock(...args),
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));
import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";
import { Handler } from "./create";
import { Service as CreateCartOrder } from "../../../../service/singlepage/ecommerce/order/create";
import { Service as OfferQuotes } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/service";

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
    findById: jest.fn().mockResolvedValue({ id: "subject" }),
    billingModule: {
      currency: { find: jest.fn().mockResolvedValue([{ id: "currency-rub" }]) },
    },
    ecommerceModuleFindOpenCartOrderWithProduct: jest
      .fn()
      .mockResolvedValue(null),
    ecommerceModuleCartQuote: jest.fn(
      async ({ preparedQuotes }) => preparedQuotes,
    ),
    subjectsToEcommerceModuleOrders: { create: writes.owner },
    ecommerceModule: {
      ordersToBillingModulePaymentIntents: { lockOffers: jest.fn() },
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
      order: { create: writes.order },
      ordersToProducts: { create: writes.line },
      storesToOrders: { create: writes.store },
      ordersToBillingModuleCurrencies: { create: writes.currency },
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
  f.service.ecommerceModule.storesToProducts.offersForProduct.mockResolvedValue(
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
it("keeps an incomplete delivery selection as a cart draft", async () => {
  const f = fixture();
  f.quote.mockImplementation(
    async (input: any) =>
      ({
        ...input,
        currencyIds: ["currency-rub"],
        serviceOptions: [],
        charges: [],
        amount: null,
        issues: [{ code: "delivery_required", message: "Choose delivery" }],
        version: "terms-1",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }) as any,
  );
  await new Handler(f.service).execute(f.context(), undefined);
  expect(f.writes.order).toHaveBeenCalledTimes(1);
});
it.each(["insufficient_stock", "configuration", "currency_unavailable"])(
  "blocks %s before graph writes",
  async (code) => {
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
  },
);
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
          { offerId: serviceId, role: "delivery", recurrence: "first" },
        ],
      }) as any,
  );
  f.service.ecommerceModule.storesToProducts.findById.mockResolvedValue({
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
  f.service.ecommerceModule.storesToProducts.quotesUnderLock = jest
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
  f.service.ecommerceModule.storesToProducts.quote = quotes.quote.bind(quotes);
  f.service.ecommerceModule.storesToProducts.quotesUnderLock =
    quotes.quotesUnderLock.bind(quotes);
  f.service.ecommerceModule.ordersToBillingModulePaymentIntents.lockOffers.mockImplementation(
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
