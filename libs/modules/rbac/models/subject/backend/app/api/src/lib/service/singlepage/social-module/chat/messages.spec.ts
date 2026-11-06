const readFiles = jest.fn();
const readBytes = jest.fn(async () => Buffer.from("Fixture text"));
import { Service } from "./messages";

beforeEach(() => readFiles.mockReset());
it("returns authors and all ordered attachments only for the authorized messages", async () => {
  const authors = {
    find: jest
      .fn()
      .mockResolvedValue([{ messageId: "message", profileId: "owner" }]),
  };
  const links = {
    find: jest.fn().mockResolvedValue([
      {
        messageId: "message",
        fileStorageModuleFileId: "second",
        orderIndex: 1,
      },
      { messageId: "message", fileStorageModuleFileId: "first", orderIndex: 0 },
    ]),
  };
  readFiles.mockResolvedValue([{ id: "first" }, { id: "second" }]);
  const result = await new Service({
    socialModule: {
      profile: {
        profilePresentation: jest.fn(async ({ id }) => ({
          id,
          title: { en: "Former member" },
          subtitle: {},
          avatar: null,
        })),
      },
      profilesToMessages: authors,
      messagesToFileStorageModuleFiles: links,
    },
    fileStorageModule: { file: { find: readFiles, readBytes } },
  } as any).enrich([{ id: "message", description: "hello" }] as any);
  expect(result[0].authorProfileIds).toEqual(["owner"]);
  expect(result[0].authorProfiles).toEqual([
    { id: "owner", title: { en: "Former member" }, subtitle: {}, avatar: null },
  ]);
  expect(result[0].attachments?.map((f) => f.id)).toEqual(["first", "second"]);
  expect(authors.find).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [{ column: "messageId", method: "inArray", value: ["message"] }],
      },
    },
  });
  expect(readFiles).toHaveBeenCalledWith(
    expect.objectContaining({
      params: {
        filters: {
          and: [
            { column: "id", method: "inArray", value: ["second", "first"] },
          ],
        },
      },
    }),
  );
});

it("does not enumerate authors or files for an empty chat", async () => {
  const result = await new Service({ socialModule: {} } as any).enrich([]);
  expect(result).toEqual([]);
  expect(readFiles).not.toHaveBeenCalled();
});

it("blocks a legacy renamed SVG read projection and preserves its File record and gallery order", async () => {
  const stored = {
    id: "legacy",
    file: "/renamed.png",
    mimeType: "image/png",
    extension: "png",
  };
  const readBytes = jest.fn(async () =>
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
  );
  const result = await new Service({
    socialModule: {
      profilesToMessages: { find: async () => [] },
      messagesToFileStorageModuleFiles: {
        find: async () => [
          {
            messageId: "message",
            fileStorageModuleFileId: "legacy",
            orderIndex: 0,
          },
        ],
      },
    },
    fileStorageModule: { file: { find: async () => [stored], readBytes } },
  } as any).enrich([{ id: "message" }] as any);
  expect(result[0].attachments).toEqual([
    expect.objectContaining({ id: "legacy", mimeType: "image/svg+xml" }),
  ]);
  expect(stored.mimeType).toBe("image/png");
});
