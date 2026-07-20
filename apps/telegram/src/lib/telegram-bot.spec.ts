/// <reference types="jest" />

/**
 * @jest-environment node
 *
 * BDD Suite: Telegram adapter normalization.
 *
 * Given: Telegram returns transport-specific messages and files.
 * When: the adapter prepares them for RBAC ingestion.
 * Then: transport controls and files are normalized without transport-owned AI routing.
 */

const mockBlobifyFiles = jest.fn();
const mockTelegramCommands = jest.fn();
const mockTelegramMessageCreate = jest.fn();
const mockTelegramThreadCreate = jest.fn();
const mockTelegramBootstrap = jest.fn();
const mockTelegramSyncMembership = jest.fn();
const mockTelegramCheckoutFreeSubscription = jest.fn();

jest.mock("@sps/shared-utils", () => {
  return {
    NEXT_PUBLIC_TELEGRAM_SERVICE_URL: "https://telegram.example.com",
    RBAC_JWT_SECRET: "jwt-secret",
    RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 3600,
    RBAC_SECRET_KEY: "rbac-secret",
    TELEGRAM_SERVICE_BOT_TOKEN: "telegram-token",
    TELEGRAM_SERVICE_BOT_USERNAME: "singlepagestartup_bot",
  };
});

jest.mock("@sps/agent/models/agent/sdk/server", () => {
  return {
    api: {
      telegramCommands: (...args: unknown[]) => mockTelegramCommands(...args),
    },
  };
});

jest.mock("@sps/rbac/models/subject/sdk/server", () => {
  return {
    api: {
      socialModuleChatFindByIdThreadCreate: (...args: unknown[]) =>
        mockTelegramThreadCreate(...args),
      socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate: (
        ...args: unknown[]
      ) => mockTelegramMessageCreate(...args),
      telegramBootstrap: (...args: unknown[]) => mockTelegramBootstrap(...args),
      telegramSyncMembership: (...args: unknown[]) =>
        mockTelegramSyncMembership(...args),
      telegramCheckoutFreeSubscription: (...args: unknown[]) =>
        mockTelegramCheckoutFreeSubscription(...args),
    },
  };
});

jest.mock("@sps/backend-utils", () => {
  return {
    blobifyFiles: (...args: unknown[]) => mockBlobifyFiles(...args),
  };
});

import {
  isTelegramBotAuthoredMessage,
  isTelegramMessageAddressedToBot,
  normalizeTelegramTransportControls,
  TelegarmBot,
} from "./telegram-bot";

function createBootstrapResult(shouldCheckoutFreeSubscription: boolean) {
  return {
    rbacModuleSubject: { id: "subject-1" },
    personalAiRbacModuleSubject: { id: "personal-ai-subject-1" },
    socialModuleProfile: { id: "profile-1" },
    personalAiSocialModuleProfile: { id: "personal-ai-profile-1" },
    socialModuleChat: { id: "chat-1" },
    socialModuleThread: { id: "thread-1" },
    shouldCheckoutFreeSubscription,
  };
}

describe("Given: Telegram bootstrap returns a checkout decision", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: ordinary messages stay independent from billing.
   *
   * Given: bootstrap says the existing subject does not need free checkout.
   * When: the transport resolves its subject, profile, chat, and thread.
   * Then: membership is synchronized but checkout is not requested.
   */
  it("When: checkout is not requested Then: skips the billing endpoint", async () => {
    mockTelegramBootstrap.mockResolvedValue(createBootstrapResult(false));
    const bot = Object.create(TelegarmBot.prototype) as any;
    bot.synchronizeRbacModuleRole = jest.fn().mockResolvedValue(undefined);
    bot.checkoutFreeSubscriptionEcommerceModuleProducts = jest
      .fn()
      .mockResolvedValue(undefined);
    const ctx = {
      from: { id: 101 },
      chat: { id: 202 },
      message: { text: "Обычное сообщение" },
    } as any;

    await expect(
      bot.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate({ ctx }),
    ).resolves.toEqual(
      expect.objectContaining({
        rbacModuleSubject: { id: "subject-1" },
        socialModuleThread: { id: "thread-1" },
      }),
    );

    expect(bot.synchronizeRbacModuleRole).toHaveBeenCalledTimes(1);
    expect(
      bot.checkoutFreeSubscriptionEcommerceModuleProducts,
    ).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: registration and start retain provisioning.
   *
   * Given: bootstrap says this registration or /start needs checkout.
   * When: the transport completes bootstrap.
   * Then: it requests free checkout exactly once for that update.
   */
  it("When: checkout is requested Then: calls the billing endpoint once", async () => {
    mockTelegramBootstrap.mockResolvedValue(createBootstrapResult(true));
    const bot = Object.create(TelegarmBot.prototype) as any;
    bot.synchronizeRbacModuleRole = jest.fn().mockResolvedValue(undefined);
    bot.checkoutFreeSubscriptionEcommerceModuleProducts = jest
      .fn()
      .mockResolvedValue(undefined);
    const ctx = {
      from: { id: 101 },
      chat: { id: 202 },
      message: { text: "/start" },
    } as any;

    await bot.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate({
      ctx,
    });

    expect(
      bot.checkoutFreeSubscriptionEcommerceModuleProducts,
    ).toHaveBeenCalledTimes(1);
    expect(
      bot.checkoutFreeSubscriptionEcommerceModuleProducts,
    ).toHaveBeenCalledWith({
      ctx,
      rbacModuleSubject: { id: "subject-1" },
    });
  });

  /**
   * BDD Scenario: adjacent topic and start updates settle independently.
   *
   * Given: a topic-service bootstrap needs no checkout while an adjacent /start does.
   * When: both background tasks run concurrently.
   * Then: neither emits a fallback and only the eligible update reaches checkout.
   */
  it("When: topic creation and start overlap Then: both settle without fallback", async () => {
    mockTelegramBootstrap
      .mockResolvedValueOnce(createBootstrapResult(false))
      .mockResolvedValueOnce(createBootstrapResult(true));
    const bot = Object.create(TelegarmBot.prototype) as any;
    bot.synchronizeRbacModuleRole = jest.fn().mockResolvedValue(undefined);
    bot.checkoutFreeSubscriptionEcommerceModuleProducts = jest
      .fn()
      .mockResolvedValue(undefined);
    const reply = jest.fn().mockResolvedValue(undefined);
    const topicCtx = {
      from: { id: 101, language_code: "ru" },
      chat: { id: 202 },
      message: {
        message_thread_id: 303,
        forum_topic_created: { name: "Новый тред" },
      },
      reply,
    } as any;
    const startCtx = {
      from: { id: 101, language_code: "ru" },
      chat: { id: 202 },
      message: { text: "/start", message_thread_id: 303 },
      reply,
    } as any;

    await Promise.all([
      bot.runIncomingMessageInBackground({
        ctx: topicCtx,
        label: "message:forum_topic_created",
        task: async () => {
          await bot.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate(
            {
              ctx: topicCtx,
              telegram: { messageThreadId: "303", isTopicMessage: true },
            },
          );
        },
      }),
      bot.runIncomingMessageInBackground({
        ctx: startCtx,
        label: "message",
        task: async () => {
          await bot.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate(
            {
              ctx: startCtx,
            },
          );
        },
      }),
    ]);

    expect(reply).not.toHaveBeenCalled();
    expect(
      bot.checkoutFreeSubscriptionEcommerceModuleProducts,
    ).toHaveBeenCalledTimes(1);
  });
});

describe("Given: Telegram bot-authored service messages", () => {
  /**
   * BDD Scenario
   * Given: Telegram emits forum_topic_created after the bot creates a command topic.
   * When: the adapter decides whether the service message belongs to a human sender.
   * Then: it rejects the bot-authored message before RBAC bootstrap can provision a personal AI agent for the bot.
   */
  it("When: the sender is a bot Then: the message is ignored", () => {
    expect(
      isTelegramBotAuthoredMessage({
        from: {
          is_bot: true,
        },
      }),
    ).toBe(true);
    expect(
      isTelegramBotAuthoredMessage({
        from: {
          is_bot: false,
        },
      }),
    ).toBe(false);
  });
});

describe("Given: the Agent Telegram command catalog", () => {
  /**
   * BDD Scenario
   * Given: startup overrides are resolved by the Agent service in apps/api.
   * When: the Telegram transport starts.
   * Then: it publishes that catalog to every global chat scope before installing the webhook.
   */
  it("When: the bot starts Then: it synchronizes Agent commands with Telegram", async () => {
    const commands = [
      {
        command: "learn",
        description: "Запомнить материал",
      },
    ];
    const setMyCommands = jest.fn().mockResolvedValue(true);
    const setWebhook = jest.fn().mockResolvedValue(true);
    mockTelegramCommands.mockResolvedValue(commands);
    const bot = Object.create(TelegarmBot.prototype) as any;
    bot.instance = {
      api: {
        setMyCommands,
        setWebhook,
      },
    };

    await expect(bot.run()).resolves.toBe(true);

    expect(mockTelegramCommands).toHaveBeenCalledWith({
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
          "Cache-Control": "no-store",
        },
      },
    });
    expect(setMyCommands).toHaveBeenNthCalledWith(1, commands);
    expect(setMyCommands).toHaveBeenNthCalledWith(2, commands, {
      scope: {
        type: "all_private_chats",
      },
    });
    expect(setMyCommands).toHaveBeenNthCalledWith(3, commands, {
      scope: {
        type: "all_group_chats",
      },
    });
    expect(setMyCommands).toHaveBeenNthCalledWith(4, commands, {
      scope: {
        type: "all_chat_administrators",
      },
    });
    expect(setWebhook).toHaveBeenCalledWith(
      "https://telegram.example.com/api/telegram",
      {
        allowed_updates: [],
      },
    );
    expect(setMyCommands.mock.invocationCallOrder[0]).toBeLessThan(
      setWebhook.mock.invocationCallOrder[0],
    );
    expect(bot.telegramPublishedCommands).toEqual(commands);
  });
});

describe("Given: Telegram transport controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: a private Telegram message starts with the native learn command.
   * When: the adapter normalizes the message for RBAC ingestion.
   * Then: it preserves the domain command without adding Knowledge semantics.
   */
  it("When: /learn is normalized Then: it stays /learn", () => {
    expect(
      normalizeTelegramTransportControls({
        botUsername: "singlepagestartup_bot",
        description: "/learn Новый факт о проекте",
      }),
    ).toBe("/learn Новый факт о проекте");
  });

  /**
   * BDD Scenario
   * Given: a Telegram message already uses the canonical web-chat controls.
   * When: the adapter normalizes the message for RBAC ingestion.
   * Then: it preserves the controls without adding a duplicate mention.
   */
  it("When: canonical controls are normalized Then: they stay unchanged", () => {
    expect(
      normalizeTelegramTransportControls({
        botUsername: "singlepagestartup_bot",
        description: "@knowledge /learn Новый факт о проекте",
      }),
    ).toBe("@knowledge /learn Новый факт о проекте");
  });

  /**
   * BDD Scenario
   * Given: a group Telegram message addresses the bot before /learn.
   * When: the adapter normalizes the message for RBAC ingestion.
   * Then: it removes the transport mention and preserves the domain command.
   */
  it("When: @bot /learn is normalized Then: it becomes /learn", () => {
    expect(
      normalizeTelegramTransportControls({
        botUsername: "singlepagestartup_bot",
        description: "@singlepagestartup_bot /learn Новый факт",
      }),
    ).toBe("/learn Новый факт");
  });

  /**
   * BDD Scenario
   * Given: Telegram addresses the bot with its standard command suffix.
   * When: the adapter normalizes the message for RBAC ingestion.
   * Then: it strips the bot suffix from any command.
   */
  it("When: /learn@bot is normalized Then: it becomes /learn", () => {
    expect(
      normalizeTelegramTransportControls({
        botUsername: "singlepagestartup_bot",
        description: "/learn@singlepagestartup_bot Новый факт",
      }),
    ).toBe("/learn Новый факт");
  });

  /**
   * BDD Scenario
   * Given: a group Telegram message explicitly requests Knowledge search.
   * When: the adapter removes the bot-addressing mention.
   * Then: it preserves the canonical @knowledge request.
   */
  it("When: @bot @knowledge is normalized Then: it preserves Knowledge search", () => {
    expect(
      normalizeTelegramTransportControls({
        botUsername: "singlepagestartup_bot",
        description: "@singlepagestartup_bot @knowledge Что известно?",
      }),
    ).toBe("@knowledge Что известно?");
  });

  /**
   * BDD Scenario
   * Given: Telegram group messages may use a mention or a command suffix.
   * When: the adapter decides whether the bot is addressed.
   * Then: both supported transport forms are accepted and unrelated text is ignored.
   */
  it("When: group addressing is checked Then: only bot-addressed forms pass", () => {
    expect(
      isTelegramMessageAddressedToBot({
        botUsername: "singlepagestartup_bot",
        description: "@singlepagestartup_bot @knowledge Что известно?",
      }),
    ).toBe(true);
    expect(
      isTelegramMessageAddressedToBot({
        botUsername: "singlepagestartup_bot",
        description: "/thread_new@singlepagestartup_bot Новый тред",
      }),
    ).toBe(true);
    expect(
      isTelegramMessageAddressedToBot({
        botUsername: "singlepagestartup_bot",
        description: "Продолжение сообщения",
        isReplyToBot: true,
      }),
    ).toBe(true);
    expect(
      isTelegramMessageAddressedToBot({
        botUsername: "singlepagestartup_bot",
        description: "@knowledge Что известно?",
      }),
    ).toBe(false);
  });

  /**
   * BDD Scenario
   * Given: a published command is sent from the main flow without a Telegram topic.
   * When: Telegram ingests the command.
   * Then: the adapter creates a topic-backed Social thread and persists the command there.
   */
  it.each(["/start", "/assistant", "/help", "/learn Новый факт"])(
    "When: %s is received in the main flow Then: it starts a topic",
    async (command) => {
      mockTelegramMessageCreate.mockResolvedValue({ id: "message-id" });
      mockTelegramThreadCreate.mockResolvedValue({
        id: "command-thread-id",
        sourceSystemId: "42",
      });
      const bot = Object.create(TelegarmBot.prototype) as any;
      const commandName = command.split(/\s+/)[0].slice(1);
      bot.telegramPublishedCommands = [
        {
          command: commandName,
          description: `Тред команды ${commandName}`,
        },
      ];
      bot.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate = jest
        .fn()
        .mockResolvedValue({
          rbacModuleSubject: { id: "subject-id" },
          socialModuleProfile: { id: "profile-id" },
          socialModuleChat: { id: "chat-id" },
          socialModuleThread: { id: "default-thread-id" },
        });
      bot.signSubjectJwt = jest.fn().mockResolvedValue("jwt-token");
      bot.shouldHandleIncomingMessageInChat = jest.fn().mockReturnValue(true);

      await bot.handleIncomingMessage({
        ctx: {
          chat: { id: 1 },
          from: { id: 2 },
          message: { text: command },
        },
        data: {
          description: command,
          sourceSystemId: "telegram-message-id",
        },
      });

      expect(mockTelegramThreadCreate).toHaveBeenCalledWith({
        id: "subject-id",
        socialModuleChatId: "chat-id",
        data: {
          title: `Тред команды ${commandName}`,
        },
        options: {
          headers: {
            Authorization: "Bearer jwt-token",
          },
        },
      });
      expect(mockTelegramMessageCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: command,
          }),
          socialModuleChatId: "chat-id",
          socialModuleProfileId: "profile-id",
          socialModuleThreadId: "command-thread-id",
        }),
      );
    },
  );

  /**
   * BDD Scenario
   * Given: a command is sent inside an existing Telegram topic.
   * When: Telegram ingests the command with message_thread_id.
   * Then: no new topic is created and the command remains in the current Social thread.
   */
  it("When: a command is received in a topic Then: it stays in that topic", async () => {
    mockTelegramMessageCreate.mockResolvedValue({ id: "message-id" });
    const bot = Object.create(TelegarmBot.prototype) as any;
    bot.telegramPublishedCommands = [
      {
        command: "assistant",
        description: "Управлять AI-ассистентом",
      },
    ];
    bot.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate = jest
      .fn()
      .mockResolvedValue({
        rbacModuleSubject: { id: "subject-id" },
        socialModuleProfile: { id: "profile-id" },
        socialModuleChat: { id: "chat-id" },
        socialModuleThread: { id: "existing-topic-thread" },
      });
    bot.signSubjectJwt = jest.fn().mockResolvedValue("jwt-token");
    bot.shouldHandleIncomingMessageInChat = jest.fn().mockReturnValue(true);

    await bot.handleIncomingMessage({
      ctx: {
        chat: { id: 1 },
        from: { id: 2 },
        message: {
          message_thread_id: 42,
          text: "/assistant",
        },
      },
      data: {
        description: "/assistant",
        sourceSystemId: "telegram-message-id",
      },
    });

    expect(mockTelegramThreadCreate).not.toHaveBeenCalled();
    expect(mockTelegramMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        socialModuleThreadId: "existing-topic-thread",
      }),
    );
  });
});

describe("Given: background processing of an incoming Telegram message", () => {
  /**
   * BDD Scenario
   * Given: an incoming message is processed outside the webhook response.
   * When: the background task fails before the message is persisted.
   * Then: the user receives a safe localized error in the original Telegram thread.
   */
  it("When: processing fails Then: the user is notified in the same thread", async () => {
    const reply = jest.fn().mockResolvedValue(null);
    const bot = Object.create(TelegarmBot.prototype) as any;
    const ctx = {
      from: {
        language_code: "ru",
      },
      message: {
        message_thread_id: 42,
      },
      reply,
    } as any;
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(
      bot.runIncomingMessageInBackground({
        ctx,
        label: "message",
        task: async () => {
          throw Object.assign(
            new Error(
              JSON.stringify({
                requestId: "request-telegram-123",
                status: 500,
                message: "internal JWT details",
              }),
            ),
            { status: 500 },
          );
        },
      }),
    ).resolves.toBeUndefined();

    expect(reply).toHaveBeenCalledWith(
      "Не удалось обработать сообщение. Попробуйте отправить его ещё раз. Код ошибки: request-telegram-123.",
      {
        message_thread_id: 42,
      },
    );
    expect(reply).not.toHaveBeenCalledWith(
      expect.stringContaining("JWT"),
      expect.anything(),
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Telegram background task failed",
      {
        errorId: "request-telegram-123",
        errorType: "Error",
        label: "message",
        status: 500,
      },
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "internal JWT details",
    );

    consoleError.mockRestore();
  });

  /**
   * BDD Scenario
   * Given: a local transport failure has no downstream requestId.
   * When: background processing reports the failure.
   * Then: Telegram creates a safe local correlation id and does not log the raw error.
   */
  it("When: requestId is absent Then: creates a safe local reference", async () => {
    const reply = jest.fn().mockResolvedValue(null);
    const bot = Object.create(TelegarmBot.prototype) as any;
    const ctx = {
      from: {
        language_code: "en",
      },
      message: {},
      reply,
    } as any;
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await bot.runIncomingMessageInBackground({
      ctx,
      label: "message:local",
      task: async () => {
        throw new Error("secret local payload");
      },
    });

    expect(reply).toHaveBeenCalledWith(
      expect.stringMatching(
        /^We couldn't process your message\. Please try sending it again\. Reference: [0-9a-f-]{36}\.$/,
      ),
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "secret local payload",
    );

    consoleError.mockRestore();
  });
});

describe("Given: a Telegram /learn message split into transport chunks", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createContext(props: {
    messageId: number;
    text: string;
    senderId?: number;
    threadId?: number;
  }) {
    return {
      chat: { id: -100 },
      from: { id: props.senderId || 10 },
      message: {
        message_id: props.messageId,
        message_thread_id: props.threadId || 20,
        text: props.text,
      },
    } as any;
  }

  /**
   * BDD Scenario
   * Given: Telegram splits one long /learn payload into adjacent messages.
   * When: both chunks arrive from the same sender in the same chat thread.
   * Then: the adapter persists one ordered message after the debounce window.
   */
  it("When: continuation chunks arrive Then: they are persisted together", async () => {
    const bot = Object.create(TelegarmBot.prototype) as any;
    const first = createContext({ messageId: 1, text: "/learn Первая часть" });
    const second = createContext({ messageId: 2, text: "Вторая часть" });

    bot.learnCommandBuffer = new Map();
    bot.persistTelegramLearnCommandMessages = jest.fn().mockResolvedValue(null);

    expect(bot.bufferTelegramLearnCommandMessage({ ctx: first })).toBe(true);
    expect(bot.bufferTelegramLearnCommandMessage({ ctx: second })).toBe(true);

    await jest.advanceTimersByTimeAsync(1_500);

    expect(bot.persistTelegramLearnCommandMessages).toHaveBeenCalledTimes(1);
    expect(bot.persistTelegramLearnCommandMessages).toHaveBeenCalledWith({
      messages: [first, second],
    });
  });

  /**
   * BDD Scenario
   * Given: buffered Telegram messages form one /learn request.
   * When: their SPS message payload is built.
   * Then: all text is joined and every Telegram source message id is retained.
   */
  it("When: buffered data is built Then: text and source ids stay ordered", async () => {
    const bot = Object.create(TelegarmBot.prototype) as any;

    const result = await bot.buildTelegramMessageDataFromMessages({
      ctx: createContext({ messageId: 1, text: "/learn Первая часть" }),
      messages: [
        createContext({ messageId: 1, text: "/learn Первая часть" }),
        createContext({ messageId: 2, text: "Вторая часть" }),
      ],
    });

    expect(result).toEqual({
      description: "/learn Первая часть\nВторая часть",
      sourceSystemId: "1",
      metadata: {
        telegram: {
          sourceMessageIds: [1, 2],
        },
      },
    });
  });
});

describe("Given: Telegram file normalization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: Telegram returns a voice note as Ogg audio.
   * When: the adapter prepares files for RBAC message create.
   * Then: it converts the audio file to MP3 before file-storage receives it.
   */
  it("When: Telegram audio is downloaded Then: it returns an MP3 file", async () => {
    const sourceFile = new File(["ogg"], "voice.oga", {
      type: "audio/ogg",
    });
    const mp3File = new File(["mp3"], "voice.mp3", {
      type: "audio/mpeg",
    });
    mockBlobifyFiles.mockResolvedValue([sourceFile]);
    const bot = Object.create(TelegarmBot.prototype) as any;
    bot.convertTelegramAudioFileToMp3 = jest.fn().mockResolvedValue(mp3File);

    const files = await bot.buildTelegramFiles({
      attachments: [
        {
          fileId: "telegram-file-id",
          mimeType: "audio/ogg",
          title: "telegram-voice-file",
        },
      ],
      ctx: {
        api: {
          getFile: jest.fn().mockResolvedValue({
            file_path: "voice/file.oga",
          }),
        },
      },
    });

    expect(mockBlobifyFiles).toHaveBeenCalledWith({
      files: [
        expect.objectContaining({
          extension: "oga",
          title: "telegram-voice-file",
          type: "audio/ogg",
        }),
      ],
    });
    expect(bot.convertTelegramAudioFileToMp3).toHaveBeenCalledWith({
      file: sourceFile,
      title: "telegram-voice-file",
    });
    expect(files).toEqual([mp3File]);
  });

  /**
   * BDD Scenario
   * Given: Telegram returns a non-audio attachment.
   * When: the adapter prepares files for RBAC message create.
   * Then: it keeps the original file without MP3 conversion.
   */
  it("When: Telegram image is downloaded Then: it keeps the original file", async () => {
    const sourceFile = new File(["image"], "photo.jpg", {
      type: "image/jpeg",
    });
    mockBlobifyFiles.mockResolvedValue([sourceFile]);
    const bot = Object.create(TelegarmBot.prototype) as any;
    bot.convertTelegramAudioFileToMp3 = jest.fn();

    const files = await bot.buildTelegramFiles({
      attachments: [
        {
          fileId: "telegram-file-id",
          mimeType: "image/jpeg",
          title: "telegram-photo",
        },
      ],
      ctx: {
        api: {
          getFile: jest.fn().mockResolvedValue({
            file_path: "photo/file.jpg",
          }),
        },
      },
    });

    expect(bot.convertTelegramAudioFileToMp3).not.toHaveBeenCalled();
    expect(files).toEqual([sourceFile]);
  });
});
