import { withConsistencyDatabase } from "@sps/shared-backend-api";
import type { Repository } from "../../../repository";
import { Service } from "./index";

function fixture(overrides: Record<string, unknown> = {}) {
  const record = {
    id: "order",
    type: "history",
    status: "paying",
    updatedAt: new Date("2026-10-20T00:00:00Z"),
    subscriptionPeriodStartsAt: null,
    subscriptionPeriodEndsAt: null,
    subscriptionPeriodInvoiceId: null,
    subscriptionRevokedAt: null,
    paymentFailureCanceledAt: null,
    subscriptionSourceOrderId: null,
    subscriptionSourceInvoiceId: null,
    subscriptionSourceInterval: null,
    ...overrides,
  } as any;
  const repository = {
    insert: jest.fn().mockResolvedValue(record),
    consumeFirstByField: jest.fn().mockResolvedValue(record),
  };
  const service = new Service(repository as unknown as Repository);
  return { service, repository, record };
}

describe("Order lifecycle writes", () => {
  it("writes the complete period with the previous lifecycle anchor", async () => {
    const { service, repository, record } = fixture({
      status: "delivering",
      subscriptionPeriodInvoiceId: "invoice-a",
    });
    await service.writeSubscriptionPeriod({
      id: "order",
      before: record,
      startsAt: new Date("2026-10-21T00:00:00Z"),
      endsAt: new Date("2026-10-22T00:00:00Z"),
      invoiceId: "invoice-b",
      status: "delivering",
    });
    expect(repository.consumeFirstByField).toHaveBeenCalledWith(
      "id",
      "order",
      {
        subscriptionPeriodInvoiceId: "invoice-b",
        subscriptionPeriodStartsAt: expect.any(Date),
        subscriptionPeriodEndsAt: expect.any(Date),
        status: "delivering",
      },
      {
        and: expect.arrayContaining([
          { column: "status", method: "eq", value: "delivering" },
          { column: "updatedAt", method: "gte", value: record.updatedAt },
          {
            column: "updatedAt",
            method: "lt",
            value: new Date(record.updatedAt.getTime() + 1),
          },
          {
            column: "subscriptionPeriodInvoiceId",
            method: "eq",
            value: "invoice-a",
          },
          { column: "subscriptionRevokedAt", method: "isNull", value: null },
        ]),
      },
    );
  });

  it("marks only unfulfilled payment failures as recoverable and clears the mark after payment", async () => {
    const { service, repository, record } = fixture();
    await service.writePaymentStatus({ before: record, status: "canceling" });
    expect(repository.consumeFirstByField).toHaveBeenLastCalledWith(
      "id",
      "order",
      {
        type: "history",
        status: "canceling",
        paymentFailureCanceledAt: expect.any(Date),
      },
      {
        and: expect.arrayContaining([
          { column: "paymentFailureCanceledAt", method: "isNull", value: null },
        ]),
      },
    );
    await service.writePaymentStatus({
      before: { ...record, subscriptionRevokedAt: new Date() },
      status: "canceling",
    });
    expect(
      repository.consumeFirstByField.mock.calls.at(-1)?.[2]
        .paymentFailureCanceledAt,
    ).toBeNull();
    await service.writePaymentStatus({
      before: { ...record, paymentFailureCanceledAt: new Date() },
      status: "paid",
    });
    expect(repository.consumeFirstByField.mock.calls.at(-1)?.[2]).toEqual({
      type: "history",
      status: "paid",
      paymentFailureCanceledAt: null,
    });
  });

  it("requires an owner transaction before creating a next-period cart", async () => {
    const { service, repository } = fixture();
    const source = {
      sourceOrderId: "source",
      sourceInvoiceId: "invoice",
      interval: "month",
    };
    expect(() => service.createNextPeriodCart(source)).toThrow(
      "owner transaction",
    );
    expect(repository.insert).not.toHaveBeenCalled();
    await withConsistencyDatabase({}, () =>
      service.createNextPeriodCart(source),
    );
    expect(repository.insert).toHaveBeenCalledWith({
      type: "cart",
      status: "new",
      subscriptionSourceOrderId: "source",
      subscriptionSourceInvoiceId: "invoice",
      subscriptionSourceInterval: "month",
    });
  });
});
