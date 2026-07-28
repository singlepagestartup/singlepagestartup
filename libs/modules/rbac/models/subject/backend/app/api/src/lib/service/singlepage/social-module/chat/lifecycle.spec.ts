/**
 * BDD Suite: chat lifecycle primary thread fallback.
 *
 * Given: existing web chats can contain multiple threads using the default component variant.
 * When: a legacy route requests the chat's primary thread.
 * Then: lifecycle resolution reuses the deterministic first relation without creating or rejecting threads.
 */

const mockSocialModuleThreadCreate = jest.fn();
const mockSocialModuleChatsToThreadsCreate = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
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

import { ChatLifecycleService } from "./lifecycle";

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
      socialModule: {
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
