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

  it("stores a detected image and cleans up only its new object if requested", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1sAAAAASUVORK5CYII=",
      "base64",
    );
    const location = "/file-storage/static/uploaded-cover.png";
    const uploadFile = jest.fn().mockResolvedValue(location);
    jest
      .mocked(Provider)
      .mockImplementation(() => ({ uploadFile, deleteFile }) as any);
    const entity = { id: "image-id", file: location };
    const repository = { insert: jest.fn().mockResolvedValue(entity) };
    const service = new Service(repository as any);
    const result = await service.storePublicImage(
      new File([png], "cover.png", { type: "image/png" }),
    );
    expect(result.entity).toBe(entity);
    expect(repository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        file: location,
        adminTitle: "cover.png",
        mimeType: "image/png",
        extension: "png",
        width: 1,
        height: 1,
      }),
    );
    expect(deleteFile).not.toHaveBeenCalled();
    await result.discard();
    expect(deleteFile).toHaveBeenCalledWith({ name: "uploaded-cover.png" });
  });

  it("rejects a spoofed image before using the public storage provider", async () => {
    const service = new Service({} as any);
    await expect(
      service.storePublicImage(
        new File(["not an image"], "cover.png", { type: "image/png" }),
      ),
    ).rejects.toThrow("Upload a PNG, JPEG, WebP, GIF or AVIF image");
    expect(Provider).not.toHaveBeenCalled();
  });
});
