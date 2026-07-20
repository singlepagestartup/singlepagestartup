/**
 * BDD Suite: Telegram bootstrap duplicate chat and thread cleanup.
 *
 * Given: concurrent Telegram updates produced duplicate SPS chats or threads.
 * When: bootstrap resolves the chat and thread for a subsequent update.
 * Then: relations are reconnected to the first-created records and duplicates are removed.
 */

const mockSocialModuleChatsToThreadsDelete = jest.fn();
const mockSocialModuleChatsToThreadsCreate = jest.fn();
const mockSocialModuleChatsToMessagesCreate = jest.fn();
const mockSocialModuleChatsToActionsCreate = jest.fn();
const mockSocialModuleThreadsToMessagesCreate = jest.fn();
const mockSocialModuleThreadsToActionsCreate = jest.fn();
const mockSocialModuleChatCreate = jest.fn();
const mockSocialModuleChatDelete = jest.fn();
const mockSocialModuleThreadCreate = jest.fn();
const mockSocialModuleThreadUpdate = jest.fn();
const mockSocialModuleThreadDelete = jest.fn();
const mockOpenRouterGenerate = jest.fn();
const mockSocialModuleProfilesToChatsCreate = jest.fn();
const mockSocialModuleProfilesToChatsDelete = jest.fn();
const originalFetch = global.fetch;

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
  TELEGRAM_SERVICE_BOT_TOKEN: "test-telegram-token",
}));

jest.mock("@sps/social/relations/chats-to-threads/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleChatsToThreadsCreate(...args),
    delete: (...args: unknown[]) =>
      mockSocialModuleChatsToThreadsDelete(...args),
  },
}));

jest.mock("@sps/social/relations/chats-to-messages/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleChatsToMessagesCreate(...args),
  },
}));

jest.mock("@sps/social/relations/chats-to-actions/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleChatsToActionsCreate(...args),
  },
}));

jest.mock("@sps/social/relations/threads-to-messages/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleThreadsToMessagesCreate(...args),
  },
}));

jest.mock("@sps/social/relations/threads-to-actions/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleThreadsToActionsCreate(...args),
  },
}));

jest.mock("@sps/social/models/thread/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSocialModuleThreadCreate(...args),
    update: (...args: unknown[]) => mockSocialModuleThreadUpdate(...args),
    delete: (...args: unknown[]) => mockSocialModuleThreadDelete(...args),
  },
}));

jest.mock("@sps/social/models/chat/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSocialModuleChatCreate(...args),
    delete: (...args: unknown[]) => mockSocialModuleChatDelete(...args),
  },
}));

jest.mock("@sps/social/relations/profiles-to-chats/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleProfilesToChatsCreate(...args),
    delete: (...args: unknown[]) =>
      mockSocialModuleProfilesToChatsDelete(...args),
  },
}));

jest.mock("@sps/shared-third-parties", () => ({
  OpenRouter: jest.fn().mockImplementation(() => ({
    generate: (...args: unknown[]) => mockOpenRouterGenerate(...args),
  })),
}));

import { Service } from "./bootstrap";
import type { PostgresAdvisoryLockRunner } from "@sps/shared-backend-database-config";

describe("Given: concurrent Telegram bootstrap requests for one user", () => {
  /**
   * BDD Scenario: Bootstrap uses a per-user PostgreSQL advisory lock.
   *
   * Given: two processes can receive Telegram updates for the same user.
   * When: the public bootstrap operation starts.
   * Then: all initialization runs inside the shared lock keyed by Telegram user id.
   */
  it("Then: runs initialization inside the Telegram user advisory lock", async () => {
    const lockCalls: Array<{ namespace: string; key: string }> = [];
    const advisoryLock: PostgresAdvisoryLockRunner = async (props) => {
      lockCalls.push({ namespace: props.namespace, key: props.key });

      return props.execute();
    };
    const expectedResult = { registration: true };
    const service = new Service({
      findById: jest.fn(),
      identity: {} as any,
      subjectsToIdentities: {} as any,
      subjectsToSocialModuleProfiles: {} as any,
      socialModule: {} as any,
      advisoryLock,
    });
    const executeWithinLock = jest
      .spyOn(service as any, "executeWithinLock")
      .mockResolvedValue(expectedResult);

    await expect(
      service.execute({
        fromId: "telegram-user-1",
        chatId: "telegram-chat-1",
      }),
    ).resolves.toBe(expectedResult);
    expect(lockCalls).toEqual([
      {
        namespace: "rbac:telegram-bootstrap",
        key: "telegram-user-1",
      },
    ]);
    expect(executeWithinLock).toHaveBeenCalledWith({
      fromId: "telegram-user-1",
      chatId: "telegram-chat-1",
    });
  });
});

describe("Given: Telegram bootstrap finds duplicate chats or threads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocialModuleThreadCreate.mockResolvedValue({
      id: "thread-1",
      variant: "telegram",
      title: "Telegram topic 42",
      sourceSystemId: "42",
    });
    mockSocialModuleThreadUpdate.mockImplementation(async (props) => {
      return {
        id: props.id,
        ...props.data,
      };
    });
    mockSocialModuleThreadsToActionsCreate.mockResolvedValue({});
    mockOpenRouterGenerate.mockResolvedValue({
      text: JSON.stringify({ title: "🦘 Где кенгуру" }),
      billing: null,
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      statusText: "OK",
      json: jest.fn().mockResolvedValue({
        ok: true,
        result: true,
      }),
    }) as any;
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("When: duplicate default threads are merged", () => {
    it("Then: keeps first-created default thread and deletes the duplicate", async () => {
      const threadsToMessages = {
        find: jest.fn().mockImplementation((props?: any) => {
          const filters = props?.params?.filters?.and ?? [];
          const eqPrimaryThread = filters.some((filter: any) => {
            return (
              filter.column === "threadId" &&
              filter.method === "eq" &&
              filter.value === "thread-old"
            );
          });

          if (eqPrimaryThread) {
            return Promise.resolve([
              {
                id: "primary-message-link",
                threadId: "thread-old",
                messageId: "message-1",
              },
            ]);
          }

          return Promise.resolve([
            {
              id: "duplicate-message-link",
              threadId: "thread-new",
              messageId: "message-2",
              variant: "default",
              orderIndex: 4,
              className: "legacy-link",
            },
          ]);
        }),
      };
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToMessages: {
            find: jest.fn().mockResolvedValue([
              {
                id: "chat-message-1",
                chatId: "chat-1",
                messageId: "message-1",
              },
              {
                id: "chat-message-2",
                chatId: "chat-1",
                messageId: "message-2",
              },
            ]),
          },
          threadsToMessages,
          chatsToActions: {
            find: jest.fn().mockResolvedValue([
              {
                id: "chat-action-1",
                chatId: "chat-1",
                actionId: "action-1",
              },
              {
                id: "chat-action-2",
                chatId: "chat-1",
                actionId: "action-2",
              },
            ]),
          },
          threadsToActions: {
            find: jest.fn().mockImplementation((props?: any) => {
              const filters = props?.params?.filters?.and ?? [];
              const eqPrimaryThread = filters.some((filter: any) => {
                return (
                  filter.column === "threadId" &&
                  filter.method === "eq" &&
                  filter.value === "thread-old"
                );
              });

              if (eqPrimaryThread) {
                return Promise.resolve([
                  {
                    id: "primary-action-link",
                    threadId: "thread-old",
                    actionId: "action-1",
                  },
                ]);
              }

              return Promise.resolve([
                {
                  id: "duplicate-action-link",
                  threadId: "thread-new",
                  actionId: "action-2",
                  variant: "default",
                  orderIndex: 7,
                  className: "action-link",
                },
              ]);
            }),
          },
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([]),
          },
        } as any,
      });

      const result = await (service as any).mergeDuplicateDefaultThreadsForChat(
        {
          chatId: "chat-1",
          defaultThreads: [
            {
              id: "thread-new",
              variant: "default",
              createdAt: "2026-01-02T00:00:00.000Z",
            },
            {
              id: "thread-old",
              variant: "default",
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ],
          chatToThreads: [
            {
              id: "chat-thread-primary",
              chatId: "chat-1",
              threadId: "thread-old",
            },
            {
              id: "chat-thread-duplicate",
              chatId: "chat-1",
              threadId: "thread-new",
            },
          ],
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      );

      expect(result.id).toBe("thread-old");
      expect(mockSocialModuleThreadsToMessagesCreate).toHaveBeenCalledWith({
        data: {
          threadId: "thread-old",
          messageId: "message-2",
          variant: "default",
          orderIndex: 4,
          className: "legacy-link",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockSocialModuleThreadsToActionsCreate).toHaveBeenCalledWith({
        data: {
          threadId: "thread-old",
          actionId: "action-2",
          variant: "default",
          orderIndex: 7,
          className: "action-link",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockSocialModuleChatsToThreadsDelete).toHaveBeenCalledWith({
        id: "chat-thread-duplicate",
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockSocialModuleThreadDelete).toHaveBeenCalledWith({
        id: "thread-new",
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
    });
  });

  describe("When: duplicate Telegram chats are resolved", () => {
    /**
     * BDD Scenario
     * Given: concurrent bootstrap calls created two Telegram chats for the same external chat id.
     * When: bootstrap resolves that Telegram chat again.
     * Then: it preserves all relations on the first-created chat and removes the duplicate chat.
     */
    it("Then: merges chat relations into the first-created Telegram chat", async () => {
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          profilesToChats: {
            find: jest.fn().mockResolvedValue([
              {
                id: "profile-link-primary",
                chatId: "chat-old",
                profileId: "profile-1",
              },
              {
                id: "profile-link-duplicate-existing",
                chatId: "chat-new",
                profileId: "profile-1",
              },
              {
                id: "profile-link-duplicate-new",
                chatId: "chat-new",
                profileId: "profile-2",
                variant: "telegram-personal-ai-agent",
                orderIndex: 4,
                className: "personal-agent",
              },
            ]),
          },
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([
              {
                id: "thread-link-primary",
                chatId: "chat-old",
                threadId: "thread-1",
              },
              {
                id: "thread-link-duplicate",
                chatId: "chat-new",
                threadId: "thread-2",
              },
            ]),
          },
          chatsToMessages: {
            find: jest.fn().mockResolvedValue([
              {
                id: "message-link-primary",
                chatId: "chat-old",
                messageId: "message-1",
              },
              {
                id: "message-link-duplicate",
                chatId: "chat-new",
                messageId: "message-2",
              },
            ]),
          },
          chatsToActions: {
            find: jest.fn().mockResolvedValue([
              {
                id: "action-link-primary",
                chatId: "chat-old",
                actionId: "action-1",
              },
              {
                id: "action-link-duplicate",
                chatId: "chat-new",
                actionId: "action-2",
              },
            ]),
          },
        } as any,
      });

      const result = await (service as any).mergeDuplicateTelegramChats({
        chats: [
          {
            id: "chat-new",
            variant: "telegram",
            sourceSystemId: "153077581",
            createdAt: "2026-01-02T00:00:00.000Z",
          },
          {
            id: "chat-old",
            variant: "telegram",
            sourceSystemId: "153077581",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(result.id).toBe("chat-old");
      expect(mockSocialModuleProfilesToChatsCreate).toHaveBeenCalledTimes(1);
      expect(mockSocialModuleProfilesToChatsCreate).toHaveBeenCalledWith({
        data: {
          chatId: "chat-old",
          profileId: "profile-2",
          variant: "telegram-personal-ai-agent",
          orderIndex: 4,
          className: "personal-agent",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockSocialModuleChatsToThreadsCreate).toHaveBeenCalledWith({
        data: {
          chatId: "chat-old",
          threadId: "thread-2",
          variant: "default",
          orderIndex: 0,
          className: undefined,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockSocialModuleChatsToMessagesCreate).toHaveBeenCalledWith({
        data: {
          chatId: "chat-old",
          messageId: "message-2",
          variant: "default",
          orderIndex: 0,
          className: undefined,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockSocialModuleChatsToActionsCreate).toHaveBeenCalledWith({
        data: {
          chatId: "chat-old",
          actionId: "action-2",
          variant: "default",
          orderIndex: 0,
          className: undefined,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockSocialModuleChatDelete).toHaveBeenCalledWith({
        id: "chat-new",
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
    });

    /**
     * BDD Scenario
     * Given: two bootstrap calls race while the Telegram chat does not exist yet.
     * When: one create loses the deterministic-slug race.
     * Then: it re-reads and uses the chat created by the winning request.
     */
    it("Then: recovers from a concurrent deterministic Telegram chat creation", async () => {
      const existingChat = {
        id: "chat-winner",
        variant: "telegram",
        sourceSystemId: "153077581",
        slug: "telegram-chat-153077581",
      };
      const chatFind = jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([existingChat]);
      const profileLinksFind = jest.fn().mockResolvedValue([]);
      mockSocialModuleChatCreate.mockRejectedValueOnce(
        new Error("slug already exists"),
      );
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chat: {
            find: chatFind,
          },
          profilesToChats: {
            find: profileLinksFind,
          },
        } as any,
      });

      const result = await (service as any).resolveTelegramChat({
        chatId: "153077581",
        profileId: "profile-1",
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(mockSocialModuleChatCreate).toHaveBeenCalledWith({
        data: {
          variant: "telegram",
          sourceSystemId: "153077581",
          slug: "telegram-chat-153077581",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(chatFind).toHaveBeenCalledTimes(2);
      expect(mockSocialModuleProfilesToChatsCreate).toHaveBeenCalledWith({
        data: {
          profileId: "profile-1",
          chatId: "chat-winner",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(result).toEqual(existingChat);
    });
  });

  describe("When: duplicate Telegram topic threads are merged", () => {
    it("Then: reconnects messages to the first-created topic thread without applying Telegram rename events", async () => {
      const threadsToMessages = {
        find: jest.fn().mockImplementation((props?: any) => {
          const filters = props?.params?.filters?.and ?? [];
          const eqPrimaryThread = filters.some((filter: any) => {
            return (
              filter.column === "threadId" &&
              filter.method === "eq" &&
              filter.value === "thread-old"
            );
          });

          if (eqPrimaryThread) {
            return Promise.resolve([
              {
                id: "primary-message-link",
                threadId: "thread-old",
                messageId: "message-1",
              },
            ]);
          }

          return Promise.resolve([
            {
              id: "duplicate-message-link",
              threadId: "thread-new",
              messageId: "message-2",
              variant: "default",
              orderIndex: 8,
              className: "telegram-link",
            },
          ]);
        }),
      };
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToMessages: {
            find: jest.fn().mockResolvedValue([
              {
                id: "chat-message-1",
                chatId: "chat-1",
                messageId: "message-1",
              },
              {
                id: "chat-message-2",
                chatId: "chat-1",
                messageId: "message-2",
              },
            ]),
          },
          threadsToMessages,
          chatsToActions: {
            find: jest.fn().mockResolvedValue([
              {
                id: "chat-action-1",
                chatId: "chat-1",
                actionId: "action-1",
              },
              {
                id: "chat-action-2",
                chatId: "chat-1",
                actionId: "action-2",
              },
            ]),
          },
          threadsToActions: {
            find: jest.fn().mockImplementation((props?: any) => {
              const filters = props?.params?.filters?.and ?? [];
              const eqPrimaryThread = filters.some((filter: any) => {
                return (
                  filter.column === "threadId" &&
                  filter.method === "eq" &&
                  filter.value === "thread-old"
                );
              });

              if (eqPrimaryThread) {
                return Promise.resolve([
                  {
                    id: "primary-action-link",
                    threadId: "thread-old",
                    actionId: "action-1",
                  },
                ]);
              }

              return Promise.resolve([
                {
                  id: "duplicate-action-link",
                  threadId: "thread-new",
                  actionId: "action-2",
                  variant: "default",
                  orderIndex: 9,
                  className: "telegram-action-link",
                },
              ]);
            }),
          },
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([]),
          },
        } as any,
      });

      const result = await (
        service as any
      ).mergeDuplicateTelegramTopicThreadsForChat({
        chatId: "chat-1",
        messageThreadId: "481420",
        topicThreads: [
          {
            id: "thread-new",
            variant: "telegram",
            sourceSystemId: "481420",
            title: "Воздушные шары",
            createdAt: "2026-01-02T00:00:00.000Z",
          },
          {
            id: "thread-old",
            variant: "telegram",
            sourceSystemId: "481420",
            title: "Telegram topic 481420",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        chatToThreads: [
          {
            id: "chat-thread-primary",
            chatId: "chat-1",
            threadId: "thread-old",
          },
          {
            id: "chat-thread-duplicate",
            chatId: "chat-1",
            threadId: "thread-new",
          },
        ],
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(result).toMatchObject({
        id: "thread-old",
        title: "Telegram topic 481420",
      });
      expect(mockSocialModuleThreadsToMessagesCreate).toHaveBeenCalledWith({
        data: {
          threadId: "thread-old",
          messageId: "message-2",
          variant: "default",
          orderIndex: 8,
          className: "telegram-link",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockSocialModuleThreadsToActionsCreate).toHaveBeenCalledWith({
        data: {
          threadId: "thread-old",
          actionId: "action-2",
          variant: "default",
          orderIndex: 9,
          className: "telegram-action-link",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockSocialModuleChatsToThreadsDelete).toHaveBeenCalledWith({
        id: "chat-thread-duplicate",
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockSocialModuleThreadDelete).toHaveBeenCalledWith({
        id: "thread-new",
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockSocialModuleThreadUpdate).not.toHaveBeenCalled();
    });
  });

  describe("When: first message arrives in a Telegram-created topic", () => {
    /**
     * BDD Scenario
     * Given: Telegram created a new topic and SPS has no mapped thread yet.
     * When: the first user message arrives with message_thread_id.
     * Then: SPS creates the fallback thread, generates a contextual title, and mirrors it to Telegram.
     */
    it("Then: creates thread and applies generated title", async () => {
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([]),
          },
        } as any,
      });

      const result = await (service as any).resolveThreadForTelegramMessage({
        socialModuleChat: {
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "550809313",
        },
        chatId: "chat-1",
        messageThreadId: "42",
        messageText: "Где живут кенгуру?",
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(mockSocialModuleThreadCreate).toHaveBeenCalledWith({
        data: {
          variant: "telegram",
          title: "Telegram topic 42",
          sourceSystemId: "42",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(mockOpenRouterGenerate).toHaveBeenCalledWith({
        model: "openai/gpt-5.6-terra",
        max_tokens: 100,
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "telegram_thread_title",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  minLength: 1,
                  maxLength: 100,
                },
              },
              required: ["title"],
              additionalProperties: false,
            },
          },
        },
        context: [
          expect.objectContaining({
            role: "system",
          }),
          {
            role: "user",
            content: "Где живут кенгуру?",
          },
        ],
      });
      expect(mockSocialModuleThreadUpdate).toHaveBeenCalledWith({
        id: "thread-1",
        data: {
          title: "Где кенгуру 🦘",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.telegram.org/bottest-telegram-token/editForumTopic",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            chat_id: "550809313",
            message_thread_id: 42,
            name: "Где кенгуру 🦘",
          }),
        }),
      );
      expect(result).toMatchObject({
        id: "thread-1",
        title: "Где кенгуру 🦘",
      });
    });

    /**
     * BDD Scenario
     * Given: the first Telegram topic message uses the Knowledge search command with a request.
     * When: bootstrap generates a contextual topic title.
     * Then: it sends only the request text to the title model and applies the generated title.
     */
    it("Then: generates a title from the /knowledge request payload", async () => {
      mockOpenRouterGenerate.mockResolvedValueOnce({
        text: JSON.stringify({ title: "Келлеры в ЖК 🏢" }),
        billing: null,
      });
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([]),
          },
        } as any,
      });

      const result = await (service as any).resolveThreadForTelegramMessage({
        socialModuleChat: {
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "550809313",
        },
        chatId: "chat-1",
        messageThreadId: "42",
        messageText: "/knowledge Келлеры в жилом комплексе",
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(mockOpenRouterGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          context: [
            expect.objectContaining({
              role: "system",
            }),
            {
              role: "user",
              content: "Келлеры в жилом комплексе",
            },
          ],
        }),
      );
      expect(mockSocialModuleThreadUpdate).toHaveBeenCalledWith({
        id: "thread-1",
        data: {
          title: "Келлеры в ЖК 🏢",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(result).toMatchObject({
        id: "thread-1",
        title: "Келлеры в ЖК 🏢",
      });
    });

    /**
     * BDD Scenario
     * Given: Telegram addresses the legacy learn command to a specific bot username.
     * When: bootstrap derives text for topic title generation.
     * Then: it removes the command and keeps the learn payload.
     */
    it("Then: derives a title source from an addressed /learn command", () => {
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {} as any,
      });

      expect(
        (service as any).getTelegramThreadTitleSourceFromMessage(
          "/learn@singlepagestartup_bot Новый материал о келлерах",
        ),
      ).toBe("Новый материал о келлерах");
      expect(
        (service as any).getTelegramThreadTitleSourceFromMessage("/start"),
      ).toBeUndefined();
    });

    /**
     * BDD Scenario
     * Given: OpenRouter returns a loose title field instead of the requested JSON object.
     * When: SPS generates a title for a Telegram topic.
     * Then: the technical title field label is removed from the visible topic title.
     */
    it("Then: removes a loose title field label from generated title", async () => {
      mockOpenRouterGenerate.mockResolvedValueOnce({
        text: "title : Келлеры 💬",
        billing: null,
      });
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {} as any,
      });

      const title = await (service as any).generateTelegramThreadTitle({
        messageText: "Келлеры",
      });

      expect(title).toBe("Келлеры 💬");
    });

    /**
     * BDD Scenario
     * Given: OpenRouter puts a redundant title label inside the structured title value.
     * When: SPS generates a title for a Telegram topic.
     * Then: the persisted title contains only the meaningful title and emoji.
     */
    it("Then: removes a field label from a structured title value", async () => {
      mockOpenRouterGenerate.mockResolvedValueOnce({
        text: JSON.stringify({
          title: "title : Возможности ассистента 🤖",
        }),
        billing: null,
      });
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {} as any,
      });

      const title = await (service as any).generateTelegramThreadTitle({
        messageText: "Расскажи что ты умеешь?",
      });

      expect(title).toBe("Возможности ассистента 🤖");
    });

    /**
     * BDD Scenario
     * Given: a Telegram topic already persisted a loose title field label.
     * When: the next message in that topic is bootstrapped.
     * Then: SPS repairs both its stored thread title and the Telegram topic title.
     */
    it("Then: repairs an already persisted loose title field label", async () => {
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([
              {
                id: "chat-thread-1",
                chatId: "chat-1",
                threadId: "thread-1",
              },
            ]),
          },
          thread: {
            find: jest.fn().mockResolvedValue([
              {
                id: "thread-1",
                variant: "telegram",
                title: "title : Келлеры 💬",
                sourceSystemId: "42",
              },
            ]),
          },
        } as any,
      });

      const result = await (service as any).resolveThreadForTelegramMessage({
        socialModuleChat: {
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "550809313",
        },
        chatId: "chat-1",
        messageThreadId: "42",
        messageText: "Следующее сообщение",
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(mockOpenRouterGenerate).not.toHaveBeenCalled();
      expect(mockSocialModuleThreadUpdate).toHaveBeenCalledWith({
        id: "thread-1",
        data: {
          title: "Келлеры 💬",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.telegram.org/bottest-telegram-token/editForumTopic",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            chat_id: "550809313",
            message_thread_id: 42,
            name: "Келлеры 💬",
          }),
        }),
      );
      expect(result).toMatchObject({
        id: "thread-1",
        title: "Келлеры 💬",
      });
    });

    /**
     * BDD Scenario
     * Given: a Telegram topic thread already has a non-fallback SPS title.
     * When: another message arrives in the same topic.
     * Then: bootstrap keeps the existing title and does not call OpenRouter.
     */
    it("Then: does not regenerate non-fallback title", async () => {
      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([
              {
                id: "chat-thread-1",
                chatId: "chat-1",
                threadId: "thread-1",
              },
            ]),
          },
          thread: {
            find: jest.fn().mockResolvedValue([
              {
                id: "thread-1",
                variant: "telegram",
                title: "Кенгуру 🦘",
                sourceSystemId: "42",
              },
            ]),
          },
        } as any,
      });

      const result = await (service as any).resolveThreadForTelegramMessage({
        socialModuleChat: {
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "550809313",
        },
        chatId: "chat-1",
        messageThreadId: "42",
        messageText: "Еще вопрос",
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(result).toMatchObject({
        id: "thread-1",
        title: "Кенгуру 🦘",
      });
      expect(mockOpenRouterGenerate).not.toHaveBeenCalled();
      expect(mockSocialModuleThreadUpdate).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    /**
     * BDD Scenario
     * Given: OpenRouter fails while naming a fallback Telegram topic.
     * When: the first user message arrives.
     * Then: SPS applies a deterministic fallback title from the message.
     */
    it("Then: uses deterministic fallback title when OpenRouter fails", async () => {
      mockOpenRouterGenerate.mockResolvedValueOnce({
        error: {
          message: "OpenRouter unavailable",
        },
        billing: null,
      });

      const service = new Service({
        findById: jest.fn(),
        identity: {} as any,
        subjectsToIdentities: {} as any,
        subjectsToSocialModuleProfiles: {} as any,
        socialModule: {
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([]),
          },
        } as any,
      });

      const result = await (service as any).resolveThreadForTelegramMessage({
        socialModuleChat: {
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "550809313",
        },
        chatId: "chat-1",
        messageThreadId: "42",
        messageText: "История интернета сейчас интересует",
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      });

      expect(mockSocialModuleThreadUpdate).toHaveBeenCalledWith({
        id: "thread-1",
        data: {
          title: "История интернета сейчас 💬",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          },
        },
      });
      expect(result).toMatchObject({
        id: "thread-1",
        title: "История интернета сейчас 💬",
      });
    });
  });
});

describe("Given: Telegram automatic chat participants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario
   * Given: a Telegram chat contains manually connected AI profiles and a duplicate relation.
   * When: automatic participants are synchronized for the user's personal AI profile.
   * Then: every connected AI remains while only the duplicate relation is removed.
   */
  it("When: participants are synchronized Then: connected AI profiles are preserved", async () => {
    const ensureProfileManagementAccess = jest.fn().mockResolvedValue({});
    const personalAiProfile = {
      id: "personal-ai-profile",
      slug: "telegram-personal-ai-agent-owner-1",
      variant: "artificial-intelligence",
    };
    const profilesToChats = {
      find: jest.fn().mockResolvedValue([
        {
          id: "sender-relation",
          profileId: "sender-profile",
          chatId: "chat-1",
        },
        {
          id: "global-ai-relation",
          profileId: "global-ai-profile",
          chatId: "chat-1",
        },
        {
          id: "other-personal-relation",
          profileId: "other-personal-ai-profile",
          chatId: "chat-1",
        },
        {
          id: "personal-relation-old",
          profileId: "personal-ai-profile",
          chatId: "chat-1",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "personal-relation-new",
          profileId: "personal-ai-profile",
          chatId: "chat-1",
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ]),
    };
    const profile = {
      find: jest.fn().mockImplementation((props: any) => {
        const filters = props?.params?.filters?.and || [];
        const slugFilter = filters.find(
          (filter: any) => filter.column === "slug",
        );

        if (slugFilter?.value === "telegram-bot") {
          return Promise.resolve([
            {
              id: "telegram-bot-profile",
              slug: "telegram-bot",
              variant: "agent",
            },
          ]);
        }

        return Promise.resolve([
          {
            id: "sender-profile",
            slug: "telegram-user",
            variant: "telegram",
          },
          {
            id: "global-ai-profile",
            slug: "open-router",
            variant: "artificial-intelligence",
          },
          {
            id: "other-personal-ai-profile",
            slug: "telegram-personal-ai-agent-owner-2",
            variant: "artificial-intelligence",
          },
          personalAiProfile,
        ]);
      }),
    };
    const service = new Service({
      findById: jest.fn(),
      identity: {} as any,
      subjectsToIdentities: {} as any,
      subjectsToSocialModuleProfiles: {} as any,
      socialModule: {
        profile,
        profilesToChats,
      } as any,
      ensureProfileManagementAccess,
    });

    await (service as any).synchronizeTelegramAutomaticProfilesForChat({
      ownerRbacSubjectId: "owner-subject",
      socialModuleChatId: "chat-1",
      personalAiSocialModuleProfile: personalAiProfile,
      isPrivateTelegramChat: false,
      headers: {
        "X-RBAC-SECRET-KEY": "test-rbac-secret",
      },
    });

    expect(mockSocialModuleProfilesToChatsDelete).toHaveBeenCalledTimes(1);
    expect(mockSocialModuleProfilesToChatsDelete).not.toHaveBeenCalledWith(
      expect.objectContaining({
        id: "global-ai-relation",
      }),
    );
    expect(mockSocialModuleProfilesToChatsDelete).toHaveBeenCalledWith({
      id: "personal-relation-new",
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
    expect(mockSocialModuleProfilesToChatsCreate).toHaveBeenCalledTimes(1);
    expect(mockSocialModuleProfilesToChatsCreate).toHaveBeenCalledWith({
      data: {
        profileId: "telegram-bot-profile",
        chatId: "chat-1",
        variant: "telegram-system-agent",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
    expect(ensureProfileManagementAccess).toHaveBeenCalledTimes(2);
    expect(ensureProfileManagementAccess).toHaveBeenCalledWith({
      ownerRbacSubjectId: "owner-subject",
      socialModuleProfileId: "global-ai-profile",
    });
    expect(ensureProfileManagementAccess).toHaveBeenCalledWith({
      ownerRbacSubjectId: "owner-subject",
      socialModuleProfileId: "other-personal-ai-profile",
    });
  });

  /**
   * BDD Scenario
   * Given: a private Telegram chat contains a stale automatic personal AI profile created for the bot and a manually connected AI profile.
   * When: automatic participants are synchronized for the human sender.
   * Then: the stale automatic profile link is removed while the manually connected AI profile remains available.
   */
  it("When: a private chat is synchronized Then: stale personal AI links are removed", async () => {
    const personalAiProfile = {
      id: "personal-ai-profile",
      slug: "telegram-personal-ai-agent-owner-1",
      variant: "artificial-intelligence",
    };
    const profilesToChats = {
      find: jest.fn().mockResolvedValue([
        {
          id: "manual-ai-relation",
          profileId: "manual-ai-profile",
          chatId: "chat-1",
          variant: "default",
        },
        {
          id: "stale-personal-relation",
          profileId: "stale-personal-ai-profile",
          chatId: "chat-1",
          variant: "telegram-personal-ai-agent",
        },
        {
          id: "current-personal-relation",
          profileId: "personal-ai-profile",
          chatId: "chat-1",
          variant: "telegram-personal-ai-agent",
        },
      ]),
    };
    const profile = {
      find: jest.fn().mockImplementation((props: any) => {
        const filters = props?.params?.filters?.and || [];
        const slugFilter = filters.find(
          (filter: any) => filter.column === "slug",
        );

        if (slugFilter?.value === "telegram-bot") {
          return Promise.resolve([]);
        }

        return Promise.resolve([
          {
            id: "manual-ai-profile",
            slug: "manual-ai",
            variant: "artificial-intelligence",
          },
          {
            id: "stale-personal-ai-profile",
            slug: "telegram-personal-ai-agent-bot",
            variant: "artificial-intelligence",
          },
          personalAiProfile,
        ]);
      }),
    };
    const service = new Service({
      findById: jest.fn(),
      identity: {} as any,
      subjectsToIdentities: {} as any,
      subjectsToSocialModuleProfiles: {} as any,
      socialModule: {
        profile,
        profilesToChats,
      } as any,
      ensureProfileManagementAccess: jest.fn().mockResolvedValue({}),
    });

    await (service as any).synchronizeTelegramAutomaticProfilesForChat({
      ownerRbacSubjectId: "owner-subject",
      socialModuleChatId: "chat-1",
      personalAiSocialModuleProfile: personalAiProfile,
      isPrivateTelegramChat: true,
      headers: {
        "X-RBAC-SECRET-KEY": "test-rbac-secret",
      },
    });

    expect(mockSocialModuleProfilesToChatsDelete).toHaveBeenCalledTimes(1);
    expect(mockSocialModuleProfilesToChatsDelete).toHaveBeenCalledWith({
      id: "stale-personal-relation",
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
    expect(mockSocialModuleProfilesToChatsDelete).not.toHaveBeenCalledWith(
      expect.objectContaining({
        id: "manual-ai-relation",
      }),
    );
  });
});
