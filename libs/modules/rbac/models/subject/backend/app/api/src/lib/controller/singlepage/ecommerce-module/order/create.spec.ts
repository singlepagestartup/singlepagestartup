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
