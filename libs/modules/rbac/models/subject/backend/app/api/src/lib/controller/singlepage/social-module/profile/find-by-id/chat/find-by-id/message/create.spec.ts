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
    AUDIO_TRANSCRIPTION_LEGACY_METADATA_KEY: "telegramVoiceTranscription",
    AUDIO_TRANSCRIPTION_ACTION_TYPE: "audio_transcription_completed",
    AUDIO_TRANSCRIPTION_DEFAULT_MODEL: "gpt-4o-transcribe",
    AUDIO_TRANSCRIPTION_MAX_BYTES: 25 * 1024 * 1024,
    AUDIO_TRANSCRIPTION_METADATA_KEY: "audioTranscription",
    OPEN_AI_TRANSCRIPTION_MODEL: undefined,
    RBAC_JWT_SECRET: "jwt-secret",
    RBAC_SECRET_KEY: "rbac-secret",
  };
});

jest.mock("@sps/backend-utils", () => {
  return {
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
    header: jest.fn(),
    json: jest.fn((payload: unknown) => {
      events.push("response");

      return payload;
    }),
  } as any;
}

function createService() {
  return {
    socialModuleChatLifecycleAssertThreadBelongsToChat: jest
      .fn()
      .mockResolvedValue(undefined),
    socialModule: {
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
        find: jest.fn().mockResolvedValue([]),
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(events.indexOf("profiles-to-messages")).toBeGreaterThanOrEqual(0);
    expect(events.indexOf("response")).toBeGreaterThan(
      events.indexOf("profiles-to-messages"),
    );
    expect(handler.notifyOtherSubjectsInChat).toHaveBeenCalled();
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(context.header).not.toHaveBeenCalledWith(
      "X-SPS-SKIP-ACTION-LOGGER",
      "1",
    );
    expect(events).toEqual(["response"]);
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
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
      socialModule: {
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
            .mockResolvedValue([{ chatId: "chat-1", profileId: "profile-2" }]),
        },
        profile: {
          find: jest.fn().mockResolvedValue([{ id: "profile-2" }]),
        },
      },
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([
          {
            subjectId: "subject-2",
            socialModuleProfileId: "profile-2",
          },
        ]),
      },
      find: jest.fn().mockResolvedValue([{ id: "subject-2" }]),
      notificationModule: {
        template: {
          find: jest.fn().mockResolvedValue([
            {
              id: "template-1",
              variant: "telegram-social-module-message-created",
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
