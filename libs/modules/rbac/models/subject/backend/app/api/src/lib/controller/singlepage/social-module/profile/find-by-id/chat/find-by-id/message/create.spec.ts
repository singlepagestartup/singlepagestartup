/**
 * BDD Suite: rbac social message create author relation.
 *
 * Given: action logging can process a successful message create response immediately.
 * When: the subject creates a message in a chat thread.
 * Then: the message author relation exists before the handler returns the response.
 */

const mockSocialModuleProfilesToMessagesCreate = jest.fn();
const mockSocialModuleMessageCreate = jest.fn();
const mockSocialModuleChatsToMessagesCreate = jest.fn();
const mockSocialModuleThreadsToMessagesCreate = jest.fn();
const mockSocialModuleMessagesToFilesCreate = jest.fn();
const mockFileStorageFileCreate = jest.fn();

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
      update: jest.fn(),
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
      notify: jest.fn(),
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
});
