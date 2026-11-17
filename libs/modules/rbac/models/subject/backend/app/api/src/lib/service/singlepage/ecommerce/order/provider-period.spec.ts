import { Service } from "./provider-period";

function fixture() {
  const root: any = {
    id: "root",
    subscriptionPeriodInvoiceId: "first",
    subscriptionPeriodEndsAt: new Date("2026-12-01T00:00:00Z"),
  };
  const next: any = { id: "next", subscriptionSourceOrderId: root.id };
  const orders = [root, next];
  const intents: any = {
    root: { id: "contract", amount: 120, checkoutCurrencyId: "usd" },
    next: { id: "next-intent", amount: 120, checkoutCurrencyId: "usd" },
  };
  const service: any = {
    ecommerceModuleOrderAssertAccess: jest.fn(),
    ecommerceModuleOrderRenewal: jest
      .fn()
      .mockResolvedValue({ orderId: "next" }),
    subjectsToEcommerceModuleOrders: {
      find: jest
        .fn()
        .mockResolvedValue([
          { subjectId: "buyer", ecommerceModuleOrderId: "root" },
        ]),
    },
    ecommerceModule: {
      order: {
        findById: jest.fn(async ({ id }) =>
          orders.find((order) => order.id === id),
        ),
        find: jest.fn(async ({ params }) => {
          const filter = params.filters.and[0];
          if (filter.column === "subscriptionProviderInvoiceId") {
            return orders.filter(
              (order) => order.subscriptionProviderInvoiceId === filter.value,
            );
          }
          return orders.filter(
            (order) => order.subscriptionSourceOrderId === filter.value,
          );
        }),
        lockForLifecycle: jest.fn(),
        configureNextPeriod: jest.fn(
          async ({ id, startsAt, endsAt, providerInvoiceId }) => {
            Object.assign(
              orders.find((order) => order.id === id)!,
              {
                subscriptionScheduledStartsAt: startsAt,
                subscriptionScheduledEndsAt: endsAt,
                subscriptionProviderInvoiceId: providerInvoiceId,
              },
            );
          },
        ),
      },
      ordersToBillingModulePaymentIntents: {
        find: jest.fn(async ({ params }) => {
          const filter = params.filters.and[0];
          return filter.column === "billingModulePaymentIntentId"
            ? [{ orderId: "root", billingModulePaymentIntentId: "contract" }]
            : [
                {
                  orderId: filter.value,
                  billingModulePaymentIntentId: intents[filter.value].id,
                },
              ];
        }),
      },
    },
    billingModule: {
      paymentIntent: {
        findById: jest.fn(async ({ id }) =>
          Object.values(intents).find((intent: any) => intent.id === id),
        ),
      },
      currency: { findById: jest.fn().mockResolvedValue({ slug: "usd" }) },
    },
  };
  const repository = {
    withSubjectLock: jest.fn((_scope, operation) => operation()),
  };
  const receipt = {
    provider: "stripe",
    contractPaymentIntentId: "contract",
    providerSubscriptionId: "sub",
    providerInvoiceId: "in_second",
    periodStart: "2026-12-01T00:00:00.000Z",
    periodEnd: "2027-01-01T00:00:00.000Z",
    amount: 120,
    currency: "usd",
    initial: false,
  };
  return {
    root,
    next,
    service,
    operation: new Service({ service, repository }),
    receipt,
  };
}

it("maps replayed provider invoices to the same successor payment", async () => {
  const f = fixture();
  await expect(f.operation.execute(f.receipt)).resolves.toEqual({
    paymentIntentId: "next-intent",
  });
  await expect(f.operation.execute(f.receipt)).resolves.toEqual({
    paymentIntentId: "next-intent",
  });
  expect(f.service.ecommerceModuleOrderRenewal).toHaveBeenCalledTimes(1);
  expect(f.service.ecommerceModuleOrderRenewal).toHaveBeenCalledWith(
    { subjectId: "buyer", orderId: "root" },
    { skipProviderReconciliation: true },
  );
  expect(f.root.subscriptionProviderInvoiceId).toBeUndefined();
  expect(f.next.subscriptionProviderInvoiceId).toBe("stripe:in_second");
});

it("freezes the initial provider dates on the contract order without preparing a second checkout", async () => {
  const f = fixture();
  await expect(
    f.operation.execute({
      ...f.receipt,
      initial: true,
      providerInvoiceId: "in_first",
    }),
  ).resolves.toEqual({ paymentIntentId: "contract" });
  expect(f.service.ecommerceModuleOrderRenewal).not.toHaveBeenCalled();
  expect(f.root.subscriptionScheduledEndsAt).toEqual(
    new Date(f.receipt.periodEnd),
  );
});

it("refuses a wrong currency, changed provider dates and an out-of-order cycle", async () => {
  const f = fixture();
  await expect(
    f.operation.execute({ ...f.receipt, currency: "eur" }),
  ).rejects.toThrow("currency differs");
  await f.operation.execute(f.receipt);
  await expect(
    f.operation.execute({ ...f.receipt, periodEnd: "2027-02-01T00:00:00Z" }),
  ).rejects.toThrow("dates changed");
  await expect(
    f.operation.execute({
      ...f.receipt,
      providerInvoiceId: "in_future",
      periodStart: "2028-01-01T00:00:00Z",
    }),
  ).rejects.toThrow("out of sequence");
});
