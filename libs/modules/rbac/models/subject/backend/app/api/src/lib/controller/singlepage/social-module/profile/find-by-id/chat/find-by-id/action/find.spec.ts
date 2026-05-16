/**
 * BDD Suite: thread-scoped social action find.
 *
 * Given: a chat has actions linked to specific threads.
 * When: the RBAC action find endpoint receives socialModuleThreadId in the raw query.
 * Then: it returns only actions linked through threads-to-actions for that chat thread.
 */

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "test-rbac-jwt-secret",
  RBAC_SECRET_KEY: "test-rbac-secret-key",
}));

import { Handler } from "./find";

describe("Given: thread-scoped social actions", () => {
  /**
   * BDD Scenario: action find uses raw query thread id.
   *
   * Given: parsedQuery contains only generic query-builder fields.
   * When: socialModuleThreadId is present in the raw request query.
   * Then: actions are resolved through chats-to-threads and threads-to-actions instead of chats-to-actions.
   */
  it("When: finding actions by thread Then: returns only thread-linked actions", async () => {
    const service = {
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
        threadsToActions: {
          find: jest.fn().mockResolvedValue([
            {
              id: "thread-action-1",
              threadId: "thread-1",
              actionId: "action-1",
            },
          ]),
        },
        chatsToActions: {
          find: jest.fn(),
        },
        action: {
          find: jest.fn().mockResolvedValue([
            {
              id: "action-1",
              description: "thread action",
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
        query: jest.fn((name?: string) => {
          if (name === "socialModuleThreadId") {
            return "thread-1";
          }

          return undefined;
        }),
      },
      get: jest.fn(() => ({
        limit: 20,
        offset: 0,
        orderBy: {
          and: [
            {
              column: "createdAt",
              method: "asc",
            },
          ],
        },
      })),
      json: jest.fn((payload: unknown) => payload),
    };

    const result = await handler.execute(context as any, jest.fn());

    expect(service.socialModule.chatsToThreads.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "chatId",
              method: "eq",
              value: "chat-1",
            },
            {
              column: "threadId",
              method: "eq",
              value: "thread-1",
            },
          ],
        },
      },
    });
    expect(service.socialModule.threadsToActions.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "threadId",
              method: "eq",
              value: "thread-1",
            },
          ],
        },
        limit: 20,
        offset: 0,
        orderBy: {
          and: [
            {
              column: "createdAt",
              method: "asc",
            },
          ],
        },
      },
    });
    expect(service.socialModule.chatsToActions.find).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: [
        {
          id: "action-1",
          description: "thread action",
        },
      ],
    });
  });

  /**
   * BDD Scenario: stale thread filter is treated as empty timeline actions.
   *
   * Given: the frontend requests actions for a thread that is no longer linked to the chat.
   * When: the RBAC action find endpoint receives that stale socialModuleThreadId.
   * Then: it returns an empty action list without throwing a validation error.
   */
  it("When: finding actions by stale thread Then: returns empty actions", async () => {
    const service = {
      socialModule: {
        chatsToThreads: {
          find: jest.fn().mockResolvedValue([]),
        },
        threadsToActions: {
          find: jest.fn(),
        },
        chatsToActions: {
          find: jest.fn(),
        },
        action: {
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
            return "stale-thread";
          }

          return undefined;
        }),
      },
      get: jest.fn(() => ({
        limit: 20,
        offset: 0,
      })),
      json: jest.fn((payload: unknown) => payload),
    };

    const result = await handler.execute(context as any, jest.fn());

    expect(service.socialModule.chatsToThreads.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "chatId",
              method: "eq",
              value: "chat-1",
            },
            {
              column: "threadId",
              method: "eq",
              value: "stale-thread",
            },
          ],
        },
      },
    });
    expect(service.socialModule.threadsToActions.find).not.toHaveBeenCalled();
    expect(service.socialModule.chatsToActions.find).not.toHaveBeenCalled();
    expect(service.socialModule.action.find).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: [],
    });
  });
});
