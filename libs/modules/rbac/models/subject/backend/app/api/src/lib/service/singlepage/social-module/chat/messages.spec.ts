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
    modules: {
      social: {
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
      fileStorage: { file: { find: readFiles, readBytes } },
    },
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
  const result = await new Service({ modules: { social: {} } } as any).enrich(
    [],
  );
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
    modules: {
      social: {
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
      fileStorage: { file: { find: async () => [stored], readBytes } },
    },
  } as any).enrich([{ id: "message" }] as any);
  expect(result[0].attachments).toEqual([
    expect.objectContaining({ id: "legacy", mimeType: "image/svg+xml" }),
  ]);
  expect(stored.mimeType).toBe("image/png");
});

it("indexes public file names and legacy protected records without reading media bytes or author profiles", async () => {
  const privateId = "ef00e598-d16c-424a-8f6b-b18a5156b76d";
  const findLinks = jest
    .fn()
    .mockResolvedValue([
      { messageId: "public", fileStorageModuleFileId: "file" },
    ]);
  const readBytes = jest.fn();
  const service = new Service({
    modules: {
      social: { messagesToFileStorageModuleFiles: { find: findLinks } },
      fileStorage: {
        file: {
          find: async () => [
            { id: "file", file: "/public/notes.txt", adminTitle: "Notes" },
          ],
          readBytes,
        },
      },
    },
  } as any);
  const result = await service.attachmentIndex([
    { id: "empty", variant: "default" },
    {
      id: "private",
      variant: "customer-work",
      metadata: {
        customerWorkMedia: {
          id: privateId,
          digest: "a".repeat(64),
          mimeType: "audio/wav",
        },
      },
    },
    { id: "public", variant: "default" },
  ] as any);
  expect(result.map((message) => message.id)).toEqual(["private", "public"]);
  expect(result[0].privateAttachments).toEqual([
    { id: privateId, name: "clip.wav", mimeType: "audio/wav" },
  ]);
  expect(result[0]).not.toHaveProperty("metadata");
  expect(result[0]).not.toHaveProperty("description");
  expect(result[1].publicAttachmentRefs).toEqual([
    { id: "file", name: "Notes" },
  ]);
  expect(findLinks.mock.calls[0][0].params.filters.and[0].value).toEqual([
    "empty",
    "public",
  ]);
  expect(readBytes).not.toHaveBeenCalled();
});
