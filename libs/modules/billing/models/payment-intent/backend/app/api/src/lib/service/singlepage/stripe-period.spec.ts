import { Service } from "./stripe-period";

function fixture(reason = "subscription_cycle") {
  const resolve = jest.fn().mockResolvedValue({
    paymentIntentId:
      reason === "subscription_create" ? "contract-intent" : "next-intent",
  });
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
    service: new Service({ resolve, readLines }),
    resolve,
    readLines,
    line,
    invoice,
    subscription,
  };
}

it("uses the recurring line's coverage and immutable provider identities", async () => {
  const f = fixture();
  await expect(f.service.execute(f as any)).resolves.toEqual({
    paymentIntentId: "next-intent",
  });
  expect(f.resolve).toHaveBeenCalledWith({
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
  await f.service.execute(f as any);
  expect(f.resolve).toHaveBeenCalledWith(
    expect.objectContaining({ initial: true }),
  );
  f.invoice.billing_reason = "subscription_cycle";
  await expect(f.service.execute(f as any)).rejects.toThrow("reconciliation");
  expect(f.resolve).toHaveBeenCalledTimes(1);
});

it.each(["subscription_update", "manual"])(
  "does not allocate a fulfillment period for %s",
  async (reason) => {
    const f = fixture(reason);
    await expect(f.service.execute(f as any)).rejects.toThrow("reconciliation");
    expect(f.resolve).not.toHaveBeenCalled();
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
  expect(f.resolve).not.toHaveBeenCalled();
});

it("reads all line pages and leaves out-of-order allocation retryable", async () => {
  const f = fixture();
  f.invoice.lines.has_more = true;
  f.readLines.mockResolvedValue([f.line]);
  f.resolve.mockRejectedValue(
    new Error("Conflict error. Prior period is missing"),
  );
  await expect(f.service.execute(f as any)).rejects.toThrow(
    "Prior period is missing",
  );
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
  expect(f.resolve).not.toHaveBeenCalled();
});

it("refuses to allocate a renewal to the original contract intent", async () => {
  const f = fixture();
  f.resolve.mockResolvedValue({ paymentIntentId: "contract-intent" });
  await expect(f.service.execute(f as any)).rejects.toThrow(
    "own local subscription period",
  );
});
