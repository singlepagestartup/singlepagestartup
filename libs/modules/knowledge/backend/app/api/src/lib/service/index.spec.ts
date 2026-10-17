/**
 * BDD Suite: Confirmed Knowledge Source attachment processing.
 * Given: an atomic repository update of notes and attachment relations.
 * When: links stay unchanged or post-commit analysis fails.
 * Then: unchanged links avoid another provider request and failure is reported
 * separately from the committed notes and attachments.
 */
import { KnowledgeService } from "./index";
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
  const service = new KnowledgeService({ source: repository });
  const rebuild = jest
    .spyOn(service, "rebuildFiles")
    .mockResolvedValue(source as any);
  const index = jest.spyOn(service, "index").mockResolvedValue({} as any);
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
  expect(result).toEqual({
    source,
    indexError: undefined,
    processingError: undefined,
  });
});
it("reports post-commit analysis failure without rejecting the confirmed update", async () => {
  const f = fixture(true);
  f.rebuild.mockRejectedValue(new Error("Provider unavailable"));
  await expect(
    f.service.updateSource({
      sourceId: "source",
      content: "Confirmed notes",
      fileIds: ["file"],
    }),
  ).resolves.toEqual({
    source,
    indexError: undefined,
    processingError: "Provider unavailable",
  });
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
