/**
 * BDD Suite: atomic settlement for every billing provider with PostgreSQL.
 * Given: isolated Payment Intents, provider Invoices and relations.
 * When: duplicate callbacks race, payment details disagree or a write fails.
 * Then: one settlement commits, mismatches write nothing and failure is retryable without partial payment state.
 */
import { randomUUID } from "node:crypto";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Repository as IntentRepository } from "../../repository";
import { Configuration as IntentConfiguration } from "../../configuration";
import { Service as IntentService } from "./index";
import { createService as createInvoiceLinks } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/bootstrap";
import { createService } from "../../bootstrap";
import { createAppAssembly } from "@sps/shared-backend-api";
import {
  Service as Settlement,
  type IExecuteProps,
} from "./paykeeper-settlement";
import { paymentProviderPrecision } from "@sps/billing/models/payment-intent/sdk/model";
import { providerMinorUnits } from "@sps/backend-utils";

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  STRIPE_SECRET_KEY: "sk_test_fixture",
}));
let mockSubscriptionIntentId: string;
jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    subscriptions: {
      retrieve: jest.fn(async () => ({
        id: "sub_fixture",
        metadata: { paymentIntentId: mockSubscriptionIntentId },
      })),
    },
  })),
}));

const removals: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  jest.restoreAllMocks();
  for (const remove of removals.splice(0).reverse()) await remove();
});
afterAll(async () => {
  await getPostgresClient().end();
});

async function fixture(provider = "paykeeper", amount = 100) {
  const assembly = createAppAssembly();
  const service = createService(assembly);
  const { invoice: invoices, paymentIntentsToInvoices: relations } =
    service.module;
  const intent = await service.create({ data: { amount } as any });
  removals.push(() => service.delete({ id: intent.id }));
  const invoice = await invoices.create({
    data: {
      amount,
      status: "open",
      provider,
      providerId: "456",
    } as any,
  });
  removals.push(() => invoices.delete({ id: invoice.id }));
  const link = await relations.create({
    data: { paymentIntentId: intent.id, invoiceId: invoice.id } as any,
  });
  removals.push(() => relations.delete({ id: link.id }));
  const props: IExecuteProps = {
    event: {
      id: "301",
      orderid: intent.id,
      clientid: "",
      amountInMinorUnits: 10000,
      acknowledgment: "OK test",
    },
    invoiceId: invoice.id,
    providerId: "456",
    providerInvoice: {
      id: "456",
      status: "paid",
      orderid: intent.id,
      paymentid: "301",
      clientid: "",
      pay_amount: "100.00",
    } as any,
  };
  const settlement = new Settlement(service);
  const otherIntent = new IntentService(
    new IntentRepository(new IntentConfiguration()),
  ).withAppAssembly(assembly);
  const second = new Settlement(otherIntent);
  return {
    service,
    otherIntent,
    invoices,
    settlement,
    second,
    props,
    intent,
    invoice,
  };
}

it("serializes independent instances and preserves timestamps when the same callback is retried", async () => {
  const f = await fixture();
  const invoiceWrite = jest.spyOn(f.invoices, "update");
  const intentWrite = jest.spyOn(f.service, "update");
  const otherWrite = jest.spyOn(f.otherIntent, "update");
  await Promise.all([
    f.settlement.execute(f.props),
    f.second.execute(f.props),
    f.settlement.execute(f.props),
    f.second.execute(f.props),
  ]);
  expect(invoiceWrite).toHaveBeenCalledTimes(1);
  expect(intentWrite.mock.calls.length + otherWrite.mock.calls.length).toBe(1);
  const paid = await f.invoices.findById({ id: f.invoice.id });
  const succeeded = await f.service.findById({ id: f.intent.id });
  expect(paid?.status).toBe("paid");
  expect(succeeded?.status).toBe("succeeded");
  await f.second.execute(f.props);
  expect((await f.invoices.findById({ id: f.invoice.id }))?.updatedAt).toEqual(
    paid?.updatedAt,
  );
  expect((await f.service.findById({ id: f.intent.id }))?.updatedAt).toEqual(
    succeeded?.updatedAt,
  );
});

it("rolls back the Invoice when the Payment Intent update fails and then retries successfully", async () => {
  const f = await fixture();
  const fail = jest
    .spyOn(f.service, "update")
    .mockRejectedValueOnce(new Error("fixture payment write failure"));
  await expect(f.settlement.execute(f.props)).rejects.toThrow(
    "fixture payment write failure",
  );
  expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
    "open",
  );
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "requires_payment_method",
  );
  fail.mockRestore();
  await f.settlement.execute(f.props);
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "succeeded",
  );
});

it.each([
  { paymentid: "999" },
  { pay_amount: "100.99" },
  { orderid: randomUUID() },
  { clientid: "foreign-client" },
  { id: "another-invoice" },
  { status: "sent" },
])(
  "refuses mismatched provider confirmation (%p) without writes",
  async (change) => {
    const f = await fixture();
    await expect(
      f.settlement.execute({
        ...f.props,
        providerInvoice: { ...f.props.providerInvoice, ...change } as any,
      }),
    ).rejects.toThrow();
    expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
      "open",
    );
    expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
      "requires_payment_method",
    );
  },
);

it("does not revive a canceled Payment Intent", async () => {
  const f = await fixture();
  await f.service.update({
    id: f.intent.id,
    data: { ...f.intent, status: "canceled" },
  });
  await expect(f.settlement.execute(f.props)).rejects.toThrow(
    "Conflict error. Payment was canceled",
  );
  expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
    "open",
  );
});

it("settles an exact three-place amount through dummy when PayKeeper cannot represent it", async () => {
  const currency = { slug: "bhd", minorUnitDigits: 3 };
  expect(() =>
    providerMinorUnits(
      "1.005",
      paymentProviderPrecision("paykeeper", currency),
    ),
  ).toThrow();
  expect(
    providerMinorUnits("1.005", paymentProviderPrecision("dummy", currency)),
  ).toBe(1005);
  const f = await fixture("dummy", 1.005);
  await f.service.settlePayment({
    invoiceId: f.invoice.id,
    provider: "dummy",
    amount: 1.005,
  });
  expect((await f.invoices.findById({ id: f.invoice.id }))?.amount).toBe(1.005);
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "succeeded",
  );
});

const providers = [
  "paykeeper",
  "stripe",
  "cloudpayments",
  "tiptoppay",
  "0xprocessing",
  "payselection",
  "telegram-star",
  "dummy",
];

describe.each(providers)("Atomic settlement for %s", (provider) => {
  it("commits once across independent concurrent consumers and repeated delivery", async () => {
    const f = await fixture(provider);
    const other = createService(createAppAssembly());
    const invoiceWrite = jest.spyOn(f.invoices, "update");
    const otherInvoiceWrite = jest.spyOn(other.module.invoice, "update");
    const intentWrite = jest.spyOn(f.service, "update");
    const otherIntentWrite = jest.spyOn(other, "update");
    const input = {
      invoiceId: f.invoice.id,
      provider,
      providerId: "456",
      amount: 100,
    };
    await Promise.all([
      f.service.settlePayment(input),
      other.settlePayment(input),
      f.service.settlePayment(input),
      other.settlePayment(input),
    ]);
    expect(
      invoiceWrite.mock.calls.length + otherInvoiceWrite.mock.calls.length,
    ).toBe(1);
    expect(
      intentWrite.mock.calls.length + otherIntentWrite.mock.calls.length,
    ).toBe(1);
    const paid = await f.invoices.findById({ id: f.invoice.id });
    const succeeded = await f.service.findById({ id: f.intent.id });
    expect(paid?.status).toBe("paid");
    expect(succeeded?.status).toBe("succeeded");
    await other.settlePayment(input);
    expect(
      (await f.invoices.findById({ id: f.invoice.id }))?.updatedAt,
    ).toEqual(paid?.updatedAt);
    expect((await f.service.findById({ id: f.intent.id }))?.updatedAt).toEqual(
      succeeded?.updatedAt,
    );
  });

  it("rolls back both records on a write failure and allows retry", async () => {
    const f = await fixture(provider);
    const fail = jest
      .spyOn(f.service, "update")
      .mockRejectedValueOnce(new Error("fixture write failure"));
    const input = { invoiceId: f.invoice.id, provider, amount: 100 };
    await expect(f.service.settlePayment(input)).rejects.toThrow(
      "fixture write failure",
    );
    expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
      "open",
    );
    expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
      "requires_payment_method",
    );
    fail.mockRestore();
    await f.service.settlePayment(input);
    expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
      "succeeded",
    );
  });

  it("rejects a foreign provider, changed provider ID, changed amount and cancellation without writes", async () => {
    const f = await fixture(provider);
    const input = {
      invoiceId: f.invoice.id,
      provider,
      providerId: "456",
      amount: 100,
    };
    for (const change of [
      { provider: "foreign" },
      { providerId: "other" },
      { amount: 101 },
      { amount: 100.99 },
    ])
      await expect(
        f.service.settlePayment({ ...input, ...change }),
      ).rejects.toThrow();
    await f.service.update({
      id: f.intent.id,
      data: { ...f.intent, status: "canceled" },
    });
    await expect(f.service.settlePayment(input)).rejects.toThrow(
      "Payment was canceled",
    );
    expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
      "open",
    );
    expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
      "canceled",
    );
  });

  it("does not allow expiry to overwrite payment, including concurrent expiry", async () => {
    const f = await fixture(provider);
    const input = { invoiceId: f.invoice.id, provider, amount: 100 };
    const expiry = {
      invoiceId: f.invoice.id,
      provider,
      expiresBefore: new Date(Date.now() + 1000),
    };
    await Promise.all([
      f.service.settlePayment(input),
      f.service.expireInvoice(expiry),
    ]);
    await f.service.expireInvoice(expiry);
    expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
      "paid",
    );
    expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
      "succeeded",
    );
  });
});

it("keeps the intent payable until its last open invoice expires", async () => {
  const f = await fixture("cloudpayments");
  const second = await f.invoices.create({
    data: { provider: "dummy", amount: 100, status: "open" },
  });
  removals.push(() => f.invoices.delete({ id: second.id }));
  const relations = f.service.module.paymentIntentsToInvoices;
  const link = await relations.create({
    data: { paymentIntentId: f.intent.id, invoiceId: second.id },
  });
  const relationStore = createInvoiceLinks(createAppAssembly());
  removals.push(() => relationStore.delete({ id: link.id }));

  const expiresBefore = new Date(Date.now() + 1000);
  await f.service.expireInvoice({
    invoiceId: f.invoice.id,
    provider: "cloudpayments",
    expiresBefore,
  });
  expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
    "failed",
  );
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    f.intent.status,
  );

  await f.service.expireInvoice({
    invoiceId: second.id,
    provider: "dummy",
    expiresBefore,
  });
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "failed",
  );
});

it("keeps zero-amount dummy settlement atomic and idempotent", async () => {
  const f = await fixture("dummy", 0);
  await Promise.all(
    Array.from({ length: 4 }, () =>
      f.service.settlePayment({
        invoiceId: f.invoice.id,
        provider: "dummy",
        amount: 0,
      }),
    ),
  );
  expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
    "paid",
  );
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "succeeded",
  );
});

it("creates one paid invoice when a free checkout is submitted twice", async () => {
  const f = await fixture("paykeeper", 0);
  const links = createInvoiceLinks(createAppAssembly());
  try {
    const results = await Promise.all([
      f.service.settleFreePayment(f.intent.id, "stripe"),
      f.service.settleFreePayment(f.intent.id, "stripe"),
    ]);
    expect(results.map((intent) => intent?.status)).toEqual([
      "succeeded",
      "succeeded",
    ]);
    const relations = await links.find({
      params: {
        filters: {
          and: [
            { column: "paymentIntentId", method: "eq", value: f.intent.id },
          ],
        },
      },
    });
    const created = relations.filter((link) => link.invoiceId !== f.invoice.id);
    expect(created).toHaveLength(1);
    expect(
      await f.invoices.findById({ id: created[0].invoiceId }),
    ).toMatchObject({
      amount: 0,
      provider: "stripe",
      status: "paid",
    });
  } finally {
    const relations = await links.find({
      params: {
        filters: {
          and: [
            { column: "paymentIntentId", method: "eq", value: f.intent.id },
          ],
        },
      },
    });
    for (const link of relations) {
      if (link.invoiceId !== f.invoice.id) {
        await links.delete({ id: link.id });
        await f.invoices.delete({ id: link.invoiceId });
      }
    }
  }
});

it("handles overlapping invoices without deadlocks and updates a shared intent once", async () => {
  const f = await fixture("dummy");
  const secondInvoice = await f.invoices.create({
    data: { amount: 100, provider: "dummy", status: "open" } as any,
  });
  removals.push(() => f.invoices.delete({ id: secondInvoice.id }));
  const relation = createInvoiceLinks(createAppAssembly());
  const link = await relation.create({
    data: { paymentIntentId: f.intent.id, invoiceId: secondInvoice.id } as any,
  });
  removals.push(() => relation.delete({ id: link.id }));
  const write = jest.spyOn(f.service, "update");
  await Promise.all(
    [f.invoice.id, secondInvoice.id].map((invoiceId) =>
      f.service.settlePayment({ invoiceId, provider: "dummy", amount: 100 }),
    ),
  );
  expect(write).toHaveBeenCalledTimes(1);
});

it("does not reuse an already allocated invoice amount on a retry", async () => {
  const f = await fixture("dummy");
  const secondIntent = await f.service.create({ data: { amount: 100 } as any });
  removals.push(() => f.service.delete({ id: secondIntent.id }));
  await f.service.settlePayment({
    invoiceId: f.invoice.id,
    provider: "dummy",
    amount: 100,
  });
  const relations = createInvoiceLinks(createAppAssembly());
  const link = await relations.create({
    data: { paymentIntentId: secondIntent.id, invoiceId: f.invoice.id } as any,
  });
  removals.push(() => relations.delete({ id: link.id }));
  await expect(
    f.service.settlePayment({
      invoiceId: f.invoice.id,
      provider: "dummy",
      amount: 100,
    }),
  ).rejects.toThrow("does not cover");
  expect((await f.service.findById({ id: secondIntent.id }))?.status).toBe(
    "requires_payment_method",
  );
});

it("does not replace the Telegram charge on a concurrent different-charge delivery", async () => {
  const f = await fixture("telegram-star");
  await f.invoices.update({
    id: f.invoice.id,
    data: { ...f.invoice, providerId: null },
  });
  const input = {
    invoiceId: f.invoice.id,
    provider: "telegram-star",
    amount: 100,
  };
  const results = await Promise.allSettled(
    ["charge-a", "charge-b"].map((settledProviderId) =>
      f.service.settlePayment({ ...input, settledProviderId }),
    ),
  );
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
});

it("settles one invoice covering multiple intents in a stable lock order", async () => {
  const f = await fixture("dummy", 100);
  await f.service.update({
    id: f.intent.id,
    data: { ...f.intent, amount: 40 },
  });
  const other = await f.service.create({ data: { amount: 60 } as any });
  removals.push(() => f.service.delete({ id: other.id }));
  const relations = createInvoiceLinks(createAppAssembly());
  const link = await relations.create({
    data: { paymentIntentId: other.id, invoiceId: f.invoice.id } as any,
  });
  removals.push(() => relations.delete({ id: link.id }));
  const input = { invoiceId: f.invoice.id, provider: "dummy", amount: 100 };
  await Promise.all([
    f.service.settlePayment(input),
    f.service.settlePayment(input),
  ]);
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "succeeded",
  );
  expect((await f.service.findById({ id: other.id }))?.status).toBe(
    "succeeded",
  );
});

it("closes a completed Stripe checkout page while the asynchronous payment can still settle", async () => {
  const f = await fixture("stripe");
  const providerId = "cs_test_" + randomUUID();
  const pending = await f.invoices.update({
    id: f.invoice.id,
    data: {
      ...f.invoice,
      providerId,
      paymentUrl: "https://checkout.example/session",
    },
  });
  expect(pending).toBeTruthy();
  const object = {
    object: "checkout.session",
    id: providerId,
    status: "complete",
    payment_status: "unpaid",
    amount_total: 10000,
  };
  await f.service.stripe({
    action: "webhook",
    data: { data: { object } },
  } as any);
  expect(await f.invoices.findById({ id: f.invoice.id })).toMatchObject({
    status: "open",
    paymentUrl: "",
  });
  await f.service.expireInvoice({
    invoiceId: f.invoice.id,
    provider: "stripe",
    expiresBefore: new Date(Date.now() + 1000),
  });
  expect((await f.invoices.findById({ id: f.invoice.id }))?.status).toBe(
    "open",
  );
  await f.service.stripe({
    action: "webhook",
    data: { data: { object: { ...object, payment_status: "paid" } } },
  } as any);
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "succeeded",
  );
});

it("creates and settles the initial Stripe subscription invoice once across concurrent webhook deliveries", async () => {
  const f = await fixture("stripe");
  mockSubscriptionIntentId = f.intent.id;
  const providerId = "in_fixture_" + randomUUID();
  const relation = createInvoiceLinks(createAppAssembly());
  const event = {
    data: {
      object: {
        object: "invoice",
        id: providerId,
        subscription: "sub_fixture",
        billing_reason: "subscription_create",
        currency: "usd",
        status: "paid",
        amount_due: 10000,
        amount_paid: 10000,
      },
    },
  };
  try {
    const write = jest.spyOn(f.service, "update");
    await Promise.all(
      Array.from({ length: 4 }, () =>
        f.service.stripe({ action: "webhook", data: event } as any),
      ),
    );
    const rows = await f.invoices.find({
      params: {
        filters: {
          and: [{ column: "providerId", method: "eq", value: providerId }],
        },
      },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("paid");
    const links = await relation.find({
      params: {
        filters: {
          and: [{ column: "invoiceId", method: "eq", value: rows[0].id }],
        },
      },
    });
    expect(links).toHaveLength(1);
    expect(write).toHaveBeenCalledTimes(1);
    // An older pending event must not downgrade a committed payment.
    await f.service.stripe({
      action: "webhook",
      data: { data: { object: { ...event.data.object, status: "open" } } },
    } as any);
    expect((await f.invoices.findById({ id: rows[0].id }))?.status).toBe(
      "paid",
    );
  } finally {
    const rows = await f.invoices.find({
      params: {
        filters: {
          and: [{ column: "providerId", method: "eq", value: providerId }],
        },
      },
    });
    for (const row of rows) {
      const links = await relation.find({
        params: {
          filters: {
            and: [{ column: "invoiceId", method: "eq", value: row.id }],
          },
        },
      });
      for (const link of links) await relation.delete({ id: link.id });
      await f.invoices.delete({ id: row.id });
    }
  }
});

it("adopts a prepared renewal invoice atomically and serializes duplicate provider deliveries", async () => {
  const f = await fixture("stripe");
  mockSubscriptionIntentId = f.intent.id;
  const next = await f.service.create({
    data: { amount: 100, type: "subscription" } as any,
  });
  removals.push(() => f.service.delete({ id: next.id }));
  const draft = await f.invoices.create({
    data: { amount: 100, status: "draft", provider: "stripe" } as any,
  });
  removals.push(() => f.invoices.delete({ id: draft.id }));
  const relation = createInvoiceLinks(createAppAssembly());
  const link = await relation.create({
    data: { paymentIntentId: next.id, invoiceId: draft.id } as any,
  });
  removals.push(() => relation.delete({ id: link.id }));
  const providerId = "in_period_" + randomUUID();
  const event = {
    action: "webhook",
    data: {
      data: {
        object: {
          id: providerId,
          object: "invoice",
          subscription: "sub_fixture",
          status: "paid",
          billing_reason: "subscription_cycle",
          currency: "usd",
          amount_due: 10000,
          amount_paid: 10000,
          lines: {
            data: [
              {
                currency: "usd",
                parent: {
                  subscription_item_details: {
                    subscription: "sub_fixture",
                    proration: false,
                  },
                },
                period: { start: 1704067200, end: 1706745600 },
              },
            ],
            has_more: false,
          },
        },
      },
    },
  };
  const write = jest
    .spyOn(f.service, "update")
    .mockRejectedValueOnce(new Error("fixture settlement failure"));
  await expect(
    f.service.settleStripeSubscriptionInvoice(
      event.data.data.object as any,
      next.id,
      true,
    ),
  ).rejects.toThrow("fixture settlement failure");
  expect(await f.invoices.findById({ id: draft.id })).toMatchObject({
    status: "draft",
    providerId: null,
  });
  expect((await f.service.findById({ id: next.id }))?.status).toBe(
    "requires_payment_method",
  );
  write.mockRestore();
  await Promise.all(
    Array.from({ length: 4 }, () =>
      f.service.settleStripeSubscriptionInvoice(
        event.data.data.object as any,
        next.id,
        true,
      ),
    ),
  );
  const recorded = await f.invoices.find({
    params: {
      filters: {
        and: [{ column: "providerId", method: "eq", value: providerId }],
      },
    },
  });
  expect(recorded).toHaveLength(1);
  expect(recorded[0]).toMatchObject({ id: draft.id, status: "paid" });
  expect((await f.service.findById({ id: next.id }))?.status).toBe("succeeded");
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "requires_payment_method",
  );
  const linked = await relation.find({
    params: {
      filters: {
        and: [{ column: "invoiceId", method: "eq", value: draft.id }],
      },
    },
  });
  expect(linked).toHaveLength(1);
  expect(linked[0].paymentIntentId).toBe(next.id);
});

it("does not expire an orphan that acquired a relation before the lock was taken", async () => {
  const f = await fixture("dummy");
  await f.service.failUninitializedPaymentIntent(
    f.intent.id,
    new Date(Date.now() + 1000),
  );
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "requires_payment_method",
  );
  await f.service.settlePayment({
    invoiceId: f.invoice.id,
    provider: "dummy",
    amount: 100,
  });
  await f.service.failUninitializedPaymentIntent(
    f.intent.id,
    new Date(Date.now() + 1000),
  );
  expect((await f.service.findById({ id: f.intent.id }))?.status).toBe(
    "succeeded",
  );
});
