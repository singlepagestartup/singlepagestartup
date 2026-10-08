import { Provider } from "@sps/providers-file-storage";
import { Service } from ".";

jest.mock("@sps/providers-file-storage", () => ({
  Provider: jest.fn(),
}));

describe("File Storage service", () => {
  const file = { id: "file", file: "/public/file-storage/static/report.pdf" };
  let deleteFile: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    deleteFile = jest.fn().mockResolvedValue(undefined);
    jest.mocked(Provider).mockImplementation(() => ({ deleteFile }) as any);
  });

  it("removes stored bytes once before deleting the record without Knowledge", async () => {
    const repository = {
      findFirstByField: jest.fn().mockResolvedValue(file),
      deleteFirstByField: jest.fn().mockResolvedValue(file),
    };
    const service = new Service(repository as any);

    await expect(service.delete({ id: file.id })).resolves.toBe(file);
    expect(deleteFile).toHaveBeenCalledTimes(1);
    expect(deleteFile).toHaveBeenCalledWith({ name: "report.pdf" });
    expect(repository.deleteFirstByField).toHaveBeenCalledWith("id", file.id);
    expect(deleteFile.mock.invocationCallOrder[0]).toBeLessThan(
      repository.deleteFirstByField.mock.invocationCallOrder[0],
    );
  });

  it("keeps the record when the storage provider rejects deletion", async () => {
    deleteFile.mockRejectedValueOnce(new Error("storage unavailable"));
    const repository = {
      findFirstByField: jest.fn().mockResolvedValue(file),
      deleteFirstByField: jest.fn(),
    };
    const service = new Service(repository as any);

    await expect(service.delete({ id: file.id })).rejects.toThrow(
      "storage unavailable",
    );
    expect(repository.deleteFirstByField).not.toHaveBeenCalled();
  });

  it("updates an ordinary file through its own repository", async () => {
    const updated = { ...file, alt: "Updated report" };
    const repository = {
      updateFirstByField: jest.fn().mockResolvedValue(updated),
    };
    const service = new Service(repository as any);

    await expect(
      service.update({ id: file.id, data: updated as any }),
    ).resolves.toBe(updated);
    expect(repository.updateFirstByField).toHaveBeenCalledWith(
      "id",
      file.id,
      updated,
    );
    expect(Provider).not.toHaveBeenCalled();
  });
});
