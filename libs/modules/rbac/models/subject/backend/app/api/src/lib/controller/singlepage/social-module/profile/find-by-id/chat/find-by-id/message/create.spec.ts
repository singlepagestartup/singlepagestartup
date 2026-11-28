jest.mock("@sps/shared-backend-api", () => ({
  withConsistencyDatabase: async (
    _db: unknown,
    operation: () => Promise<unknown>,
  ) => operation(),
}));
jest.mock("@sps/shared-backend-database-config", () => ({
  getDrizzle: () => ({
    transaction: async (operation: (db: unknown) => Promise<unknown>) =>
      operation({}),
  }),
}));
/**
 * BDD Suite: rbac social message create author relation.
 *
 * Given: action logging can process a successful message create response immediately.
 * When: the subject creates a message in a chat thread.
 * Then: the message author relation exists before the handler returns the response.
 */

const mockSocialModuleProfilesToMessagesCreate = jest.fn();
const mockSocialModuleMessageCreate = jest.fn();
const mockSocialModuleMessageUpdate = jest.fn();
const mockSocialModuleChatsToMessagesCreate = jest.fn();
const mockSocialModuleThreadsToMessagesCreate = jest.fn();
const mockSocialModuleMessagesToFilesCreate = jest.fn();
const mockFileStorageFileCreate = jest.fn();
const mockRbacSubjectNotify = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    AUDIO_TRANSCRIPTION_LEGACY_METADATA_KEY: "telegramVoiceTranscription",
    AUDIO_TRANSCRIPTION_ACTION_TYPE: "audio_transcription_completed",
    AUDIO_TRANSCRIPTION_DEFAULT_MODEL: "gpt-4o-transcribe",
    AUDIO_TRANSCRIPTION_MAX_BYTES: 25 * 1024 * 1024,
    AUDIO_TRANSCRIPTION_METADATA_KEY: "audioTranscription",
    OPEN_AI_TRANSCRIPTION_MODEL: undefined,
    RBAC_JWT_SECRET: "jwt-secret",
    RBAC_SECRET_KEY: "rbac-secret",
    assertSupportedAiChatAttachments:
      jest.requireActual("@sps/shared-utils").assertSupportedAiChatAttachments,
  };
});

jest.mock("@sps/backend-utils", () => {
  return {
    ...jest.requireActual("@sps/backend-utils"),
    getHttpErrorType: (error: Error) => ({
      status: 400,
      message: error.message,
      details: null,
    }),
    logger: {
      error: jest.fn(),
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

jest.mock("@sps/social/models/message/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) => mockSocialModuleMessageCreate(...args),
      update: (...args: unknown[]) => mockSocialModuleMessageUpdate(...args),
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

jest.mock(
  "@sps/social/relations/messages-to-file-storage-module-files/sdk/server",
  () => {
    return {
      api: {
        create: (...args: unknown[]) =>
          mockSocialModuleMessagesToFilesCreate(...args),
      },
    };
  },
);

jest.mock("@sps/file-storage/models/file/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) => mockFileStorageFileCreate(...args),
    },
  };
});

jest.mock("@sps/rbac/models/subject/sdk/server", () => {
  return {
    api: {
      notify: (...args: unknown[]) => mockRbacSubjectNotify(...args),
    },
  };
});

import { AUDIO_TRANSCRIPTION_METADATA_KEY } from "@sps/shared-utils";
import { Handler } from "./create";

function createContext(
  events: string[],
  data: Record<string, unknown> = {
    description: "Hello",
  },
) {
  const formData = new FormData();

  formData.set("data", JSON.stringify(data));

  return {
    req: {
      header: jest.fn(),
      param: (name: string) => {
        return {
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
          socialModuleThreadId: "thread-1",
        }[name];
      },
      formData: jest.fn().mockResolvedValue(formData),
    },
    get: jest.fn(),
    header: jest.fn(),
    json: jest.fn((payload: unknown) => {
      events.push("response");

      return payload;
    }),
  } as any;
}

function createService() {
  return {
    customerWork: {
      messageFromThread: jest.fn().mockResolvedValue(null),
      sendEmployeeTraining: jest.fn(),
      orderSupport: { send: jest.fn() },
    },
    socialModuleChatLifecycleAssertThreadBelongsToChat: jest
      .fn()
      .mockResolvedValue(undefined),
    modules: {
      social: {
        message: {
          find: jest.fn().mockResolvedValue([]),
          create: (...args: unknown[]) =>
            mockSocialModuleMessageCreate(...args),
        },
        profilesToMessages: {
          create: (...args: unknown[]) =>
            mockSocialModuleProfilesToMessagesCreate(...args),
        },
        chatsToMessages: {
          create: (...args: unknown[]) =>
            mockSocialModuleChatsToMessagesCreate(...args),
        },
        threadsToMessages: {
          create: (...args: unknown[]) =>
            mockSocialModuleThreadsToMessagesCreate(...args),
        },
        chat: {
          findById: jest
            .fn()
            .mockResolvedValue({ id: "chat-1", variant: "ai-chat" }),
        },
        thread: {
          findById: jest
            .fn()
            .mockResolvedValue({ id: "thread-1", metadata: {} }),
        },
        profilesToChats: {
          find: jest.fn().mockResolvedValue([
            {
              chatId: "chat-1",
              profileId: "profile-1",
            },
          ]),
        },
        profile: {
          findById: jest.fn().mockResolvedValue({
            id: "assistant-profile",
            variant: "artificial-intelligence",
          }),
        },
        messagesToFileStorageModuleFiles: {
          create: (...args: unknown[]) =>
            mockSocialModuleMessagesToFilesCreate(...args),
          find: jest.fn().mockResolvedValue([]),
        },
      },
    },
  } as any;
}

describe("Given: rbac social message create author relation", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSocialModuleMessageCreate.mockResolvedValue({
      id: "message-1",
      description: "Hello",
    });
    mockSocialModuleChatsToMessagesCreate.mockResolvedValue({});
    mockSocialModuleThreadsToMessagesCreate.mockResolvedValue({});
    mockSocialModuleProfilesToMessagesCreate.mockResolvedValue({});
    mockSocialModuleMessagesToFilesCreate.mockResolvedValue({});
    mockFileStorageFileCreate.mockResolvedValue({});
    mockSocialModuleMessageUpdate.mockResolvedValue({});
    mockRbacSubjectNotify.mockResolvedValue({});
  });

  it("uses human support without starting a workflow or dispatching an AI reaction", async () => {
    const service = createService();
    const context = createContext([]);
    context.get.mockReturnValue(true);
    service.customerWork.orderSupport.send.mockResolvedValue({
      id: "support-message",
      variant: "customer-work",
    });
    const response = await new Handler(service).execute(context, jest.fn());

    expect(service.customerWork.orderSupport.send).toHaveBeenCalledWith({
      customerId: "subject-1",
      profileId: "profile-1",
      chatId: "chat-1",
      threadId: "thread-1",
      text: "Hello",
      sourceSystemId: undefined,
      attachments: [],
    });
    expect(service.customerWork.messageFromThread).not.toHaveBeenCalled();
    expect(mockSocialModuleMessageCreate).not.toHaveBeenCalled();
    expect(context.header).toHaveBeenCalledWith(
      "X-SPS-SKIP-ACTION-LOGGER",
      "1",
    );
    expect(response).toMatchObject({
      data: { id: "support-message", authorProfileIds: ["profile-1"] },
    });
  });

  it("uses the linked customer's workflow before writing an ordinary Social message", async () => {
    const service = createService();
    service.customerWork.messageFromThread.mockResolvedValue({
      id: "workflow-message",
    });
    const context = createContext([], {
      description: "Hello",
      sourceSystemId: "482",
    });
    const response = await new Handler(service).execute(context, jest.fn());

    expect(service.customerWork.messageFromThread).toHaveBeenCalledWith({
      customerId: "subject-1",
      chatId: "chat-1",
      threadId: "thread-1",
      profileId: "profile-1",
      text: "Hello",
      sourceSystemId: "482",
      hasAttachments: false,
    });
    expect(response).toEqual({
      data: {
        id: "workflow-message",
        authorProfileIds: ["profile-1"],
        attachments: [],
      },
    });
    expect(mockSocialModuleMessageCreate).not.toHaveBeenCalled();
  });

  it.each([
    [
      "voice.wav",
      "audio/wav",
      "524946462600000057415645666d74201000000001000100401f0000803e00000200100064617461020000000000",
    ],
    [
      "clip.mp4",
      "video/mp4",
      "000000186674797069736f6d0000000069736f6d6d703432",
    ],
  ])(
    "accepts a %s attachment in ordinary AI chat and links the uploaded file to its message",
    async (name, type, hex) => {
      const context = createContext([], { description: "" });
      const form = await context.req.formData();
      const file = new File([Buffer.from(hex, "hex")], name, { type });
      form.append("files", file);
      mockFileStorageFileCreate.mockResolvedValueOnce({ id: "media-file" });
      const handler = new Handler(createService());
      handler.notifyOtherSubjectsInChat = jest
        .fn()
        .mockResolvedValue(undefined);

      await handler.execute(context, jest.fn());

      expect(mockFileStorageFileCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { adminTitle: name, file },
        }),
      );
      expect(mockSocialModuleMessagesToFilesCreate).toHaveBeenCalledWith({
        data: {
          messageId: "message-1",
          fileStorageModuleFileId: "media-file",
          orderIndex: 0,
        },
      });
    },
  );

  it("passes the selected text model and reasoning effort to the linked workflow", async () => {
    const service = createService();
    service.customerWork.messageFromThread.mockResolvedValue({
      id: "workflow-message",
    });
    const context = createContext([], {
      description: "Hello",
      metadata: { provider: { modelId: " gpt-5.2 ", reasoning: "high" } },
    });
    await new Handler(service).execute(context, jest.fn());

    expect(service.customerWork.messageFromThread).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { provider: { modelId: "gpt-5.2", reasoning: "high" } },
      }),
    );
    expect(mockSocialModuleMessageCreate).not.toHaveBeenCalled();
  });

  it("submits employee training files and returns their private download references", async () => {
    const service = createService();
    const chat = { id: "chat-1", variant: "store-employee" };
    service.modules.social.chat.findById.mockResolvedValue(chat);
    const attachment = {
      id: "7e87970f-4675-4a18-a26d-f78ab3237794",
      name: "notes.txt",
    };
    service.customerWork.sendEmployeeTraining.mockResolvedValue({
      id: "training-message",
      variant: "customer-work",
      description: "",
      metadata: {
        customerWorkAttachments: [
          { ...attachment, digest: "a".repeat(64), mimeType: "text/plain" },
        ],
      },
    });
    const context = createContext([], { description: "", sourceSystemId: "1" });
    const form = await context.req.formData();
    const file = new File(["notes"], attachment.name, { type: "text/plain" });
    form.append("files", file);

    const result = await new Handler(service).execute(context, jest.fn());

    expect(service.customerWork.sendEmployeeTraining).toHaveBeenCalledWith({
      actorId: "subject-1",
      actorProfileId: "profile-1",
      chat,
      threadId: "thread-1",
      text: "",
      sourceSystemId: "1",
      selection: undefined,
      attachments: [file],
    });
    expect(result).toEqual({
      data: {
        id: "training-message",
        variant: "customer-work",
        description: "",
        metadata: {},
        privateAttachments: [{ ...attachment, mimeType: "text/plain" }],
        authorProfileIds: ["profile-1"],
        attachments: [],
      },
    });
    expect(mockFileStorageFileCreate).not.toHaveBeenCalled();
  });

  it("reserves CRM staff message authorship for the scoped workspace route", async () => {
    const service = createService();
    const context = createContext([], {
      description: "Fake staff reply",
      sourceSystemId: "workspace-staff:task:staff:operation",
    });
    await expect(
      new Handler(service).execute(context, jest.fn()),
    ).rejects.toThrow("This message key is reserved");
    expect(service.customerWork.messageFromThread).not.toHaveBeenCalled();
    expect(mockSocialModuleMessageCreate).not.toHaveBeenCalled();
  });

  it.each([
    { modelId: "gpt-5.2", reasoning: "unknown" },
    { modelId: "auto", reasoning: "high" },
  ])(
    "rejects an invalid reasoning selection before calling the workflow",
    async (provider) => {
      const service = createService();
      const context = createContext([], {
        description: "Hello",
        metadata: { provider },
      });
      await expect(
        new Handler(service).execute(context, jest.fn()),
      ).rejects.toThrow("Invalid provider model selection");
      expect(service.customerWork.messageFromThread).not.toHaveBeenCalled();
      expect(mockSocialModuleMessageCreate).not.toHaveBeenCalled();
    },
  );

  it("rejects explicit workflow reasoning in an ordinary Social message", async () => {
    const context = createContext([], {
      description: "Hello",
      metadata: { provider: { modelId: "gpt-5.2", reasoning: "high" } },
    });
    await expect(
      new Handler(createService()).execute(context, jest.fn()),
    ).rejects.toThrow("Reasoning effort is unavailable for this conversation");
    expect(mockSocialModuleMessageCreate).not.toHaveBeenCalled();
  });

  it("stores each attachment separately and links all of them in message order", async () => {
    const context = createContext([]);
    const form = await context.req.formData();
    const files = [
      new File(["<p>Example</p>"], "demo.html", { type: "text/html" }),
      new File(["# Notes"], "notes.md", { type: "text/markdown" }),
    ];
    for (const file of files) {
      form.append("files", file);
      mockFileStorageFileCreate.mockResolvedValueOnce({ id: file.name });
    }
    const handler = new Handler(createService());
    handler.notifyOtherSubjectsInChat = jest.fn().mockResolvedValue(undefined);

    await handler.execute(context, jest.fn());

    expect(mockFileStorageFileCreate).toHaveBeenCalledTimes(files.length);
    expect(mockSocialModuleMessagesToFilesCreate).toHaveBeenCalledTimes(
      files.length,
    );
    for (const [index, file] of files.entries()) {
      expect(mockFileStorageFileCreate).toHaveBeenNthCalledWith(
        index + 1,
        expect.objectContaining({ data: { adminTitle: file.name, file } }),
      );
      expect(mockSocialModuleMessagesToFilesCreate).toHaveBeenNthCalledWith(
        index + 1,
        {
          data: {
            messageId: "message-1",
            fileStorageModuleFileId: file.name,
            orderIndex: index,
          },
        },
      );
    }
  });

  /**
   * BDD Scenario
   * Given: a thread message create request succeeds.
   * When: the handler links the message to chat, thread, and author.
   * Then: the author relation is persisted before the HTTP response is returned.
   */
  it("When: message is created Then: profiles-to-messages is created before response", async () => {
    const events: string[] = [];

    mockSocialModuleProfilesToMessagesCreate.mockImplementationOnce(
      async () => {
        events.push("profiles-to-messages");

        return {};
      },
    );

    const handler = new Handler(createService());
    handler.notifyOtherSubjectsInChat = jest.fn(() => {
      events.push("notify");

      return Promise.resolve();
    });

    const context = createContext(events);

    await handler.execute(context, jest.fn());

    expect(mockSocialModuleProfilesToMessagesCreate).toHaveBeenCalledWith({
      data: {
        messageId: "message-1",
        profileId: "profile-1",
      },
    });
    expect(events.indexOf("profiles-to-messages")).toBeGreaterThanOrEqual(0);
    expect(events.indexOf("response")).toBeGreaterThan(
      events.indexOf("profiles-to-messages"),
    );
    expect(handler.notifyOtherSubjectsInChat).toHaveBeenCalled();
    expect(context.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorProfileIds: ["profile-1"],
        attachments: [],
      }),
    });
  });

  /**
   * BDD Scenario
   * Given: a Telegram system message must precede a dependent AI reply.
   * When: message metadata requests awaited notification delivery.
   * Then: the create response is held until notification delivery completes.
   */
  it("When: system notification is awaited Then: delivery precedes response", async () => {
    const events: string[] = [];
    let finishNotification: (() => void) | undefined;
    let markNotificationStarted: (() => void) | undefined;
    const notificationStarted = new Promise<void>((resolve) => {
      markNotificationStarted = resolve;
    });

    mockSocialModuleMessageCreate.mockResolvedValueOnce({
      id: "message-1",
      description: "Tool calls",
      metadata: {
        systemMessage: {
          version: 1,
          source: "rbac.telegram.ai-execution",
          excludeFromOpenRouter: true,
          awaitNotification: true,
        },
      },
    });

    const handler = new Handler(createService());
    handler.notifyOtherSubjectsInChat = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          markNotificationStarted?.();
          finishNotification = () => {
            events.push("notify");
            resolve();
          };
        }),
    );

    const executePromise = handler.execute(
      createContext(events, {
        description: "Tool calls",
        metadata: {
          systemMessage: {
            version: 1,
            source: "rbac.telegram.ai-execution",
            excludeFromOpenRouter: true,
            awaitNotification: true,
          },
        },
      }),
      jest.fn(),
    );

    await notificationStarted;
    expect(events).toEqual([]);

    finishNotification?.();
    await executePromise;

    expect(events).toEqual(["notify", "response"]);
  });

  /**
   * BDD Scenario
   * Given: the web composer persists its complete AI reaction intent with the message.
   * When: message creation normalizes that intent.
   * Then: the action logger remains enabled and receives one durable backend-dispatch trigger.
   */
  it("When: AI reaction intent is persisted Then: action dispatch is not suppressed", async () => {
    const events: string[] = [];
    const handler = new Handler(createService());
    handler.notifyOtherSubjectsInChat = jest.fn().mockResolvedValue(undefined);
    const context = createContext(events, {
      description: "Use MCP",
      metadata: {
        rbacAiReactionRequest: {
          version: 1,
          modelId: " auto ",
          reasoning: "auto",
          skillIds: ["skill-1", "skill-1"],
          useKnowledgeSearch: false,
        },
      },
    });

    await handler.execute(context, jest.fn());

    expect(mockSocialModuleMessageCreate).toHaveBeenCalledWith({
      data: {
        description: "Use MCP",
        metadata: {
          rbacAiReactionRequest: {
            version: 1,
            modelId: "auto",
            reasoning: "auto",
            skillIds: ["skill-1"],
            useKnowledgeSearch: false,
          },
        },
      },
    });
    expect(context.header).not.toHaveBeenCalledWith(
      "X-SPS-SKIP-ACTION-LOGGER",
      "1",
    );
    expect(events).toEqual(["response"]);
  });

  it("preserves the message and requested chat options in a former document thread", async () => {
    const service = createService();
    service.modules.social.thread.findById.mockResolvedValue({
      id: "thread-1",
      metadata: {
        aiChatDocument: {
          key: "brief",
          profileId: "assistant-profile",
          sourceIds: ["brief-source"],
        },
      },
    });
    const handler = new Handler(service);
    handler.notifyOtherSubjectsInChat = jest.fn().mockResolvedValue(undefined);
    const data = {
      description: "Prepare the brief",
      metadata: {
        rbacAiReactionRequest: {
          version: 1,
          modelId: "auto",
          reasoning: "auto",
          skillIds: ["user-skill"],
          useKnowledgeSearch: false,
        },
      },
    };

    await handler.execute(createContext([], data), jest.fn());

    expect(mockSocialModuleMessageCreate).toHaveBeenCalledWith({ data });
    expect(mockSocialModuleThreadsToMessagesCreate).toHaveBeenCalledWith({
      data: { messageId: "message-1", threadId: "thread-1" },
    });
  });

  /**
   * BDD Scenario
   * Given: an audio attachment is created as a processing social message.
   * When: the handler persists the message and attached audio.
   * Then: it skips ordinary chat notifications so Telegram does not echo the transient audio attachment.
   */
  it("When: audio transcription is processing Then: ordinary chat notification is skipped", async () => {
    const events: string[] = [];

    mockSocialModuleMessageCreate.mockResolvedValueOnce({
      id: "message-1",
      description: "",
      metadata: {
        [AUDIO_TRANSCRIPTION_METADATA_KEY]: {
          status: "processing",
        },
      },
    });

    const handler = new Handler(createService());
    handler.notifyOtherSubjectsInChat = jest.fn(() => {
      events.push("notify");

      return Promise.resolve();
    });

    const context = createContext(events, {
      description: "",
      metadata: {
        [AUDIO_TRANSCRIPTION_METADATA_KEY]: {
          status: "processing",
        },
      },
    });

    await handler.execute(context, jest.fn());

    expect(mockSocialModuleProfilesToMessagesCreate).toHaveBeenCalledWith({
      data: {
        messageId: "message-1",
        profileId: "profile-1",
      },
    });
    expect(handler.notifyOtherSubjectsInChat).not.toHaveBeenCalled();
    expect(events).toEqual(["response"]);
  });

  /**
   * BDD Scenario
   * Given: Telegram delivery completes after another request has replaced a placeholder with interactive menu content.
   * When: the delivery path persists Telegram's source-system message id from its stale create-time snapshot.
   * Then: it patches only the source-system id and cannot restore the stale placeholder fields.
   */
  it("When: Telegram delivery finishes late Then: newer message content is preserved", async () => {
    const service = {
      find: jest.fn().mockResolvedValue([{ id: "subject-2" }]),
      modules: {
        social: {
          chat: {
            findById: jest.fn().mockResolvedValue({
              id: "chat-1",
              sourceSystemId: "153077581",
              variant: "telegram",
            }),
          },
          thread: {
            findById: jest.fn().mockResolvedValue({ id: "thread-1" }),
          },
          profilesToChats: {
            find: jest
              .fn()
              .mockResolvedValue([
                { chatId: "chat-1", profileId: "profile-2" },
              ]),
          },
          profile: {
            find: jest.fn().mockResolvedValue([{ id: "profile-2" }]),
          },
        },
        notification: {
          template: {
            find: jest.fn().mockResolvedValue([
              {
                id: "template-1",
                variant: "telegram-social-module-message-created",
              },
            ]),
          },
        },
      },
      module: {
        subjectsToSocialModuleProfiles: {
          find: jest.fn().mockResolvedValue([
            {
              subjectId: "subject-2",
              socialModuleProfileId: "profile-2",
            },
          ]),
        },
      },
    } as any;
    const staleCreateTimeMessage = {
      id: "message-1",
      description: "Готовлю меню управления ассистентом…",
      interaction: {},
      messagesToFileStorageModuleFiles: [],
    } as any;

    mockRbacSubjectNotify.mockResolvedValueOnce({
      notificationService: {
        notifications: [{ sourceSystemId: "5263" }],
      },
    });

    await new Handler(service).notifyOtherSubjectsInChat({
      id: "subject-1",
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-1",
      socialModuleProfileId: "profile-1",
      extendedSocialModuleMessage: staleCreateTimeMessage,
    });

    expect(mockSocialModuleMessageUpdate).toHaveBeenCalledWith({
      id: "message-1",
      data: {
        sourceSystemId: "5263",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
  });
});

it("rejects unsupported AI Chat uploads before creating a message or uploading any file", async () => {
  jest.clearAllMocks();
  const context = createContext([]);
  const body = new FormData();
  body.set("data", JSON.stringify({ description: "Review the logo" }));
  body.set(
    "files",
    new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" }),
  );
  context.req.formData.mockResolvedValue(body);
  const handler = new Handler(createService());
  await expect(handler.execute(context, jest.fn())).rejects.toThrow(
    "Unsupported files: logo.svg",
  );
  expect(mockSocialModuleMessageCreate).not.toHaveBeenCalled();
  expect(mockFileStorageFileCreate).not.toHaveBeenCalled();
});
