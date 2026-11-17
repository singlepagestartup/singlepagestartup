import { Service } from "./index";
import { withConsistencyDatabase } from "@sps/shared-backend-api";

const mockRetrieveInvoice = jest.fn();
const mockRetrieveSubscription = jest.fn();
const mockListInvoices = jest.fn();
const mockCreateSubscription = jest.fn();
const mockCreatePrice = jest.fn();
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "fixture-secret",
  STRIPE_SECRET_KEY: "sk_test_fixture",
}));
jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    invoices: { retrieve: mockRetrieveInvoice, list: mockListInvoices },
    subscriptions: {
      retrieve: mockRetrieveSubscription,
      create: mockCreateSubscription,
    },
    products: {
      search: jest.fn().mockResolvedValue({ data: [{ id: "prod" }] }),
    },
    prices: {
      list: jest.fn().mockResolvedValue({ data: [] }),
      create: mockCreatePrice,
    },
    customers: { list: jest.fn().mockResolvedValue({ data: [{ id: "cus" }] }) },
  })),
}));

function matches(record: any, props: any) {
  return (props?.params?.filters?.and ?? []).every((filter: any) => {
    if (filter.method === "inArray") {
      return filter.value.includes(record[filter.column]);
    }
    return record[filter.column] === filter.value;
  });
}

function fixture(withResolver = true) {
  const root = {
    id: "root",
    amount: 100,
    type: "subscription",
    interval: "month",
    status: "succeeded",
    checkoutMetadata: null,
  };
  const next = {
    ...root,
    id: "next",
    status: "requires_payment_method",
    checkoutMetadata: { providerContractPaymentIntentId: "root" },
  };
  const intents = new Map<string, any>([
    [root.id, root],
    [next.id, next],
  ]);
  const invoices = new Map<string, any>([
    [
      "initial",
      {
        id: "initial",
        amount: 100,
        status: "paid",
        provider: "stripe",
        providerId: "in_initial",
      },
    ],
    [
      "prepared",
      {
        id: "prepared",
        amount: 100,
        status: "draft",
        provider: "stripe",
        providerId: null,
      },
    ],
  ]);
  const links = [
    { paymentIntentId: "root", invoiceId: "initial" },
    { paymentIntentId: "next", invoiceId: "prepared" },
  ];
  const invoiceService = {
    find: jest.fn(async (props: any) =>
      [...invoices.values()].filter((item) => matches(item, props)),
    ),
    findById: jest.fn(async ({ id }: any) => invoices.get(id)),
    create: jest.fn(async ({ data }: any) => {
      const invoice = { id: "created", ...data };
      invoices.set(invoice.id, invoice);
      return invoice;
    }),
    update: jest.fn(async ({ id, data }: any) => {
      const invoice = { ...invoices.get(id), ...data };
      invoices.set(id, invoice);
      return invoice;
    }),
  };
  const relationService = {
    find: jest.fn(async (props: any) =>
      links.filter((item) => matches(item, props)),
    ),
    create: jest.fn(async ({ data }: any) => {
      links.push(data);
      return data;
    }),
  };
  const repository = {
    withPaymentIntentLock: jest.fn(async (_id: string, operation: () => any) =>
      operation(),
    ),
  };
  const service = new Service(
    repository as any,
    {
      invoice: invoiceService,
      paymentIntentsToInvoices: relationService,
    } as any,
  );
  jest
    .spyOn(service, "findById")
    .mockImplementation(async ({ id }: any) => intents.get(id));
  const settle = jest
    .spyOn(service, "settlePayment")
    .mockImplementation(async (props) => {
      const invoice = invoices.get(props.invoiceId);
      invoice.status = "paid";
      intents.get(props.paymentIntentId!).status = "succeeded";
      return invoice;
    });
  const resolve = jest.fn(async () => ({ paymentIntentId: "next" }));
  if (withResolver) {
    service.setProviderPeriodResolver(resolve);
  }
  const subscription = {
    id: "sub_contract",
    metadata: { paymentIntentId: "root" },
  };
  const remote = {
    id: "in_period",
    object: "invoice",
    created: 100,
    subscription: "sub_contract",
    billing_reason: "subscription_cycle",
    currency: "usd",
    status: "paid",
    amount_due: 10000,
    amount_paid: 10000,
    lines: {
      data: [
        {
          currency: "usd",
          parent: {
            subscription_item_details: {
              subscription: "sub_contract",
              proration: false,
            },
          },
          period: { start: 1704067200, end: 1706745600 },
        },
      ],
      has_more: false,
    },
  };
  mockRetrieveSubscription.mockResolvedValue(subscription);
  mockRetrieveInvoice.mockResolvedValue({ ...remote, id: "in_initial" });
  mockListInvoices.mockReturnValue({
    async *[Symbol.asyncIterator]() {
      yield remote;
    },
  });
  return {
    service,
    intents,
    invoices,
    links,
    invoiceService,
    relationService,
    settle,
    resolve,
    remote,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

it("adopts the next period's draft invoice and never appends a renewal to the root intent", async () => {
  const f = fixture();
  const event = { action: "webhook", data: { data: { object: f.remote } } };
  await f.service.stripe(event as any);
  await f.service.stripe(event as any);
  expect(f.invoiceService.create).not.toHaveBeenCalled();
  expect(f.relationService.create).not.toHaveBeenCalled();
  expect(f.invoices.get("prepared")).toMatchObject({
    status: "paid",
    providerId: "in_period",
  });
  expect(f.invoices.get("initial")).toMatchObject({
    status: "paid",
    providerId: "in_initial",
  });
  expect(f.links).toEqual([
    { paymentIntentId: "root", invoiceId: "initial" },
    { paymentIntentId: "next", invoiceId: "prepared" },
  ]);
  expect(f.settle).toHaveBeenCalledWith(
    expect.objectContaining({ paymentIntentId: "next", invoiceId: "prepared" }),
  );
  expect(mockCreateSubscription).not.toHaveBeenCalled();
});

it.each(["subscription_cycle", "subscription_update", undefined])(
  "fails closed for an unresolved %s invoice when no period resolver is composed",
  async (reason) => {
    const f = fixture(false);
    const remote = { ...f.remote, billing_reason: reason };
    await expect(
      f.service.stripe({
        action: "webhook",
        data: { data: { object: remote } },
      } as any),
    ).rejects.toThrow("Subscription period resolver is required");
    expect(f.invoiceService.create).not.toHaveBeenCalled();
    expect(f.invoiceService.update).not.toHaveBeenCalled();
    expect(f.relationService.create).not.toHaveBeenCalled();
    expect(f.settle).not.toHaveBeenCalled();
  },
);

it("can settle the initial subscription invoice without a recurring period resolver", async () => {
  const f = fixture(false);
  f.intents.get("root").status = "requires_payment_method";
  Object.assign(f.invoices.get("initial"), {
    status: "open",
    providerId: "in_period",
  });
  await f.service.stripe({
    action: "webhook",
    data: {
      data: { object: { ...f.remote, billing_reason: "subscription_create" } },
    },
  } as any);
  expect(f.settle).toHaveBeenCalledWith(
    expect.objectContaining({ paymentIntentId: "root", invoiceId: "initial" }),
  );
  expect(f.intents.get("root").status).toBe("succeeded");
  expect(f.intents.get("next").status).toBe("requires_payment_method");
});

it("preserves a settled legacy cycle replay without a resolver and without new writes", async () => {
  const f = fixture(false);
  f.invoices.get("initial").providerId = "in_period";
  await f.service.stripe({
    action: "webhook",
    data: { data: { object: f.remote } },
  } as any);
  expect(f.invoiceService.create).not.toHaveBeenCalled();
  expect(f.invoiceService.update).not.toHaveBeenCalled();
  expect(f.relationService.create).not.toHaveBeenCalled();
  expect(f.settle).not.toHaveBeenCalled();
});

it("cannot append another initial provider invoice to a settled intent without a resolver", async () => {
  const f = fixture(false);
  await expect(
    f.service.stripe({
      action: "webhook",
      data: {
        data: {
          object: { ...f.remote, billing_reason: "subscription_create" },
        },
      },
    } as any),
  ).rejects.toThrow("already settled");
  expect(f.invoiceService.create).not.toHaveBeenCalled();
  expect(f.relationService.create).not.toHaveBeenCalled();
  expect(f.settle).not.toHaveBeenCalled();
});

it("cannot bypass the missing-resolver fence by polling an open recurring invoice", async () => {
  const f = fixture(false);
  f.intents.get("root").status = "requires_payment_method";
  Object.assign(f.invoices.get("initial"), {
    status: "open",
    providerId: "in_period",
  });
  mockRetrieveInvoice.mockResolvedValue(f.remote);
  await expect(
    f.service.checkStripeInvoice(f.invoices.get("initial")),
  ).rejects.toThrow("Subscription period resolver is required");
  expect(f.settle).not.toHaveBeenCalled();
  expect(f.invoiceService.update).not.toHaveBeenCalled();
});

it("resolves the successor period before settling a polled recurring invoice", async () => {
  const f = fixture();
  Object.assign(f.invoices.get("prepared"), {
    status: "open",
    providerId: "in_period",
  });
  mockRetrieveInvoice.mockResolvedValue(f.remote);
  await f.service.checkStripeInvoice(f.invoices.get("prepared"));
  expect(f.resolve).toHaveBeenCalledWith(
    expect.objectContaining({ providerInvoiceId: "in_period" }),
  );
  expect(f.settle).toHaveBeenCalledWith(
    expect.objectContaining({ paymentIntentId: "next", invoiceId: "prepared" }),
  );
});

it("does not bind or settle an unresolved out-of-order receipt", async () => {
  const f = fixture();
  f.resolve.mockRejectedValueOnce(
    new Error("Conflict error. Previous period is missing"),
  );
  await expect(
    f.service.stripe({
      action: "webhook",
      data: { data: { object: f.remote } },
    } as any),
  ).rejects.toThrow("Previous period is missing");
  expect(f.invoiceService.update).not.toHaveBeenCalled();
  expect(f.invoiceService.create).not.toHaveBeenCalled();
  expect(f.settle).not.toHaveBeenCalled();
});

it("does not rebind a provider invoice already associated with a different local period", async () => {
  const f = fixture();
  f.invoices.get("initial").providerId = "in_period";
  f.invoices.get("initial").status = "open";
  await expect(
    f.service.stripe({
      action: "webhook",
      data: { data: { object: f.remote } },
    } as any),
  ).rejects.toThrow("another payment intent");
  expect(f.invoiceService.update).not.toHaveBeenCalled();
  expect(f.settle).not.toHaveBeenCalled();
});

it("refuses a changed prepared amount and ignores provider drafts until finalization", async () => {
  const f = fixture();
  await f.service.stripe({
    action: "webhook",
    data: { data: { object: { ...f.remote, status: "draft" } } },
  } as any);
  expect(f.resolve).not.toHaveBeenCalled();
  f.invoices.get("prepared").amount = 99;
  await expect(
    f.service.stripe({
      action: "webhook",
      data: { data: { object: f.remote } },
    } as any),
  ).rejects.toThrow("prepared period invoice");
  expect(f.invoiceService.update).not.toHaveBeenCalled();
  expect(f.settle).not.toHaveBeenCalled();
});

it("does not settle when the prepared invoice disappears during adoption", async () => {
  const f = fixture();
  f.invoiceService.update.mockResolvedValueOnce(null);
  await expect(
    f.service.stripe({
      action: "webhook",
      data: { data: { object: f.remote } },
    } as any),
  ).rejects.toThrow("Invoice not found");
  expect(f.invoiceService.create).not.toHaveBeenCalled();
  expect(f.settle).not.toHaveBeenCalled();
});

it.each(["void", "canceled"])(
  "does not replace a %s prepared invoice after a cancellation race",
  async (status) => {
    const f = fixture();
    f.invoices.get("prepared").status = status;
    await expect(
      f.service.stripe({
        action: "webhook",
        data: { data: { object: f.remote } },
      } as any),
    ).rejects.toThrow("requires payment reconciliation");
    expect(f.invoiceService.create).not.toHaveBeenCalled();
    expect(f.invoiceService.update).not.toHaveBeenCalled();
    expect(f.relationService.create).not.toHaveBeenCalled();
    expect(f.settle).not.toHaveBeenCalled();
  },
);

it("refuses a provider currency that differs from the saved checkout currency", async () => {
  const f = fixture();
  f.intents.get("next").checkoutCurrencyId = "saved-currency";
  f.service.billingModule.currency = {
    find: jest.fn(),
    findById: jest.fn().mockResolvedValue({ slug: "eur" }),
  };
  await expect(
    f.service.stripe({
      action: "webhook",
      data: { data: { object: f.remote } },
    } as any),
  ).rejects.toThrow("currency differs");
  expect(f.invoiceService.update).not.toHaveBeenCalled();
  expect(f.settle).not.toHaveBeenCalled();
});

it("preserves already-paid legacy renewal history without allocating another period", async () => {
  const f = fixture();
  f.invoices.get("initial").providerId = "in_period";
  f.resolve.mockResolvedValueOnce({ paymentIntentId: "root" });
  await f.service.stripe({
    action: "webhook",
    data: { data: { object: f.remote } },
  } as any);
  expect(f.resolve).toHaveBeenCalledWith(
    expect.objectContaining({
      contractPaymentIntentId: "root",
      recordedPaymentIntentId: "root",
      providerInvoiceId: "in_period",
      periodStart: "2024-01-01T00:00:00.000Z",
      periodEnd: "2024-02-01T00:00:00.000Z",
    }),
  );
  expect(f.invoiceService.update).not.toHaveBeenCalled();
  expect(f.settle).not.toHaveBeenCalled();
  expect(f.links).toEqual([
    { paymentIntentId: "root", invoiceId: "initial" },
    { paymentIntentId: "next", invoiceId: "prepared" },
  ]);
});

it("reconciles authoritative legacy provider coverage even when its local invoice is already paid", async () => {
  const f = fixture();
  f.resolve.mockResolvedValueOnce({ paymentIntentId: "root" });
  mockListInvoices.mockReturnValue({
    async *[Symbol.asyncIterator]() {
      yield { ...f.remote, id: "in_initial" };
    },
  });
  await f.service.reconcileSubscriptionPeriods({ id: "root" });
  expect(f.resolve).toHaveBeenCalledWith(
    expect.objectContaining({
      recordedPaymentIntentId: "root",
      providerInvoiceId: "in_initial",
    }),
  );
  expect(f.invoiceService.update).not.toHaveBeenCalled();
  expect(f.settle).not.toHaveBeenCalled();
});

it("recovers a lost renewal notification while checking the prepared local invoice", async () => {
  const f = fixture();
  await f.service.checkStripeInvoice(f.invoices.get("prepared"));
  expect(mockListInvoices).toHaveBeenCalledWith({
    subscription: "sub_contract",
    limit: 100,
  });
  expect(f.invoices.get("prepared")).toMatchObject({
    status: "paid",
    providerId: "in_period",
  });
  expect(mockCreateSubscription).not.toHaveBeenCalled();
});

it("does not call the provider for reconciliation inside a business transaction", async () => {
  const f = fixture();
  await expect(
    withConsistencyDatabase({} as any, () =>
      f.service.reconcileSubscriptionPeriods({ id: "root" }),
    ),
  ).rejects.toThrow("requires a committed transaction");
  expect(mockRetrieveInvoice).not.toHaveBeenCalled();
});

it("refuses any second provider submission for a prepared successor intent", async () => {
  const f = fixture();
  await expect(
    f.service.stripe({
      action: "create",
      entity: f.intents.get("next"),
      currency: "usd",
      email: "buyer@example.test",
      metadata: { email: "buyer@example.test", paymentIntentId: "next" },
    }),
  ).rejects.toThrow("existing provider contract");
  expect(mockCreateSubscription).not.toHaveBeenCalled();
});

it("adds first-only charges to the initial Stripe invoice without recurring them", async () => {
  const f = fixture();
  Object.assign(f.intents.get("root"), {
    amount: 120,
    checkoutMetadata: { providerRecurringAmount: 100 },
  });
  f.invoices.get("initial").amount = 120;
  mockCreatePrice.mockResolvedValue({ id: "price" });
  mockCreateSubscription.mockResolvedValue({
    id: "sub_contract",
    latest_invoice: {
      id: "in_initial",
      hosted_invoice_url: "https://stripe.example/in_initial",
    },
  });
  await f.service.stripe({
    action: "create",
    entity: f.intents.get("root"),
    currency: "usd",
    email: "buyer@example.test",
    metadata: { email: "buyer@example.test", paymentIntentId: "root" },
  });
  expect(mockCreatePrice).toHaveBeenCalledWith(
    expect.objectContaining({
      unit_amount: 10000,
      recurring: { interval: "month", interval_count: 1 },
    }),
  );
  expect(mockCreateSubscription).toHaveBeenCalledWith(
    expect.objectContaining({
      add_invoice_items: [
        {
          price_data: { currency: "usd", product: "prod", unit_amount: 2000 },
          quantity: 1,
        },
      ],
    }),
    { idempotencyKey: "sps:root:subscription" },
  );
});
