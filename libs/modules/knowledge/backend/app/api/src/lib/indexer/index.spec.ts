import { KnowledgeIndexer, hashContent } from "./index";

function setup(
  indexedContentHash: string | null = null,
  content = "Knowledge notes",
) {
  const source = {
    id: "source-1",
    title: "Notes",
    content,
    contentHash: hashContent(content),
    indexedContentHash,
  };
  const repository = {
    listSourcesForIndex: jest.fn().mockResolvedValue([source]),
    publishChunks: jest.fn().mockResolvedValue(true),
    clearDerivedData: jest.fn(),
  };
  const embeddingClient = {
    embedMany: jest.fn().mockResolvedValue([Array(768).fill(0.1)]),
    validateEmbedding: jest.fn(),
  };
  return {
    source,
    repository,
    embeddingClient,
    indexer: new KnowledgeIndexer({
      repository: repository as any,
      embeddingClient: embeddingClient as any,
    }),
  };
}

describe("Source indexing", () => {
  it("publishes text and vectors against the processed content hash", async () => {
    const { source, repository, embeddingClient, indexer } = setup();
    await indexer.index({ sourceId: source.id });
    expect(embeddingClient.embedMany).toHaveBeenCalledWith([source.content]);
    expect(repository.publishChunks).toHaveBeenCalledWith(
      source.id,
      source.contentHash,
      expect.arrayContaining([
        expect.objectContaining({ text: source.content }),
      ]),
    );
  });

  it("skips an unchanged indexed source and force reindexes it", async () => {
    const { embeddingClient, indexer } = setup(hashContent("Knowledge notes"));
    expect((await indexer.index()).skipped).toBe(1);
    expect(embeddingClient.embedMany).not.toHaveBeenCalled();
    await indexer.index({ force: true });
    expect(embeddingClient.embedMany).toHaveBeenCalledTimes(1);
  });

  it("dry run does not clear, embed or publish", async () => {
    const { repository, embeddingClient, indexer } = setup();
    await indexer.index({ dryRun: true, clear: true });
    expect(repository.clearDerivedData).not.toHaveBeenCalled();
    expect(repository.publishChunks).not.toHaveBeenCalled();
    expect(embeddingClient.embedMany).not.toHaveBeenCalled();
  });

  it("does not count stale publication as indexed", async () => {
    const { repository, indexer } = setup();
    repository.publishChunks.mockResolvedValue(false);
    expect(await indexer.index()).toMatchObject({ indexed: 0, skipped: 1 });
  });

  it("rejects incomplete vectors before publishing", async () => {
    const { repository, embeddingClient, indexer } = setup();
    embeddingClient.embedMany.mockResolvedValue([]);
    await expect(indexer.index()).rejects.toThrow("count");
    expect(repository.publishChunks).not.toHaveBeenCalled();
  });

  it("clears an empty source index without an embedding request", async () => {
    const { embeddingClient, indexer } = setup(null, "");
    embeddingClient.embedMany.mockResolvedValue([]);
    await indexer.index();
    expect(embeddingClient.embedMany).toHaveBeenCalledWith([]);
    expect(embeddingClient.validateEmbedding).not.toHaveBeenCalled();
  });
});
