import type { Repository } from "../../repository";
import { Service } from "./index";

describe("invoice creation clock", () => {
  const createdAt = new Date("2026-10-20T00:00:00Z");
  function fixture() {
    const repository = {
      find: jest.fn().mockResolvedValue([]),
      findFirstByField: jest
        .fn()
        .mockResolvedValue({ id: "invoice-a", createdAt }),
      insert: jest.fn().mockResolvedValue({}),
      updateFirstByField: jest.fn().mockResolvedValue({}),
      consumeFirstByField: jest.fn().mockResolvedValue({}),
    };
    return {
      repository,
      service: new Service(repository as unknown as Repository),
    };
  }

  it("rejects forged dates on create and leaves the database default in charge", async () => {
    const { repository, service } = fixture();
    await expect(
      service.create({ data: { status: "open", createdAt } }),
    ).rejects.toThrow("server assigned");
    await expect(service.findOrCreate({ data: { createdAt } })).rejects.toThrow(
      "server assigned",
    );
    await service.create({ data: { status: "open" } });
    expect(repository.insert).toHaveBeenCalledWith({ status: "open" });
  });

  it.each(["2026-10-25T00:00:00Z", null, "invalid"])(
    "rejects changed dates through generic and conditional writes: %s",
    async (date) => {
      const { repository, service } = fixture();
      for (const extra of [{}, { metadata: {}, _expectedMetadata: {} }]) {
        await expect(
          service.update({
            id: "invoice-a",
            data: {
              ...extra,
              createdAt: date as unknown as Date,
              status: "paid",
            },
          }),
        ).rejects.toThrow("immutable");
      }
      expect(repository.updateFirstByField).not.toHaveBeenCalled();
      expect(repository.consumeFirstByField).not.toHaveBeenCalled();
    },
  );

  it("allows existing provider spread payloads while excluding createdAt from the SQL patch", async () => {
    const { repository, service } = fixture();
    const payload = {
      id: "invoice-a",
      createdAt: createdAt.toISOString() as unknown as Date,
      status: "paid",
    };
    await service.update({
      id: "invoice-a",
      data: payload,
    });
    expect(repository.updateFirstByField).toHaveBeenCalledWith(
      "id",
      "invoice-a",
      {
        id: "invoice-a",
        status: "paid",
      },
    );
    expect(payload.createdAt).toBe(createdAt.toISOString());
  });
});
