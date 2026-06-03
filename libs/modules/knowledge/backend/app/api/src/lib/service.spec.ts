/**
 * BDD Suite: knowledge service.
 *
 * Given: test doubles for embeddings, generation, and repository access.
 * When: search and generation requests are validated.
 * Then: request bounds and response contracts are preserved.
 */

import { KnowledgeService } from "./service";

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

    await service.search({ query: "self-storage", topK: 100 });

    expect(searchChunks).toHaveBeenCalledWith(
      expect.objectContaining({ topK: 20 }),
    );
  });

  /**
   * BDD Scenario: profile-scoped search.
   *
   * Given: a profile is linked to two knowledge documents.
   * When: search runs with that profile id.
   * Then: vector search is restricted to the linked document ids.
   */
  it("restricts search to documents linked to the selected profile", async () => {
    const searchChunks = jest.fn().mockResolvedValue([]);
    const service = new KnowledgeService({
      repository: {
        findDocumentsByProfileId: jest
          .fn()
          .mockResolvedValue([{ id: "document-1" }, { id: "document-2" }]),
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

    await service.search({ query: "self-storage", profileId: "profile-1" });

    expect(searchChunks).toHaveBeenCalledWith(
      expect.objectContaining({
        documentIds: ["document-1", "document-2"],
      }),
    );
  });

  /**
   * BDD Scenario: profile chat without documents.
   *
   * Given: a profile has no linked knowledge documents.
   * When: chat generation is requested for that profile.
   * Then: the service fails before saving social messages or calling LLM.
   */
  it("rejects profile chat when no documents are linked", async () => {
    const createThreadMessage = jest.fn();
    const generate = jest.fn();
    const service = new KnowledgeService({
      repository: {
        findDocumentsByProfileId: jest.fn().mockResolvedValue([]),
        createThreadMessage,
      } as any,
      embeddingClient: {} as any,
      generationClient: { generate } as any,
      modelClient: {} as any,
    });

    await expect(
      service.chatMessage({
        profileId: "profile-1",
        message: "Что известно про Магнит?",
      }),
    ).rejects.toThrow("no linked knowledge documents");
    expect(createThreadMessage).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: chat edit suggestion.
   *
   * Given: a profile chat request contains a proposed markdown edit.
   * When: the assistant response is saved.
   * Then: a pending edit suggestion is saved and returned with the chat result.
   */
  it("stores an optional edit suggestion from a chat request", async () => {
    const createEditSuggestion = jest
      .fn()
      .mockResolvedValue({ id: "suggestion-1" });
    const service = new KnowledgeService({
      repository: {
        findDocumentsByProfileId: jest
          .fn()
          .mockResolvedValue([{ id: "document-1" }]),
        findProfileById: jest.fn().mockResolvedValue({
          id: "profile-1",
          adminTitle: "Expert",
          description: {},
        }),
        createKnowledgeThread: jest.fn().mockResolvedValue({
          thread: { id: "thread-1" },
        }),
        createThreadMessage: jest
          .fn()
          .mockResolvedValueOnce({ id: "message-user" })
          .mockResolvedValueOnce({ id: "message-assistant" }),
        listThreadMessages: jest.fn().mockResolvedValue([]),
        searchChunks: jest.fn().mockResolvedValue([]),
        createEditSuggestion,
      } as any,
      embeddingClient: {
        embed: jest
          .fn()
          .mockResolvedValue(Array.from({ length: 768 }, () => 0)),
      } as any,
      generationClient: {
        generate: jest.fn().mockResolvedValue({ answer: "answer" }),
      } as any,
      modelClient: {
        get: jest.fn().mockResolvedValue({
          id: "openai/gpt-5-5",
          provider: "openai",
          providerModel: "gpt-5.5",
        }),
      } as any,
    });

    const result = await service.chatMessage({
      profileId: "profile-1",
      message: "Предложи правку",
      editSuggestion: {
        title: "Updated Magnit note",
        targetDocumentId: "document-1",
        proposedDescription: "# Магнит\n\nНовая версия.",
      },
    });

    expect(createEditSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Updated Magnit note",
        targetDocumentId: "document-1",
        proposedDescription: "# Магнит\n\nНовая версия.",
      }),
    );
    expect(result.editSuggestionId).toBe("suggestion-1");
  });

  /**
   * BDD Scenario: selected generation model.
   *
   * Given: a generation request includes a model slug.
   * When: the service builds the generation call.
   * Then: the selected model id is passed to the generation client.
   */
  it("passes the selected generation model to the generation client", async () => {
    const contexts = [
      {
        id: "chunk-1",
        text: "Self-storage context",
        chunkIndex: 0,
        sourceTitle: "Source",
        sourceOriginalPath: "source.txt",
        sourceType: "text",
        distance: 0.1,
        similarity: 0.9,
        metadata: {},
      },
    ];
    const generate = jest.fn().mockResolvedValue({ answer: "answer" });
    const selectedModel = {
      id: "anthropic/claude-opus-4-1",
      label: "Claude Opus 4.1",
      provider: "anthropic",
      providerModel: "claude-opus-4-1-20250805",
      task: "chat",
      local: false,
    };
    const service = new KnowledgeService({
      repository: {
        searchChunks: jest.fn().mockResolvedValue(contexts),
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
      query: "self-storage",
      generationModelSlug: "anthropic/claude-opus-4-1",
    });

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "anthropic/claude-opus-4-1",
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
   * BDD Scenario: social chat learning requires content.
   *
   * Given: a Knowledge chat /learn request contains no text after trimming.
   * When: the service validates chat learning input.
   * Then: it rejects before model dimension checks or indexing.
   */
  it("requires content before learning from a social chat message", async () => {
    const upsertChatLearnDocumentForProfile = jest.fn();
    const modelGet = jest.fn();
    const service = new KnowledgeService({
      repository: {
        upsertChatLearnDocumentForProfile,
      } as any,
      embeddingClient: {} as any,
      generationClient: {} as any,
      modelClient: {
        get: modelGet,
      } as any,
    });

    await expect(
      service.learnFromChatMessage({
        profileId: "profile-1",
        chatId: "chat-1",
        threadId: "thread-1",
        messageId: "message-1",
        content: "   ",
      }),
    ).rejects.toThrow("Knowledge learn content is required");
    expect(upsertChatLearnDocumentForProfile).not.toHaveBeenCalled();
    expect(modelGet).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: social chat learning indexes content.
   *
   * Given: a Knowledge chat /learn request has text content.
   * When: the service stores the deterministic chat document.
   * Then: it runs embedding indexing for the returned document id.
   */
  it("stores chat-learn content and indexes the returned document", async () => {
    const upsertChatLearnDocumentForProfile = jest
      .fn()
      .mockResolvedValue({ id: "document-1" });
    const service = new KnowledgeService({
      repository: {
        upsertChatLearnDocumentForProfile,
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

    const result = await service.learnFromChatMessage({
      profileId: "profile-1",
      chatId: "chat-1",
      threadId: "thread-1",
      messageId: "message-1",
      content: " Learned context ",
    });

    expect(upsertChatLearnDocumentForProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: "profile-1",
        chatId: "chat-1",
        threadId: "thread-1",
        messageId: "message-1",
        content: "Learned context",
      }),
    );
    expect(index).toHaveBeenCalledWith({ documentId: "document-1" });
    expect(result).toEqual({
      document: { id: "document-1" },
      index: { indexed: 1, skipped: 0 },
    });
  });
});
