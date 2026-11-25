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
    hasEmbeddingIndex: jest.fn().mockResolvedValue(true),
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
      source: repository as any,
      embeddingClient: embeddingClient as any,
    }),
  };
}

describe("Source indexing", () => {
  it("coalesces embeddings without sharing publication or rollback across repository scopes", async () => {
    const first = setup();
    const second = setup();
    let releaseEmbeddings!: (vectors: number[][]) => void;
    const embeddings = new Promise<number[][]>((resolve) => {
      releaseEmbeddings = resolve;
    });
    first.embeddingClient.embedMany.mockReturnValue(embeddings);
    first.repository.publishChunks.mockRejectedValue(
      new Error("transaction rollback"),
    );

    const firstIndex = expect(
      first.indexer.index({ sourceId: first.source.id }),
    ).rejects.toThrow("transaction rollback");
    const secondIndex = second.indexer.index({ sourceId: second.source.id });
    await Promise.resolve();
    expect(first.embeddingClient.embedMany).toHaveBeenCalledTimes(1);
    expect(second.embeddingClient.embedMany).not.toHaveBeenCalled();
    releaseEmbeddings([Array<number>(768).fill(0.125)]);

    await firstIndex;
    await expect(secondIndex).resolves.toMatchObject({ indexed: 1 });
    expect(first.repository.publishChunks).toHaveBeenCalledTimes(1);
    expect(second.repository.publishChunks).toHaveBeenCalledTimes(1);
  });
  it("rebuilds old vectors whose Source hash is already fresh and labels the replacement", async () => {
    const { source, repository, embeddingClient } = setup(
      hashContent("Knowledge notes"),
    );
    const identity = "openai:text-embedding-3-large:768:v1";
    repository.hasEmbeddingIndex.mockResolvedValue(false);
    const indexer = new KnowledgeIndexer({
      source: repository as any,
      embeddingClient: embeddingClient as any,
      embeddingIndex: identity,
    });
    await expect(indexer.index({ sourceId: source.id })).resolves.toMatchObject(
      { indexed: 1 },
    );
    expect(repository.hasEmbeddingIndex).toHaveBeenCalledWith(
      [source.id],
      identity,
      false,
    );
    expect(repository.publishChunks).toHaveBeenCalledWith(
      source.id,
      source.contentHash,
      [
        expect.objectContaining({
          metadata: expect.objectContaining({ embeddingIndex: identity }),
        }),
      ],
    );
  });

  it("scans past an entirely fresh page when a bulk run has a small indexing limit", async () => {
    const { source, repository, indexer } = setup();
    const fresh = Array.from({ length: 50 }, (_, index) => ({
      ...source,
      id: `source-${index + 2}`,
      indexedContentHash: source.contentHash,
    }));
    repository.listSourcesForIndex
      .mockResolvedValueOnce(fresh)
      .mockResolvedValueOnce([source]);
    await expect(indexer.index({ limit: 1 })).resolves.toMatchObject({
      indexed: 1,
      skipped: 50,
    });
    expect(repository.listSourcesForIndex).toHaveBeenNthCalledWith(2, {
      limit: 50,
      afterId: fresh.at(-1)!.id,
    });
    expect(repository.publishChunks).toHaveBeenCalledTimes(1);
  });
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
    await expect(indexer.index()).rejects.toMatchObject({
      status: 503,
      cause: expect.objectContaining({
        message: expect.stringContaining("count"),
      }),
    });
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
