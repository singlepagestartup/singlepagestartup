const mockSocialModuleThreadCreate = jest.fn();
const mockSocialModuleChatsToThreadsCreate = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
    ...jest.requireActual("@sps/shared-utils"),
    RBAC_SECRET_KEY: "rbac-secret",
  };
});

jest.mock("@sps/social/models/thread/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) => mockSocialModuleThreadCreate(...args),
      findById: jest.fn(),
    },
  };
});

jest.mock("@sps/social/relations/chats-to-threads/sdk/server", () => {
  return {
    api: {
      create: (...args: unknown[]) =>
        mockSocialModuleChatsToThreadsCreate(...args),
    },
  };
});

jest.mock("@sps/social/models/chat/sdk/server", () => ({ api: {} }));
jest.mock("@sps/social/models/profile/sdk/server", () => ({ api: {} }));
jest.mock(
  "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server",
  () => ({ api: {} }),
);
jest.mock("@sps/social/relations/profiles-to-chats/sdk/server", () => ({
  api: {},
}));

import { Service as ChatLifecycleService } from "./lifecycle";
import { api as threadApi } from "@sps/social/models/thread/sdk/server";

it.each([
  { variant: "store-employee" },
  { slug: "store-employee-training-reserved" },
])(
  "reserves employee training chat identities from ordinary create",
  async (data) => {
    const lifecycle = new ChatLifecycleService({} as never);
    await expect(
      lifecycle.createChatWithDefaultThread({
        subjectId: "subject",
        autoBootstrapProfile: true,
        data,
      }),
    ).rejects.toThrow("Forbidden error");
  },
);

it("creates one default thread without document metadata for a new AI Chat", async () => {
  const thread = { id: "default-thread", variant: "default", metadata: {} };
  mockSocialModuleThreadCreate.mockResolvedValueOnce(thread);
  jest.mocked(threadApi.findById).mockResolvedValueOnce(thread as never);
  const lifecycle = new ChatLifecycleService({
    modules: {
      social: {
        chat: {
          findById: jest
            .fn()
            .mockResolvedValue({ id: "chat-1", variant: "ai-chat" }),
        },
        chatsToThreads: { find: jest.fn().mockResolvedValue([]) },
      },
    },
  } as never);

  const result = await lifecycle.ensureDefaultThreadForChat({
    socialModuleChatId: "chat-1",
  });

  expect(result).toEqual(thread);
  expect(mockSocialModuleThreadCreate).toHaveBeenCalledTimes(1);
  expect(mockSocialModuleThreadCreate).toHaveBeenCalledWith(
    expect.objectContaining({ data: { variant: "default" } }),
  );
  expect(mockSocialModuleChatsToThreadsCreate).toHaveBeenCalledTimes(1);
  expect(mockSocialModuleChatsToThreadsCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: {
        chatId: "chat-1",
        threadId: "default-thread",
        variant: "default",
      },
    }),
  );
});

describe("Given: a web chat has several default-variant threads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: reuse the earliest linked thread.
   *
   * Given: six ordinary UI threads share variant default and relation order zero.
   * When: the lifecycle service resolves the primary thread.
   * Then: it returns the earliest relation and does not create another thread.
   */
  test("When: primary thread is requested Then: the earliest relation is reused", async () => {
    const service = {
      modules: {
        social: {
          chat: {
            findById: jest.fn().mockResolvedValue({ id: "chat-1" }),
          },
          chatsToThreads: {
            find: jest.fn().mockResolvedValue([
              {
                threadId: "thread-newer",
                orderIndex: 0,
                createdAt: new Date("2026-06-17T07:24:42.000Z"),
              },
              {
                threadId: "thread-primary",
                orderIndex: 0,
                createdAt: new Date("2026-06-16T22:02:05.000Z"),
              },
            ]),
          },
          thread: {
            find: jest.fn().mockResolvedValue([
              {
                id: "thread-newer",
                variant: "default",
                createdAt: new Date("2026-06-17T07:24:42.000Z"),
              },
              {
                id: "thread-primary",
                variant: "default",
                createdAt: new Date("2026-06-16T22:02:05.000Z"),
              },
            ]),
          },
        },
      },
    } as any;
    const lifecycle = new ChatLifecycleService(service);

    const result = await lifecycle.ensureDefaultThreadForChat({
      socialModuleChatId: "chat-1",
    });

    expect(result.id).toBe("thread-primary");
    expect(mockSocialModuleThreadCreate).not.toHaveBeenCalled();
    expect(mockSocialModuleChatsToThreadsCreate).not.toHaveBeenCalled();
  });
});
