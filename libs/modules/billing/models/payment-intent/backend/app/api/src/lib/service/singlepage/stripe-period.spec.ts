import { Service } from "./stripe-period";

function fixture(reason = "subscription_cycle") {
  const readLines = jest.fn();
  const line = {
    currency: "usd",
    parent: {
      subscription_item_details: {
        subscription: "sub_contract",
        proration: false,
      },
    },
    period: { start: 1704067200, end: 1706745600 },
  };
  const invoice = {
    id: "in_period",
    currency: "usd",
    billing_reason: reason,
    amount_due: 10000,
    period_start: 1,
    period_end: 2,
    lines: { data: [line], has_more: false },
  };
  const subscription = {
    id: "sub_contract",
    metadata: { paymentIntentId: "contract-intent" },
  };
  return {
    service: new Service({ readLines }),
    readLines,
    line,
    invoice,
    subscription,
  };
}

it("uses the recurring line's coverage and immutable provider identities", async () => {
  const f = fixture();
  await expect(f.service.execute(f as any)).resolves.toEqual({
    provider: "stripe",
    contractPaymentIntentId: "contract-intent",
    providerSubscriptionId: "sub_contract",
    providerInvoiceId: "in_period",
    periodStart: "2024-01-01T00:00:00.000Z",
    periodEnd: "2024-02-01T00:00:00.000Z",
    amount: 100,
    currency: "usd",
    initial: false,
  });
});

it("allows first-only invoice items only on the initial subscription invoice", async () => {
  const f = fixture("subscription_create");
  const firstOnly = {
    currency: "usd",
    parent: {
      invoice_item_details: { subscription: "sub_contract", proration: false },
    },
  };
  f.invoice.lines.data.push(firstOnly as any);
  await expect(f.service.execute(f as any)).resolves.toMatchObject({
    initial: true,
  });
  f.invoice.billing_reason = "subscription_cycle";
  await expect(f.service.execute(f as any)).rejects.toThrow("reconciliation");
});

it.each(["subscription_update", "manual"])(
  "does not allocate a fulfillment period for %s",
  async (reason) => {
    const f = fixture(reason);
    await expect(f.service.execute(f as any)).rejects.toThrow("reconciliation");
  },
);

it("refuses prorations, foreign subscriptions and ambiguous recurring coverage", async () => {
  const f = fixture();
  f.line.parent.subscription_item_details.proration = true;
  await expect(f.service.execute(f as any)).rejects.toThrow("reconciliation");
  f.line.parent.subscription_item_details.proration = false;
  f.line.parent.subscription_item_details.subscription = "sub_foreign";
  await expect(f.service.execute(f as any)).rejects.toThrow("reconciliation");
  f.line.parent.subscription_item_details.subscription = "sub_contract";
  f.invoice.lines.data.push(f.line);
  await expect(f.service.execute(f as any)).rejects.toThrow("reconciliation");
});

it("reads all line pages to identify the recurring period", async () => {
  const f = fixture();
  f.invoice.lines.has_more = true;
  f.readLines.mockResolvedValue([f.line]);
  await expect(f.service.execute(f as any)).resolves.toMatchObject({
    providerInvoiceId: "in_period",
  });
  expect(f.readLines).toHaveBeenCalledWith("in_period");
});

it("checks the invoice's frozen subscription metadata against the remote contract", async () => {
  const f = fixture();
  Object.assign(f.invoice, {
    parent: {
      subscription_details: { metadata: { paymentIntentId: "foreign" } },
    },
  });
  await expect(f.service.execute(f as any)).rejects.toThrow("identity changed");
});
