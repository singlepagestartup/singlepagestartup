import { Service } from "./checkout-claim";

function fixture() {
  const orders = [
    { id: "b", type: "cart", status: "new" },
    { id: "a", type: "cart", status: "new" },
  ];
  const owners = orders.map((order) => ({
    subjectId: "subject",
    ecommerceModuleOrderId: order.id,
  }));
  const lines = orders.map((order) => ({
    id: `line-${order.id}`,
    orderId: order.id,
    productId: "product",
    quantity: 2,
  }));
  const currencies = orders.map((order) => ({
    id: `currency-${order.id}`,
    orderId: order.id,
    billingModuleCurrencyId: "usd",
  }));
  const repository = { withSubjectLock: jest.fn(async (_scope, run) => run()) };
  const modules = {
    ecommerce: {
      order: {
        lockForLifecycle: jest.fn(),
        findById: jest.fn(async ({ id }) =>
          orders.find((order) => order.id === id),
        ),
        update: jest.fn(async ({ id, data }) =>
          Object.assign(
            orders.find((order) => order.id === id)!,
            data,
          ),
        ),
        ordersToBillingModulePaymentIntents: {
          find: jest.fn().mockResolvedValue([]),
        },
        paymentIntent: {
          find: jest
            .fn()
            .mockResolvedValue([{ id: "intent", status: "requires_action" }]),
        },
      },
      ordersToProducts: { find: jest.fn().mockResolvedValue(lines) },
      ordersToBillingModuleCurrencies: {
        find: jest.fn().mockResolvedValue(currencies),
      },
    },
    billing: {
      paymentIntentsToInvoices: {
        find: jest
          .fn()
          .mockResolvedValue([
            { paymentIntentId: "intent", invoiceId: "invoice" },
          ]),
      },
      invoice: {
        find: jest
          .fn()
          .mockResolvedValue([
            { id: "invoice", status: "open", paymentUrl: "https://pay.test" },
          ]),
      },
    },
  };
  const settledOrderIds = jest.fn().mockResolvedValue(new Set());
  const operation = new Service({
    repository,
    modules,
    settledOrderIds,
    module: {
      subjectsToEcommerceModuleOrders: {
        find: jest.fn().mockResolvedValue(owners),
      },
    },
  } as any);
  const props = {
    subjectId: "subject",
    orderIds: ["b", "a"],
    comment: "note",
    expectedLines: structuredClone(lines),
    expectedCurrencies: structuredClone(currencies),
  };
  return {
    orders,
    owners,
    lines,
    currencies,
    repository,
    modules,
    settledOrderIds,
    operation,
    props,
  };
}

it("locks sorted IDs and claims every cart before a second checkout can claim it", async () => {
  const f = fixture();
  await expect(f.operation.execute(f.props)).resolves.toEqual({
    invoices: undefined,
  });
  expect(f.modules.ecommerce.order.lockForLifecycle.mock.calls).toEqual([
    [{ id: "a" }],
    [{ id: "b" }],
  ]);
  expect(f.orders).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "a",
        type: "history",
        status: "paying",
        comment: "note",
      }),
      expect.objectContaining({ id: "b", type: "history", status: "paying" }),
    ]),
  );
  await expect(f.operation.execute(f.props)).rejects.toThrow(
    "no longer an open cart",
  );
  expect(f.modules.ecommerce.order.update).toHaveBeenCalledTimes(2);
});

it.each(["owner", "status", "lines", "currency", "settled", "period"])(
  "preserves the whole cart when %s changed during preflight",
  async (change) => {
    const f = fixture();
    if (change === "owner") {
      f.owners.push({ subjectId: "foreign", ecommerceModuleOrderId: "b" });
    }
    if (change === "status") {
      f.orders[0].status = "paid";
    }
    if (change === "lines") {
      f.lines[0].quantity = 9;
    }
    if (change === "currency") {
      f.currencies[0].billingModuleCurrencyId = "eur";
    }
    if (change === "settled") {
      f.settledOrderIds.mockResolvedValue(new Set(["b"]));
    }
    if (change === "period") {
      Object.assign(f.orders[0], {
        subscriptionPeriodInvoiceId: "prior-invoice",
      });
    }
    await expect(f.operation.execute(f.props)).rejects.toThrow();
    expect(f.modules.ecommerce.order.update).not.toHaveBeenCalled();
  },
);

it("resumes the existing invoice of one legacy cart without creating another attempt", async () => {
  const f = fixture();
  f.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue(
    [{ orderId: "a", billingModulePaymentIntentId: "intent" }],
  );
  const result = await f.operation.execute({
    ...f.props,
    orderIds: ["a"],
    expectedLines: undefined,
    expectedCurrencies: undefined,
  });
  expect(result.invoices).toEqual([
    { id: "invoice", status: "open", paymentUrl: "https://pay.test" },
  ]);
  expect(f.orders[1].status).toBe("paying");
  expect(
    f.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find,
  ).toHaveBeenCalled();
  expect(f.modules.ecommerce.order.paymentIntent.find).toHaveBeenCalled();
});

it.each(["missing-link", "mixed"])(
  "does not duplicate an unresolved legacy attempt for %s",
  async (scenario) => {
    const f = fixture();
    f.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue(
      [{ orderId: "a", billingModulePaymentIntentId: "intent" }],
    );
    if (scenario === "missing-link") {
      f.modules.billing.invoice.find.mockResolvedValue([]);
    }
    await expect(
      f.operation.execute({
        ...f.props,
        orderIds: scenario === "mixed" ? ["a", "b"] : ["a"],
        expectedLines: undefined,
        expectedCurrencies: undefined,
      }),
    ).rejects.toThrow("unresolved payment");
    expect(f.modules.ecommerce.order.update).not.toHaveBeenCalled();
  },
);

it.each(["one shared intent", "one invoice covering two intents"])(
  "resumes a grouped legacy invoice only for the exact selection with %s",
  async (scenario) => {
    const f = fixture();
    const secondIntent =
      scenario === "one shared intent" ? "intent" : "second-intent";
    const orderLinks = [
      { orderId: "a", billingModulePaymentIntentId: "intent" },
      { orderId: "b", billingModulePaymentIntentId: secondIntent },
    ];
    const intentIds = [
      ...new Set(orderLinks.map((row) => row.billingModulePaymentIntentId)),
    ];
    const invoiceLinks = intentIds.map((paymentIntentId) => ({
      paymentIntentId,
      invoiceId: "invoice",
    }));
    const invoice = {
      id: "invoice",
      status: "open",
      paymentUrl: "https://pay.test",
      amount: 200,
    };
    function filterRows(
      rows: Record<string, string>[],
      {
        params,
      }: {
        params: {
          filters: {
            and: { column: string; method: string; value: string | string[] }[];
          };
        };
      },
    ) {
      const { column, method, value } = params.filters.and[0];
      return rows.filter((row) =>
        method === "eq" ? row[column] === value : value.includes(row[column]),
      );
    }
    f.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find.mockImplementation(
      async (props) => filterRows(orderLinks, props),
    );
    f.modules.billing.paymentIntentsToInvoices.find.mockImplementation(
      async (props) => filterRows(invoiceLinks, props),
    );
    f.modules.ecommerce.order.paymentIntent.find.mockImplementation(
      async (props) =>
        filterRows(
          intentIds.map((id) => ({ id, status: "requires_action" })),
          props,
        ),
    );
    f.modules.billing.invoice.find.mockResolvedValue([invoice]);

    await expect(
      f.operation.execute({ subjectId: "subject", orderIds: ["a"] }),
    ).rejects.toThrow("unresolved payment");
    expect(f.modules.ecommerce.order.update).not.toHaveBeenCalled();

    await expect(f.operation.execute(f.props)).resolves.toEqual({
      invoices: [invoice],
    });
    expect(
      f.orders.every(
        (order) => order.type === "history" && order.status === "paying",
      ),
    ).toBe(true);
  },
);

it("preserves failed intent links while allowing a cart with no live invoices to start a fresh attempt", async () => {
  const f = fixture();
  f.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue(
    [{ orderId: "a", billingModulePaymentIntentId: "intent" }],
  );
  f.modules.ecommerce.order.paymentIntent.find.mockResolvedValue([
    { id: "intent", status: "failed" },
  ]);
  f.modules.billing.invoice.find.mockResolvedValue([
    { id: "invoice", status: "void", paymentUrl: "" },
  ]);
  await expect(f.operation.execute(f.props)).resolves.toEqual({
    invoices: undefined,
  });
  expect(f.modules.ecommerce.order.update).toHaveBeenCalledTimes(2);
});

it("reopens an exact selection with separate currency invoices and preserves a paid free invoice without a payment URL", async () => {
  const f = fixture();
  Object.assign(f.orders[0], { type: "history", status: "paid" });
  Object.assign(f.orders[1], { type: "history", status: "paying" });
  f.settledOrderIds.mockResolvedValue(new Set(["b"]));
  f.modules.ecommerce.order.ordersToBillingModulePaymentIntents.find.mockResolvedValue(
    [
      { orderId: "a", billingModulePaymentIntentId: "usd-intent" },
      { orderId: "b", billingModulePaymentIntentId: "rub-intent" },
    ],
  );
  f.modules.ecommerce.order.paymentIntent.find.mockResolvedValue([
    { id: "rub-intent", status: "succeeded" },
    { id: "usd-intent", status: "requires_payment_method" },
  ]);
  f.modules.billing.paymentIntentsToInvoices.find.mockResolvedValue([
    { paymentIntentId: "rub-intent", invoiceId: "rub-invoice" },
    { paymentIntentId: "usd-intent", invoiceId: "usd-invoice" },
  ]);
  const invoices = [
    { id: "rub-invoice", status: "paid", amount: 0, paymentUrl: null },
    {
      id: "usd-invoice",
      status: "open",
      amount: 20,
      paymentUrl: "https://pay.test/usd",
    },
  ];
  f.modules.billing.invoice.find.mockResolvedValue(invoices);
  await expect(
    f.operation.execute({ ...f.props, resumeExisting: true }),
  ).resolves.toEqual({ invoices });
  expect(f.modules.ecommerce.order.update).not.toHaveBeenCalled();
});
