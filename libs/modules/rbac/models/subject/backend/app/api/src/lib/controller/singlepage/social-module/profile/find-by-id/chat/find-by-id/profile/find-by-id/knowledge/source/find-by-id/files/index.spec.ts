const mockSourceFiles = jest.fn();
const mockSetFiles = jest.fn();
const mockRebuild = jest.fn();
const mockCreateFile = jest.fn();
const mockReanalyze = jest.fn();
const mockSource = {
  id: "source",
  contentHash: "hash",
  indexedContentHash: "hash" as string | null,
};
jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => ({
  KnowledgeService: jest.fn(() => ({
    rebuildFiles: mockRebuild,
    source: {
      sourceFiles: mockSourceFiles,
      setFiles: mockSetFiles,
      findSourceById: jest.fn(async () => mockSource),
    },
  })),
}));
jest.mock("@sps/file-storage/models/file/sdk/server", () => ({
  api: { create: mockCreateFile },
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesUpdate:
      mockReanalyze,
  },
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
  mockReanalyze.mockResolvedValue({});
  mockSourceFiles.mockResolvedValue([
    { relation: { id: "first-link" }, file: { id: "first" } },
    { relation: { id: "second-link" }, file: { id: "second" } },
  ]);
  mockSetFiles.mockResolvedValue(undefined);
  mockRebuild.mockResolvedValue(undefined);
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
it("unlinks atomically and returns while the scoped background analysis is still running", async () => {
  const body = new FormData();
  body.set("removeFileId", "first");
  body.set("expectedContentHash", "hash");
  mockSource.indexedContentHash = null;
  mockReanalyze.mockImplementationOnce(() => new Promise(() => {}));
  const result = (await new Handler().execute(context(body))) as any;
  expect(mockSetFiles).toHaveBeenCalledWith(
    "source",
    ["second"],
    ["first", "second"],
    "hash",
  );
  expect(mockCreateFile).not.toHaveBeenCalled();
  expect(mockRebuild).not.toHaveBeenCalled();
  expect(mockReanalyze).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "subject",
      socialModuleProfileId: "requester",
      socialModuleChatId: "chat",
      targetSocialModuleProfileId: "assistant",
      knowledgeModuleSourceId: "source",
      data: { reanalyze: true },
    }),
  );
  expect(result.data.analysisPending).toBe(true);
});
it("reports failed explicit reanalysis without pretending the index is ready", async () => {
  const body = new FormData();
  body.set("reanalyze", "true");
  mockSource.indexedContentHash = null;
  mockRebuild.mockRejectedValueOnce(new Error("Rebuild unavailable"));
  const result = (await new Handler().execute(context(body))) as any;
  expect(result.data.processingError).toBe("Rebuild unavailable");
  expect(result.data.analysisPending).toBe(false);
  expect(mockReanalyze).not.toHaveBeenCalled();
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
