/**
 * BDD Suite: Confirmed Knowledge Source attachment processing.
 * Given: an atomic repository update of notes and attachment relations.
 * When: links stay unchanged or analysis fails before commit.
 * Then: unchanged files skip analysis and failed analysis rejects the update.
 */
import { Service as KnowledgeService } from "./index";
const source = {
  id: "source",
  content: "Confirmed notes",
  contentHash: "hash",
  indexedContentHash: "hash",
};
function fixture(attachmentsChanged: boolean) {
  const repository: any = {
    updateSourceWithAttachments: jest
      .fn()
      .mockResolvedValue({ source, attachmentsChanged }),
    findSourceById: jest.fn().mockResolvedValue(source),
  };
  repository.withTransaction = (operation: (scope: any) => unknown) =>
    operation(repository);
  const service = new KnowledgeService({ source: repository });
  const rebuild = jest
    .spyOn(service, "rebuildFiles")
    .mockResolvedValue(source as any);
  const index = jest
    .spyOn(service, "indexAuthorizedSource")
    .mockResolvedValue({} as any);
  return { repository, service, rebuild, index };
}
it("does not repeat file analysis for already attached files", async () => {
  const f = fixture(false);
  const result = await f.service.updateSource({
    sourceId: "source",
    content: "Confirmed notes",
    expectedContentHash: "previous",
    fileIds: ["file"],
  });
  expect(f.repository.updateSourceWithAttachments).toHaveBeenCalledWith(
    expect.objectContaining({
      expectedContentHash: "previous",
      fileIds: ["file"],
    }),
  );
  expect(f.rebuild).not.toHaveBeenCalled();
  expect(f.index).toHaveBeenCalledWith({ sourceId: "source" }, f.repository);
  expect(result).toEqual({ source });
});
it("rejects the update when attachment analysis fails", async () => {
  const f = fixture(true);
  f.rebuild.mockRejectedValue(new Error("Provider unavailable"));
  await expect(
    f.service.updateSource({
      sourceId: "source",
      content: "Confirmed notes",
      fileIds: ["file"],
    }),
  ).rejects.toThrow("Provider unavailable");
  expect(f.index).not.toHaveBeenCalled();
});

it("rejects unsupported stored attachments before first-Source creation or external linking", async () => {
  const validateAttachments = jest
    .fn()
    .mockRejectedValue(new Error("SVG files are not supported in Knowledge."));
  const upsertSourceBySlug = jest.fn();
  const onSourceSaved = jest.fn();
  const service = new KnowledgeService({
    source: { validateAttachments, upsertSourceBySlug } as any,
  });
  await expect(
    service.learnContent({
      slug: "document",
      title: "Document",
      content: "Notes",
      fileIds: ["disguised-svg"],
      onSourceSaved,
    }),
  ).rejects.toThrow("SVG");
  expect(upsertSourceBySlug).not.toHaveBeenCalled();
  expect(onSourceSaved).not.toHaveBeenCalled();
});
