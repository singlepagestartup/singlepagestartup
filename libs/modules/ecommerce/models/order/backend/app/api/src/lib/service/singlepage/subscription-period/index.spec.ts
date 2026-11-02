import { Service } from "./index";
import { intervalEnd } from "./utils";

const invoice = (id: string, createdAt: string, status = "paid") => ({
  id,
  createdAt: new Date(createdAt),
  status,
});

function fixture(
  overrides: Record<string, unknown> = {},
  invoices = [invoice("invoice-a", "2026-10-20T00:00:00Z")],
) {
  let order: any = {
    id: "order",
    status: "paid",
    type: "history",
    updatedAt: new Date("2026-10-21T00:00:00Z"),
    subscriptionPeriodStartsAt: null,
    subscriptionPeriodEndsAt: null,
    subscriptionPeriodInvoiceId: null,
    checkoutAttributesByCurrency: { type: "subscription", interval: "day" },
    ordersToBillingModulePaymentIntents: [
      {
        billingModulePaymentIntent: {
          paymentIntentsToInvoices: invoices.map((invoice) => ({ invoice })),
        },
      },
    ],
    ...overrides,
  };
  const write = jest.fn(
    async ({ before, startsAt, endsAt, invoiceId, status }) => {
      if (
        before.subscriptionPeriodInvoiceId !== order.subscriptionPeriodInvoiceId
      )
        return undefined;
      order = {
        ...order,
        subscriptionPeriodStartsAt: startsAt,
        subscriptionPeriodEndsAt: endsAt,
        subscriptionPeriodInvoiceId: invoiceId,
        status,
      };
      return order;
    },
  );
  const service = new Service({
    findByIdExtended: async () => order,
    findById: async () => order,
    writeSubscriptionPeriod: write,
  });
  return { service, write, order: () => order };
}

describe("confirmed subscription period", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-23T10:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  it("gives delayed first payment a complete interval from acceptance", async () => {
    const { service } = fixture();
    const result = await service.execute({
      id: "order",
      expectedInvoiceId: null,
    });
    expect(result.accepted).toBe(true);
    expect(result.order.subscriptionPeriodStartsAt).toEqual(
      new Date("2026-10-23T10:00:00Z"),
    );
    expect(result.order.subscriptionPeriodEndsAt).toEqual(
      new Date("2026-10-24T10:00:00Z"),
    );
    expect(result.order.status).toBe("delivering");
  });

  it("accepts one invoice once under simultaneous retries", async () => {
    const { service, write, order } = fixture();
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        service.execute({ id: "order", expectedInvoiceId: null }),
      ),
    );
    expect(results.filter((item) => item.accepted)).toHaveLength(1);
    expect(order().subscriptionPeriodEndsAt).toEqual(
      new Date("2026-10-24T10:00:00Z"),
    );
    await service.execute({ id: "order", expectedInvoiceId: "invoice-a" });
    expect(order().subscriptionPeriodEndsAt).toEqual(
      new Date("2026-10-24T10:00:00Z"),
    );
    expect(write).toHaveBeenCalledTimes(8);
  });

  it.each([
    ["2026-10-25T10:00:00Z", "2026-10-26T10:00:00Z"],
    ["2026-10-22T10:00:00Z", "2026-10-24T10:00:00Z"],
  ])(
    "renews one full interval from the later deadline/confirmation %s",
    async (endsAt, expected) => {
      const { service } = fixture(
        {
          status: "delivering",
          subscriptionPeriodInvoiceId: "invoice-a",
          subscriptionPeriodStartsAt: new Date("2026-10-20T10:00:00Z"),
          subscriptionPeriodEndsAt: new Date(endsAt),
        },
        [
          invoice("invoice-b", "2026-10-22T00:00:00Z"),
          invoice("invoice-a", "2026-10-20T00:00:00Z"),
        ],
      );
      const result = await service.execute({
        id: "order",
        expectedInvoiceId: "invoice-a",
      });
      expect(result.order.subscriptionPeriodInvoiceId).toBe("invoice-b");
      expect(result.order.subscriptionPeriodEndsAt).toEqual(new Date(expected));
      expect(result.order.subscriptionPeriodStartsAt).toEqual(
        new Date(endsAt) > new Date()
          ? new Date("2026-10-20T10:00:00Z")
          : new Date(),
      );
    },
  );

  it("ignores an OPEN renewal and an older paid invoice", async () => {
    const { service, write } = fixture(
      {
        status: "delivering",
        subscriptionPeriodInvoiceId: "invoice-b",
        subscriptionPeriodStartsAt: new Date("2026-10-22T00:00:00Z"),
        subscriptionPeriodEndsAt: new Date("2026-10-23T00:00:00Z"),
      },
      [
        invoice("invoice-a", "2026-10-20T00:00:00Z"),
        invoice("invoice-b", "2026-10-21T00:00:00Z"),
        invoice("invoice-c", "2026-10-22T00:00:00Z", "open"),
      ],
    );
    expect(
      (await service.execute({ id: "order", expectedInvoiceId: "invoice-b" }))
        .accepted,
    ).toBe(false);
    expect(write).not.toHaveBeenCalled();
  });

  it("orders equal creation dates by stable invoice id", async () => {
    const { service } = fixture({}, [
      invoice("invoice-b", "2026-10-20T00:00:00Z"),
      invoice("invoice-a", "2026-10-20T00:00:00Z"),
    ]);
    expect(
      (await service.execute({ id: "order", expectedInvoiceId: null })).order
        .subscriptionPeriodInvoiceId,
    ).toBe("invoice-b");
  });

  it("refuses an unowned/unpaid invoice and a legacy row without freeze", async () => {
    await expect(
      fixture({}, [
        invoice("open", "2026-10-20T00:00:00Z", "open"),
      ]).service.execute({ id: "order", expectedInvoiceId: null }),
    ).rejects.toThrow("confirmed paid invoice");
    await expect(
      fixture({ status: "delivering" }).service.execute({
        id: "order",
        expectedInvoiceId: null,
      }),
    ).rejects.toThrow("frozen");
  });

  it("freezes the legacy delivery clock without prolonging it and is replay safe", async () => {
    const { service, write } = fixture({ status: "delivering" });
    const input = { id: "order", expectedUpdatedAt: "2026-10-21T00:00:00Z" };
    const result = await service.freeze(input);
    expect(result.order.subscriptionPeriodStartsAt).toEqual(
      new Date(input.expectedUpdatedAt),
    );
    expect(result.order.subscriptionPeriodEndsAt).toEqual(
      new Date("2026-10-22T00:00:00Z"),
    );
    expect((await service.freeze(input)).accepted).toBe(false);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("refuses a concurrent legacy update and incomplete period", async () => {
    await expect(
      fixture({ status: "delivering" }).service.freeze({
        id: "order",
        expectedUpdatedAt: "2026-10-19T00:00:00Z",
      }),
    ).rejects.toThrow("changed");
    await expect(
      fixture({
        status: "delivering",
        subscriptionPeriodEndsAt: new Date(),
      }).service.freeze({
        id: "order",
        expectedUpdatedAt: "2026-10-21T00:00:00Z",
      }),
    ).rejects.toThrow("Incomplete");
  });

  it.each(["minute", "hour", "day", "week", "month", "year"])(
    "supports the existing calendar interval %s",
    (interval) => {
      expect(intervalEnd(new Date(), interval).getTime()).toBeGreaterThan(
        Date.now(),
      );
    },
  );
});
