/**
 * BDD Suite: telegram bootstrap default thread cleanup.
 *
 * Given: a Telegram chat has duplicate SPS default or topic threads.
 * When: bootstrap resolves the thread for an incoming Telegram update.
 * Then: messages and actions are reconnected to the first-created thread and duplicates are removed.
 */

const mockSocialModuleChatsToThreadsDelete = jest.fn();
const mockSocialModuleThreadsToMessagesCreate = jest.fn();
const mockSocialModuleThreadsToActionsCreate = jest.fn();
const mockSocialModuleThreadCreate = jest.fn();
const mockSocialModuleThreadUpdate = jest.fn();
const mockSocialModuleThreadDelete = jest.fn();
const mockOpenRouterGenerate = jest.fn();
const originalFetch = global.fetch;

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
  TELEGRAM_SERVICE_BOT_TOKEN: "test-telegram-token",
}));

jest.mock("@sps/social/relations/chats-to-threads/sdk/server", () => ({
  api: {
    create: jest.fn(),
    delete: (...args: unknown[]) =>
      mockSocialModuleChatsToThreadsDelete(...args),
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

jest.mock("@sps/shared-third-parties", () => ({
  OpenRouter: jest.fn().mockImplementation(() => ({
    generate: (...args: unknown[]) => mockOpenRouterGenerate(...args),
  })),
}));

import { Service } from "./bootstrap";

describe("Given: Telegram bootstrap finds duplicate default threads", () => {
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
        model: "google/gemini-2.5-flash",
        temperature: 0.2,
        max_tokens: 20,
        responseFormat: {
          type: "json_object",
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
