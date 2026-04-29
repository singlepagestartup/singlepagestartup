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

import { Handler } from "./create";

function createContext(events: string[]) {
  const formData = new FormData();

  formData.set(
    "data",
    JSON.stringify({
      description: "Hello",
    }),
  );

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
});
