/**
 * BDD Suite: agent social message action routing.
 *
 * Given: social chat messages can be created through legacy chat routes or thread-aware chat routes.
 * When: the action logger forwards a message creation action to the agent telegram handler.
 * Then: automatic social profiles in the chat are asked to handle both route shapes.
 */

jest.mock("@sps/shared-utils", () => {
  return {
    RBAC_SECRET_KEY: "rbac-secret",
  };
});

import { Handler } from "./bot";

function createContext() {
  return {
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  const agentSocialModuleProfileHandler = jest
    .fn()
    .mockResolvedValue(undefined);

  return {
    agentSocialModuleProfileHandler,
    socialModule: {
      message: {
        findById: jest.fn().mockResolvedValue({
          id: "message-1",
          description: "Hello",
        }),
      },
      chatsToMessages: {
        find: jest.fn().mockResolvedValue([
          {
            chatId: "chat-1",
            messageId: "message-1",
          },
        ]),
      },
      chat: {
        findById: jest.fn().mockResolvedValue({
          id: "chat-1",
        }),
      },
      profilesToChats: {
        find: jest.fn().mockResolvedValue([
          {
            chatId: "chat-1",
            profileId: "sender-profile",
          },
          {
            chatId: "chat-1",
            profileId: "open-router-profile",
          },
        ]),
      },
      profile: {
        find: jest.fn().mockResolvedValue([
          {
            id: "sender-profile",
            variant: "default",
          },
          {
            id: "open-router-profile",
            slug: "open-router",
            variant: "artificial-intelligence",
          },
        ]),
      },
      profilesToMessages: {
        find: jest.fn().mockResolvedValue([
          {
            messageId: "message-1",
            profileId: "sender-profile",
          },
        ]),
      },
    },
  } as any;
}

function createAction(route: string) {
  return {
    rbacModuleAction: {
      payload: {
        route,
        method: "POST",
        result: {
          data: {
            id: "message-1",
          },
        },
      },
    },
  } as any;
}

describe("Given: agent social message action routing", () => {
  /**
   * BDD Scenario
   * Given: a user message was created through the legacy chat message route.
   * When: the agent telegram handler processes the logged action.
   * Then: it asks the OpenRouter social profile to reply.
   */
  it("When: legacy message create route is logged Then: automatic social profile handler runs", async () => {
    const service = createService();
    const handler = new Handler(service);
    const context = createContext();

    await handler.onMessage(context, {
      data: createAction(
        "/api/rbac/subjects/subject-1/social-module/profiles/sender-profile/chats/chat-1/messages",
      ),
    });

    expect(service.agentSocialModuleProfileHandler).toHaveBeenCalledWith({
      shouldReplySocialModuleProfile: expect.objectContaining({
        id: "open-router-profile",
      }),
      socialModuleChat: expect.objectContaining({
        id: "chat-1",
      }),
      socialModuleMessage: expect.objectContaining({
        id: "message-1",
      }),
      messageFromSocialModuleProfile: expect.objectContaining({
        id: "sender-profile",
      }),
    });
    expect(context.json).toHaveBeenCalledWith({
      data: true,
    });
  });

  /**
   * BDD Scenario
   * Given: a user message was created through a thread-aware chat message route.
   * When: the agent telegram handler processes the logged action.
   * Then: it matches the route and asks the OpenRouter social profile to reply.
   */
  it("When: thread message create route is logged Then: automatic social profile handler runs", async () => {
    const service = createService();
    const handler = new Handler(service);
    const context = createContext();

    await handler.onMessage(context, {
      data: createAction(
        "/api/rbac/subjects/subject-1/social-module/profiles/sender-profile/chats/chat-1/threads/thread-1/messages",
      ),
    });

    expect(service.agentSocialModuleProfileHandler).toHaveBeenCalledWith({
      shouldReplySocialModuleProfile: expect.objectContaining({
        id: "open-router-profile",
      }),
      socialModuleChat: expect.objectContaining({
        id: "chat-1",
      }),
      socialModuleMessage: expect.objectContaining({
        id: "message-1",
      }),
      messageFromSocialModuleProfile: expect.objectContaining({
        id: "sender-profile",
      }),
    });
    expect(context.json).toHaveBeenCalledWith({
      data: true,
    });
  });
});
