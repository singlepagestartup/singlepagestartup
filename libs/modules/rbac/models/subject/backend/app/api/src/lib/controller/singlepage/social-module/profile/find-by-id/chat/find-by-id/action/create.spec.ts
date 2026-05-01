/**
 * BDD Suite: thread-scoped social action create.
 *
 * Given: a chat action is created from a thread-aware UI request.
 * When: the RBAC action create endpoint receives socialModuleThreadId in the raw query.
 * Then: it links the action to exactly that thread through threads-to-actions.
 */

const mockSocialModuleActionCreate = jest.fn();
const mockSocialModuleChatsToActionsCreate = jest.fn();
const mockSocialModuleThreadsToActionsCreate = jest.fn();
const mockSocialModuleProfilesToActionsCreate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "test-rbac-jwt-secret",
  RBAC_SECRET_KEY: "test-rbac-secret-key",
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("@sps/social/models/action/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSocialModuleActionCreate(...args),
  },
}));

jest.mock("@sps/social/relations/chats-to-actions/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleChatsToActionsCreate(...args),
  },
}));

jest.mock("@sps/social/relations/threads-to-actions/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleThreadsToActionsCreate(...args),
  },
}));

jest.mock("@sps/social/relations/profiles-to-actions/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) =>
      mockSocialModuleProfilesToActionsCreate(...args),
  },
}));

import { Handler } from "./create";

describe("Given: thread-scoped social action create", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSocialModuleActionCreate.mockResolvedValue({
      id: "action-1",
      payload: {
        type: "update",
      },
    });
    mockSocialModuleChatsToActionsCreate.mockResolvedValue({});
    mockSocialModuleThreadsToActionsCreate.mockResolvedValue({});
    mockSocialModuleProfilesToActionsCreate.mockResolvedValue({});
  });

  /**
   * BDD Scenario: action create uses raw query thread id.
   *
   * Given: parsed query middleware does not expose socialModuleThreadId.
   * When: socialModuleThreadId is present in the raw request query.
   * Then: the action is linked to that thread and not stored as threadless.
   */
  it("When: creating action by thread Then: creates thread action relation", async () => {
    const service = {
      socialModuleChatLifecycleAssertThreadBelongsToChat: jest
        .fn()
        .mockResolvedValue(undefined),
      socialModule: {
        threadsToMessages: {
          find: jest.fn(),
        },
        chatsToThreads: {
          find: jest.fn(),
        },
      },
    };
    const handler = new Handler(service as any);
    const context = {
      req: {
        param: jest.fn((name: string) => {
          return {
            id: "subject-1",
            socialModuleProfileId: "profile-1",
            socialModuleChatId: "chat-1",
          }[name];
        }),
        query: jest.fn((name?: string) => {
          if (name === "socialModuleThreadId") {
            return "thread-1";
          }

          return undefined;
        }),
        parseBody: jest.fn().mockResolvedValue({
          data: JSON.stringify({
            payload: {
              type: "update",
              message: {
                id: "message-1",
              },
            },
          }),
        }),
      },
      json: jest.fn((payload: unknown) => payload),
    };

    const result = await handler.execute(context as any, jest.fn());

    expect(
      service.socialModuleChatLifecycleAssertThreadBelongsToChat,
    ).toHaveBeenCalledWith({
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-1",
    });
    expect(service.socialModule.threadsToMessages.find).not.toHaveBeenCalled();
    expect(mockSocialModuleActionCreate).toHaveBeenCalledWith({
      data: {
        payload: {
          type: "update",
          message: {
            id: "message-1",
          },
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret-key",
        },
      },
    });
    expect(mockSocialModuleChatsToActionsCreate).toHaveBeenCalledWith({
      data: {
        actionId: "action-1",
        chatId: "chat-1",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret-key",
        },
      },
    });
    expect(mockSocialModuleThreadsToActionsCreate).toHaveBeenCalledWith({
      data: {
        actionId: "action-1",
        threadId: "thread-1",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret-key",
        },
      },
    });
    expect(result).toEqual({
      data: {
        id: "action-1",
        payload: {
          type: "update",
        },
      },
    });
  });

  /**
   * BDD Scenario: action create uses body thread id.
   *
   * Given: Telegram callback action data carries socialModuleThreadId next to payload.
   * When: the action create endpoint persists the action.
   * Then: socialModuleThreadId creates threads-to-actions and is not stored in the action payload.
   */
  it("When: creating action with body thread id Then: links action without persisting thread id", async () => {
    const callbackPayload = {
      telegram: {
        callback_query: {
          data: "command_premium",
        },
      },
    };
    const service = {
      socialModuleChatLifecycleAssertThreadBelongsToChat: jest
        .fn()
        .mockResolvedValue(undefined),
      socialModule: {
        threadsToMessages: {
          find: jest.fn(),
        },
        chatsToThreads: {
          find: jest.fn(),
        },
      },
    };
    const handler = new Handler(service as any);
    const context = {
      req: {
        param: jest.fn((name: string) => {
          return {
            id: "subject-1",
            socialModuleProfileId: "profile-1",
            socialModuleChatId: "chat-1",
          }[name];
        }),
        query: jest.fn(() => undefined),
        parseBody: jest.fn().mockResolvedValue({
          data: JSON.stringify({
            socialModuleThreadId: "thread-body",
            payload: callbackPayload,
          }),
        }),
      },
      json: jest.fn((payload: unknown) => payload),
    };

    await handler.execute(context as any, jest.fn());

    expect(
      service.socialModuleChatLifecycleAssertThreadBelongsToChat,
    ).toHaveBeenCalledWith({
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-body",
    });
    expect(service.socialModule.threadsToMessages.find).not.toHaveBeenCalled();
    expect(mockSocialModuleActionCreate).toHaveBeenCalledWith({
      data: {
        payload: callbackPayload,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret-key",
        },
      },
    });
    expect(mockSocialModuleThreadsToActionsCreate).toHaveBeenCalledWith({
      data: {
        actionId: "action-1",
        threadId: "thread-body",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret-key",
        },
      },
    });
  });

  /**
   * BDD Scenario: action create resolves thread from payload message.
   *
   * Given: message update/delete logging does not pass socialModuleThreadId in the query.
   * When: the action payload contains the affected message id.
   * Then: the action is linked to the same thread as that message.
   */
  it("When: creating action for message payload Then: resolves message thread", async () => {
    const service = {
      socialModuleChatLifecycleAssertThreadBelongsToChat: jest
        .fn()
        .mockResolvedValue(undefined),
      socialModule: {
        threadsToMessages: {
          find: jest.fn().mockResolvedValue([
            {
              id: "thread-message-1",
              threadId: "thread-1",
              messageId: "message-1",
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ]),
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
      },
    };
    const handler = new Handler(service as any);
    const context = {
      req: {
        param: jest.fn((name: string) => {
          return {
            id: "subject-1",
            socialModuleProfileId: "profile-1",
            socialModuleChatId: "chat-1",
          }[name];
        }),
        query: jest.fn(() => undefined),
        parseBody: jest.fn().mockResolvedValue({
          data: JSON.stringify({
            payload: {
              type: "delete",
              message: {
                id: "message-1",
              },
            },
          }),
        }),
      },
      json: jest.fn((payload: unknown) => payload),
    };

    await handler.execute(context as any, jest.fn());

    expect(
      service.socialModuleChatLifecycleAssertThreadBelongsToChat,
    ).not.toHaveBeenCalled();
    expect(service.socialModule.threadsToMessages.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "messageId",
              method: "eq",
              value: "message-1",
            },
          ],
        },
      },
    });
    expect(service.socialModule.chatsToThreads.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "chatId",
              method: "eq",
              value: "chat-1",
            },
          ],
        },
      },
    });
    expect(mockSocialModuleThreadsToActionsCreate).toHaveBeenCalledWith({
      data: {
        actionId: "action-1",
        threadId: "thread-1",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret-key",
        },
      },
    });
  });
});
