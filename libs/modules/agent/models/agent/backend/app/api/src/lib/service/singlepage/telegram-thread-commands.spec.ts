/**
 * BDD Suite: agent Telegram thread commands.
 *
 * Given: Telegram commands arrive as ordinary social messages.
 * When: the agent Telegram bot service handles thread management commands.
 * Then: SPS thread operations run from the sender subject, not from the Telegram adapter.
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
      socialModuleChatFindByIdThreadFind: jest.fn(),
      socialModuleChatFindByIdThreadCreate: jest.fn(),
      socialModuleChatFindByIdThreadUpdate: jest.fn(),
      socialModuleChatFindByIdThreadDelete: jest.fn(),
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
const mockedThreadFind =
  rbacModuleSubjectApi.socialModuleChatFindByIdThreadFind as jest.Mock;
const mockedThreadCreate =
  rbacModuleSubjectApi.socialModuleChatFindByIdThreadCreate as jest.Mock;
const mockedThreadUpdate =
  rbacModuleSubjectApi.socialModuleChatFindByIdThreadUpdate as jest.Mock;
const mockedThreadDelete =
  rbacModuleSubjectApi.socialModuleChatFindByIdThreadDelete as jest.Mock;

function createProps(description: string) {
  return {
    jwtToken: "bot-jwt",
    rbacModuleSubject: {
      id: "telegram-bot-subject",
    },
    shouldReplySocialModuleProfile: {
      id: "telegram-bot-profile",
      slug: "telegram-bot",
    },
    socialModuleChat: {
      id: "chat-1",
    },
    socialModuleMessage: {
      id: "message-1",
      description,
    },
    messageFromSocialModuleProfile: {
      id: "sender-profile",
    },
  } as any;
}

function createService(props?: {
  currentThread?: {
    id: string;
    title?: string;
    variant?: string;
    sourceSystemId?: string;
  };
}) {
  const service = Object.create(Service.prototype) as Service;

  (service as any).getMessageFromRbacModuleSubject = jest
    .fn()
    .mockResolvedValue({
      id: "sender-subject",
    });
  (service as any).telegramBotReplyMessageCreate = jest.fn().mockResolvedValue({
    id: "reply-message",
  });
  (service as any).resolveThreadIdForMessageInChat = jest
    .fn()
    .mockResolvedValue("thread-current");
  (service as any).socialModule = {
    thread: {
      findById: jest.fn().mockResolvedValue(
        props?.currentThread || {
          id: "thread-current",
          title: "Current thread",
          variant: "telegram",
          sourceSystemId: "42",
        },
      ),
    },
  };

  return service;
}

describe("agent Telegram thread commands", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSign.mockResolvedValue("sender-jwt");
  });

  /**
   * BDD Scenario
   * Given: a sender asks for the Telegram chat threads.
   * When: the Telegram bot agent handles /threads.
   * Then: it reads threads through the sender subject RBAC SDK and replies in-thread.
   */
  it("handles /threads through the sender subject", async () => {
    const service = createService();
    mockedThreadFind.mockResolvedValue([
      {
        id: "thread-default",
        title: "",
        variant: "default",
      },
      {
        id: "thread-topic",
        title: "Topic title",
        variant: "telegram",
        sourceSystemId: "42",
      },
    ]);

    await service.telegramBotCommandReplyMessageCreate(createProps("/threads"));

    expect(mockedThreadFind).toHaveBeenCalledWith({
      id: "sender-subject",
      socialModuleChatId: "chat-1",
      options: {
        headers: {
          Authorization: "Bearer sender-jwt",
        },
      },
    });
    expect((service as any).telegramBotReplyMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          description: "1. Default thread\n2. Topic title (42)",
        },
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a sender asks the Telegram bot to create a thread.
   * When: the Telegram bot agent handles /thread_new.
   * Then: it creates the thread through the sender subject RBAC SDK.
   */
  it("handles /thread_new through the sender subject", async () => {
    const service = createService();
    mockedThreadCreate.mockResolvedValue({
      id: "thread-new",
      title: "Roadmap",
    });

    await service.telegramBotCommandReplyMessageCreate(
      createProps("/thread_new Roadmap"),
    );

    expect(mockedThreadCreate).toHaveBeenCalledWith({
      id: "sender-subject",
      socialModuleChatId: "chat-1",
      data: {
        title: "Roadmap",
      },
      options: {
        headers: {
          Authorization: "Bearer sender-jwt",
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: a command message belongs to a non-default Telegram thread.
   * When: the sender asks to rename it.
   * Then: the agent calls the RBAC thread update flow for the current thread.
   */
  it("handles /thread_rename for the current non-default thread", async () => {
    const service = createService();
    mockedThreadUpdate.mockResolvedValue({
      id: "thread-current",
      title: "New title",
    });

    await service.telegramBotCommandReplyMessageCreate(
      createProps("/thread_rename New title"),
    );

    expect(mockedThreadUpdate).toHaveBeenCalledWith({
      id: "sender-subject",
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-current",
      data: {
        title: "New title",
      },
      options: {
        headers: {
          Authorization: "Bearer sender-jwt",
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: a command message belongs to the default thread.
   * When: the sender asks to rename it from Telegram.
   * Then: the agent replies with usage guidance and does not call update.
   */
  it("does not rename the default thread from Telegram", async () => {
    const service = createService({
      currentThread: {
        id: "thread-default",
        variant: "default",
      },
    });

    await service.telegramBotCommandReplyMessageCreate(
      createProps("/thread_rename New title"),
    );

    expect(mockedThreadUpdate).not.toHaveBeenCalled();
    expect((service as any).telegramBotReplyMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          description: "Run /thread_rename inside a Telegram topic.",
        },
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a command message belongs to a non-default Telegram thread.
   * When: the sender confirms deletion.
   * Then: the agent calls the RBAC thread delete flow for the current thread.
   */
  it("handles /thread_delete confirm for the current non-default thread", async () => {
    const service = createService();
    mockedThreadDelete.mockResolvedValue({
      id: "thread-current",
    });

    await service.telegramBotCommandReplyMessageCreate(
      createProps("/thread_delete confirm"),
    );

    expect(mockedThreadDelete).toHaveBeenCalledWith({
      id: "sender-subject",
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-current",
      options: {
        headers: {
          Authorization: "Bearer sender-jwt",
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: a command message belongs to the default thread.
   * When: the sender confirms deletion.
   * Then: the agent refuses the destructive operation.
   */
  it("does not delete the default thread from Telegram", async () => {
    const service = createService({
      currentThread: {
        id: "thread-default",
        variant: "default",
      },
    });

    await service.telegramBotCommandReplyMessageCreate(
      createProps("/thread_delete confirm"),
    );

    expect(mockedThreadDelete).not.toHaveBeenCalled();
    expect((service as any).telegramBotReplyMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          description:
            "Default thread cannot be deleted from Telegram. Use SPS UI or open a concrete topic.",
        },
      }),
    );
  });
});
