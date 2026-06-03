/**
 * BDD Suite: RBAC profile-scoped Knowledge chat reaction.
 *
 * Given: social chats can opt into Knowledge/RAG mode with chat.variant="knowledge".
 * When: a subject asks an AI profile to learn or answer in that chat.
 * Then: the handler validates the chat mode and scopes Knowledge calls to the replying AI profile.
 */

const mockKnowledgeLearnContent = jest.fn();
const mockKnowledgeGenerate = jest.fn();
const mockSocialModuleMessageCreate = jest.fn();
const mockSocialModuleProfilesToMessagesCreate = jest.fn();
const mockSocialModuleChatsToMessagesCreate = jest.fn();
const mockSocialModuleThreadsToMessagesCreate = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
    RBAC_SECRET_KEY: "rbac-secret",
  };
});

jest.mock("@sps/backend-utils", () => {
  return {
    getHttpErrorType: (error: Error) => {
      return {
        status: 400,
        message: error.message,
        details: null,
      };
    },
  };
});

jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => {
  return {
    KnowledgeService: jest.fn().mockImplementation(() => {
      return {
        learnContent: mockKnowledgeLearnContent,
        generate: mockKnowledgeGenerate,
      };
    }),
  };
});

jest.mock("@sps/social/models/message/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) => mockSocialModuleMessageCreate(...args),
    },
  };
});

jest.mock("@sps/social/relations/profiles-to-messages/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) =>
        mockSocialModuleProfilesToMessagesCreate(...args),
    },
  };
});

jest.mock("@sps/social/relations/chats-to-messages/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) =>
        mockSocialModuleChatsToMessagesCreate(...args),
    },
  };
});

jest.mock("@sps/social/relations/threads-to-messages/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) =>
        mockSocialModuleThreadsToMessagesCreate(...args),
    },
  };
});

import { Handler } from "./react-by-knowledge";

function createContext(data?: Record<string, unknown>) {
  return {
    req: {
      param: (name: string) => {
        return {
          id: "subject-1",
          socialModuleProfileId: "user-profile-1",
          socialModuleChatId: "chat-1",
          socialModuleMessageId: "message-1",
        }[name];
      },
      parseBody: jest.fn().mockResolvedValue({
        data: JSON.stringify({
          shouldReplySocialModuleProfile: {
            id: "assistant-profile-1",
          },
          ...(data || {}),
        }),
      }),
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService(props?: {
  chatVariant?: string;
  messageDescription?: string;
  replyProfileVariant?: string;
  knowledgeDocumentRelations?: unknown[];
}) {
  return {
    socialModuleChatLifecycleEnsureDefaultThreadForChat: jest
      .fn()
      .mockResolvedValue({ id: "thread-1" }),
    socialModule: {
      profilesToChats: {
        find: jest.fn().mockResolvedValue([
          {
            id: "profile-chat-1",
          },
        ]),
      },
      profilesToMessages: {
        find: jest.fn().mockResolvedValue([
          {
            id: "profile-message-1",
          },
        ]),
      },
      chatsToMessages: {
        find: jest.fn().mockResolvedValue([
          {
            id: "chat-message-1",
          },
        ]),
      },
      chatsToThreads: {
        find: jest.fn().mockResolvedValue([
          {
            chatId: "chat-1",
            threadId: "thread-1",
          },
        ]),
      },
      threadsToMessages: {
        find: jest.fn().mockResolvedValue([
          {
            threadId: "thread-1",
            messageId: "message-1",
          },
        ]),
        create: jest.fn().mockResolvedValue({}),
      },
      messagesToFileStorageModuleFiles: {
        find: jest.fn().mockResolvedValue([]),
      },
      profilesToKnowledgeModuleDocuments: {
        find: jest
          .fn()
          .mockResolvedValue(props?.knowledgeDocumentRelations || []),
        create: jest.fn().mockResolvedValue({
          id: "profile-document-relation-1",
        }),
      },
      chat: {
        findById: jest.fn().mockResolvedValue({
          id: "chat-1",
          variant: props?.chatVariant || "knowledge",
        }),
      },
      message: {
        findById: jest.fn().mockResolvedValue({
          id: "message-1",
          description: props?.messageDescription || "/learn Stored context",
        }),
      },
      profile: {
        findById: jest.fn().mockResolvedValue({
          id: "assistant-profile-1",
          variant: props?.replyProfileVariant || "artificial-intelligence",
          slug: "chat-gpt-1",
        }),
      },
    },
    fileStorageModule: {
      file: {
        find: jest.fn().mockResolvedValue([]),
      },
    },
    subjectsToRoles: {
      find: jest.fn().mockResolvedValue([]),
    },
    role: {
      find: jest.fn().mockResolvedValue([]),
    },
  } as any;
}

describe("Given: RBAC profile-scoped Knowledge chat reaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockKnowledgeLearnContent.mockResolvedValue({
      document: {
        id: "document-1",
        slug: "knowledge-assistant-profile-1-message-1-message-hash",
        title: "Stored context",
      },
      index: {
        indexed: 1,
      },
    });
    mockKnowledgeGenerate.mockResolvedValue({
      answer: "Profile-scoped answer",
      sources: [
        {
          id: "chunk-1",
          text: "Relevant context",
        },
      ],
      generationModelSlug: "openai/gpt-5-5",
      generationProvider: "openai",
      generationModel: "gpt-5.5",
      usage: {
        totalTokens: 12,
      },
    });
    mockSocialModuleMessageCreate.mockResolvedValue({
      id: "assistant-message-1",
      description: "assistant response",
    });
    mockSocialModuleProfilesToMessagesCreate.mockResolvedValue({});
    mockSocialModuleChatsToMessagesCreate.mockResolvedValue({});
    mockSocialModuleThreadsToMessagesCreate.mockResolvedValue({});
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat message starts with /learn.
   * When: the subject asks the AI profile to react through Knowledge.
   * Then: message text is stripped, indexed for the AI profile, and acknowledged in the same thread.
   */
  it("When: /learn is used Then: it learns stripped message content for the AI profile", async () => {
    const handler = new Handler(createService());
    const context = createContext();

    await handler.execute(context, jest.fn());

    expect(mockKnowledgeLearnContent).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: expect.stringMatching(
          /^knowledge-assistant-profile-1-message-1-message-/,
        ),
        title: "Stored context",
        content: "Stored context",
        summary: "Content learned from social chat message",
        metadata: expect.objectContaining({
          assistantSocialModuleProfileId: "assistant-profile-1",
          socialModuleChatId: "chat-1",
          socialModuleThreadId: "thread-1",
          socialModuleMessageId: "message-1",
          triggerMessageId: "message-1",
        }),
      }),
    );
    expect(
      (handler.service as any).socialModule.profilesToKnowledgeModuleDocuments
        .create,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          profileId: "assistant-profile-1",
          knowledgeModuleDocumentId: "document-1",
        },
      }),
    );
    expect(mockSocialModuleMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceSystemId: "knowledge",
          metadata: {
            knowledge: expect.objectContaining({
              action: "learn",
              profileId: "assistant-profile-1",
              triggerMessageId: "message-1",
            }),
          },
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat /learn message has an attachment with non-string reader output.
   * When: the subject asks the AI profile to learn from that attachment.
   * Then: the handler normalizes content before calling the Knowledge service.
   */
  it("When: /learn reads non-string attachment content Then: it normalizes content before learning", async () => {
    const service = createService({
      messageDescription: "/learn",
    });
    service.socialModule.messagesToFileStorageModuleFiles.find = jest
      .fn()
      .mockResolvedValue([
        {
          fileStorageModuleFileId: "file-1",
          orderIndex: 0,
        },
      ]);
    service.fileStorageModule.file.find = jest.fn().mockResolvedValue([
      {
        id: "file-1",
        extension: "txt",
        file: "uploads/content.txt",
        adminTitle: "content.txt",
      },
    ]);
    const handler = new Handler(service);
    (handler as any).readFileStorageModuleFile = jest
      .fn()
      .mockResolvedValue(new Date("2026-01-01T00:00:00.000Z"));

    await handler.execute(createContext(), jest.fn());

    expect(mockKnowledgeLearnContent).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: expect.stringMatching(
          /^knowledge-assistant-profile-1-message-1-file-1-/,
        ),
        content: "2026-01-01T00:00:00.000Z",
        metadata: expect.objectContaining({
          fileId: "file-1",
          fileName: "content.txt",
          filePath: "uploads/content.txt",
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a /learn request produces a document already linked to the AI profile.
   * When: the subject asks the AI profile to learn through Knowledge again.
   * Then: RBAC does not duplicate the profile-document relation.
   */
  it("When: /learn repeats an existing document Then: it does not duplicate the profile relation", async () => {
    const service = createService({
      knowledgeDocumentRelations: [
        {
          id: "profile-document-relation-1",
          profileId: "assistant-profile-1",
          knowledgeModuleDocumentId: "document-1",
        },
      ],
    });
    const handler = new Handler(service);

    await handler.execute(createContext(), jest.fn());

    expect(mockKnowledgeLearnContent).toHaveBeenCalled();
    expect(
      service.socialModule.profilesToKnowledgeModuleDocuments.create,
    ).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a default chat receives a /learn message.
   * When: the Knowledge reaction endpoint is called.
   * Then: it rejects the request before indexing any knowledge.
   */
  it("When: chat variant is default Then: it rejects without indexing knowledge", async () => {
    const handler = new Handler(
      createService({
        chatVariant: "default",
      }),
    );

    await expect(handler.execute(createContext(), jest.fn())).rejects.toThrow(
      'chat.variant="knowledge"',
    );
    expect(mockKnowledgeLearnContent).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat targets a non-AI reply profile.
   * When: the Knowledge reaction endpoint is called.
   * Then: it rejects before learning or generating.
   */
  it("When: reply profile is not AI Then: it rejects before Knowledge work", async () => {
    const handler = new Handler(
      createService({
        replyProfileVariant: "default",
      }),
    );

    await expect(handler.execute(createContext(), jest.fn())).rejects.toThrow(
      'variant="artificial-intelligence"',
    );
    expect(mockKnowledgeLearnContent).not.toHaveBeenCalled();
    expect(mockKnowledgeGenerate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat has a valid AI profile that is not connected to the chat.
   * When: the Knowledge reaction endpoint is called.
   * Then: it rejects before learning or generating.
   */
  it("When: reply profile is not in chat Then: it rejects before Knowledge work", async () => {
    const service = createService();
    service.socialModule.profilesToChats.find = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: "request-profile-chat-1",
        },
      ])
      .mockResolvedValueOnce([]);
    const handler = new Handler(service);

    await expect(handler.execute(createContext(), jest.fn())).rejects.toThrow(
      "Reply social-module profile is not connected to chat",
    );
    expect(mockKnowledgeLearnContent).not.toHaveBeenCalled();
    expect(mockKnowledgeGenerate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat message is a normal question.
   * When: the subject asks the AI profile to react through Knowledge.
   * Then: generation runs with that AI profile id and citations are saved in message metadata.
   */
  it("When: a normal question is asked Then: it generates with profile-scoped Knowledge", async () => {
    const handler = new Handler(
      createService({
        messageDescription: "What should we answer?",
        knowledgeDocumentRelations: [
          {
            knowledgeModuleDocumentId: "document-1",
          },
        ],
      }),
    );

    await handler.execute(createContext(), jest.fn());

    expect(mockKnowledgeGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "What should we answer?",
        documentIds: ["document-1"],
        persona: expect.objectContaining({
          title: "chat-gpt-1",
        }),
      }),
    );
    expect(mockSocialModuleMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: "Profile-scoped answer",
          metadata: {
            knowledge: expect.objectContaining({
              action: "generate",
              profileId: "assistant-profile-1",
              documentIds: ["document-1"],
              citations: [
                {
                  id: "chunk-1",
                  text: "Relevant context",
                },
              ],
            }),
          },
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: an AI profile has no linked Knowledge documents.
   * When: a normal question is asked in a Knowledge chat.
   * Then: RBAC passes an empty document scope instead of using global Knowledge.
   */
  it("When: the AI profile has no documents Then: it passes an empty document scope", async () => {
    const handler = new Handler(
      createService({
        messageDescription: "What should we answer?",
      }),
    );

    await handler.execute(createContext(), jest.fn());

    expect(mockKnowledgeGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "What should we answer?",
        documentIds: [],
      }),
    );
  });
});
