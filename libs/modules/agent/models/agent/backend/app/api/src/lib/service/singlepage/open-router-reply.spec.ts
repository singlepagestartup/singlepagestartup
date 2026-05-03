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

jest.mock("hono/jwt", () => {
  return {
    sign: jest.fn(),
  };
});

import { Service } from "./index";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import * as jwt from "hono/jwt";

const mockedSign = jwt.sign as jest.Mock;
const mockedReactByOpenRouter =
  rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter as jest.Mock;
const mockedThreadMessageCreate =
  rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate as jest.Mock;
const mockedMessageCreate =
  rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate as jest.Mock;

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
        description:
          "Ошибка OpenRouter\n`Internal server error: unknown certificate verification error`",
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
        description:
          "Ошибка OpenRouter\n`No valid model response received. model=openai/gpt-5.2: generation error`",
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
        description: "Ошибка OpenRouter\n`Generated message is empty`",
      },
      options: {
        headers: {
          Authorization: "Bearer caller-jwt",
        },
      },
    });
  });
});
