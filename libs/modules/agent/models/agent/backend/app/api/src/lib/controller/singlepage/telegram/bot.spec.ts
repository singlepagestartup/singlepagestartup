/**
 * BDD Suite: agent social message action routing.
 *
 * Given: social chat messages can be created through legacy chat routes or thread-aware chat routes.
 * When: the action logger forwards a message creation action to the agent telegram handler.
 * Then: automatic social profiles in the chat are asked to handle both route shapes.
 */

jest.mock("@sps/shared-utils", () => {
  return {
    AUDIO_TRANSCRIPTION_ACTION_TYPE: "audio_transcription_completed",
    AUDIO_TRANSCRIPTION_LEGACY_METADATA_KEY: "telegramVoiceTranscription",
    AUDIO_TRANSCRIPTION_METADATA_KEY: "audioTranscription",
    normalizeRoutePath: (value?: string | null) => {
      const route = value?.trim() || "";

      if (!route) {
        return "";
      }

      if (route.startsWith("/")) {
        return route.split(/[?#]/, 1)[0];
      }

      return new URL(route).pathname;
    },
    RBAC_SECRET_KEY: "rbac-secret",
  };
});

import { Handler } from "./bot";
import {
  AUDIO_TRANSCRIPTION_ACTION_TYPE,
  AUDIO_TRANSCRIPTION_METADATA_KEY,
} from "@sps/shared-utils";

function createContext() {
  return {
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  const agentSocialModuleProfileHandler = jest
    .fn()
    .mockResolvedValue(undefined);
  const notificationMessageUpdate = jest.fn().mockResolvedValue(undefined);

  return {
    agentSocialModuleProfileHandler,
    notificationMessageDelete: jest.fn().mockResolvedValue(undefined),
    notificationMessageUpdate,
    socialModule: {
      action: {
        findById: jest.fn().mockResolvedValue({
          id: "action-1",
          payload: {},
        }),
      },
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
          sourceSystemId: "telegram-chat-1",
          variant: "telegram",
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
      chatsToActions: {
        find: jest.fn().mockResolvedValue([
          {
            actionId: "action-1",
            chatId: "chat-1",
          },
        ]),
      },
      profilesToActions: {
        find: jest.fn().mockResolvedValue([
          {
            actionId: "action-1",
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

function createForwardedSocialAction(payload: Record<string, unknown>) {
  return {
    rbacModuleAction: {
      payload: {
        route:
          "/api/rbac/subjects/subject-1/social-module/profiles/sender-profile/chats/chat-1/actions",
        method: "POST",
        result: {
          data: {
            id: "action-1",
          },
        },
      },
    },
    socialModuleActionPayload: payload,
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
      socialModuleThreadId: "thread-1",
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
   * Given: a legacy action persisted the public tunnel origin with the route.
   * When: the agent processes that absolute thread-aware message URL.
   * Then: it normalizes the route and dispatches the connected AI profile.
   */
  it("When: an absolute tunnel route is logged Then: automatic dispatch still runs", async () => {
    const service = createService();
    const handler = new Handler(service);
    const context = createContext();

    await handler.onMessage(context, {
      data: createAction(
        "http://sps-api.ru.tuna.am/api/rbac/subjects/subject-1/social-module/profiles/sender-profile/chats/chat-1/threads/thread-1/messages?source=host",
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
      socialModuleThreadId: "thread-1",
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
   * Given: a chat contains two AI profiles and a message with AI execution settings.
   * When: backend automatic dispatch handles the message-create action.
   * Then: every connected AI profile is invoked.
   */
  it("When: multiple AI profiles participate Then: every AI profile handles the message", async () => {
    const service = createService();
    service.socialModule.message.findById.mockResolvedValue({
      id: "message-1",
      description: "Use MCP",
      metadata: {
        rbacAiReactionRequest: {
          version: 1,
          modelId: "auto",
          reasoning: "auto",
          skillIds: [],
          useKnowledgeSearch: false,
        },
      },
    });
    service.socialModule.profilesToChats.find.mockResolvedValue([
      { chatId: "chat-1", profileId: "sender-profile" },
      { chatId: "chat-1", profileId: "open-router-profile" },
      { chatId: "chat-1", profileId: "open-router-profile-2" },
    ]);
    service.socialModule.profile.find.mockResolvedValue([
      { id: "sender-profile", variant: "default" },
      {
        id: "open-router-profile",
        variant: "artificial-intelligence",
      },
      {
        id: "open-router-profile-2",
        variant: "artificial-intelligence",
      },
    ]);
    const handler = new Handler(service);
    const context = createContext();

    await handler.onMessage(context, {
      data: createAction(
        "/api/rbac/subjects/subject-1/social-module/profiles/sender-profile/chats/chat-1/threads/thread-1/messages",
      ),
    });

    expect(service.agentSocialModuleProfileHandler).toHaveBeenCalledTimes(2);
    expect(
      service.agentSocialModuleProfileHandler.mock.calls.map(
        ([call]) => call.shouldReplySocialModuleProfile.id,
      ),
    ).toEqual(["open-router-profile", "open-router-profile-2"]);
  });

  /**
   * BDD Scenario
   * Given: a Telegram message has two AI profiles and the system telegram-bot in the chat.
   * When: backend automatic dispatch handles the message-create action.
   * Then: it dispatches every automatic participant; AI handlers independently skip bot commands.
   */
  it("When: Telegram has multiple automatic participants Then: all are dispatched", async () => {
    const service = createService();
    service.socialModule.message.findById.mockResolvedValue({
      id: "message-1",
      description: "/start",
      metadata: {
        rbacAiReactionRequest: {
          version: 1,
          modelId: "auto",
          reasoning: "auto",
          skillIds: [],
          useKnowledgeSearch: false,
        },
      },
    });
    service.socialModule.profilesToChats.find.mockResolvedValue([
      { chatId: "chat-1", profileId: "sender-profile" },
      { chatId: "chat-1", profileId: "legacy-ai-profile" },
      { chatId: "chat-1", profileId: "personal-ai-profile" },
      { chatId: "chat-1", profileId: "telegram-bot-profile" },
    ]);
    service.socialModule.profile.find.mockResolvedValue([
      { id: "sender-profile", variant: "default" },
      {
        id: "legacy-ai-profile",
        variant: "artificial-intelligence",
      },
      {
        id: "personal-ai-profile",
        variant: "artificial-intelligence",
      },
      {
        id: "telegram-bot-profile",
        slug: "telegram-bot",
        variant: "agent",
      },
    ]);
    const handler = new Handler(service);

    await handler.onMessage(createContext(), {
      data: createAction(
        "/api/rbac/subjects/subject-1/social-module/profiles/sender-profile/chats/chat-1/threads/thread-1/messages",
      ),
    });

    expect(service.agentSocialModuleProfileHandler).toHaveBeenCalledTimes(3);
    expect(
      service.agentSocialModuleProfileHandler.mock.calls.map(
        ([call]) => call.shouldReplySocialModuleProfile.id,
      ),
    ).toEqual([
      "legacy-ai-profile",
      "personal-ai-profile",
      "telegram-bot-profile",
    ]);
  });

  /**
   * BDD Scenario
   * Given: an audio transcript update is marked completed with the explicit agent trigger.
   * When: the agent telegram handler processes the forwarded social action.
   * Then: it reuses normal message dispatch and asks the OpenRouter social profile to reply.
   */
  it("When: audio transcription completed action is logged Then: automatic social profile handler runs", async () => {
    const service = createService();
    const forwardedAction = createForwardedSocialAction({
      type: AUDIO_TRANSCRIPTION_ACTION_TYPE,
      message: {
        id: "message-1",
        description: "transcribed voice text",
        metadata: {
          [AUDIO_TRANSCRIPTION_METADATA_KEY]: {
            agentTrigger: AUDIO_TRANSCRIPTION_ACTION_TYPE,
            status: "completed",
          },
        },
      },
    });
    service.socialModule.action.findById.mockResolvedValue({
      id: "action-1",
      payload: forwardedAction.socialModuleActionPayload,
    });
    const handler = new Handler(service);
    const context = createContext();

    await handler.onAction(context, {
      data: forwardedAction,
    });

    expect(service.notificationMessageUpdate).not.toHaveBeenCalled();
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
   * Given: a normal message edit is forwarded as a generic update action.
   * When: the agent telegram handler processes the action.
   * Then: it updates the notification message and does not trigger an agent reply.
   */
  it("When: generic update action is logged Then: only notification update runs", async () => {
    const service = createService();
    const forwardedAction = createForwardedSocialAction({
      type: "update",
      message: {
        id: "message-1",
        description: "edited text",
      },
    });
    service.socialModule.action.findById.mockResolvedValue({
      id: "action-1",
      payload: forwardedAction.socialModuleActionPayload,
    });
    const handler = new Handler(service);
    const context = createContext();

    await handler.onAction(context, {
      data: forwardedAction,
    });

    expect(service.notificationMessageUpdate).toHaveBeenCalledWith({
      socialModuleChat: expect.objectContaining({
        id: "chat-1",
      }),
      socialModuleMessage: expect.objectContaining({
        id: "message-1",
      }),
    });
    expect(service.agentSocialModuleProfileHandler).not.toHaveBeenCalled();
    expect(context.json).toHaveBeenCalledWith({
      data: true,
    });
  });

  /**
   * BDD Scenario
   * Given: an audio transcription action has completed metadata but no transcript text.
   * When: the agent telegram handler processes the action.
   * Then: it does not trigger an agent reply.
   */
  it("When: completed audio action has empty text Then: automatic social profile handler is skipped", async () => {
    const service = createService();
    const forwardedAction = createForwardedSocialAction({
      type: AUDIO_TRANSCRIPTION_ACTION_TYPE,
      message: {
        id: "message-1",
        description: "",
        metadata: {
          [AUDIO_TRANSCRIPTION_METADATA_KEY]: {
            agentTrigger: AUDIO_TRANSCRIPTION_ACTION_TYPE,
            status: "completed",
          },
        },
      },
    });
    service.socialModule.action.findById.mockResolvedValue({
      id: "action-1",
      payload: forwardedAction.socialModuleActionPayload,
    });
    const handler = new Handler(service);
    const context = createContext();

    await handler.onAction(context, {
      data: forwardedAction,
    });

    expect(service.notificationMessageUpdate).not.toHaveBeenCalled();
    expect(service.agentSocialModuleProfileHandler).not.toHaveBeenCalled();
    expect(context.json).toHaveBeenCalledWith({
      data: false,
    });
  });
});
