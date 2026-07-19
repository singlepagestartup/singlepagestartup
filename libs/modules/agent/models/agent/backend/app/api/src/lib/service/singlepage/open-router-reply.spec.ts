/**
 * BDD Suite: agent OpenRouter reply fallback and prompt gating.
 *
 * Given: OpenRouter replies can fail downstream or receive empty incoming prompts.
 * When: the agent service handles those reply paths.
 * Then: it skips non-actionable prompts and preserves user-facing fallback replies.
 */

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_SECRET_KEY: "rbac-secret",
    RBAC_JWT_SECRET: "jwt-secret",
    RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 3600,
  };
});

jest.mock("@sps/rbac/models/subject/sdk/server", () => {
  return {
    api: {
      socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter:
        jest.fn(),
      socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate:
        jest.fn(),
      socialModuleProfileFindByIdChatFindByIdMessageCreate: jest.fn(),
    },
  };
});

jest.mock("@sps/social/models/message/sdk/server", () => {
  return {
    api: {
      update: jest.fn(),
    },
  };
});

jest.mock("hono/jwt", () => {
  return {
    sign: jest.fn(),
  };
});

import { Service } from "./index";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import * as jwt from "hono/jwt";

const mockedSign = jwt.sign as jest.Mock;
const mockedReactByOpenRouter =
  rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter as jest.Mock;
const mockedThreadMessageCreate =
  rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate as jest.Mock;
const mockedMessageCreate =
  rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate as jest.Mock;
const mockedSocialMessageUpdate = socialModuleMessageApi.update as jest.Mock;
const openRouterStatusMetadata = {
  systemMessage: {
    version: 1,
    source: "agent.openrouter.status",
    excludeFromOpenRouter: true,
  },
};

function createService() {
  const service = Object.create(Service.prototype) as Service;

  (service as any).resolveThreadIdForMessageInChat = jest
    .fn()
    .mockResolvedValue("thread-1");
  (service as any).getMessageFromRbacModuleSubject = jest
    .fn()
    .mockResolvedValue({
      id: "subject-openrouter",
    });
  (service as any).telegramBotPremiumMessageWithKeyboardCreate = jest
    .fn()
    .mockResolvedValue(undefined);
  (service as any).rbacModule = {
    rolesToEcommerceModuleProducts: {
      find: jest.fn().mockResolvedValue([
        {
          roleId: "premium-role",
        },
      ]),
    },
    role: {
      find: jest.fn().mockResolvedValue([
        {
          id: "premium-role",
          slug: "premium",
        },
      ]),
    },
    subjectsToRoles: {
      find: jest.fn().mockResolvedValue([
        {
          subjectId: "subject-openrouter",
          roleId: "premium-role",
        },
      ]),
    },
  };
  (service as any).statusMessages = {
    openRouterNotFoundSubscription: {
      ru: "Нет активной подписки",
    },
    openRouterNotEnoughTokens: {
      ru: "Недостаточно токенов",
    },
    openRouterError: {
      ru: "Ошибка OpenRouter",
    },
  };

  return service;
}

describe("Given: agent OpenRouter reply fallback and prompt gating", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSign.mockResolvedValue("signed-jwt");
  });

  /**
   * BDD Scenario
   * Given: Agent creates a Telegram command or assistant-management reply.
   * When: the reply is persisted in the current thread.
   * Then: it carries the system marker while preserving other metadata.
   */
  it("marks every Telegram system reply as excluded from OpenRouter", async () => {
    const service = createService();

    mockedThreadMessageCreate.mockResolvedValue({ id: "reply-message" });

    await (service as any).telegramBotReplyMessageCreate({
      jwtToken: "caller-jwt",
      rbacModuleSubject: {
        id: "caller-subject",
      },
      shouldReplySocialModuleProfile: {
        id: "telegram-bot-profile",
      },
      socialModuleChat: {
        id: "chat-1",
      },
      socialModuleMessage: {
        id: "message-1",
        description: "/assistant",
      },
      messageFromSocialModuleProfile: {
        id: "sender-profile",
      },
      data: {
        description: "Профиль ассистента открыт.",
        metadata: {
          telegram: {
            presentation: true,
          },
        },
      },
    });

    expect(mockedThreadMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          description: "Профиль ассистента открыт.",
          metadata: {
            telegram: {
              presentation: true,
            },
            systemMessage: {
              version: 1,
              source: "agent.telegram.system-reply",
              excludeFromOpenRouter: true,
            },
          },
        },
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a published Telegram bot command enters Agent dispatch.
   * When: Agent routes the command to its system handler.
   * Then: the originating command message is excluded from later generations.
   */
  it("marks Telegram bot command inputs as excluded from OpenRouter", async () => {
    const service = Object.create(Service.prototype) as Service;
    const commandReply = jest.fn().mockResolvedValue(undefined);

    mockedSocialMessageUpdate.mockResolvedValue({ id: "message-command" });
    (service as any).rbacModule = {
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([{ subjectId: "bot-subject" }]),
      },
      subject: {
        findById: jest.fn().mockResolvedValue({ id: "bot-subject" }),
      },
    };
    (service as any).telegramConversationRuntime = {
      get: jest.fn().mockResolvedValue(undefined),
    };
    (service as any).resolveTelegramConversationKey = jest
      .fn()
      .mockResolvedValue({
        chatId: "chat-1",
        threadId: "thread-1",
        senderProfileId: "sender-profile",
      });
    (service as any).telegramBotCommandReplyMessageCreate = commandReply;

    await service.agentSocialModuleProfileHandler({
      shouldReplySocialModuleProfile: {
        id: "telegram-bot-profile",
        slug: "telegram-bot",
      } as any,
      socialModuleChat: {
        id: "chat-1",
        variant: "telegram",
      } as any,
      socialModuleMessage: {
        id: "message-command",
        description: "/assistant",
      } as any,
      socialModuleThreadId: "thread-1",
      messageFromSocialModuleProfile: {
        id: "sender-profile",
      } as any,
    });

    expect(mockedSocialMessageUpdate).toHaveBeenCalledWith({
      id: "message-command",
      data: {
        metadata: {
          systemMessage: {
            version: 1,
            source: "agent.telegram.command",
            excludeFromOpenRouter: true,
          },
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(commandReply).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: an avatar file arrives while the Telegram assistant editor is active.
   * When: Agent consumes the file as conversation input.
   * Then: the persisted input is marked as system traffic before the editor handles it.
   */
  it("marks active Telegram assistant input before consuming an avatar", async () => {
    const service = Object.create(Service.prototype) as Service;
    const handleMessage = jest.fn().mockResolvedValue(undefined);
    const transport = {};

    mockedSocialMessageUpdate.mockResolvedValue({ id: "message-avatar" });
    (service as any).rbacModule = {
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([{ subjectId: "bot-subject" }]),
      },
      subject: {
        findById: jest.fn().mockResolvedValue({ id: "bot-subject" }),
      },
    };
    (service as any).telegramConversationRuntime = {
      get: jest.fn().mockResolvedValue({
        conversationId: "assistant-profile-management",
        editor: {
          kind: "avatar",
          field: "file",
        },
      }),
    };
    (service as any).resolveTelegramConversationKey = jest
      .fn()
      .mockResolvedValue({
        chatId: "chat-1",
        threadId: "thread-1",
        senderProfileId: "sender-profile",
      });
    (service as any).getTelegramAssistantConversationContext = jest
      .fn()
      .mockResolvedValue({ key: "conversation-key" });
    (service as any).getTelegramAssistantConversation = jest.fn(() => ({
      handleMessage,
    }));
    (service as any).getTelegramAssistantConversationTransport = jest.fn(
      () => transport,
    );

    const avatarMessage = {
      id: "message-avatar",
      description: "",
      metadata: {
        telegram: {
          sourceMessageIds: [501],
        },
      },
    };

    await service.agentSocialModuleProfileHandler({
      shouldReplySocialModuleProfile: {
        id: "telegram-bot-profile",
        slug: "telegram-bot",
      } as any,
      socialModuleChat: {
        id: "chat-1",
        variant: "telegram",
      } as any,
      socialModuleMessage: avatarMessage as any,
      socialModuleThreadId: "thread-1",
      messageFromSocialModuleProfile: {
        id: "sender-profile",
      } as any,
    });

    expect(mockedSocialMessageUpdate).toHaveBeenCalledWith({
      id: "message-avatar",
      data: {
        metadata: {
          telegram: {
            sourceMessageIds: [501],
          },
          systemMessage: {
            version: 1,
            source: "agent.telegram.assistant-conversation",
            excludeFromOpenRouter: true,
          },
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(handleMessage).toHaveBeenCalledWith(
      { key: "conversation-key" },
      avatarMessage,
      transport,
    );
    expect(avatarMessage.metadata).toEqual({
      telegram: {
        sourceMessageIds: [501],
      },
      systemMessage: {
        version: 1,
        source: "agent.telegram.assistant-conversation",
        excludeFromOpenRouter: true,
      },
    });
  });

  /**
   * BDD Scenario
   * Given: /assistant remains open on a read-only menu page in a Telegram topic.
   * When: the sender writes an ordinary natural-language prompt.
   * Then: Agent neither marks it as management traffic nor blocks the AI reply.
   */
  it("lets ordinary prompts reach AI while the assistant menu is idle", async () => {
    const service = Object.create(Service.prototype) as Service;
    const handleMessage = jest.fn();
    const openRouterReplyMessageCreate = jest.fn().mockResolvedValue(undefined);

    (service as any).rbacModule = {
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([{ subjectId: "reply-subject" }]),
      },
      subject: {
        findById: jest.fn().mockResolvedValue({ id: "reply-subject" }),
      },
    };
    (service as any).telegramConversationRuntime = {
      get: jest.fn().mockResolvedValue({
        conversationId: "assistant-profile-management",
        page: "knowledge-document",
        editor: undefined,
      }),
    };
    (service as any).resolveTelegramConversationKey = jest
      .fn()
      .mockResolvedValue({
        chatId: "chat-1",
        threadId: "thread-1",
        senderProfileId: "sender-profile",
      });
    (service as any).getTelegramAssistantConversation = jest.fn(() => ({
      handleMessage,
    }));
    (service as any).openRouterReplyMessageCreate =
      openRouterReplyMessageCreate;

    const commonProps = {
      socialModuleChat: {
        id: "chat-1",
        variant: "telegram",
      },
      socialModuleMessage: {
        id: "ordinary-prompt",
        description: "Сколько на сайте статей? О чем они?",
      },
      socialModuleThreadId: "thread-1",
      messageFromSocialModuleProfile: {
        id: "sender-profile",
      },
    } as any;

    await service.agentSocialModuleProfileHandler({
      ...commonProps,
      shouldReplySocialModuleProfile: {
        id: "telegram-bot-profile",
        slug: "telegram-bot",
      },
    });

    expect(handleMessage).not.toHaveBeenCalled();
    expect(mockedSocialMessageUpdate).not.toHaveBeenCalled();

    await service.agentSocialModuleProfileHandler({
      ...commonProps,
      shouldReplySocialModuleProfile: {
        id: "assistant-profile",
        slug: "assistant-profile",
        variant: "artificial-intelligence",
      },
    });

    expect(openRouterReplyMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        shouldReplySocialModuleProfile: expect.objectContaining({
          id: "assistant-profile",
        }),
        socialModuleMessage: expect.objectContaining({
          id: "ordinary-prompt",
        }),
      }),
    );
    expect(mockedSocialMessageUpdate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a system-marked message reaches the Agent OpenRouter fallback path.
   * When: reply generation is considered.
   * Then: Agent stops before resolving a thread or calling the RBAC route.
   */
  it("skips system-marked prompts before OpenRouter generation", async () => {
    const service = createService();

    await expect(
      service.openRouterReplyMessageCreate({
        jwtToken: "caller-jwt",
        rbacModuleSubject: {
          id: "caller-subject",
        } as any,
        shouldReplySocialModuleProfile: {
          id: "assistant-profile",
        } as any,
        socialModuleChat: {
          id: "chat-1",
        } as any,
        socialModuleMessage: {
          id: "message-1",
          description: "Профиль ассистента открыт.",
          metadata: {
            systemMessage: {
              version: 1,
              source: "agent.telegram.system-reply",
              excludeFromOpenRouter: true,
            },
          },
        } as any,
        messageFromSocialModuleProfile: {
          id: "sender-profile",
        } as any,
      }),
    ).resolves.toBeUndefined();

    expect(
      (service as any).resolveThreadIdForMessageInChat,
    ).not.toHaveBeenCalled();
    expect(mockedReactByOpenRouter).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a Telegram user has no role granting a payable OpenRouter subscription.
   * When: Agent creates the subscription status response instead of generating.
   * Then: the response is marked as system traffic and cannot enter later OpenRouter context.
   */
  it("marks the missing-subscription response as excluded from OpenRouter", async () => {
    const service = createService();
    const statusMessage = { id: "subscription-status-message" };

    (service as any).rbacModule.subjectsToRoles.find = jest
      .fn()
      .mockResolvedValue([]);
    mockedThreadMessageCreate.mockResolvedValue(statusMessage);

    await expect(
      service.openRouterReplyMessageCreate({
        jwtToken: "caller-jwt",
        rbacModuleSubject: {
          id: "caller-subject",
        } as any,
        shouldReplySocialModuleProfile: {
          id: "assistant-profile",
        } as any,
        socialModuleChat: {
          id: "chat-1",
        } as any,
        socialModuleMessage: {
          id: "message-1",
          description: "Hello",
        } as any,
        messageFromSocialModuleProfile: {
          id: "sender-profile",
        } as any,
      }),
    ).resolves.toBe(statusMessage);

    expect(mockedThreadMessageCreate).toHaveBeenCalledWith({
      id: "caller-subject",
      socialModuleProfileId: "assistant-profile",
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-1",
      data: {
        description: "Нет активной подписки",
        interaction: {
          inline_keyboard: [
            [
              {
                text: "Premium",
                callback_data: "command_premium",
              },
            ],
          ],
        },
        metadata: openRouterStatusMetadata,
      },
      options: {
        headers: {
          Authorization: "Bearer caller-jwt",
        },
      },
    });
    expect(mockedReactByOpenRouter).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the OpenRouter billing layer rejects a follow-up request because the subject is already negative.
   * When: the agent service catches that route error while replying in-thread.
   * Then: it posts the existing not-enough-tokens message in the same thread and triggers the premium upsell helper.
   */
  it("preserves the threaded not-enough-tokens reply and premium upsell flow", async () => {
    const service = createService();

    mockedReactByOpenRouter.mockRejectedValue(
      new Error(
        "Validation error. You do not have access to this resource because your 'subjectsToBillingModuleCurrencies' do not have enough balance for that route.",
      ),
    );

    await expect(
      service.openRouterReplyMessageCreate({
        jwtToken: "caller-jwt",
        rbacModuleSubject: {
          id: "caller-subject",
        } as any,
        shouldReplySocialModuleProfile: {
          id: "assistant-profile",
        } as any,
        socialModuleChat: {
          id: "chat-1",
        } as any,
        socialModuleMessage: {
          id: "message-1",
          description: "Hello",
        } as any,
        messageFromSocialModuleProfile: {
          id: "sender-profile",
        } as any,
      }),
    ).rejects.toThrow("do not have enough balance for that route");

    expect(mockedThreadMessageCreate).toHaveBeenCalledWith({
      id: "caller-subject",
      socialModuleProfileId: "assistant-profile",
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-1",
      data: {
        description: "Недостаточно токенов",
        metadata: openRouterStatusMetadata,
      },
      options: {
        headers: {
          Authorization: "Bearer caller-jwt",
        },
      },
    });
    expect(
      (service as any).telegramBotPremiumMessageWithKeyboardCreate,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        jwtToken: "caller-jwt",
        socialModuleChat: expect.objectContaining({
          id: "chat-1",
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: the downstream OpenRouter route fails because the runtime cannot verify an upstream certificate.
   * When: the agent service handles that recoverable OpenRouter failure.
   * Then: it posts the error into the current thread and does not fail the Telegram webhook.
   */
  it("posts recoverable OpenRouter certificate errors without rethrowing", async () => {
    const service = createService();

    mockedReactByOpenRouter.mockRejectedValue(
      new Error(
        "Internal server error: unknown certificate verification error",
      ),
    );

    await expect(
      service.openRouterReplyMessageCreate({
        jwtToken: "caller-jwt",
        rbacModuleSubject: {
          id: "caller-subject",
        } as any,
        shouldReplySocialModuleProfile: {
          id: "assistant-profile",
        } as any,
        socialModuleChat: {
          id: "chat-1",
        } as any,
        socialModuleMessage: {
          id: "message-1",
          description: "Hello",
        } as any,
        messageFromSocialModuleProfile: {
          id: "sender-profile",
        } as any,
      }),
    ).resolves.toBeUndefined();

    expect(mockedThreadMessageCreate).toHaveBeenCalledWith({
      id: "caller-subject",
      socialModuleProfileId: "assistant-profile",
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-1",
      data: {
        description: "Ошибка OpenRouter",
        metadata: openRouterStatusMetadata,
      },
      options: {
        headers: {
          Authorization: "Bearer caller-jwt",
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: the downstream OpenRouter route throws the terminal no-valid-response error.
   * When: the agent service handles that recoverable OpenRouter failure.
   * Then: it posts one user-facing error message into the current thread and resolves.
   */
  it("posts recoverable no-valid-model-response errors without rethrowing", async () => {
    const service = createService();

    mockedReactByOpenRouter.mockRejectedValue(
      new Error(
        "No valid model response received. model=openai/gpt-5.2: generation error",
      ),
    );

    await expect(
      service.openRouterReplyMessageCreate({
        jwtToken: "caller-jwt",
        rbacModuleSubject: {
          id: "caller-subject",
        } as any,
        shouldReplySocialModuleProfile: {
          id: "assistant-profile",
        } as any,
        socialModuleChat: {
          id: "chat-1",
        } as any,
        socialModuleMessage: {
          id: "message-1",
          description: "Hello",
        } as any,
        messageFromSocialModuleProfile: {
          id: "sender-profile",
        } as any,
      }),
    ).resolves.toBeUndefined();

    expect(mockedThreadMessageCreate).toHaveBeenCalledTimes(1);
    expect(mockedThreadMessageCreate).toHaveBeenCalledWith({
      id: "caller-subject",
      socialModuleProfileId: "assistant-profile",
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-1",
      data: {
        description: "Ошибка OpenRouter",
        metadata: openRouterStatusMetadata,
      },
      options: {
        headers: {
          Authorization: "Bearer caller-jwt",
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: the downstream RBAC route resolves with its own terminal OpenRouter message.
   * When: the agent service returns that route result to the caller.
   * Then: it does not create a second agent-level OpenRouter error message.
   */
  it("does not duplicate error messages when RBAC returns a terminal OpenRouter message", async () => {
    const service = createService();
    const terminalMessage = {
      data: {
        socialModule: {
          message: {
            id: "status-message-1",
            description:
              "Ошибка OpenRouter\n`No valid model response received. model=openai/gpt-5.2: generation error`",
          },
        },
      },
    };

    mockedReactByOpenRouter.mockResolvedValue(terminalMessage);

    await expect(
      service.openRouterReplyMessageCreate({
        jwtToken: "caller-jwt",
        rbacModuleSubject: {
          id: "caller-subject",
        } as any,
        shouldReplySocialModuleProfile: {
          id: "assistant-profile",
        } as any,
        socialModuleChat: {
          id: "chat-1",
        } as any,
        socialModuleMessage: {
          id: "message-1",
          description: "Hello",
        } as any,
        messageFromSocialModuleProfile: {
          id: "sender-profile",
        } as any,
      }),
    ).resolves.toBe(terminalMessage);

    expect(mockedReactByOpenRouter).toHaveBeenCalledWith({
      id: "subject-openrouter",
      socialModuleChatId: "chat-1",
      socialModuleMessageId: "message-1",
      socialModuleProfileId: "sender-profile",
      data: {
        shouldReplySocialModuleProfile: {
          id: "assistant-profile",
        },
      },
      options: {
        headers: {
          Authorization: "Bearer signed-jwt",
        },
      },
    });
    expect(mockedThreadMessageCreate).not.toHaveBeenCalled();
    expect(mockedMessageCreate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the downstream RBAC route already wrote the terminal OpenRouter status message before throwing.
   * When: the agent service catches the marked fatal route error.
   * Then: it does not write a duplicate agent-level error message.
   */
  it("does not duplicate error messages when RBAC throws after writing terminal status", async () => {
    const service = createService();

    mockedReactByOpenRouter.mockRejectedValue(
      new Error(
        "No valid model response received. model=openai/gpt-5.2: generation error [open-router-terminal-message-written]",
      ),
    );

    await expect(
      service.openRouterReplyMessageCreate({
        jwtToken: "caller-jwt",
        rbacModuleSubject: {
          id: "caller-subject",
        } as any,
        shouldReplySocialModuleProfile: {
          id: "assistant-profile",
        } as any,
        socialModuleChat: {
          id: "chat-1",
        } as any,
        socialModuleMessage: {
          id: "message-1",
          description: "Hello",
        } as any,
        messageFromSocialModuleProfile: {
          id: "sender-profile",
        } as any,
      }),
    ).resolves.toBeUndefined();

    expect(mockedThreadMessageCreate).not.toHaveBeenCalled();
    expect(mockedMessageCreate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a Telegram-origin social message has no text description because the user only sent an attachment.
   * When: the agent service considers that message for an OpenRouter reply.
   * Then: it skips generation without calling OpenRouter or writing an error message.
   */
  it("skips empty incoming prompts before OpenRouter generation", async () => {
    const service = createService();

    await expect(
      service.openRouterReplyMessageCreate({
        jwtToken: "caller-jwt",
        rbacModuleSubject: {
          id: "caller-subject",
        } as any,
        shouldReplySocialModuleProfile: {
          id: "assistant-profile",
        } as any,
        socialModuleChat: {
          id: "chat-1",
        } as any,
        socialModuleMessage: {
          id: "message-1",
          description: "",
        } as any,
        messageFromSocialModuleProfile: {
          id: "sender-profile",
        } as any,
      }),
    ).resolves.toBeUndefined();

    expect(
      (service as any).resolveThreadIdForMessageInChat,
    ).not.toHaveBeenCalled();
    expect(mockedReactByOpenRouter).not.toHaveBeenCalled();
    expect(mockedThreadMessageCreate).not.toHaveBeenCalled();
    expect(mockedMessageCreate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: the downstream OpenRouter route rejects a selected model response because generated text is empty.
   * When: the agent service handles that generation failure while replying in-thread.
   * Then: it writes the existing OpenRouter error message into the thread and rethrows for observability.
   */
  it("posts an OpenRouter error reply when generated model output is empty", async () => {
    const service = createService();

    mockedReactByOpenRouter.mockRejectedValue(
      new Error("Generated message is empty"),
    );

    await expect(
      service.openRouterReplyMessageCreate({
        jwtToken: "caller-jwt",
        rbacModuleSubject: {
          id: "caller-subject",
        } as any,
        shouldReplySocialModuleProfile: {
          id: "assistant-profile",
        } as any,
        socialModuleChat: {
          id: "chat-1",
        } as any,
        socialModuleMessage: {
          id: "message-1",
          description: "Hello",
        } as any,
        messageFromSocialModuleProfile: {
          id: "sender-profile",
        } as any,
      }),
    ).rejects.toThrow("Generated message is empty");

    expect(mockedThreadMessageCreate).toHaveBeenCalledWith({
      id: "caller-subject",
      socialModuleProfileId: "assistant-profile",
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-1",
      data: {
        description: "Ошибка OpenRouter",
        metadata: openRouterStatusMetadata,
      },
      options: {
        headers: {
          Authorization: "Bearer caller-jwt",
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: an automatic AI profile is selected in either a normal or Knowledge chat.
   * When: the agent dispatches the new message.
   * Then: both variants use the single OpenRouter reaction flow.
   */
  it.each([
    ["default", "social-profile"],
    ["knowledge", "chat-gpt-knowledge-profile"],
  ])(
    "routes %s chat AI profiles through OpenRouter only",
    async (chatVariant, profileSlug) => {
      const service = Object.create(Service.prototype) as Service;
      const openRouterReplyMessageCreate = jest
        .fn()
        .mockResolvedValue(undefined);

      (service as any).openRouterReplyMessageCreate =
        openRouterReplyMessageCreate;
      (service as any).rbacModule = {
        subjectsToSocialModuleProfiles: {
          find: jest.fn().mockResolvedValue([
            {
              subjectId: "rbac-subject",
            },
          ]),
        },
        subject: {
          findById: jest.fn().mockResolvedValue({
            id: "rbac-subject",
          }),
        },
      };

      await service.agentSocialModuleProfileHandler({
        shouldReplySocialModuleProfile: {
          id: "social-profile",
          slug: profileSlug,
          variant: "artificial-intelligence",
        } as any,
        socialModuleChat: {
          id: "chat-1",
          variant: chatVariant,
        } as any,
        socialModuleMessage: {
          id: "message-1",
          description: "Complete the assigned task",
        } as any,
        messageFromSocialModuleProfile: {
          id: "requester-profile",
        } as any,
      });

      expect(openRouterReplyMessageCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          jwtToken: "signed-jwt",
          rbacModuleSubject: expect.objectContaining({
            id: "rbac-subject",
          }),
          shouldReplySocialModuleProfile: expect.objectContaining({
            id: "social-profile",
          }),
        }),
      );
    },
  );

  /**
   * BDD Scenario
   * Given: one Telegram sender has an active assistant editor while another sender does not.
   * When: the Agent dispatches ordinary messages from both senders to an AI profile.
   * Then: the active editor input suppresses OpenRouter and the unrelated message keeps the normal AI flow.
   */
  it("suppresses OpenRouter only for the active Telegram editor key", async () => {
    const service = Object.create(Service.prototype) as Service;
    const openRouterReplyMessageCreate = jest.fn().mockResolvedValue(undefined);
    const getConversation = jest
      .fn()
      .mockImplementation(async (key: { senderProfileId: string }) =>
        key.senderProfileId === "active-sender"
          ? {
              conversationId: "telegram-assistant-profile-management",
              editor: {
                kind: "profile",
                field: "title",
              },
            }
          : undefined,
      );

    (service as any).openRouterReplyMessageCreate =
      openRouterReplyMessageCreate;
    (service as any).telegramConversationRuntime = {
      get: getConversation,
    };
    (service as any).resolveTelegramConversationKey = jest
      .fn()
      .mockImplementation(async (props: any) => ({
        chatId: props.socialModuleChat.id,
        threadId: "thread-1",
        senderProfileId: props.messageFromSocialModuleProfile.id,
      }));
    (service as any).rbacModule = {
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([
          {
            subjectId: "rbac-subject",
          },
        ]),
      },
      subject: {
        findById: jest.fn().mockResolvedValue({
          id: "rbac-subject",
        }),
      },
    };

    const commonProps = {
      shouldReplySocialModuleProfile: {
        id: "ai-profile",
        slug: "personal-ai",
        variant: "artificial-intelligence",
      } as any,
      socialModuleChat: {
        id: "chat-1",
        variant: "telegram",
      } as any,
      socialModuleMessage: {
        id: "message-1",
        description: "Editor input",
      } as any,
    };

    await service.agentSocialModuleProfileHandler({
      ...commonProps,
      messageFromSocialModuleProfile: {
        id: "active-sender",
      } as any,
    });
    await service.agentSocialModuleProfileHandler({
      ...commonProps,
      socialModuleMessage: {
        id: "message-2",
        description: "Ordinary prompt",
      } as any,
      messageFromSocialModuleProfile: {
        id: "unrelated-sender",
      } as any,
    });

    expect(getConversation).toHaveBeenCalledTimes(2);
    expect(openRouterReplyMessageCreate).toHaveBeenCalledTimes(1);
    expect(openRouterReplyMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        socialModuleMessage: expect.objectContaining({
          id: "message-2",
        }),
        messageFromSocialModuleProfile: expect.objectContaining({
          id: "unrelated-sender",
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: Telegram ingests a direct /learn command without transport rewriting.
   * When: Agent dispatches connected automatic profiles.
   * Then: the AI profile receives the command and the telegram-bot profile skips it.
   */
  it("routes direct /learn only to an artificial-intelligence profile", async () => {
    const service = Object.create(Service.prototype) as Service;
    const openRouterReplyMessageCreate = jest.fn().mockResolvedValue(undefined);
    const telegramBotCommandReplyMessageCreate = jest
      .fn()
      .mockResolvedValue(undefined);

    (service as any).openRouterReplyMessageCreate =
      openRouterReplyMessageCreate;
    (service as any).telegramBotCommandReplyMessageCreate =
      telegramBotCommandReplyMessageCreate;
    (service as any).rbacModule = {
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([
          {
            subjectId: "rbac-subject",
          },
        ]),
      },
      subject: {
        findById: jest.fn().mockResolvedValue({
          id: "rbac-subject",
        }),
      },
    };

    const commonProps = {
      socialModuleChat: {
        id: "chat-1",
      } as any,
      socialModuleMessage: {
        id: "message-1",
        description: "/learn Store this fact",
      } as any,
      messageFromSocialModuleProfile: {
        id: "requester-profile",
      } as any,
    };

    await service.agentSocialModuleProfileHandler({
      ...commonProps,
      shouldReplySocialModuleProfile: {
        id: "ai-profile",
        slug: "personal-ai",
        variant: "artificial-intelligence",
      } as any,
    });
    await service.agentSocialModuleProfileHandler({
      ...commonProps,
      shouldReplySocialModuleProfile: {
        id: "telegram-bot-profile",
        slug: "telegram-bot",
        variant: "default",
      } as any,
    });

    expect(openRouterReplyMessageCreate).toHaveBeenCalledTimes(1);
    expect(telegramBotCommandReplyMessageCreate).not.toHaveBeenCalled();
  });
});
