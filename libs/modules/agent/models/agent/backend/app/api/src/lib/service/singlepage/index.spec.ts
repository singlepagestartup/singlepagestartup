/**
 * BDD Suite: agent thread normalization routine.
 *
 * Given: chat histories can contain legacy messages without thread links.
 * When: normalization runs before thread resolution.
 * Then: only missing links are created and repeated runs remain idempotent.
 */

import { Service } from "./index";
import { api as socialModuleThreadsToMessagesApi } from "@sps/social/relations/threads-to-messages/sdk/server";

jest.mock("@sps/social/relations/threads-to-messages/sdk/server", () => {
  return {
    api: {
      create: jest.fn(),
    },
  };
});

type FindMock = jest.Mock<Promise<any[] | undefined>, [any]>;

function createServiceWithMocks(props?: {
  chatsToMessages?: any[];
  chatsToThreads?: any[];
  threadsToMessages?: any[];
}) {
  const service = Object.create(Service.prototype) as Service;
  const chatsToMessagesFind: FindMock = jest
    .fn()
    .mockResolvedValue(props?.chatsToMessages);
  const chatsToThreadsFind: FindMock = jest
    .fn()
    .mockResolvedValue(props?.chatsToThreads);
  const threadsToMessagesFind: FindMock = jest
    .fn()
    .mockResolvedValue(props?.threadsToMessages);

  (service as any).socialModule = {
    chatsToMessages: { find: chatsToMessagesFind },
    chatsToThreads: { find: chatsToThreadsFind },
    threadsToMessages: { find: threadsToMessagesFind },
  };
  (service as any).ensureDefaultThreadForChat = jest.fn().mockResolvedValue({
    id: "thread-default",
    variant: "default",
  });

  return {
    service,
    mocks: {
      chatsToMessagesFind,
      chatsToThreadsFind,
      threadsToMessagesFind,
      ensureDefaultThreadForChat: (service as any)
        .ensureDefaultThreadForChat as jest.Mock,
      createThreadToMessage:
        socialModuleThreadsToMessagesApi.create as jest.Mock,
    },
  };
}

describe("agent thread normalization routine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: a chat has messages where some are still threadless or linked to foreign threads.
   * When: normalization is executed for that chat.
   * Then: only missing/invalid links are created to the default thread.
   */
  it("creates links only for messages without valid chat thread relation", async () => {
    const { service, mocks } = createServiceWithMocks({
      chatsToMessages: [
        { chatId: "chat-1", messageId: "message-1" },
        { chatId: "chat-1", messageId: "message-2" },
        { chatId: "chat-1", messageId: "message-3" },
      ],
      chatsToThreads: [{ chatId: "chat-1", threadId: "thread-custom" }],
      threadsToMessages: [
        { messageId: "message-2", threadId: "thread-custom" },
        { messageId: "message-3", threadId: "thread-foreign" },
      ],
    });

    const result = await service.normalizeChatThreadsAndMessageLinks({
      socialModuleChatId: "chat-1",
      secretKey: "rbac-secret",
    });

    expect(result).toBe("thread-default");
    expect(mocks.ensureDefaultThreadForChat).toHaveBeenCalledWith({
      socialModuleChatId: "chat-1",
      secretKey: "rbac-secret",
    });
    expect(mocks.createThreadToMessage).toHaveBeenCalledTimes(2);
    expect(mocks.createThreadToMessage).toHaveBeenNthCalledWith(1, {
      data: {
        threadId: "thread-default",
        messageId: "message-1",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(mocks.createThreadToMessage).toHaveBeenNthCalledWith(2, {
      data: {
        threadId: "thread-default",
        messageId: "message-3",
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
   * Given: all chat messages already have valid links to chat-owned threads.
   * When: normalization is executed again.
   * Then: no duplicate links are created.
   */
  it("is idempotent when valid links already exist", async () => {
    const { service, mocks } = createServiceWithMocks({
      chatsToMessages: [
        { chatId: "chat-2", messageId: "message-1" },
        { chatId: "chat-2", messageId: "message-2" },
      ],
      chatsToThreads: [{ chatId: "chat-2", threadId: "thread-custom" }],
      threadsToMessages: [
        { messageId: "message-1", threadId: "thread-default" },
        { messageId: "message-2", threadId: "thread-custom" },
      ],
    });

    const result = await service.normalizeChatThreadsAndMessageLinks({
      socialModuleChatId: "chat-2",
      secretKey: "rbac-secret",
    });

    expect(result).toBe("thread-default");
    expect(mocks.createThreadToMessage).not.toHaveBeenCalled();
  });
});
