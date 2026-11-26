const mockSourceFiles = jest.fn();
const mockSetFiles = jest.fn();
const mockRebuild = jest.fn();
const mockCreateFile = jest.fn();
const mockDeleteFile = jest.fn();
const mockSource = {
  id: "source",
  contentHash: "hash",
  indexedContentHash: "hash" as string | null,
};
const mockScope = {
  sourceFiles: mockSourceFiles,
  setFiles: mockSetFiles,
  findSourceById: jest.fn(async () => mockSource),
};
jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => ({
  Service: jest.fn(() => ({
    rebuildFiles: mockRebuild,
    source: {
      ...mockScope,
      withTransaction: (operation: (scope: typeof mockScope) => unknown) =>
        operation(mockScope),
    },
  })),
}));
jest.mock("@sps/file-storage/models/file/sdk/server", () => ({
  api: { create: mockCreateFile, delete: mockDeleteFile },
}));
/**
 * BDD Suite: Scoped Knowledge attachments.
 * Given: a Source and uploaded or attached files.
 * When: files are uploaded, removed or reanalyzed.
 * Then: validated bytes and metadata are preserved and failures retain scope.
 */
import { Handler } from "./index";
function context(body: FormData) {
  return {
    req: {
      method: "POST",
      param: (name: string) =>
        ({
          id: "subject",
          socialModuleProfileId: "requester",
          socialModuleChatId: "chat",
          targetSocialModuleProfileId: "assistant",
          knowledgeModuleSourceId: "source",
        })[name],
      formData: async () => body,
    },
    json: (value: any) => value,
  } as any;
}
beforeEach(() => {
  jest.clearAllMocks();
  mockSource.indexedContentHash = "hash";
  mockSourceFiles.mockResolvedValue([
    { relation: { id: "first-link" }, file: { id: "first" } },
    { relation: { id: "second-link" }, file: { id: "second" } },
  ]);
  mockSetFiles.mockResolvedValue(undefined);
  mockRebuild.mockResolvedValue(mockSource);
});
it("rejects SVG uploads before persisting file or Source changes", async () => {
  const body = new FormData();
  body.set(
    "files",
    new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" }),
  );
  await expect(new Handler().execute(context(body))).rejects.toMatchObject({
    status: 400,
    message: expect.stringContaining("logo.svg"),
  });
  expect(mockCreateFile).not.toHaveBeenCalled();
  expect(mockSetFiles).not.toHaveBeenCalled();
});
it("preserves uploaded text bytes, filename and MIME type across FormData runtimes", async () => {
  const body = new FormData();
  body.set(
    "files",
    new File(["Original UTF-8 notes: привет"], "notes.txt", {
      type: "text/plain",
    }),
  );
  mockCreateFile.mockResolvedValue({ id: "uploaded" });
  await new Handler().execute(context(body));
  const uploaded = mockCreateFile.mock.calls[0][0].data.file;
  expect(uploaded.name).toBe("notes.txt");
  expect(uploaded.type).toBe("text/plain");
  expect(await uploaded.text()).toBe("Original UTF-8 notes: привет");
  expect(mockSetFiles).toHaveBeenCalledWith(
    "source",
    ["first", "second", "uploaded"],
    ["first", "second"],
    undefined,
  );
});
it("returns the rebuilt Source when removing an attachment", async () => {
  const body = new FormData();
  body.set("removeFileId", "first");
  body.set("expectedContentHash", "hash");
  mockSource.indexedContentHash = null;
  const result = (await new Handler().execute(context(body))) as any;
  expect(mockSetFiles).toHaveBeenCalledWith(
    "source",
    ["second"],
    ["first", "second"],
    "hash",
  );
  expect(mockCreateFile).not.toHaveBeenCalled();
  expect(mockRebuild).toHaveBeenCalledWith("source", mockScope);
  expect(result.data.source).toBe(mockSource);
});
it("rejects failed explicit reanalysis", async () => {
  const body = new FormData();
  body.set("reanalyze", "true");
  mockRebuild.mockRejectedValueOnce(new Error("Rebuild unavailable"));
  await expect(new Handler().execute(context(body))).rejects.toThrow(
    "Rebuild unavailable",
  );
});
it("discards only new uploads if indexing fails", async () => {
  const body = new FormData();
  body.set(
    "files",
    new File(["New notes"], "notes.txt", { type: "text/plain" }),
  );
  mockCreateFile.mockResolvedValue({ id: "new-upload" });
  mockRebuild.mockRejectedValueOnce(
    Object.assign(new Error("Index unavailable"), { status: 503 }),
  );
  await expect(new Handler().execute(context(body))).rejects.toMatchObject({
    status: 503,
  });
  expect(mockDeleteFile).toHaveBeenCalledTimes(1);
  expect(mockDeleteFile).toHaveBeenCalledWith(
    expect.objectContaining({ id: "new-upload" }),
  );
});
it("rejects unattached files and prevents analysis after a stale Source conflict", async () => {
  const body = new FormData();
  body.set("removeFileId", "foreign");
  await expect(new Handler().execute(context(body))).rejects.toThrow(
    "not attached",
  );
  expect(mockSetFiles).not.toHaveBeenCalled();
  body.set("removeFileId", "first");
  body.set("expectedContentHash", "stale");
  mockSetFiles.mockRejectedValue(new Error("Conflict error. Source changed"));
  await expect(new Handler().execute(context(body))).rejects.toMatchObject({
    status: 409,
  });
  expect(mockRebuild).not.toHaveBeenCalled();
});
