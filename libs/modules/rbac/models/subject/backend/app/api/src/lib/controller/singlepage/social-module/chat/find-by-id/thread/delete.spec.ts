/**
 * BDD Suite: Telegram thread delete mirror.
 *
 * Given: a subject deletes a Telegram-backed SPS thread.
 * When: the RBAC thread delete handler removes the thread.
 * Then: the Telegram forum topic is deleted before the SPS thread is removed.
 */

const mockSocialModuleMessageDelete = jest.fn();
const mockSocialModuleThreadDelete = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "jwt-secret",
  RBAC_SECRET_KEY: "rbac-secret",
  TELEGRAM_SERVICE_BOT_TOKEN: "telegram-token",
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("@sps/social/models/message/sdk/server", () => ({
  api: {
    delete: (...args: unknown[]) => mockSocialModuleMessageDelete(...args),
  },
}));

jest.mock("@sps/social/models/thread/sdk/server", () => ({
  api: {
    delete: (...args: unknown[]) => mockSocialModuleThreadDelete(...args),
  },
}));

jest.mock("@sps/social/relations/chats-to-threads/sdk/server", () => ({
  api: {
    delete: jest.fn(),
  },
}));

import { Handler } from "./delete";

function createContext() {
  return {
    req: {
      param: (name: string) => {
        return {
          id: "subject-1",
          socialModuleChatId: "chat-1",
          socialModuleThreadId: "thread-1",
        }[name];
      },
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  return {
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest
      .fn()
      .mockResolvedValue(undefined),
    socialModuleChatLifecycleAssertThreadBelongsToChat: jest
      .fn()
      .mockResolvedValue(undefined),
    socialModule: {
      chat: {
        findById: jest.fn().mockResolvedValue({
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "-100123",
        }),
      },
      thread: {
        findById: jest.fn().mockResolvedValue({
          id: "thread-1",
          variant: "telegram",
          title: "Support",
          sourceSystemId: "42",
        }),
      },
      chatsToThreads: {
        find: jest.fn().mockResolvedValue([
          {
            id: "chat-thread-1",
            chatId: "chat-1",
            threadId: "thread-1",
          },
        ]),
      },
      threadsToMessages: {
        find: jest.fn().mockImplementation((props?: any) => {
          const filters = props?.params?.filters?.and ?? [];
          const messageFilter = filters.find((filter: any) => {
            return filter.column === "messageId";
          });

          if (messageFilter) {
            return Promise.resolve([
              {
                id: "thread-message-1",
                threadId: "thread-1",
                messageId: messageFilter.value,
              },
            ]);
          }

          return Promise.resolve([
            {
              id: "thread-message-1",
              threadId: "thread-1",
              messageId: "message-1",
            },
          ]);
        }),
      },
      chatsToMessages: {
        find: jest.fn().mockResolvedValue([
          {
            id: "chat-message-1",
            chatId: "chat-1",
            messageId: "message-1",
          },
        ]),
      },
    },
  } as any;
}

describe("Given: Telegram-backed SPS thread deletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        ok: true,
        result: true,
      }),
      statusText: "OK",
    }) as any;

    mockSocialModuleMessageDelete.mockResolvedValue({
      id: "message-1",
    });
    mockSocialModuleThreadDelete.mockResolvedValue({
      id: "thread-1",
    });
  });

  /**
   * BDD Scenario
   * Given: the SPS thread has Telegram sourceSystemId.
   * When: the thread is deleted through the RBAC chat endpoint.
   * Then: Telegram deleteForumTopic receives the mapped message_thread_id.
   */
  it("When: deleting thread Then: deletes Telegram topic by sourceSystemId", async () => {
    const handler = new Handler(createService());

    await handler.execute(createContext(), jest.fn());

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bottelegram-token/deleteForumTopic",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          chat_id: "-100123",
          message_thread_id: 42,
        }),
      }),
    );
    expect(mockSocialModuleMessageDelete).toHaveBeenCalledWith({
      id: "message-1",
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(mockSocialModuleThreadDelete).toHaveBeenCalledWith({
      id: "thread-1",
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
  });
});
