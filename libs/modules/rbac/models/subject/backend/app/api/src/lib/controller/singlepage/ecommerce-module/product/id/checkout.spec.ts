/** Buy now uses the same exact-offer cart operation as Add to cart. */
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-secret",
}));
jest.mock("@sps/backend-utils", () => ({
  ...jest.requireActual("@sps/backend-utils"),
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));
import { Handler } from "./checkout";
import { Service as ProductCheckout } from "../../../../../service/singlepage/ecommerce/product/checkout";
function fixture() {
  const offer = { id: "offer-a", productId: "product", storeId: "store-a" };
  const service: any = {
    findById: jest.fn().mockResolvedValue({ id: "subject" }),
    subjectsToIdentities: {
      find: jest.fn().mockResolvedValue([{ identityId: "identity" }]),
    },
    billingModule: {
      paymentIntent: { isProviderAllowed: jest.fn().mockReturnValue(true) },
      currency: {
        find: jest.fn().mockResolvedValue([{ id: "rub" }]),
        findById: jest
          .fn()
          .mockResolvedValue({ id: "rub", slug: "rub", minorUnitDigits: 2 }),
      },
    },
    ecommerceModule: {
      product: {
        findById: jest
          .fn()
          .mockResolvedValue({ id: "product", slug: "course" }),
      },
      storesToProducts: {
        offersForProduct: jest.fn().mockResolvedValue([offer]),
        quote: jest.fn(async (input: any) => ({
          ...input,
          amount: "5000",
          currencyIds: ["rub"],
          issues: [],
          version: "terms-1",
        })),
      },
    },
    ecommerceModuleOrderCreate: jest
      .fn()
      .mockResolvedValue({ orderId: "created-order", lineId: "created-line" }),
    ecommerceOrderCheckout: jest
      .fn()
      .mockResolvedValue({ billingModule: { invoices: [] } }),
  };
  service.ecommerceProductCheckout = (props: any) =>
    new ProductCheckout(service).execute(props);
  const context = (data: any = {}) =>
    ({
      req: {
        param: (name: string) => (name === "id" ? "subject" : "product"),
        parseBody: async () => ({
          data: JSON.stringify({ provider: "dummy", ...data }),
        }),
      },
      json: (payload: any) => payload,
    }) as any;
  return { offer, service, context };
}
it("resolves one eligible Product-only offer and delegates an atomic graph with its currency", async () => {
  const f = fixture();
  await new Handler(f.service).execute(f.context(), undefined);
  expect(f.service.ecommerceModuleOrderCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      subjectId: "subject",
      productId: "product",
      offerId: "offer-a",
      storeId: "store-a",
      billingModuleCurrencyId: "rub",
      quantity: 1,
    }),
  );
  expect(f.service.ecommerceOrderCheckout).toHaveBeenCalledWith(
    expect.objectContaining({
      ecommerceModule: { orders: [{ id: "created-order" }] },
    }),
  );
});
it("rejects ambiguous Product-only checkout before creating an Order", async () => {
  const f = fixture();
  f.service.ecommerceModule.storesToProducts.offersForProduct.mockResolvedValue(
    [f.offer, { ...f.offer, id: "offer-b" }],
  );
  await expect(
    new Handler(f.service).execute(f.context(), undefined),
  ).rejects.toThrow("Choose one available store offer");
  expect(f.service.ecommerceModuleOrderCreate).not.toHaveBeenCalled();
});
it("honors an explicitly selected offer when several stores sell one Product", async () => {
  const f = fixture();
  f.service.ecommerceModule.storesToProducts.offersForProduct.mockResolvedValue(
    [f.offer, { ...f.offer, id: "offer-b", storeId: "store-b" }],
  );
  await new Handler(f.service).execute(
    f.context({ offerId: "offer-b", quantity: 2 }),
    undefined,
  );
  expect(f.service.ecommerceModuleOrderCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      offerId: "offer-b",
      storeId: "store-b",
      quantity: 2,
    }),
  );
});
it("sends incomplete delivery selection to the cart without creating an unusable checkout Order", async () => {
  const f = fixture();
  f.service.ecommerceModule.storesToProducts.quote.mockResolvedValue({
    amount: null,
    currencyIds: ["rub"],
    issues: [{ code: "delivery_required", message: "Choose delivery" }],
  });
  await expect(
    new Handler(f.service).execute(f.context(), undefined),
  ).rejects.toThrow("Complete the offer selection");
  expect(f.service.ecommerceModuleOrderCreate).not.toHaveBeenCalled();
});
it("requires an anonymous receipt email before creating the Order", async () => {
  const f = fixture();
  f.service.subjectsToIdentities.find.mockResolvedValue([]);
  await expect(
    new Handler(f.service).execute(f.context(), undefined),
  ).rejects.toThrow("Email is required");
  expect(f.service.ecommerceModuleOrderCreate).not.toHaveBeenCalled();
});
it("passes receipt email and provider to the owning checkout after offer creation", async () => {
  const f = fixture();
  await new Handler(f.service).execute(
    f.context({ provider: "stripe", email: "buyer@example.test" }),
    undefined,
  );
  expect(f.service.ecommerceOrderCheckout).toHaveBeenCalledWith(
    expect.objectContaining({
      provider: "stripe",
      email: "buyer@example.test",
    }),
  );
});
it("permits Telegram Star checkout without a receipt Identity", async () => {
  const f = fixture();
  f.service.subjectsToIdentities.find.mockResolvedValue([]);
  await new Handler(f.service).execute(
    f.context({ provider: "telegram-star" }),
    undefined,
  );
  expect(f.service.ecommerceOrderCheckout).toHaveBeenCalledTimes(1);
});

it("re-quotes and creates exactly the configured item and services, then checks out only its new order", async () => {
  const f = fixture();
  const configured = {
    offerId: "offer-a",
    storeId: "store-a",
    quantity: 2,
    billingModule: { currency: { id: "rub" } },
    destination: {
      address: "City Street 10",
      region: "Area",
      coordinates: { latitude: 60, longitude: 30 },
    },
    services: [
      { offerId: "7341680e-08e1-4984-bc97-c8072d3d968a", quantity: 1 },
    ],
    expectedQuoteVersion: "terms-1",
    comment: "Call before delivery",
    email: "buyer@example.test",
  };
  await new Handler(f.service).execute(f.context(configured), undefined);
  expect(f.service.ecommerceModule.storesToProducts.quote).toHaveBeenCalledWith(
    {
      offerId: configured.offerId,
      quantity: configured.quantity,
      currencyId: "rub",
      destination: configured.destination,
      services: configured.services,
    },
  );
  expect(f.service.ecommerceModuleOrderCreate).toHaveBeenCalledTimes(1);
  expect(f.service.ecommerceModuleOrderCreate).toHaveBeenCalledWith({
    subjectId: "subject",
    productId: "product",
    offerId: "offer-a",
    storeId: "store-a",
    quantity: 2,
    billingModuleCurrencyId: "rub",
    destination: configured.destination,
    services: configured.services,
    expectedQuoteVersion: "terms-1",
    comment: configured.comment,
  });
  expect(f.service.ecommerceOrderCheckout).toHaveBeenCalledTimes(1);
  expect(f.service.ecommerceOrderCheckout).toHaveBeenCalledWith(
    expect.objectContaining({
      ecommerceModule: { orders: [{ id: "created-order" }] },
      comment: configured.comment,
    }),
  );
});

it("rejects a stale product-page quote before creating or checking out any order", async () => {
  const f = fixture();
  await expect(
    new Handler(f.service).execute(
      f.context({ expectedQuoteVersion: "old-terms" }),
      undefined,
    ),
  ).rejects.toThrow("Offer terms changed");
  expect(f.service.ecommerceModuleOrderCreate).not.toHaveBeenCalled();
  expect(f.service.ecommerceOrderCheckout).not.toHaveBeenCalled();
});

it.each([
  { expectedQuoteVersion: 17 },
  {
    services: [
      { offerId: "7341680e-08e1-4984-bc97-c8072d3d968a", quantity: 0 },
    ],
  },
  {
    destination: {
      address: "Street",
      coordinates: { latitude: 200, longitude: 30 },
    },
  },
])(
  "rejects malformed configured purchases before quote or graph work",
  async (data) => {
    const f = fixture();
    await expect(
      new Handler(f.service).execute(f.context(data), undefined),
    ).rejects.toThrow("Invalid product purchase selection");
    expect(
      f.service.ecommerceModule.storesToProducts.quote,
    ).not.toHaveBeenCalled();
    expect(f.service.ecommerceModuleOrderCreate).not.toHaveBeenCalled();
  },
);

it("preserves the same-offer cart duplicate guard and never checks out the existing cart as a fallback", async () => {
  const f = fixture();
  f.service.ecommerceModuleOrderCreate.mockRejectedValue(
    new Error("Conflict error. Product is already in the cart"),
  );
  await expect(
    new Handler(f.service).execute(
      f.context({ expectedQuoteVersion: "terms-1" }),
      undefined,
    ),
  ).rejects.toThrow("Product is already in the cart");
  expect(f.service.ecommerceModuleOrderCreate).toHaveBeenCalledTimes(1);
  expect(f.service.ecommerceOrderCheckout).not.toHaveBeenCalled();
});

it("rejects a disabled provider before creating any cart graph and allows a corrected retry", async () => {
  const f = fixture();
  f.service.billingModule.paymentIntent.isProviderAllowed.mockReturnValueOnce(
    false,
  );
  await expect(
    new Handler(f.service).execute(
      f.context({ provider: "disabled" }),
      undefined,
    ),
  ).rejects.toThrow("payment provider is unavailable");
  expect(f.service.ecommerceModuleOrderCreate).not.toHaveBeenCalled();
  await new Handler(f.service).execute(
    f.context({ provider: "stripe" }),
    undefined,
  );
  expect(f.service.ecommerceModuleOrderCreate).toHaveBeenCalledTimes(1);
});

it("rejects incompatible provider/currency precision before creating any order", async () => {
  const f = fixture();
  f.service.billingModule.currency.findById.mockResolvedValue({
    id: "rub",
    slug: "custom",
    minorUnitDigits: 8,
  });
  await expect(
    new Handler(f.service).execute(
      f.context({ provider: "stripe" }),
      undefined,
    ),
  ).rejects.toThrow("two decimal places");
  expect(f.service.ecommerceModuleOrderCreate).not.toHaveBeenCalled();
  expect(f.service.ecommerceOrderCheckout).not.toHaveBeenCalled();
});
