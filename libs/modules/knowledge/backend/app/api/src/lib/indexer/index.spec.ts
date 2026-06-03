/**
 * BDD Suite: knowledge indexer input normalization.
 *
 * Given: repository rows can contain non-string values from existing data.
 * When: the Knowledge indexer prepares content for hashing and embeddings.
 * Then: it normalizes indexable document fields before derived source/chunk writes.
 */

import { KnowledgeIndexer, hashContent } from "./index";

describe("knowledge indexer input normalization", () => {
  /**
   * BDD Scenario: non-string document description.
   *
   * Given: a document row has a Date-like description value.
   * When: the document is indexed.
   * Then: hashing, embeddings, and source creation receive normalized string content.
   */
  it("normalizes document description before hashing and source creation", async () => {
    const description = new Date("2026-01-01T00:00:00.000Z");
    const repository = {
      listDocumentsForIndex: jest.fn().mockResolvedValue([
        {
          id: "document-1",
          title: "Document",
          slug: "document",
          description,
          status: "imported",
          summary: "",
          tags: [],
          metadata: {},
          contentHash: "",
          lastIndexedAt: null,
        },
      ]),
      getDocumentOriginalPath: jest
        .fn()
        .mockReturnValue("knowledge-document:1"),
      findSourceByOriginalPath: jest.fn().mockResolvedValue(null),
      upsertSourceForDocument: jest.fn().mockResolvedValue({
        id: "source-1",
      }),
      deleteChunksBySourceId: jest.fn(),
      insertChunksForSource: jest.fn().mockResolvedValue([]),
      updateDocumentIndexMetadata: jest.fn(),
    };
    const embeddingClient = {
      embedMany: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    };

    const indexer = new KnowledgeIndexer({
      repository: repository as any,
      embeddingClient: embeddingClient as any,
    });

    await indexer.index({
      documentId: "document-1",
    });

    expect(embeddingClient.embedMany).toHaveBeenCalledWith([
      "2026-01-01T00:00:00.000Z",
    ]);
    expect(repository.upsertSourceForDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        document: expect.objectContaining({
          description: "2026-01-01T00:00:00.000Z",
        }),
      }),
    );
  });

  /**
   * BDD Scenario: already-indexed document status healing.
   *
   * Given: a document has matching indexed chunks but still has an imported status.
   * When: the document is reindexed.
   * Then: the indexer updates document metadata without embedding the content again.
   */
  it("marks already-indexed imported documents as indexed on reindex", async () => {
    const description = "Knowledge notes";
    const contentHash = hashContent(description);
    const repository = {
      listDocumentsForIndex: jest.fn().mockResolvedValue([
        {
          id: "document-1",
          title: "Document",
          slug: "document",
          description,
          status: "imported",
          summary: "",
          tags: [],
          metadata: {},
          contentHash,
          lastIndexedAt: null,
        },
      ]),
      getDocumentOriginalPath: jest
        .fn()
        .mockReturnValue("knowledge-document:document-1"),
      findSourceByOriginalPath: jest.fn().mockResolvedValue({
        id: "source-1",
        contentHash,
      }),
      hasSourceChunks: jest.fn().mockResolvedValue(true),
      updateDocumentIndexMetadata: jest.fn(),
    };
    const embeddingClient = {
      embedMany: jest.fn(),
    };

    const indexer = new KnowledgeIndexer({
      repository: repository as any,
      embeddingClient: embeddingClient as any,
    });

    await indexer.index({
      documentId: "document-1",
    });

    expect(embeddingClient.embedMany).not.toHaveBeenCalled();
    expect(repository.updateDocumentIndexMetadata).toHaveBeenCalledWith({
      documentId: "document-1",
      contentHash,
    });
  });
});
