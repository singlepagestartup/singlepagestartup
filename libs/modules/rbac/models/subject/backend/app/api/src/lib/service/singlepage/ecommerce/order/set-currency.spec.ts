import { Service } from "./set-currency";
const transaction = jest.fn(async (operation: (tx: unknown) => Promise<void>) =>
  operation({}),
);
jest.mock("@sps/shared-backend-database-config", () => ({
  getDrizzle: () => ({ transaction }),
}));
jest.mock("@sps/shared-backend-api", () => ({
  withConsistencyDatabase: (_tx: unknown, operation: () => Promise<void>) =>
    operation(),
}));
jest.mock("@sps/shared-utils", () => ({
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG: "free-subscription",
}));
function fixture() {
  const currencies = {
    find: jest
      .fn()
      .mockResolvedValue([
        { id: "link", billingModuleCurrencyId: "old-stars" },
      ]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const service = {
    ecommerceModuleOrderAssertAccess: jest.fn().mockResolvedValue(undefined),
    ecommerceModuleResolveOrderCurrency: jest.fn().mockResolvedValue("usd"),
    ecommerceModule: {
      order: {
        lockForLifecycle: jest.fn(),
        findById: jest.fn().mockResolvedValue({ type: "cart", status: "new" }),
      },
      ordersToProducts: {
        find: jest.fn().mockResolvedValue([{ productId: "product" }]),
      },
      product: { findById: jest.fn().mockResolvedValue({ slug: "pro" }) },
      ordersToBillingModuleCurrencies: currencies,
    },
  };
  return { service, currencies, operation: new Service({ service } as any) };
}
const props = { subjectId: "owner", orderId: "order", currencyId: "usd" };
beforeEach(() => jest.clearAllMocks());
it("replaces the legacy currency only after validating the active owned cart", async () => {
  const { service, currencies, operation } = fixture();
  await operation.execute(props);
  expect(transaction).toHaveBeenCalledTimes(1);
  expect(service.ecommerceModuleOrderAssertAccess).toHaveBeenCalledWith({
    subjectId: "owner",
    orderId: "order",
  });
  expect(service.ecommerceModule.order.lockForLifecycle).toHaveBeenCalledWith({
    id: "order",
  });
  expect(service.ecommerceModuleResolveOrderCurrency).toHaveBeenCalledWith({
    productId: "product",
    billingModuleCurrencyId: "usd",
  });
  expect(currencies.update).toHaveBeenCalledWith({
    id: "link",
    data: { billingModuleCurrencyId: "usd" },
  });
  expect(
    service.ecommerceModuleResolveOrderCurrency.mock.invocationCallOrder[0],
  ).toBeLessThan(currencies.update.mock.invocationCallOrder[0]);
});
it("does not read or change a foreign order", async () => {
  const { service, currencies, operation } = fixture();
  service.ecommerceModuleOrderAssertAccess.mockRejectedValue(
    new Error("Permission error"),
  );
  await expect(operation.execute(props)).rejects.toThrow("Permission error");
  expect(service.ecommerceModule.order.findById).not.toHaveBeenCalled();
  expect(currencies.update).not.toHaveBeenCalled();
});
it.each(["paying", "paid", "completed"])(
  "refuses an order in %s state",
  async (status) => {
    const { service, currencies, operation } = fixture();
    service.ecommerceModule.order.findById.mockResolvedValue({
      type: "cart",
      status,
    });
    await expect(operation.execute(props)).rejects.toThrow(
      "Only an active cart",
    );
    expect(currencies.update).not.toHaveBeenCalled();
  },
);
it("validates every product before any currency write", async () => {
  const { service, currencies, operation } = fixture();
  service.ecommerceModule.ordersToProducts.find.mockResolvedValue([
    { productId: "first" },
    { productId: "second" },
  ]);
  service.ecommerceModuleResolveOrderCurrency
    .mockResolvedValueOnce("usd")
    .mockRejectedValueOnce(new Error("No price in USD"));
  await expect(operation.execute(props)).rejects.toThrow("No price in USD");
  expect(currencies.create).not.toHaveBeenCalled();
  expect(currencies.update).not.toHaveBeenCalled();
  expect(currencies.delete).not.toHaveBeenCalled();
});
it("creates a missing currency association", async () => {
  const { currencies, operation } = fixture();
  currencies.find.mockResolvedValue([]);
  await operation.execute(props);
  expect(currencies.create).toHaveBeenCalledWith({
    data: { orderId: "order", billingModuleCurrencyId: "usd" },
  });
});
it("normalizes duplicate legacy associations in the same transaction", async () => {
  const { currencies, operation } = fixture();
  currencies.find.mockResolvedValue([
    { id: "a", billingModuleCurrencyId: "usd" },
    { id: "b", billingModuleCurrencyId: "rub" },
  ]);
  await operation.execute(props);
  expect(currencies.update).not.toHaveBeenCalled();
  expect(currencies.delete).toHaveBeenCalledWith({ id: "b" });
});
it("retains the Initial Free restriction", async () => {
  const { service, currencies, operation } = fixture();
  service.ecommerceModule.product.findById.mockResolvedValue({
    slug: "free-subscription",
  });
  await expect(operation.execute(props)).rejects.toThrow(
    "cannot be changed through a cart",
  );
  expect(currencies.update).not.toHaveBeenCalled();
});
