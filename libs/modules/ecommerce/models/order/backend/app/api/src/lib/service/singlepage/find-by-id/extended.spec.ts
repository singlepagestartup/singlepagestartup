import { Service } from "./extended";
import { Service as CheckoutAttributes } from "./checkout-attributes";

function currentCheckout() {
  const keys = { price: "price-key", interval: "interval-key" };
  const attributes = {
    usd: { id: "usd", number: "29" },
    rub: { id: "rub", number: "1900" },
    interval: { id: "interval", string: { en: "month", ru: "month" } },
  };
  const service = new CheckoutAttributes(
    {
      find: async ({ params }: any) => [
        { id: keys[params.filters.and[0].value as keyof typeof keys] },
      ],
    } as any,
    { find: async () => [{ productId: "pro", quantity: 1 }] } as any,
    { findById: async () => ({ id: "pro", type: "subscription" }) } as any,
    {
      find: async () =>
        Object.values(attributes).map(({ id }) => ({ attributeId: id })),
    } as any,
    {
      find: async ({ params }: any) => {
        const key = params.filters.and.find(
          (item: any) => item.column === "attributeKeyId",
        ).value;
        const selection = params.filters.and.find(
          (item: any) => item.column === "attributeId",
        );
        if (key === keys.price)
          return [{ attributeId: "usd" }, { attributeId: "rub" }];
        return selection.value === "interval"
          ? [{ attributeId: "interval" }]
          : [];
      },
    } as any,
    {
      findById: async ({ id }: { id: string }) =>
        attributes[id as keyof typeof attributes],
    } as any,
    {
      find: async ({ params }: any) => {
        const currency = params.filters.and.find(
          (item: any) => item.column === "billingModuleCurrencyId",
        ).value;
        return currency === "usd" || currency === "rub"
          ? [{ attributeId: currency }]
          : [];
      },
    } as any,
  );
  jest.spyOn(service, "execute");
  return service as CheckoutAttributes & {
    execute: jest.MockedFunction<CheckoutAttributes["execute"]>;
  };
}

function fixture() {
  const state = {
    order: {
      id: "order",
      type: "history",
      status: "delivered",
      subscriptionPeriodStartsAt: new Date(
        "2026-10-20T00:00:00Z",
      ) as Date | null,
      subscriptionPeriodEndsAt: new Date("2026-10-20T00:01:00Z") as Date | null,
      subscriptionPeriodInvoiceId: "invoice" as string | null,
      subscriptionRevokedAt: null,
    },
    orderCurrency: {
      id: "order-currency",
      orderId: "order",
      billingModuleCurrencyId: "star",
      amount: "999",
    },
    currencies: [
      { id: "star", symbol: "XTR" },
      { id: "usd", symbol: "$" },
      { id: "rub", symbol: "₽" },
    ],
    intents: [
      {
        id: "intent",
        type: "one_off",
        interval: "minute" as string | null,
        amount: 2,
        status: "succeeded",
      },
    ],
    orderIntents: [
      {
        id: "order-intent",
        orderId: "order",
        billingModulePaymentIntentId: "intent",
      },
    ],
    intentCurrencies: [
      { id: "intent-currency", paymentIntentId: "intent", currencyId: "star" },
    ],
    intentInvoices: [
      { id: "intent-invoice", paymentIntentId: "intent", invoiceId: "invoice" },
    ],
    invoices: [
      {
        id: "invoice",
        status: "paid",
        amount: 1,
        createdAt: new Date("2026-10-20T00:00:00Z"),
      },
    ],
  };
  const checkout = currentCheckout();
  const product = { id: "pro", type: "subscription", slug: "pro-subscription" };
  const dependencies = {
    findById: jest.fn(async () => state.order),
    findByIdCheckoutAttributes: checkout,
    findByIdExtendedProduct: jest.fn(async () => product),
    ordersToProducts: {
      find: jest.fn(async () => [
        { id: "line", orderId: "order", productId: "pro", quantity: 1 },
      ]),
    },
    ordersToBillingModuleCurrencies: {
      find: jest.fn(async () => [state.orderCurrency]),
    },
    ordersToFileStorageModuleFiles: { find: jest.fn(async () => []) },
    ordersToBillingModulePaymentIntents: {
      find: jest.fn(async () => state.orderIntents),
    },
    billingModule: {
      currency: { find: jest.fn(async () => state.currencies) },
      paymentIntent: { find: jest.fn(async () => state.intents) },
      paymentIntentsToCurrencies: {
        find: jest.fn(async () => state.intentCurrencies),
      },
      paymentIntentsToInvoices: {
        find: jest.fn(async () => state.intentInvoices),
      },
      invoice: { find: jest.fn(async () => state.invoices) },
    },
    fileStorageModule: { file: { find: jest.fn(async () => []) } },
  };
  const service = new Service(
    dependencies as unknown as ConstructorParameters<typeof Service>[0],
  );
  const unbilled = (status = "new") => {
    state.order.type = "cart";
    state.order.status = status;
    state.order.subscriptionPeriodInvoiceId = null;
    state.order.subscriptionPeriodStartsAt = null;
    state.order.subscriptionPeriodEndsAt = null;
    state.orderIntents.length = 0;
    state.intents.length = 0;
    state.intentCurrencies.length = 0;
    state.intentInvoices.length = 0;
    state.invoices.length = 0;
  };
  return { state, checkout, service, dependencies, unbilled };
}

describe("Order payment history after a Product price cutover", () => {
  it.each(["paid", "delivered", "completed", "canceled"])(
    "reads a %s Star purchase using its own Invoice and saved minute contract",
    async (status) => {
      const { state, checkout, service } = fixture();
      state.order.status = status;
      const before = JSON.stringify(state);
      const result = await service.execute({ id: "order" });
      expect(result.checkoutAttributesByCurrency).toEqual({
        amount: 1,
        type: "subscription",
        interval: "minute",
      });
      expect(
        result.ordersToBillingModuleCurrencies[0].billingModuleCurrency?.id,
      ).toBe("star");
      expect(result.subscriptionPeriodInvoiceId).toBe("invoice");
      expect(result.subscriptionPeriodStartsAt).toEqual(
        state.order.subscriptionPeriodStartsAt,
      );
      expect(result.subscriptionPeriodEndsAt).toEqual(
        state.order.subscriptionPeriodEndsAt,
      );
      expect(JSON.stringify(state)).toBe(before);
      expect(checkout.execute).toHaveBeenCalledWith({ id: "order" });
      expect(checkout.execute).not.toHaveBeenCalledWith({
        id: "order",
        billingModuleCurrencyId: "star",
      });
      await expect(
        checkout.execute({ id: "order", billingModuleCurrencyId: "star" }),
      ).rejects.toThrow("target price attributes");
    },
  );

  it("keeps a canceled cart's paid Invoice readable without changing its type or status", async () => {
    const { state, service } = fixture();
    state.order.type = "cart";
    state.order.status = "canceled";
    const result = await service.execute({ id: "order" });
    expect(result.type).toBe("cart");
    expect(result.status).toBe("canceled");
    expect(result.checkoutAttributesByCurrency.amount).toBe(1);
  });

  it("shows the old RUB Invoice amount rather than today's 1900 RUB price", async () => {
    const { state, checkout, service } = fixture();
    state.orderCurrency.billingModuleCurrencyId = "rub";
    state.intentCurrencies[0].currencyId = "rub";
    state.invoices[0].amount = 1000;
    expect(
      (await service.execute({ id: "order" })).checkoutAttributesByCurrency
        .amount,
    ).toBe(1000);
    expect(
      (await checkout.execute({ id: "order", billingModuleCurrencyId: "rub" }))
        .amount,
    ).toBe(1900);
  });

  it.each(["history", "cart"])(
    "reads an OPEN Star Invoice in a %s without inventing an accepted period",
    async (type) => {
      const { state, service, unbilled } = fixture();
      unbilled("requested_cancelation");
      state.order.type = type;
      state.orderIntents.push({
        id: "open-link",
        orderId: "order",
        billingModulePaymentIntentId: "open-intent",
      });
      state.intents.push({
        id: "open-intent",
        type: "one_off",
        interval: "minute",
        amount: 1,
        status: "requires_action",
      });
      state.intentCurrencies.push({
        id: "open-currency",
        paymentIntentId: "open-intent",
        currencyId: "star",
      });
      state.intentInvoices.push({
        id: "open-invoice-link",
        paymentIntentId: "open-intent",
        invoiceId: "open",
      });
      state.invoices.push({
        id: "open",
        status: "open",
        amount: 1,
        createdAt: new Date("2026-10-21T00:00:00Z"),
      });
      const result = await service.execute({ id: "order" });
      expect(result.checkoutAttributesByCurrency).toEqual({
        amount: 1,
        type: "subscription",
        interval: "minute",
      });
      expect(result.status).toBe("requested_cancelation");
      expect(result.subscriptionPeriodInvoiceId).toBeNull();
      expect(result.subscriptionPeriodStartsAt).toBeNull();
      expect(result.subscriptionPeriodEndsAt).toBeNull();
      expect(
        result.ordersToBillingModulePaymentIntents[0].billingModulePaymentIntent
          .paymentIntentsToInvoices[0].invoice.status,
      ).toBe("open");
    },
  );

  it("keeps an accepted paid Invoice authoritative while a newer renewal Invoice is OPEN", async () => {
    const { state, service } = fixture();
    state.intentInvoices.push({
      id: "renewal",
      paymentIntentId: "intent",
      invoiceId: "new-open",
    });
    state.invoices.push({
      id: "new-open",
      status: "open",
      amount: 100,
      createdAt: new Date("2026-10-21T00:00:00Z"),
    });
    expect(
      (await service.execute({ id: "order" })).checkoutAttributesByCurrency
        .amount,
    ).toBe(1);
  });

  it.each(["paid", "open"])(
    "handles a newer %s Invoice in another currency without mixing its interval with the accepted payment",
    async (status) => {
      const { state, service } = fixture();
      state.orderIntents.push({
        id: "foreign-link",
        orderId: "order",
        billingModulePaymentIntentId: "foreign-intent",
      });
      state.intents.push({
        id: "foreign-intent",
        type: "subscription",
        interval: "month",
        amount: 1900,
        status: "succeeded",
      });
      state.intentCurrencies.push({
        id: "foreign-currency",
        paymentIntentId: "foreign-intent",
        currencyId: "rub",
      });
      state.intentInvoices.push({
        id: "foreign-invoice-link",
        paymentIntentId: "foreign-intent",
        invoiceId: "foreign-invoice",
      });
      state.invoices.push({
        id: "foreign-invoice",
        status,
        amount: 1900,
        createdAt: new Date("2026-10-22T00:00:00Z"),
      });
      const before = JSON.stringify(state);
      if (status === "paid") {
        await expect(service.execute({ id: "order" })).rejects.toThrow(
          "Paid Invoice currency does not match this Order",
        );
      } else {
        const result = await service.execute({ id: "order" });
        expect(result.checkoutAttributesByCurrency).toEqual({
          amount: 1,
          type: "subscription",
          interval: "minute",
        });
        expect(result.subscriptionPeriodInvoiceId).toBe("invoice");
      }
      expect(JSON.stringify(state)).toBe(before);
    },
  );

  it("uses the latest paid Invoice's own saved contract without moving an existing period anchor", async () => {
    const { state, service } = fixture();
    state.orderIntents.push({
      id: "new-link",
      orderId: "order",
      billingModulePaymentIntentId: "new-intent",
    });
    state.intents.push({
      id: "new-intent",
      type: "subscription",
      interval: "month",
      amount: 29,
      status: "succeeded",
    });
    state.intentCurrencies.push({
      id: "new-currency",
      paymentIntentId: "new-intent",
      currencyId: "star",
    });
    state.intentInvoices.push({
      id: "new-invoice-link",
      paymentIntentId: "new-intent",
      invoiceId: "new-paid",
    });
    state.invoices.push({
      id: "new-paid",
      status: "paid",
      amount: 29,
      createdAt: new Date("2026-10-21T00:00:00Z"),
    });
    const result = await service.execute({ id: "order" });
    expect(result.checkoutAttributesByCurrency).toEqual({
      amount: 29,
      type: "subscription",
      interval: "month",
    });
    expect(result.subscriptionPeriodInvoiceId).toBe("invoice");
    expect(result.subscriptionPeriodEndsAt).toEqual(
      state.order.subscriptionPeriodEndsAt,
    );
  });

  it("reads a retired-currency unbilled cart but still rejects that currency in new checkout", async () => {
    const { state, checkout, service, unbilled } = fixture();
    unbilled();
    state.orderCurrency.amount = "0";
    expect(
      (await service.execute({ id: "order" })).checkoutAttributesByCurrency
        .amount,
    ).toBe(0);
    await expect(
      checkout.execute({ id: "order", billingModuleCurrencyId: "star" }),
    ).rejects.toThrow("target price attributes");
  });

  it("keeps an unbilled canceled Star cart inspectable with its stored amount", async () => {
    const { state, service, unbilled } = fixture();
    unbilled("canceled");
    state.orderCurrency.amount = "0";
    const result = await service.execute({ id: "order" });
    expect(result.status).toBe("canceled");
    expect(result.type).toBe("cart");
    expect(result.checkoutAttributesByCurrency.amount).toBe(0);
    expect(result.ordersToBillingModulePaymentIntents).toEqual([]);
  });

  it("quotes a new unbilled RUB cart from current Product attributes", async () => {
    const { state, service, unbilled } = fixture();
    unbilled();
    state.orderCurrency.billingModuleCurrencyId = "rub";
    const result = await service.execute({ id: "order" });
    expect(result.checkoutAttributesByCurrency).toEqual({
      amount: 1900,
      type: "subscription",
      interval: "month",
    });
  });

  it("preserves the initial Free subscription behind its zero one_off settlement", async () => {
    const { state, checkout, service } = fixture();
    state.intents[0].type = "one_off";
    state.intents[0].interval = null;
    state.invoices[0].amount = 0;
    checkout.execute.mockResolvedValue({
      amount: 0,
      type: "subscription",
      interval: "day",
    });
    expect(
      (await service.execute({ id: "order" })).checkoutAttributesByCurrency,
    ).toEqual({ amount: 0, type: "subscription", interval: "day" });
  });

  it("does not hide unrelated current checkout failures behind a stored amount", async () => {
    const { checkout, service, unbilled } = fixture();
    unbilled();
    checkout.execute.mockRejectedValue(
      new Error("Internal error. Product has multiple target price attributes"),
    );
    await expect(service.execute({ id: "order" })).rejects.toThrow(
      "multiple target price attributes",
    );
  });

  it.each(["", "not-a-number", "-1"])(
    "rejects invalid stored cart amount %p instead of inventing a zero price",
    async (amount) => {
      const { state, service, unbilled } = fixture();
      unbilled();
      state.orderCurrency.amount = amount;
      await expect(service.execute({ id: "order" })).rejects.toThrow(
        "Stored Order amount is invalid",
      );
    },
  );

  it.each([
    "missing-anchor",
    "unpaid-ambiguity",
    "currency-ambiguity",
    "invoice-ambiguity",
    "missing-currency",
    "invalid-interval",
  ])(
    "rejects %s rather than choosing an unrelated payment context",
    async (kind) => {
      const { state, service } = fixture();
      if (kind === "missing-anchor")
        state.order.subscriptionPeriodInvoiceId = "foreign";
      if (kind === "unpaid-ambiguity") {
        state.order.subscriptionPeriodInvoiceId = null;
        state.invoices[0].status = "open";
        state.invoices.push({
          id: "second",
          status: "open",
          amount: 2,
          createdAt: new Date("2026-10-22T00:00:00Z"),
        });
        state.intentInvoices.push({
          id: "second-invoice",
          paymentIntentId: "intent",
          invoiceId: "second",
        });
      }
      if (kind === "currency-ambiguity")
        state.intentCurrencies.push({
          id: "other-currency",
          paymentIntentId: "intent",
          currencyId: "rub",
        });
      if (kind === "invoice-ambiguity") {
        state.orderIntents.push({
          id: "other-link",
          orderId: "order",
          billingModulePaymentIntentId: "other",
        });
        state.intents.push({
          id: "other",
          type: "subscription",
          interval: "month",
          amount: 1,
          status: "succeeded",
        });
        state.intentCurrencies.push({
          id: "other-currency",
          paymentIntentId: "other",
          currencyId: "star",
        });
        state.intentInvoices.push({
          id: "other-invoice",
          paymentIntentId: "other",
          invoiceId: "invoice",
        });
      }
      if (kind === "missing-currency")
        state.intentCurrencies[0].currencyId = "rub";
      if (kind === "invalid-interval") state.intents[0].interval = "fortnight";
      await expect(service.execute({ id: "order" })).rejects.toThrow(
        "Validation error.",
      );
    },
  );
});
