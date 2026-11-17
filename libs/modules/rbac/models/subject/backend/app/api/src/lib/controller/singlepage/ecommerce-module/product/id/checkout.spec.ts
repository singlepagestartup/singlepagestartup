/** Buy now uses the same exact-offer cart operation as Add to cart. */
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-secret",
}));
jest.mock("@sps/backend-utils", () => ({
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
      currency: { find: jest.fn().mockResolvedValue([{ id: "rub" }]) },
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
  ).rejects.toThrow("Complete the offer selection in the cart");
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
