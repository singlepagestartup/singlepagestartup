/**
 * BDD Suite: knowledge service.
 *
 * Given: Knowledge is a social-agnostic RAG service.
 * When: search, generation, and learning requests are executed.
 * Then: document scope is explicit and caller context stays generic.
 */

import { KnowledgeService } from "./service";
import type { KnowledgeSearchResult } from "./types";

function createSearchResult(
  props: Partial<KnowledgeSearchResult> & { id: string },
): KnowledgeSearchResult {
  return {
    text: "Knowledge fragment",
    chunkIndex: 0,
    sourceId: "source-1",
    sourceTitle: "Source",
    sourceOriginalPath: "source.txt",
    sourceType: "text",
    distance: 0.1,
    similarity: 0.9,
    retrievalRole: "seed",
    metadata: {},
    ...props,
  };
}

describe("knowledge service", () => {
  /**
   * BDD Scenario: empty search query.
   *
   * Given: a search request with blank text.
   * When: the service validates the request.
   * Then: the request is rejected before embedding generation.
   */
  it("requires a query for search", async () => {
    const service = new KnowledgeService({
      repository: {} as any,
      embeddingClient: {} as any,
      generationClient: {} as any,
      modelClient: {} as any,
    });

    await expect(service.search({ query: "   " })).rejects.toThrow(
      "Knowledge search query is required",
    );
  });

  /**
   * BDD Scenario: search topK bounds.
   *
   * Given: a request asks for too many results.
   * When: vector search is executed.
   * Then: the repository receives the capped result count.
   */
  it("caps search result count", async () => {
    const searchChunks = jest.fn().mockResolvedValue([]);
    const service = new KnowledgeService({
      repository: { searchChunks } as any,
      embeddingClient: {
        embed: jest
          .fn()
          .mockResolvedValue(Array.from({ length: 768 }, () => 0)),
      } as any,
      generationClient: {} as any,
      modelClient: {} as any,
    });

    await service.search({ query: "project documentation", topK: 100 });

    expect(searchChunks).toHaveBeenCalledWith(
      expect.objectContaining({ topK: 50 }),
    );
  });

  /**
   * BDD Scenario: expanded neighbor search.
   *
   * Given: vector search finds seed chunks inside profile-scoped documents.
   * When: search is requested with a neighbor window.
   * Then: same-source neighboring chunks are loaded and duplicate chunk ids are removed.
   */
  it("expands seed chunks with same-source neighbors and removes duplicates", async () => {
    const seed = createSearchResult({
      id: "chunk-2",
      chunkIndex: 2,
      sourceId: "source-1",
    });
    const duplicateSeedNeighbor = createSearchResult({
      id: "chunk-2",
      chunkIndex: 2,
      sourceId: "source-1",
      retrievalRole: "neighbor",
    });
    const neighbor = createSearchResult({
      id: "chunk-3",
      chunkIndex: 3,
      sourceId: "source-1",
      retrievalRole: "neighbor",
    });
    const searchChunks = jest.fn().mockResolvedValue([seed]);
    const findNeighborChunks = jest
      .fn()
      .mockResolvedValue([duplicateSeedNeighbor, neighbor]);
    const service = new KnowledgeService({
      repository: {
        searchChunks,
        findNeighborChunks,
      } as any,
      embeddingClient: {
        embed: jest
          .fn()
          .mockResolvedValue(Array.from({ length: 768 }, () => 0)),
      } as any,
      generationClient: {} as any,
      modelClient: {} as any,
    });

    await expect(
      service.search({
        query: "project documentation",
        topK: 30,
        neighborWindow: 1,
      }),
    ).resolves.toEqual([seed, neighbor]);
    expect(searchChunks).toHaveBeenCalledWith(
      expect.objectContaining({ topK: 30 }),
    );
    expect(findNeighborChunks).toHaveBeenCalledWith({
      window: 1,
      seeds: [
        {
          sourceId: "source-1",
          chunkIndex: 2,
          distance: 0.1,
          similarity: 0.9,
        },
      ],
    });
  });

  /**
   * BDD Scenario: explicit document scoped search.
   *
   * Given: a caller passes document ids.
   * When: search runs with duplicated and blank ids.
   * Then: vector search is restricted to normalized document ids.
   */
  it("restricts search to explicit document ids", async () => {
    const searchChunks = jest.fn().mockResolvedValue([]);
    const service = new KnowledgeService({
      repository: {
        searchChunks,
      } as any,
      embeddingClient: {
        embed: jest
          .fn()
          .mockResolvedValue(Array.from({ length: 768 }, () => 0)),
      } as any,
      generationClient: {} as any,
      modelClient: {} as any,
    });

    await service.search({
      query: "project documentation",
      documentIds: ["document-1", "document-2", "document-1", " "],
    });

    expect(searchChunks).toHaveBeenCalledWith(
      expect.objectContaining({
        documentIds: ["document-1", "document-2"],
      }),
    );
  });

  /**
   * BDD Scenario: empty explicit document scope.
   *
   * Given: a caller explicitly passes no document ids.
   * When: search is requested.
   * Then: Knowledge returns no sources and does not fall back to global search.
   */
  it("does not search globally for an empty explicit document id list", async () => {
    const embed = jest.fn();
    const searchChunks = jest.fn();
    const service = new KnowledgeService({
      repository: {
        searchChunks,
      } as any,
      embeddingClient: {
        embed,
      } as any,
      generationClient: {} as any,
      modelClient: {} as any,
    });

    await expect(
      service.search({ query: "project documentation", documentIds: [] }),
    ).resolves.toEqual([]);
    expect(embed).not.toHaveBeenCalled();
    expect(searchChunks).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: ordered document list.
   *
   * Given: a caller passes profile-linked document ids in relation order.
   * When: Knowledge loads documents by those ids.
   * Then: the response preserves caller order and drops missing documents.
   */
  it("lists documents in caller-provided order", async () => {
    const findDocumentsByIds = jest.fn().mockResolvedValue([
      { id: "document-2", title: "Second" },
      { id: "document-1", title: "First" },
    ]);
    const service = new KnowledgeService({
      repository: {
        findDocumentsByIds,
      } as any,
      embeddingClient: {} as any,
      generationClient: {} as any,
      modelClient: {} as any,
    });

    await expect(
      service.listDocuments({
        documentIds: ["document-1", "document-2", "missing-document"],
      }),
    ).resolves.toEqual([
      { id: "document-1", title: "First" },
      { id: "document-2", title: "Second" },
    ]);
  });

  /**
   * BDD Scenario: generic persona generation.
   *
   * Given: a generation request includes document ids and persona context.
   * When: the service builds the generation call.
   * Then: document scope and generic persona are passed to LLM generation.
   */
  it("passes explicit document scope and generic persona to generation", async () => {
    const contexts = [
      createSearchResult({
        id: "chunk-1",
        text: "Documentation context",
        chunkIndex: 0,
      }),
    ];
    const searchChunks = jest.fn().mockResolvedValue(contexts);
    const generate = jest.fn().mockResolvedValue({ answer: "answer" });
    const selectedModel = {
      id: "anthropic/claude-opus-4-1",
      label: "Claude Opus 4.1",
      provider: "anthropic",
      providerModel: "claude-opus-4-1-20250805",
      task: "chat",
      local: false,
    };
    const persona = {
      title: "Documentation expert",
      description: { tone: "concise" },
    };
    const service = new KnowledgeService({
      repository: {
        searchChunks,
      } as any,
      embeddingClient: {
        embed: jest
          .fn()
          .mockResolvedValue(Array.from({ length: 768 }, () => 0)),
      } as any,
      generationClient: { generate } as any,
      modelClient: { get: jest.fn().mockResolvedValue(selectedModel) } as any,
    });

    const result = await service.generate({
      query: "project documentation",
      documentIds: ["document-1"],
      persona,
      generationModelSlug: "anthropic/claude-opus-4-1",
    });

    expect(searchChunks).toHaveBeenCalledWith(
      expect.objectContaining({
        documentIds: ["document-1"],
      }),
    );
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "anthropic/claude-opus-4-1",
        persona,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        generationModelSlug: "anthropic/claude-opus-4-1",
        generationProvider: "anthropic",
        generationModel: "claude-opus-4-1-20250805",
      }),
    );
  });

  /**
   * BDD Scenario: disabled knowledge search.
   *
   * Given: a generation request is a thread follow-up that should use chat history only.
   * When: Knowledge generation is called with useKnowledgeSearch=false.
   * Then: vector search is skipped and chat history is passed to LLM generation.
   */
  it("skips vector search for history-only generation", async () => {
    const embed = jest.fn();
    const searchChunks = jest.fn();
    const generate = jest.fn().mockResolvedValue({ answer: "answer" });
    const service = new KnowledgeService({
      repository: {
        searchChunks,
      } as any,
      embeddingClient: {
        embed,
      } as any,
      generationClient: { generate } as any,
      modelClient: {
        get: jest.fn().mockResolvedValue({
          id: "openai/gpt-5-5",
          provider: "openai",
          providerModel: "gpt-5.5",
          task: "chat",
          local: false,
        }),
      } as any,
    });

    await service.generate({
      query: "Поправь предыдущий текст",
      documentIds: ["document-1"],
      chatHistory: [
        {
          role: "assistant",
          content: "В этом фрагменте спикер оценивает помещение.",
        },
      ],
      useKnowledgeSearch: false,
    });

    expect(embed).not.toHaveBeenCalled();
    expect(searchChunks).not.toHaveBeenCalled();
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        contexts: [],
        chatHistory: [
          {
            role: "assistant",
            content: "В этом фрагменте спикер оценивает помещение.",
          },
        ],
      }),
    );
  });

  /**
   * BDD Scenario: generic learning requires content.
   *
   * Given: a learn request contains no text after trimming.
   * When: the service validates generic learning input.
   * Then: it rejects before model dimension checks or document upsert.
   */
  it("requires content before learning generic knowledge", async () => {
    const upsertDocumentBySlug = jest.fn();
    const modelGet = jest.fn();
    const service = new KnowledgeService({
      repository: {
        upsertDocumentBySlug,
      } as any,
      embeddingClient: {} as any,
      generationClient: {} as any,
      modelClient: {
        get: modelGet,
      } as any,
    });

    await expect(
      service.learnContent({
        slug: "knowledge-profile-message",
        title: "Message",
        content: "   ",
      }),
    ).rejects.toThrow("Knowledge learn content is required");
    expect(upsertDocumentBySlug).not.toHaveBeenCalled();
    expect(modelGet).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: generic learning indexes content.
   *
   * Given: a generic learn request has a deterministic slug and content.
   * When: the service stores the document.
   * Then: it runs embedding indexing for the returned document id.
   */
  it("stores learned content and indexes the returned document", async () => {
    const upsertDocumentBySlug = jest
      .fn()
      .mockResolvedValue({ id: "document-1" });
    const service = new KnowledgeService({
      repository: {
        upsertDocumentBySlug,
      } as any,
      embeddingClient: {} as any,
      generationClient: {} as any,
      modelClient: {
        get: jest.fn().mockResolvedValue({
          id: "nomic-embed-text",
          dimensions: 768,
        }),
      } as any,
    });
    const index = jest
      .spyOn(service, "index")
      .mockResolvedValue({ indexed: 1, skipped: 0 } as any);

    const result = await service.learnContent({
      slug: "knowledge-profile-message-file-hash",
      title: " Uploaded knowledge ",
      content: " Learned context ",
      summary: "Summary",
      metadata: {
        sourceKind: "chat-message",
      },
    });

    expect(upsertDocumentBySlug).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "knowledge-profile-message-file-hash",
        title: "Uploaded knowledge",
        description: "Learned context",
        summary: "Summary",
        status: "imported",
        metadata: {
          sourceKind: "chat-message",
        },
      }),
    );
    expect(index).toHaveBeenCalledWith({ documentId: "document-1" });
    expect(result).toEqual({
      document: { id: "document-1" },
      index: { indexed: 1, skipped: 0 },
    });
  });

  /**
   * BDD Scenario: direct OpenRouter indexing validation.
   *
   * Given: apps/api routes embeddings directly to OpenRouter.
   * When: Knowledge starts an indexing operation.
   * Then: it relies on response vector validation and does not query apps/llm for that remote model.
   */
  it("does not resolve OpenRouter embedding models through apps/llm", async () => {
    const previousProvider = process.env.KNOWLEDGE_EMBEDDING_PROVIDER;
    const modelGet = jest.fn();
    const service = new KnowledgeService({
      repository: {
        listDocumentsForIndex: jest.fn().mockResolvedValue([]),
      } as any,
      embeddingClient: {} as any,
      generationClient: {} as any,
      modelClient: {
        get: modelGet,
      } as any,
    });

    process.env.KNOWLEDGE_EMBEDDING_PROVIDER = "openrouter";

    try {
      await expect(
        service.index({ documentId: "document-1", dryRun: true }),
      ).resolves.toEqual(
        expect.objectContaining({ indexed: 0, skipped: 0, dryRun: true }),
      );
      expect(modelGet).not.toHaveBeenCalled();
    } finally {
      if (typeof previousProvider === "undefined") {
        delete process.env.KNOWLEDGE_EMBEDDING_PROVIDER;
      } else {
        process.env.KNOWLEDGE_EMBEDDING_PROVIDER = previousProvider;
      }
    }
  });

  /**
   * BDD Scenario: missing document deletion.
   *
   * Given: a delete request references a missing Knowledge document.
   * When: the service validates the document id.
   * Then: cleanup is not attempted.
   */
  it("rejects deleting a missing document before cleanup", async () => {
    const deleteDocumentWithDerivedData = jest.fn();
    const service = new KnowledgeService({
      repository: {
        findDocumentById: jest.fn().mockResolvedValue(undefined),
        deleteDocumentWithDerivedData,
      } as any,
      embeddingClient: {} as any,
      generationClient: {} as any,
      modelClient: {} as any,
    });

    await expect(service.deleteDocument("missing-document")).rejects.toThrow(
      "Knowledge document missing-document was not found.",
    );
    expect(deleteDocumentWithDerivedData).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: document deletion cleanup.
   *
   * Given: a Knowledge document exists.
   * When: the service deletes it.
   * Then: repository cleanup runs without embedding generation or reindexing.
   */
  it("deletes a document through cleanup without embedding generation", async () => {
    const document = { id: "document-1", title: "Temporary knowledge" };
    const deleteDocumentWithDerivedData = jest.fn().mockResolvedValue(document);
    const embeddingClient = {
      embed: jest.fn(),
      embedMany: jest.fn(),
    };
    const service = new KnowledgeService({
      repository: {
        findDocumentById: jest.fn().mockResolvedValue(document),
        deleteDocumentWithDerivedData,
      } as any,
      embeddingClient: embeddingClient as any,
      generationClient: {} as any,
      modelClient: {
        get: jest.fn(),
      } as any,
    });
    const index = jest.spyOn(service, "index");

    await expect(service.deleteDocument("document-1")).resolves.toBe(document);
    expect(deleteDocumentWithDerivedData).toHaveBeenCalledWith("document-1");
    expect(embeddingClient.embed).not.toHaveBeenCalled();
    expect(embeddingClient.embedMany).not.toHaveBeenCalled();
    expect(index).not.toHaveBeenCalled();
  });
});
