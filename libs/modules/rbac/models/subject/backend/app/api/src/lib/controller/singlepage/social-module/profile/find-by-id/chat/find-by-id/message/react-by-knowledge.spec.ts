/**
 * BDD Suite: RBAC profile-scoped Knowledge chat reaction.
 *
 * Given: social chats can opt into Knowledge/RAG mode with chat.variant="knowledge".
 * When: a subject asks an AI profile to learn or answer in that chat.
 * Then: the handler validates the chat mode and scopes Knowledge calls to the replying AI profile.
 */

const mockKnowledgeLearnContent = jest.fn();
const mockKnowledgeGenerate = jest.fn();
const mockKnowledgeGetModel = jest.fn();
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
        getModel: mockKnowledgeGetModel,
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
  profileSkillRelations?: unknown[];
  skills?: unknown[];
  threadMessages?: {
    id: string;
    description?: string;
    interaction?: Record<string, unknown>;
  }[];
}) {
  const currentMessage = {
    id: "message-1",
    description:
      props?.messageDescription || "@knowledge /learn Stored context",
  };
  const threadMessages = props?.threadMessages || [currentMessage];
  const threadMessageRelations = threadMessages.map((message, index) => {
    return {
      threadId: "thread-1",
      messageId: message.id,
      orderIndex: index,
      createdAt: new Date(
        `2026-01-01T10:${String(index).padStart(2, "0")}:00.000Z`,
      ),
    };
  });

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
        find: jest.fn((request?: any) => {
          const filters = request?.params?.filters?.and || [];
          const threadIdFilter = filters.find((filter: any) => {
            return filter.column === "threadId";
          });
          const messageIdFilter = filters.find((filter: any) => {
            return filter.column === "messageId";
          });

          return Promise.resolve(
            threadMessageRelations.filter((relation) => {
              if (
                threadIdFilter?.value &&
                relation.threadId !== threadIdFilter.value
              ) {
                return false;
              }

              if (
                messageIdFilter?.value &&
                relation.messageId !== messageIdFilter.value
              ) {
                return false;
              }

              return true;
            }),
          );
        }),
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
      profilesToSkills: {
        find: jest.fn().mockResolvedValue(props?.profileSkillRelations || []),
      },
      skill: {
        find: jest.fn().mockResolvedValue(props?.skills || []),
      },
      chat: {
        findById: jest.fn().mockResolvedValue({
          id: "chat-1",
          variant: props?.chatVariant || "knowledge",
        }),
      },
      message: {
        find: jest.fn((request?: any) => {
          const idFilter = request?.params?.filters?.and?.find(
            (filter: any) => {
              return filter.column === "id";
            },
          );
          const ids = Array.isArray(idFilter?.value) ? idFilter.value : null;

          return Promise.resolve(
            ids
              ? threadMessages.filter((message) => ids.includes(message.id))
              : threadMessages,
          );
        }),
        findById: jest.fn().mockResolvedValue(currentMessage),
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
    mockKnowledgeGetModel.mockResolvedValue({
      id: "openai/gpt-5-5",
      provider: "openai",
      providerModel: "gpt-5.5",
      task: "chat",
      local: false,
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
   * Given: a Knowledge chat message starts with @knowledge /learn.
   * When: the subject asks the AI profile to react through Knowledge.
   * Then: message text is stripped, indexed for the AI profile, and acknowledged in the same thread.
   */
  it("When: @knowledge /learn is used Then: it learns stripped message content for the AI profile", async () => {
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
    expect(
      (handler.service as any).socialModule.profilesToSkills.find,
    ).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat /learn message has an attachment with non-string reader output.
   * When: the subject asks the AI profile to learn from that attachment.
   * Then: the handler normalizes content before calling the Knowledge service.
   */
  it("When: /learn reads non-string attachment content Then: it normalizes content before learning", async () => {
    const service = createService({
      messageDescription: "@knowledge /learn",
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
   * Given: a Knowledge chat message starts with /learn without @knowledge.
   * When: the subject asks the AI profile to react through Knowledge.
   * Then: the handler rejects the command before indexing any knowledge.
   */
  it("When: bare /learn is used Then: it rejects without indexing knowledge", async () => {
    const handler = new Handler(
      createService({
        messageDescription: "/learn Stored context",
      }),
    );

    await expect(handler.execute(createContext(), jest.fn())).rejects.toThrow(
      "/learn requires @knowledge mention",
    );
    expect(mockKnowledgeLearnContent).not.toHaveBeenCalled();
    expect(mockSocialModuleMessageCreate).not.toHaveBeenCalled();
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
   * Given: a Knowledge chat message is sent without @knowledge.
   * When: the subject asks the AI profile to react through Knowledge.
   * Then: generation runs without hidden RAG side effects.
   */
  it("When: a normal question is asked without @knowledge Then: it skips RAG", async () => {
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
        documentIds: [],
        useKnowledgeSearch: false,
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
              documentIds: [],
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
   * Given: a Knowledge chat message explicitly mentions @knowledge.
   * When: the subject asks the AI profile to react through Knowledge.
   * Then: generation strips the @knowledge token and runs RAG in the AI profile document scope.
   */
  it("When: @knowledge is mentioned Then: it runs RAG with profile-scoped documents", async () => {
    const handler = new Handler(
      createService({
        messageDescription: "@knowledge What should we answer?",
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
        useKnowledgeSearch: true,
      }),
    );
    expect(mockSocialModuleMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: {
            knowledge: expect.objectContaining({
              requestedKnowledgeSearch: true,
              documentIds: ["document-1"],
              useKnowledgeSearch: true,
            }),
          },
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat thread already has an assistant response.
   * When: the user asks to format or edit that prior response.
   * Then: generation receives thread history and skips RAG search for that follow-up.
   */
  it("When: a follow-up edits prior text Then: it uses thread history without RAG", async () => {
    const handler = new Handler(
      createService({
        messageDescription:
          'Сделай нормальное форматирование текста и тут не "спикер", а Максим Иванов',
        knowledgeDocumentRelations: [
          {
            knowledgeModuleDocumentId: "document-1",
          },
        ],
        threadMessages: [
          {
            id: "assistant-message-previous",
            description: "В этом фрагменте спикер оценивает помещение.",
            interaction: {
              role: "assistant",
              content: "В этом фрагменте спикер оценивает помещение.",
            },
          },
          {
            id: "message-1",
            description:
              'Сделай нормальное форматирование текста и тут не "спикер", а Максим Иванов',
          },
        ],
      }),
    );

    await handler.execute(createContext(), jest.fn());

    expect(mockKnowledgeGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        query:
          'Сделай нормальное форматирование текста и тут не "спикер", а Максим Иванов',
        documentIds: [],
        useKnowledgeSearch: false,
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

  /**
   * BDD Scenario
   * Given: the replying AI profile has an active linked social skill.
   * When: a normal Knowledge question is answered without an explicit @skill.
   * Then: generation does not apply linked skills as a hidden prompt side effect.
   */
  it("When: no skill ids are selected Then: it does not apply linked profile skills", async () => {
    const skill = {
      id: "skill-1",
      slug: "brief-writer",
      title: "Brief Writer",
      description: "Write a concise product brief.",
      status: "published",
      metadata: {},
    };
    const handler = new Handler(
      createService({
        messageDescription: "What should we answer?",
        profileSkillRelations: [{ skillId: "skill-1" }],
        skills: [skill],
      }),
    );

    await handler.execute(createContext(), jest.fn());

    expect(
      (handler.service as any).socialModule.profilesToSkills.find,
    ).not.toHaveBeenCalled();
    expect(mockKnowledgeGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        skillInstructions: [],
      }),
    );
    expect(mockSocialModuleMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: {
            knowledge: expect.objectContaining({
              skills: [],
            }),
          },
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat message mentions a selected skill from the replying AI profile.
   * When: the subject asks the AI profile to answer through Knowledge.
   * Then: RBAC scopes the selected skill to the replying AI profile and passes it as prompt instructions.
   */
  it("When: selected skill ids are passed Then: it uses prompt skills linked to the replying AI profile", async () => {
    const skill = {
      id: "skill-1",
      slug: "brief-writer",
      title: "Brief Writer",
      description: "Write a concise product brief.",
      status: "active",
      metadata: {},
    };
    const handler = new Handler(
      createService({
        messageDescription: "@brief-writer What should we answer?",
        profileSkillRelations: [{ skillId: "skill-1" }],
        skills: [skill],
      }),
    );

    await handler.execute(
      createContext({
        skillIds: ["skill-1"],
      }),
      jest.fn(),
    );

    expect(
      (handler.service as any).socialModule.profilesToSkills.find,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: "assistant-profile-1",
              },
            ],
          },
        }),
      }),
    );
    expect(mockKnowledgeGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "What should we answer?",
        skillInstructions: [
          {
            id: "skill-1",
            slug: "brief-writer",
            title: "Brief Writer",
            instructions: "Write a concise product brief.",
          },
        ],
      }),
    );
    expect(mockSocialModuleMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: {
            knowledge: expect.objectContaining({
              requestedSkillIds: ["skill-1"],
              skillsProfileId: "assistant-profile-1",
              skills: [
                {
                  skillId: "skill-1",
                  slug: "brief-writer",
                  title: "Brief Writer",
                  mode: "prompt-instruction",
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
   * Given: a Knowledge chat message mentions @knowledge and a linked selected skill.
   * When: the subject asks the AI profile to answer through Knowledge.
   * Then: generation combines RAG document scope with selected skill instructions.
   */
  it("When: @knowledge and selected skill ids are passed Then: it combines RAG and prompt skills", async () => {
    const skill = {
      id: "skill-1",
      slug: "brief-writer",
      title: "Brief Writer",
      description: "Write a concise product brief.",
      status: "active",
      metadata: {},
    };
    const handler = new Handler(
      createService({
        messageDescription: "@knowledge @brief-writer What should we answer?",
        knowledgeDocumentRelations: [
          {
            knowledgeModuleDocumentId: "document-1",
          },
        ],
        profileSkillRelations: [{ skillId: "skill-1" }],
        skills: [skill],
      }),
    );

    await handler.execute(
      createContext({
        skillIds: ["skill-1"],
      }),
      jest.fn(),
    );

    expect(mockKnowledgeGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "What should we answer?",
        documentIds: ["document-1"],
        useKnowledgeSearch: true,
        skillInstructions: [
          {
            id: "skill-1",
            slug: "brief-writer",
            title: "Brief Writer",
            instructions: "Write a concise product brief.",
          },
        ],
      }),
    );
  });
});
