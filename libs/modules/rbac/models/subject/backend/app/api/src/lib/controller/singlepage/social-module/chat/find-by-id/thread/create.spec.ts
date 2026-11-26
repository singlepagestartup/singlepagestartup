const mockSocialModuleThreadCreate = jest.fn();
const mockSocialModuleThreadUpdate = jest.fn();
const mockSocialModuleChatsToThreadsCreate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
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

jest.mock("@sps/social/models/thread/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSocialModuleThreadCreate(...args),
    update: (...args: unknown[]) => mockSocialModuleThreadUpdate(...args),
  },
}));

jest.mock("@sps/social/relations/chats-to-threads/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleChatsToThreadsCreate(...args),
  },
}));

import { Handler } from "./create";

function createContext(data: Record<string, unknown> = { title: "Support" }) {
  return {
    req: {
      param: (name: string) => {
        return {
          id: "subject-1",
          socialModuleChatId: "chat-1",
        }[name];
      },
      parseBody: jest.fn().mockResolvedValue({
        data: JSON.stringify(data),
      }),
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  return {
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest
      .fn()
      .mockResolvedValue(undefined),
    modules: {
      social: {
        chat: {
          findById: jest.fn().mockResolvedValue({
            id: "chat-1",
            variant: "telegram",
            sourceSystemId: "-100123",
          }),
        },
        chatsToThreads: {
          find: jest.fn().mockResolvedValue([]),
        },
        thread: {
          find: jest.fn().mockResolvedValue([]),
        },
      },
    },
  } as any;
}

describe("Given: Telegram-backed SPS chat thread creation", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        ok: true,
        result: {
          message_thread_id: 42,
          name: "Support",
          icon_color: 7322096,
        },
      }),
      statusText: "OK",
    }) as any;

    mockSocialModuleThreadCreate.mockResolvedValue({
      id: "thread-1",
      title: "Support",
      sourceSystemId: "42",
    });
    mockSocialModuleThreadUpdate.mockResolvedValue({
      id: "thread-existing",
      title: "Support",
      sourceSystemId: "42",
    });
    mockSocialModuleChatsToThreadsCreate.mockResolvedValue({
      id: "chat-to-thread-1",
    });
  });

  it("preserves the employee chat's supported thread variants", async () => {
    const service = createService();
    service.modules.social.chat.findById.mockResolvedValue({
      id: "chat-1",
      variant: "store-employee",
    });
    await expect(
      new Handler(service as any).execute(
        createContext({ title: "Discussion", variant: "telegram" }),
        jest.fn(),
      ),
    ).rejects.toThrow("Training discussions use the custom variant");
    expect(mockSocialModuleThreadCreate).not.toHaveBeenCalled();
  });

  it("rejects new document metadata before creating the thread or its Telegram topic", async () => {
    await expect(
      new Handler(createService()).execute(
        createContext({
          title: "Brief.md",
          metadata: {
            aiChatDocument: {
              key: "brief",
              profileId: "profile",
              sourceIds: [],
            },
          },
        }),
        jest.fn(),
      ),
    ).rejects.toThrow("Thread documents are no longer supported");
    expect(mockSocialModuleThreadCreate).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: Telegram accepts the forum topic create request.
   * When: a thread is created through the RBAC chat endpoint.
   * Then: the persisted SPS thread stores Telegram message_thread_id.
   */
  it("When: creating thread Then: creates Telegram topic and stores sourceSystemId", async () => {
    const handler = new Handler(createService());

    await handler.execute(createContext(), jest.fn());

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bottelegram-token/createForumTopic",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          chat_id: "-100123",
          name: "Support",
        }),
      }),
    );
    expect(mockSocialModuleThreadCreate).toHaveBeenCalledWith({
      data: {
        title: "Support",
        variant: "telegram",
        sourceSystemId: "42",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(mockSocialModuleChatsToThreadsCreate).toHaveBeenCalledWith({
      data: {
        chatId: "chat-1",
        threadId: "thread-1",
        variant: "telegram",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: Telegram creates a private-chat topic with a fallback title.
   * When: a thread is created with a specific SPS title.
   * Then: the handler immediately renames the Telegram topic to the SPS title.
   */
  it("When: Telegram returns fallback topic name Then: renames topic to SPS title", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        ok: true,
        result: {
          message_thread_id: 42,
          name: "New Chat",
          icon_color: 7322096,
        },
      }),
      statusText: "OK",
    });
    const handler = new Handler(createService());

    await handler.execute(createContext(), jest.fn());

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bottelegram-token/editForumTopic",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          chat_id: "-100123",
          message_thread_id: 42,
          name: "Support",
        }),
      }),
    );
  });
});
