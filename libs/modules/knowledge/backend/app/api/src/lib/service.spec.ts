/**
 * BDD Suite: knowledge service.
 *
 * Given: Knowledge is a social-agnostic RAG service.
 * When: search, generation, and learning requests are executed.
 * Then: document scope is explicit and caller context stays generic.
 */

import { Service as KnowledgeService } from "./service";
import type { KnowledgeSearchResult } from "./types";

const originalEmbeddingProvider = process.env.KNOWLEDGE_EMBEDDING_PROVIDER;

beforeEach(() => {
  process.env.KNOWLEDGE_EMBEDDING_PROVIDER = "llm";
});

afterEach(() => {
  if (originalEmbeddingProvider === undefined) {
    delete process.env.KNOWLEDGE_EMBEDDING_PROVIDER;
  } else {
    process.env.KNOWLEDGE_EMBEDDING_PROVIDER = originalEmbeddingProvider;
  }
});

function createSearchResult(
  props: Partial<KnowledgeSearchResult> & { id: string },
): KnowledgeSearchResult {
  return {
    text: "Knowledge fragment",
    chunkIndex: 0,
    sourceId: "source-1",
    sourceTitle: "Source",
    distance: 0.1,
    similarity: 0.9,
    retrievalRole: "seed",
    metadata: {},
    ...props,
  };
}

it("uses one paid query with two independent authorized source scopes and a bounded personal share", async () => {
  process.env.KNOWLEDGE_EMBEDDING_PROVIDER = "openai";
  const vector = Array<number>(768).fill(0.125);
  const embedQuery = jest.fn().mockResolvedValue(vector);
  const searchChunks = jest.fn(async ({ sourceIds }: { sourceIds: string[] }) =>
    Array.from({ length: 4 }, (_, index) =>
      createSearchResult({
        id: `${sourceIds[0]}:${index}`,
        sourceId: sourceIds[0],
        sourceVersion: `${sourceIds[0]}-version`,
      }),
    ),
  );
  const findSourcesByIds = jest.fn(async (sourceIds: string[]) =>
    sourceIds.map((id) => ({
      id,
      title: id,
      content: id,
      contentHash: "hash",
      indexedContentHash: "hash",
    })),
  );
  const source = {
    searchChunks,
    findSourcesByIds,
    hasEmbeddingIndex: jest.fn().mockResolvedValue(true),
    findNeighborChunks: jest.fn().mockResolvedValue([]),
  };
  const embeddingClient = {
    embed: jest.fn(),
    embedMany: jest.fn(),
    validateEmbedding: jest.fn(),
  };
  const knowledge = new KnowledgeService({
    source: source as any,
    embeddingClient,
  });

  const results = await knowledge.searchAuthorizedSources({
    query: " matching request ",
    sourceIds: ["personal", "staff"],
    personalSourceIds: ["personal", "outside"],
    neighborWindow: 1,
    finalTopK: 3,
    embedQuery,
  });
  expect(embedQuery).toHaveBeenCalledTimes(1);
  expect(embedQuery).toHaveBeenCalledWith("matching request", {
    provider: "openai",
    model: "text-embedding-3-large",
    dimensions: 768,
  });
  expect(source.hasEmbeddingIndex).toHaveBeenCalledWith(
    ["personal", "staff"],
    "openai:text-embedding-3-large:768:v1",
    true,
  );
  expect(source.findSourcesByIds).not.toHaveBeenCalled();
  expect(source.searchChunks.mock.calls.map(([props]) => props)).toEqual([
    expect.objectContaining({
      sourceIds: ["staff"],
      includeCustomerMemory: true,
      embeddingIndex: "openai:text-embedding-3-large:768:v1",
    }),
    expect.objectContaining({
      sourceIds: ["personal"],
      includeCustomerMemory: true,
      embeddingIndex: "openai:text-embedding-3-large:768:v1",
    }),
  ]);
  expect(
    source.findNeighborChunks.mock.calls.map(
      ([props]) => props.seeds[0].sourceVersion,
    ),
  ).toEqual(["staff-version", "personal-version"]);
  expect(results.map(({ sourceId }) => sourceId)).toEqual([
    "staff",
    "staff",
    "personal",
  ]);
  expect(embeddingClient.embed).not.toHaveBeenCalled();
  expect(embeddingClient.embedMany).not.toHaveBeenCalled();

  source.searchChunks.mockClear();
  embedQuery.mockResolvedValue(undefined);
  await expect(
    knowledge.searchAuthorizedSources({
      query: "blocked",
      sourceIds: ["personal"],
      embedQuery,
    }),
  ).resolves.toEqual([]);
  expect(source.searchChunks).not.toHaveBeenCalled();
  await expect(
    knowledge.searchAuthorizedSources({
      query: "no sources",
      sourceIds: [],
      embedQuery,
    }),
  ).resolves.toEqual([]);
  expect(embedQuery).toHaveBeenCalledTimes(2);
});

describe("knowledge service", () => {
  describe("stored file mutations", () => {
    function setup() {
      const file = { id: "file", file: "/report.txt" };
      const mutateStoredFile = jest.fn().mockResolvedValue({
        file,
        sourceIds: ["source-1", "source-2"],
      });
      const service = new KnowledgeService({
        source: { mutateStoredFile } as any,
        embeddingClient: {} as any,
        generationClient: {} as any,
        modelClient: {} as any,
      });
      return { file, mutateStoredFile, service };
    }
    it.each(["update", "delete"] as const)(
      "returns the committed file for %s",
      async (action) => {
        const { file, mutateStoredFile, service } = setup();
        const data = { alt: "Updated report" };
        const result =
          action === "update"
            ? await service.updateStoredFile({ id: file.id, data })
            : await service.deleteStoredFile({ id: file.id });
        expect(result).toBe(file);
        expect(mutateStoredFile).toHaveBeenCalledWith({
          action,
          id: file.id,
          ...(action === "update" ? { data } : {}),
        });
      },
    );
    it("propagates failure from the transaction rebuilding the affected Sources", async () => {
      const { file, mutateStoredFile, service } = setup();
      mutateStoredFile.mockRejectedValueOnce(new Error("vision unavailable"));
      await expect(service.deleteStoredFile({ id: file.id })).rejects.toThrow(
        "vision unavailable",
      );
    });
  });
  /**
   * BDD Scenario: empty search query.
   *
   * Given: a search request with blank text.
   * When: the service validates the request.
   * Then: the request is rejected before embedding generation.
   */
  it("requires a query for search", async () => {
    const service = new KnowledgeService({
      source: {} as any,
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
      source: { searchChunks } as any,
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
      source: {
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
      source: {
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
      sourceIds: ["source-1", "source-2", "source-1", " "],
    });

    expect(searchChunks).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceIds: ["source-1", "source-2"],
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
      source: {
        searchChunks,
      } as any,
      embeddingClient: {
        embed,
      } as any,
      generationClient: {} as any,
      modelClient: {} as any,
    });

    await expect(
      service.search({ query: "project documentation", sourceIds: [] }),
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
    const findSourcesByIds = jest.fn().mockResolvedValue([
      { id: "source-2", title: "Second" },
      { id: "source-1", title: "First" },
    ]);
    const service = new KnowledgeService({
      source: {
        findSourcesByIds,
      } as any,
      embeddingClient: {} as any,
      generationClient: {} as any,
      modelClient: {} as any,
    });

    await expect(
      service.listSources({
        sourceIds: ["source-1", "source-2", "missing-document"],
      }),
    ).resolves.toEqual([
      { id: "source-1", title: "First" },
      { id: "source-2", title: "Second" },
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
        text: "Sourceation context",
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
      title: "Sourceation expert",
      description: { tone: "concise" },
    };
    const service = new KnowledgeService({
      source: {
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
      sourceIds: ["source-1"],
      persona,
      generationModelSlug: "anthropic/claude-opus-4-1",
    });

    expect(searchChunks).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceIds: ["source-1"],
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
      source: {
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
      sourceIds: ["source-1"],
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
    const upsertSourceBySlug = jest.fn();
    const modelGet = jest.fn();
    const service = new KnowledgeService({
      source: {
        upsertSourceBySlug,
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
    ).rejects.toThrow("Knowledge learn content or files are required");
    expect(upsertSourceBySlug).not.toHaveBeenCalled();
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
    const source = { id: "source-1", content: "Learned context" };
    const upsertSourceBySlug = jest.fn().mockResolvedValue(source);
    const repository: any = {
      upsertSourceBySlug,
      findSourceById: jest.fn().mockResolvedValue(source),
    };
    repository.withTransaction = (operation: (scope: any) => unknown) =>
      operation(repository);
    const service = new KnowledgeService({
      source: repository,
      embeddingClient: {} as any,
      generationClient: {} as any,
      modelClient: {} as any,
    });
    const index = jest
      .spyOn(service, "indexAuthorizedSource")
      .mockResolvedValue({ indexed: 1, skipped: 0 } as any);
    const result = await service.learnContent({
      slug: "knowledge-source",
      title: "Uploaded knowledge",
      content: "Learned context",
      description: "Summary",
    });
    expect(upsertSourceBySlug).toHaveBeenCalledWith(
      {
        slug: "knowledge-source",
        title: "Uploaded knowledge",
        content: "Learned context",
        description: "Summary",
      },
      true,
    );
    expect(index).toHaveBeenCalledWith({ sourceId: "source-1" }, repository);
    expect(result.source).toEqual(source);
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
      source: {
        listSourcesForIndex: jest.fn().mockResolvedValue([]),
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
        service.index({ sourceId: "source-1", dryRun: true }),
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
   * Given: a delete request references a missing Knowledge source.
   * When: the service validates the document id.
   * Then: cleanup is not attempted.
   */
  it("rejects deleting a missing document before cleanup", async () => {
    const deleteSourceWithDerivedData = jest.fn();
    const service = new KnowledgeService({
      source: {
        findSourceById: jest.fn().mockResolvedValue(undefined),
        deleteSourceWithDerivedData,
      } as any,
      embeddingClient: {} as any,
      generationClient: {} as any,
      modelClient: {} as any,
    });

    await expect(service.deleteSource("missing-document")).rejects.toThrow(
      "Knowledge source missing-document was not found.",
    );
    expect(deleteSourceWithDerivedData).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: document deletion cleanup.
   *
   * Given: a Knowledge source exists.
   * When: the service deletes it.
   * Then: repository cleanup runs without embedding generation or reindexing.
   */
  it("deletes a document through cleanup without embedding generation", async () => {
    const document = { id: "source-1", title: "Temporary knowledge" };
    const deleteSourceWithDerivedData = jest.fn().mockResolvedValue(document);
    const embeddingClient = {
      embed: jest.fn(),
      embedMany: jest.fn(),
    };
    const service = new KnowledgeService({
      source: {
        findSourceById: jest.fn().mockResolvedValue(document),
        deleteSourceWithDerivedData,
      } as any,
      embeddingClient: embeddingClient as any,
      generationClient: {} as any,
      modelClient: {
        get: jest.fn(),
      } as any,
    });
    const index = jest.spyOn(service, "index");

    await expect(service.deleteSource("source-1")).resolves.toBe(document);
    expect(deleteSourceWithDerivedData).toHaveBeenCalledWith("source-1");
    expect(embeddingClient.embed).not.toHaveBeenCalled();
    expect(embeddingClient.embedMany).not.toHaveBeenCalled();
    expect(index).not.toHaveBeenCalled();
  });
});
