import { Service } from "./index";
import { Repository } from "../../repository";
import { Configuration } from "../../configuration";

function fixture() {
  const record = {
    id: "order",
    status: "delivering",
    updatedAt: new Date("2026-10-20T00:00:00Z"),
    subscriptionPeriodStartsAt: new Date("2026-10-20T00:00:00Z"),
    subscriptionPeriodEndsAt: new Date("2026-10-21T00:00:00Z"),
    subscriptionPeriodInvoiceId: "invoice-a",
  };
  const repository = {
    find: jest.fn().mockResolvedValue([]),
    findFirstByField: jest.fn().mockResolvedValue(record),
    insert: jest.fn().mockResolvedValue({ id: "created" }),
    updateFirstByField: jest.fn().mockResolvedValue(record),
    consumeFirstByField: jest.fn().mockResolvedValue(record),
    seed: jest.fn().mockResolvedValue({}),
  };
  const service = Object.create(Service.prototype) as Service;
  service.repository = repository as unknown as Repository;
  return { service, repository, record };
}

describe("server-managed Order lifecycle fields", () => {
  it.each([
    "subscriptionPeriodStartsAt",
    "subscriptionPeriodEndsAt",
    "subscriptionPeriodInvoiceId",
    "subscriptionRevokedAt",
    "paymentFailureCanceledAt",
    "subscriptionSourceOrderId",
    "subscriptionSourceInvoiceId",
    "subscriptionSourceInterval",
  ])(
    "rejects injected %s through CRUD and conditional updates",
    async (field) => {
      const { service, repository } = fixture();
      const data = {
        [field]: field.endsWith("At") ? "2027-01-01T00:00:00Z" : "forged",
      };
      await expect(service.create({ data })).rejects.toThrow("server managed");
      await expect(service.update({ id: "order", data })).rejects.toThrow(
        "server managed",
      );
      await expect(
        service.update({
          id: "order",
          data: { ...data, metadata: {}, _expectedMetadata: {} } as any,
        }),
      ).rejects.toThrow("server managed");
      await expect(service.findOrCreate({ data })).rejects.toThrow(
        "server managed",
      );
      expect(repository.insert).not.toHaveBeenCalled();
      expect(repository.updateFirstByField).not.toHaveBeenCalled();
      expect(repository.consumeFirstByField).not.toHaveBeenCalled();
    },
  );

  it("strips null defaults and unchanged full-record lifecycle values", async () => {
    const { service, repository, record } = fixture();
    await service.create({
      data: {
        status: "new",
        subscriptionPeriodStartsAt: null,
        subscriptionPeriodEndsAt: null,
        subscriptionPeriodInvoiceId: null,
      },
    });
    expect(repository.insert).toHaveBeenCalledWith({ status: "new" });
    await service.update({
      id: "order",
      data: { ...record, comment: "changed" },
    });
    expect(repository.updateFirstByField).toHaveBeenCalledWith("id", "order", {
      id: "order",
      status: "delivering",
      comment: "changed",
    });
  });

  it("keeps conditional metadata writes and strips unchanged protected values", async () => {
    const { service, repository, record } = fixture();
    await service.update({
      id: "order",
      data: {
        ...record,
        metadata: { label: "new" },
        _expectedMetadata: { label: "old" },
      } as any,
    });
    expect(repository.consumeFirstByField).toHaveBeenCalledWith(
      "id",
      "order",
      {
        id: "order",
        status: "delivering",
        metadata: { label: "new" },
      },
      { and: [{ column: "metadata", method: "eq", value: { label: "old" } }] },
    );
    expect(repository.updateFirstByField).not.toHaveBeenCalled();
  });

  it("clears automatic recovery when a caller explicitly cancels the Order", async () => {
    const { service, repository } = fixture();
    await service.update({ id: "order", data: { status: "canceled" } });
    expect(repository.updateFirstByField).toHaveBeenCalledWith("id", "order", {
      status: "canceled",
      paymentFailureCanceledAt: null,
    });
  });

  it("preserves conditional conflict errors", async () => {
    const { service, repository } = fixture();
    repository.consumeFirstByField.mockResolvedValueOnce(undefined);
    await expect(
      service.update({
        id: "order",
        data: {
          metadata: {},
          _expectedMetadata: {},
        } as any,
      }),
    ).rejects.toThrow("Metadata changed");
  });

  it("keeps standard Order seed inactive before any database reads or writes", async () => {
    const repository = Object.create(Repository.prototype) as Repository;
    repository.configuration = new Configuration().getConfiguration();
    repository.find = jest.fn();
    repository.insert = jest.fn();
    repository.updateFirstByField = jest.fn();
    const service = Object.create(Service.prototype) as Service;
    service.repository = repository;
    await expect(service.seed()).resolves.toEqual({
      module: "ecommerce",
      name: "order",
      type: "model",
      seeds: [],
    });
    expect(repository.find).not.toHaveBeenCalled();
    expect(repository.insert).not.toHaveBeenCalled();
    expect(repository.updateFirstByField).not.toHaveBeenCalled();
  });

  it("uses the inherited insertion hook after find-or-create misses", async () => {
    class ProjectService extends Service {
      protected override async insert(data: Record<string, unknown>) {
        return super.insert({ ...data, comment: "project" });
      }
    }
    const { repository } = fixture();
    const service = Object.create(ProjectService.prototype) as ProjectService;
    service.repository = repository as unknown as Repository;
    await service.findOrCreate({
      data: { status: "new", subscriptionPeriodEndsAt: null },
    });
    expect(repository.insert).toHaveBeenCalledWith({
      status: "new",
      comment: "project",
    });
  });
});
