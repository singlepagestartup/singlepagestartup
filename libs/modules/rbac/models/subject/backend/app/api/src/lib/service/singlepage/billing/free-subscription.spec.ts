const checkout = jest.fn();
const checkOrder = jest.fn();
jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "secret",
  ALLOWED_BILLING_SERVICE_PROVIDERS: "dummy",
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    ecommerceModuleProductCheckout: (...args: unknown[]) => checkout(...args),
  },
}));
jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: { check: (...args: unknown[]) => checkOrder(...args) },
}));
import { Service } from "./free-subscription";

function fixture() {
  const dependencies: any = {
    subjectsToEcommerceModuleOrders: { find: jest.fn().mockResolvedValue([]) },
    ecommerceModule: {
      order: {
        findById: jest.fn(),
        find: jest.fn(),
        findByIdCheckoutAttributes: jest.fn(),
      },
      product: {
        find: jest
          .fn()
          .mockResolvedValue([
            { id: "free", slug: "free-subscription", type: "subscription" },
          ]),
      },
      attributeKey: {
        find: jest.fn().mockResolvedValue([{ id: "price-key", type: "price" }]),
      },
      attributeKeysToAttributes: {
        find: jest
          .fn()
          .mockResolvedValue([
            { attributeKeyId: "price-key", attributeId: "zero" },
          ]),
      },
      productsToAttributes: {
        find: jest
          .fn()
          .mockResolvedValue([{ productId: "free", attributeId: "zero" }]),
      },
      ordersToProducts: { find: jest.fn().mockResolvedValue([]) },
      attribute: {
        find: jest.fn().mockResolvedValue([{ id: "zero", number: "0" }]),
      },
      attributesToBillingModuleCurrencies: {
        find: jest
          .fn()
          .mockResolvedValue([
            { attributeId: "zero", billingModuleCurrencyId: "currency" },
          ]),
      },
    },
    billingModule: {
      currency: { findById: jest.fn().mockResolvedValue({ id: "currency" }) },
    },
  };
  return { dependencies, service: new Service(dependencies) };
}
beforeEach(() => {
  jest.clearAllMocks();
  checkout.mockResolvedValue({ billingModule: { invoices: [] } });
});

it("starts the configured zero-price subscription without a Telegram account or payment details", async () => {
  const { service } = fixture();
  await service.execute({ id: "user" });
  expect(checkout).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "user",
      productId: "free",
      data: {
        provider: "dummy",
        email: undefined,
        billingModule: { currency: { id: "currency" } },
      },
    }),
  );
});

it("does not duplicate an active subscription or replace a paid subscription", async () => {
  const { service, dependencies } = fixture();
  dependencies.subjectsToEcommerceModuleOrders.find.mockResolvedValue([
    { ecommerceModuleOrderId: "active" },
  ]);
  dependencies.ecommerceModule.order.findById.mockResolvedValue({
    id: "active",
    status: "delivering",
  });
  dependencies.ecommerceModule.order.findByIdCheckoutAttributes.mockResolvedValue(
    { type: "subscription", amount: 99 },
  );
  await service.activate({ id: "user" }, jest.fn());
  expect(checkout).not.toHaveBeenCalled();
});

it("fails configuration without checking out a paid product when the free price is missing", async () => {
  const { service, dependencies } = fixture();
  dependencies.ecommerceModule.attribute.find.mockResolvedValue([
    { id: "zero", number: "99" },
  ]);
  await expect(service.execute({ id: "user" })).rejects.toThrow(
    "Configuration error",
  );
  expect(checkout).not.toHaveBeenCalled();
});

it("waits for local invoice settlement and delivery before authentication completes", async () => {
  const { service, dependencies } = fixture();
  dependencies.subjectsToEcommerceModuleOrders.find
    .mockResolvedValueOnce([])
    .mockResolvedValue([{ ecommerceModuleOrderId: "new-order" }]);
  dependencies.ecommerceModule.order.find
    .mockResolvedValueOnce([{ id: "new-order", status: "paying" }])
    .mockResolvedValueOnce([{ id: "new-order", status: "delivering" }]);
  const proceed = jest.fn().mockResolvedValue(undefined);
  await service.activate({ id: "user" }, proceed);
  expect(checkOrder).toHaveBeenCalledWith(
    expect.objectContaining({ id: "new-order", data: {} }),
  );
  expect(proceed).toHaveBeenCalledWith({ subjectId: "user" });
});
