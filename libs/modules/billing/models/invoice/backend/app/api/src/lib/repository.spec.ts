import { DatabaseRepository } from "@sps/shared-backend-api";
import { Repository } from "./repository";

describe("invoice creation clock", () => {
  const createdAt = new Date("2026-10-20T00:00:00Z");
  let repository: Repository;
  let insert: jest.SpyInstance;
  let update: jest.SpyInstance;
  let consume: jest.SpyInstance;
  beforeEach(() => {
    repository = Object.create(Repository.prototype);
    repository.findFirstByField = jest
      .fn()
      .mockResolvedValue({ id: "invoice-a", createdAt });
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

  it("rejects forged dates on create and leaves the database default in charge", async () => {
    expect(() => repository.insert({ status: "open", createdAt })).toThrow(
      "server assigned",
    );
    await repository.insert({ status: "open" });
    expect(insert).toHaveBeenCalledWith({ status: "open" });
  });

  it.each(["2026-10-25T00:00:00Z", null, "invalid"])(
    "rejects changed dates through generic and conditional writes: %s",
    async (date) => {
      await expect(
        repository.updateFirstByField("id", "invoice-a", {
          createdAt: date,
          status: "paid",
        }),
      ).rejects.toThrow("immutable");
      await expect(
        repository.consumeFirstByField("id", "invoice-a", {
          createdAt: date,
          status: "paid",
        }),
      ).rejects.toThrow("immutable");
      expect(update).not.toHaveBeenCalled();
      expect(consume).not.toHaveBeenCalled();
    },
  );

  it("allows existing provider spread payloads while excluding createdAt from the SQL patch", async () => {
    const payload = {
      id: "invoice-a",
      createdAt: createdAt.toISOString(),
      status: "paid",
    };
    await repository.updateFirstByField("id", "invoice-a", payload);
    expect(update).toHaveBeenCalledWith("id", "invoice-a", {
      id: "invoice-a",
      status: "paid",
    });
    expect(payload.createdAt).toBe(createdAt.toISOString());
  });
});
