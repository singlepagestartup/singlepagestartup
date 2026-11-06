import { DatabaseRepository } from "@sps/shared-backend-api";
import { Repository } from "./repository";

describe("server managed subscription period", () => {
  const record = {
    id: "order",
    status: "delivering",
    updatedAt: new Date("2026-10-20T00:00:00Z"),
    subscriptionPeriodStartsAt: new Date("2026-10-20T00:00:00Z"),
    subscriptionPeriodEndsAt: new Date("2026-10-21T00:00:00Z"),
    subscriptionPeriodInvoiceId: "invoice-a",
  };
  let repository: Repository;
  let insert: jest.SpyInstance;
  let update: jest.SpyInstance;
  let consume: jest.SpyInstance;
  beforeEach(() => {
    repository = Object.create(Repository.prototype);
    repository.findFirstByField = jest.fn().mockResolvedValue(record);
    insert = jest
      .spyOn(DatabaseRepository.prototype, "insert")
      .mockResolvedValue({} as any);
    update = jest
      .spyOn(DatabaseRepository.prototype, "updateFirstByField")
      .mockResolvedValue({});
    consume = jest
      .spyOn(DatabaseRepository.prototype, "consumeFirstByField")
      .mockResolvedValue({});
  });
  afterEach(() => jest.restoreAllMocks());

  it.each([
    "subscriptionPeriodStartsAt",
    "subscriptionPeriodEndsAt",
    "subscriptionPeriodInvoiceId",
    "subscriptionRevokedAt",
  ])(
    "rejects injected %s on create/update/conditional writes",
    async (field) => {
      const data = {
        [field]: field.endsWith("InvoiceId")
          ? "forged-invoice"
          : "2027-01-01T00:00:00Z",
      };
      expect(() => repository.insert(data)).toThrow("server managed");
      await expect(
        repository.updateFirstByField("id", "order", data),
      ).rejects.toThrow("server managed");
      await expect(
        repository.consumeFirstByField("id", "order", data),
      ).rejects.toThrow("server managed");
      expect(insert).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(consume).not.toHaveBeenCalled();
    },
  );

  it("accepts harmless null defaults on create and strips unchanged period fields from spread updates", async () => {
    await repository.insert({
      status: "new",
      subscriptionPeriodStartsAt: null,
      subscriptionPeriodEndsAt: null,
      subscriptionPeriodInvoiceId: null,
    });
    expect(insert).toHaveBeenCalledWith({ status: "new" });
    await repository.updateFirstByField("id", "order", {
      ...record,
      comment: "changed",
    });
    expect(update).toHaveBeenCalledWith("id", "order", {
      id: "order",
      status: "delivering",
      updatedAt: record.updatedAt,
      comment: "changed",
    });
  });

  it("puts all fields and the full previous anchor into one conditional write", async () => {
    await repository.writeSubscriptionPeriod({
      id: "order",
      before: record as any,
      startsAt: new Date("2026-10-21T00:00:00Z"),
      endsAt: new Date("2026-10-22T00:00:00Z"),
      invoiceId: "invoice-b",
      status: "delivering",
    });
    expect(consume).toHaveBeenCalledWith(
      "id",
      "order",
      expect.objectContaining({
        subscriptionPeriodInvoiceId: "invoice-b",
        subscriptionPeriodStartsAt: expect.any(Date),
        subscriptionPeriodEndsAt: expect.any(Date),
      }),
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
        ]),
      },
    );
  });
});
