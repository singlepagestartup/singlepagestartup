import { Service } from "./renewal";

function fixture(provider = "stripe") {
  const source: any = {
    id: "source",
    type: "history",
    status: "delivering",
    subscriptionPeriodInvoiceId: "paid",
    subscriptionPeriodEndsAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
  };
  source.subscriptionScheduledEndsAt = source.subscriptionPeriodEndsAt;
  const next: any = {
    id: "next",
    type: "cart",
    status: "new",
    subscriptionSourceOrderId: source.id,
    subscriptionSourceInterval: "day",
  };
  let nextLinks: any[] = [];
  const snapshots = [
    {
      amount: "100",
      currencyId: "usd",
      purchaseType: "subscription",
      charge: { role: "product", recurrence: "each", amount: "100" },
    },
    {
      amount: "20",
      currencyId: "usd",
      purchaseType: "subscription",
      charge: { role: "delivery", recurrence: "each", amount: "20" },
    },
    {
      amount: "9",
      currencyId: "usd",
      purchaseType: "subscription",
      charge: { role: "add-on", recurrence: "first", amount: "9" },
    },
  ];
  const intent: any = {
    id: "contract",
    type: "subscription",
    status: "succeeded",
    amount: 129,
    checkoutMetadata: { email: "buyer@example.com" },
  };
  const service: any = {
    ecommerceModuleOrderAssertAccess: jest.fn(),
    ecommerceModuleOrderRepeat: jest
      .fn()
      .mockResolvedValue({ orderIds: [next.id] }),
    ecommerceOrderCheckout: jest.fn(async () => {
      nextLinks = [{ billingModulePaymentIntentId: "next-intent" }];
    }),
    ecommerceModule: {
      order: {
        findById: jest.fn(async ({ id }) => (id === source.id ? source : next)),
        find: jest.fn(async ({ params }) =>
          params.filters.and[0].value === source.id ? [next] : [],
        ),
        lockForLifecycle: jest.fn(),
        configureNextPeriod: jest.fn(async ({ startsAt, endsAt }) =>
          Object.assign(next, {
            subscriptionScheduledStartsAt: startsAt,
            subscriptionScheduledEndsAt: endsAt,
          }),
        ),
        update: jest.fn(),
        stopSubscriptionRenewal: jest.fn(),
        fulfillmentQuoteOptions: jest
          .fn()
          .mockResolvedValue({ fulfilledLineIds: [] }),
      },
      ordersToBillingModulePaymentIntents: {
        find: jest.fn(async ({ params }) =>
          params.filters.and[0].value === source.id
            ? snapshots.map((purchaseSnapshot) => ({
                billingModulePaymentIntentId: intent.id,
                purchaseSnapshot,
              }))
            : nextLinks,
        ),
      },
      ordersToBillingModuleCurrencies: {
        find: jest.fn().mockResolvedValue([{ billingModuleCurrencyId: "usd" }]),
      },
      ordersToProducts: {
        find: jest.fn().mockResolvedValue([
          { id: "line", offerId: "offer", quantity: 1, parentLineId: null },
          {
            id: "delivery",
            offerId: "delivery-offer",
            quantity: 1,
            parentLineId: "line",
          },
        ]),
      },
      storesToProducts: {
        quoteMany: jest.fn().mockResolvedValue([{ amount: "120", issues: [] }]),
      },
    },
    billingModule: {
      paymentIntentsToInvoices: {
        find: jest
          .fn()
          .mockResolvedValue([
            { paymentIntentId: intent.id, invoiceId: "paid" },
          ]),
      },
      paymentIntent: {
        schedulesSubscriptionPayments: jest.fn(
          ({ provider }: { provider: string }) => provider === "stripe",
        ),
        findById: jest.fn().mockResolvedValue(intent),
        reconcileSubscriptionPeriods: jest.fn(),
        failUnpaidIntent: jest.fn(),
      },
      invoice: {
        findById: jest
          .fn()
          .mockResolvedValue({ id: "paid", status: "paid", provider }),
        update: jest.fn(),
      },
    },
  };
  const repository = {
    withSubjectLock: jest.fn((_scope, operation) => operation()),
  };
  return {
    source,
    next,
    intent,
    service,
    operation: new Service({ service, repository }),
    setLinks: (links: any[]) => {
      nextLinks = links;
    },
  };
}

it("prepares one local Stripe payment and reuses it while reconciling provider receipts", async () => {
  const f = fixture();
  const props = { subjectId: "buyer", orderId: "source" };
  await expect(f.operation.execute(props)).resolves.toEqual({
    orderId: "next",
  });
  await f.operation.execute(props);
  expect(f.service.ecommerceOrderCheckout).toHaveBeenCalledTimes(1);
  expect(f.service.ecommerceOrderCheckout).toHaveBeenCalledWith(
    expect.objectContaining({ provider: "stripe" }),
    {
      deferProviderCheckout: true,
      providerContractPaymentIntentId: "contract",
    },
  );
  expect(
    f.service.billingModule.paymentIntent.reconcileSubscriptionPeriods,
  ).toHaveBeenCalledTimes(2);
});

it("defers renewal checkout for another provider that owns subscription scheduling", async () => {
  const f = fixture("custom-scheduled");
  f.service.billingModule.paymentIntent.schedulesSubscriptionPayments.mockReturnValue(
    true,
  );
  await f.operation.execute({ subjectId: "buyer", orderId: "source" });
  expect(
    f.service.billingModule.paymentIntent.schedulesSubscriptionPayments,
  ).toHaveBeenCalledWith({ provider: "custom-scheduled" });
  expect(f.service.ecommerceOrderCheckout).toHaveBeenCalledWith(
    expect.objectContaining({ provider: "custom-scheduled" }),
    {
      deferProviderCheckout: true,
      providerContractPaymentIntentId: "contract",
    },
  );
  expect(
    f.service.billingModule.paymentIntent.reconcileSubscriptionPeriods,
  ).toHaveBeenCalledWith({ id: "contract" });
});

it("does not recursively reconcile while resolving a provider receipt", async () => {
  const f = fixture();
  await f.operation.execute(
    { subjectId: "buyer", orderId: "source" },
    { skipProviderReconciliation: true },
  );
  expect(
    f.service.billingModule.paymentIntent.reconcileSubscriptionPeriods,
  ).not.toHaveBeenCalled();
});

it("requires buyer confirmation when the recurring price changes and stops the scheduled debit", async () => {
  const f = fixture();
  f.service.ecommerceModule.storesToProducts.quoteMany.mockResolvedValue([
    { amount: "121", issues: [] },
  ]);
  await expect(
    f.operation.execute({ subjectId: "buyer", orderId: "source" }),
  ).resolves.toEqual({ orderId: "next", requiresConfirmation: true });
  expect(f.service.ecommerceOrderCheckout).not.toHaveBeenCalled();
  expect(
    f.service.ecommerceModule.order.stopSubscriptionRenewal,
  ).toHaveBeenCalledWith({ id: "source" });
});

it("prepares a manual provider invoice through its ordinary checkout", async () => {
  const f = fixture("yookassa");
  await f.operation.execute({ subjectId: "buyer", orderId: "source" });
  expect(f.service.ecommerceOrderCheckout).toHaveBeenCalledWith(
    expect.objectContaining({ provider: "yookassa" }),
    { manualSubscriptionPeriod: true },
  );
  expect(
    f.service.billingModule.paymentIntent.reconcileSubscriptionPeriods,
  ).not.toHaveBeenCalled();
});

it("does not prepare a canceled, revoked or not-yet-due subscription", async () => {
  const f = fixture();
  f.source.subscriptionPeriodEndsAt = new Date(
    Date.now() + 25 * 60 * 60 * 1000,
  );
  f.source.subscriptionScheduledEndsAt = f.source.subscriptionPeriodEndsAt;
  await f.operation.execute({ subjectId: "buyer", orderId: "source" });
  f.source.subscriptionPeriodEndsAt = new Date(Date.now() + 60_000);
  f.source.status = "requested_cancelation";
  await f.operation.execute({ subjectId: "buyer", orderId: "source" });
  f.source.status = "delivering";
  f.source.subscriptionRevokedAt = new Date();
  await f.operation.execute({ subjectId: "buyer", orderId: "source" });
  expect(f.service.ecommerceModuleOrderRepeat).not.toHaveBeenCalled();
});

it("keeps a manual Stripe subscription period payable without inventing a remote contract", async () => {
  const f = fixture();
  f.intent.type = "one_off";
  await f.operation.execute({ subjectId: "buyer", orderId: "source" });
  expect(f.service.ecommerceOrderCheckout).toHaveBeenCalledWith(
    expect.objectContaining({ provider: "stripe" }),
    { manualSubscriptionPeriod: true },
  );
  expect(
    f.service.billingModule.paymentIntent.reconcileSubscriptionPeriods,
  ).not.toHaveBeenCalled();
  f.service.ecommerceModule.storesToProducts.quoteMany.mockResolvedValue([
    { amount: "121", issues: [] },
  ]);
  f.setLinks([]);
  await f.operation.execute({ subjectId: "buyer", orderId: "source" });
  expect(
    f.service.ecommerceModule.order.stopSubscriptionRenewal,
  ).not.toHaveBeenCalled();
});

it("keeps the original automatic Stripe contract when preparing the third period", async () => {
  const f = fixture();
  f.intent.id = "second-period-intent";
  f.service.billingModule.paymentIntentsToInvoices.find.mockResolvedValue([
    { paymentIntentId: f.intent.id, invoiceId: "paid" },
  ]);
  f.intent.checkoutMetadata.providerContractPaymentIntentId =
    "original-contract";
  await f.operation.execute({ subjectId: "buyer", orderId: "source" });
  expect(f.service.ecommerceOrderCheckout).toHaveBeenCalledWith(
    expect.anything(),
    {
      deferProviderCheckout: true,
      providerContractPaymentIntentId: "original-contract",
    },
  );
  expect(
    f.service.billingModule.paymentIntent.reconcileSubscriptionPeriods,
  ).toHaveBeenCalledWith({ id: "original-contract" });
});

it("keeps the provider contract active when preparation fails transiently", async () => {
  const f = fixture();
  f.service.ecommerceModuleOrderRepeat.mockRejectedValueOnce(
    new Error("database unavailable"),
  );
  await expect(
    f.operation.execute({ subjectId: "buyer", orderId: "source" }),
  ).rejects.toThrow("database unavailable");
  expect(
    f.service.ecommerceModule.order.stopSubscriptionRenewal,
  ).not.toHaveBeenCalled();
  f.service.ecommerceModuleOrderRepeat.mockRejectedValueOnce(
    new Error(
      "Conflict error. Next delivery is unavailable: insufficient_stock",
    ),
  );
  await expect(
    f.operation.execute({ subjectId: "buyer", orderId: "source" }),
  ).rejects.toThrow("insufficient_stock");
  expect(
    f.service.ecommerceModule.order.stopSubscriptionRenewal,
  ).toHaveBeenCalledTimes(1);
});
