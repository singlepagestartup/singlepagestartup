/**
 * BDD Suite: agent OpenRouter insufficient-balance fallback.
 *
 * Given: the downstream OpenRouter subject route still reports billing failures with the existing balance-error text.
 * When: the agent service handles that failure while replying in a chat thread.
 * Then: the thread receives the not-enough-tokens message and the premium upsell flow remains unchanged.
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

describe("agent OpenRouter insufficient-balance fallback", () => {
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
});
