import { Service } from "./order-summary";

const orderLine = {
  id: "line",
  orderId: "order",
  productId: "product",
  offerId: "chosen",
  parentLineId: null,
  quantity: 2,
};

function setup() {
  const currency = { id: "rub", symbol: "₽", minorUnitDigits: 2 };
  const findByIdTotal = jest.fn().mockResolvedValue({
    availableCurrencyIds: ["rub"],
    totals: [{ total: 1590, billingModuleCurrency: currency }],
    unpriced: [],
  });
  const assertAccess = jest.fn().mockResolvedValue(undefined);
  const ecommerce = {
    order: {
      findById: jest.fn().mockResolvedValue({ id: "order", type: "cart" }),
      findByIdTotal,
      work: {
        findByOrder: jest.fn().mockResolvedValue(undefined),
        resultPriceForOrder: jest.fn().mockResolvedValue(undefined),
      },
    },
    ordersToProducts: { find: jest.fn().mockResolvedValue([orderLine]) },
    product: {
      findById: jest.fn().mockResolvedValue({
        id: "product",
        slug: "cover",
        title: { ru: "Обложка" },
        shortDescription: {},
        type: "one_off",
        variant: "default",
        metadata: { internal: "must not be projected" },
      }),
    },
    ordersToBillingModulePaymentIntents: {
      find: jest.fn().mockResolvedValue([]),
    },
    ordersToBillingModuleCurrencies: {
      find: jest.fn().mockResolvedValue([{ billingModuleCurrencyId: "rub" }]),
    },
  };
  const service = new Service({
    modules: { ecommerce },
    ecommerceModuleOrderAssertAccess: assertAccess,
  } as unknown as ConstructorParameters<typeof Service>[0]);
  return { service, ecommerce, assertAccess, findByIdTotal };
}

const scope = {
  subjectId: "customer",
  orderId: "order",
  productId: "product",
  offerId: "chosen",
};

it("projects the purchased line, published product fields and total in the selected currency", async () => {
  const { service, assertAccess } = setup();

  await expect(service.find(scope)).resolves.toEqual({
    product: {
      id: "product",
      slug: "cover",
      title: { ru: "Обложка" },
      shortDescription: {},
      type: "one_off",
    },
    quantity: 2,
    offerId: "chosen",
    total: { amount: 1590, symbol: "₽", precision: 2 },
  });
  expect(assertAccess).toHaveBeenCalledWith({
    subjectId: "customer",
    orderId: "order",
  });
});

it("adds fractional prices exactly for a multi-line order", async () => {
  const { service, findByIdTotal } = setup();
  const currency = { id: "rub", symbol: "₽", minorUnitDigits: 2 };
  findByIdTotal.mockResolvedValue({
    availableCurrencyIds: ["rub"],
    totals: [0.1, 0.2].map((total) => ({
      total,
      billingModuleCurrency: currency,
    })),
    unpriced: [],
  });
  expect((await service.total("order", "cart"))?.amount).toBe(0.3);
});

it("preserves the product and quantity on an older order without repricing history", async () => {
  const { service, ecommerce, findByIdTotal } = setup();
  ecommerce.order.findById.mockResolvedValue({ id: "order", type: "history" });
  ecommerce.ordersToProducts.find.mockResolvedValue([
    { ...orderLine, offerId: null },
  ]);

  const summary = await service.find(scope);

  expect(summary?.product.slug).toBe("cover");
  expect(summary?.quantity).toBe(2);
  expect(summary?.offerId).toBeUndefined();
  expect(summary?.total).toBeUndefined();
  expect(findByIdTotal).not.toHaveBeenCalled();
});

it("uses the order's saved purchase price when history has a snapshot", async () => {
  const { service, ecommerce, findByIdTotal } = setup();
  ecommerce.order.findById.mockResolvedValue({ id: "order", type: "history" });
  ecommerce.ordersToBillingModulePaymentIntents.find.mockResolvedValue([
    { orderId: "order", purchaseSnapshot: { version: 1 } },
  ]);

  expect((await service.find(scope))?.total?.amount).toBe(1590);
  expect(findByIdTotal).toHaveBeenCalledWith({ id: "order" });
});

it.each(["cart", "history"])(
  "omits the nominal total of token-funded work in %s",
  async (type) => {
    const { service, ecommerce, findByIdTotal } = setup();
    ecommerce.order.work.findByOrder.mockResolvedValue({
      paymentMode: "work-tokens",
    });
    await expect(service.total("order", type)).resolves.toBeUndefined();
    expect(findByIdTotal).not.toHaveBeenCalled();
  },
);

it("omits a different offer and reads no order data for an unrelated subject", async () => {
  const { service, ecommerce, assertAccess } = setup();

  await expect(
    service.find({ ...scope, offerId: "other" }),
  ).resolves.toBeUndefined();
  expect(ecommerce.product.findById).not.toHaveBeenCalled();

  ecommerce.order.findById.mockClear();
  assertAccess.mockRejectedValueOnce(
    new Error("Permission error. Foreign order"),
  );
  await expect(service.find(scope)).resolves.toBeUndefined();
  expect(ecommerce.order.findById).not.toHaveBeenCalled();
});
