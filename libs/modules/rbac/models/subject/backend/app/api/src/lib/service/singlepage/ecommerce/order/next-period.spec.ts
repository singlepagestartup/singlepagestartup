import { Service } from "./repeat";

function fixture() {
  const source = {
    id: "source",
    type: "history",
    status: "expired",
    subscriptionPeriodInvoiceId: "paid-period",
    subscriptionPeriodEndsAt: new Date(Date.now() - 1000),
    subscriptionRevokedAt: null,
  };
  const nextOrders: any[] = [];
  const charge = {
    productId: "coffee",
    offerId: "coffee-offer",
    storeId: "seller",
    providerStoreId: "seller",
    role: "product",
    recurrence: "each",
    quantity: 1,
    amount: "1200",
    stockQuantity: null,
    formula: "unit_price * quantity",
    formulaVersion: "1",
    inputs: {},
  };
  const snapshots = [
    {
      version: 1,
      currencyId: "rub",
      purchaseType: "subscription",
      interval: "month",
      charge,
      destination: { address: "Buyer address" },
    },
    {
      version: 1,
      currencyId: "rub",
      purchaseType: "subscription",
      interval: "month",
      charge: {
        ...charge,
        productId: "delivery",
        offerId: "delivery-offer",
        role: "delivery",
        amount: "300",
      },
      destination: {},
    },
    {
      version: 1,
      currencyId: "rub",
      purchaseType: "subscription",
      interval: "month",
      charge: {
        ...charge,
        productId: "wrap",
        offerId: "wrap-offer",
        role: "add-on",
        recurrence: "first",
        amount: "150",
      },
      destination: {},
    },
  ];
  const service = {
    ecommerceModuleOrderAssertAccess: jest.fn(),
    module: {
      subjectsToEcommerceModuleOrders: {
        find: jest
          .fn()
          .mockResolvedValue([
            { subjectId: "buyer", ecommerceModuleOrderId: source.id },
          ]),
        create: jest.fn(),
      },
    },
    modules: {
      ecommerce: {
        storesToProducts: {
          quote: jest.fn(async (input) => ({
            offerId: input.offerId,
            storeId: "seller",
            currencyId: "rub",
            amount: "1500",
            issues: [],
            version: "new-price",
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            destination: input.destination,
            charges: [
              charge,
              {
                ...charge,
                productId: "delivery",
                offerId: "delivery-offer",
                role: "delivery",
                amount: "300",
              },
            ],
          })),
        },
        storesToOrders: { create: jest.fn() },
        ordersToBillingModuleCurrencies: { create: jest.fn() },
        ordersToProducts: {
          create: jest.fn().mockResolvedValue({ id: "created-primary" }),
        },
        order: {
          fulfillmentQuoteOptions: jest
            .fn()
            .mockResolvedValue({ fulfilledLineIds: [] }),
          findById: jest.fn().mockResolvedValue(source),
          lockForLifecycle: jest.fn(),
          find: jest.fn(async () => [...nextOrders]),
          createNextPeriodCart: jest.fn(
            async ({ sourceOrderId, sourceInvoiceId, interval }) => {
              const order = {
                id: "next",
                subscriptionSourceOrderId: sourceOrderId,
                subscriptionSourceInvoiceId: sourceInvoiceId,
                subscriptionSourceInterval: interval,
              };
              nextOrders.push(order);
              return order;
            },
          ),
          delete: jest.fn(),
          ordersToBillingModulePaymentIntents: {
            find: jest.fn().mockResolvedValue(
              snapshots.map((snapshot, index) => ({
                id: `saved-${index}`,
                billingModulePaymentIntentId: "intent",
                purchaseSnapshot: snapshot,
              })),
            ),
          },
          paymentIntent: {
            findById: jest
              .fn()
              .mockResolvedValue({ type: "one_off", status: "succeeded" }),
          },
        },
      },
      billing: {
        paymentIntentsToInvoices: {
          find: jest
            .fn()
            .mockResolvedValue([
              { paymentIntentId: "intent", invoiceId: "paid-period" },
            ]),
        },
        invoice: { findById: jest.fn().mockResolvedValue({ status: "paid" }) },
      },
    },
  };
  let tail = Promise.resolve();
  const repository = {
    withSubjectLock: jest.fn((_scope, operation) => {
      const next = tail.then(operation);
      tail = next.then(
        () => undefined,
        () => undefined,
      );
      return next;
    }),
  };
  return {
    source,
    service,
    operation: new Service({ repository, service } as any),
  };
}

it("creates one next-period cart under concurrent retry and retains only recurring services", async () => {
  const f = fixture();
  const props = {
    subjectId: "buyer",
    orderId: "source",
    mode: "next-period" as const,
  };
  const results = await Promise.all([
    f.operation.execute(props),
    f.operation.execute(props),
  ]);
  expect(results).toEqual([{ orderIds: ["next"] }, { orderIds: ["next"] }]);
  expect(
    f.service.modules.ecommerce.order.createNextPeriodCart,
  ).toHaveBeenCalledTimes(1);
  expect(f.service.modules.ecommerce.order.delete).not.toHaveBeenCalled();
  expect(
    f.service.modules.ecommerce.storesToProducts.quote,
  ).toHaveBeenCalledWith(
    expect.objectContaining({
      services: [expect.objectContaining({ offerId: "delivery-offer" })],
    }),
  );
  expect(
    f.service.modules.ecommerce.ordersToProducts.create,
  ).toHaveBeenCalledTimes(2);
  expect(
    f.service.modules.ecommerce.ordersToProducts.create.mock.calls.map(
      ([args]) => args.data.offerId,
    ),
  ).toEqual(["coffee-offer", "delivery-offer"]);
  expect(
    f.service.modules.ecommerce.order.createNextPeriodCart,
  ).toHaveBeenCalledWith({
    sourceOrderId: "source",
    sourceInvoiceId: "paid-period",
    interval: "month",
  });
  f.service.modules.ecommerce.storesToProducts.quote.mockRejectedValue(
    new Error("catalog changed"),
  );
  await expect(f.operation.execute(props)).resolves.toEqual({
    orderIds: ["next"],
  });
});

it("refuses a period before its final day and permits a provider-managed period", async () => {
  const f = fixture();
  const props = {
    subjectId: "buyer",
    orderId: "source",
    mode: "next-period" as const,
  };
  f.source.subscriptionPeriodEndsAt = new Date(
    Date.now() + 25 * 60 * 60 * 1000,
  );
  await expect(f.operation.execute(props)).rejects.toThrow("not due");
  f.source.subscriptionPeriodEndsAt = new Date(Date.now() - 1000);
  f.service.modules.ecommerce.order.paymentIntent.findById.mockResolvedValue({
    type: "subscription",
    status: "succeeded",
  });
  await expect(f.operation.execute(props)).resolves.toEqual({
    orderIds: ["next"],
  });
  expect(
    f.service.modules.ecommerce.order.createNextPeriodCart,
  ).toHaveBeenCalledTimes(1);
});
