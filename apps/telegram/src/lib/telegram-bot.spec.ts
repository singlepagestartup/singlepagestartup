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
          throw new Error("internal JWT details");
        },
      }),
    ).resolves.toBeUndefined();

    expect(reply).toHaveBeenCalledWith(
      "Не удалось обработать сообщение. Попробуйте отправить его ещё раз.",
      {
        message_thread_id: 42,
      },
    );
    expect(reply).not.toHaveBeenCalledWith(
      expect.stringContaining("JWT"),
      expect.anything(),
    );
    expect(consoleError).toHaveBeenCalledWith(
      "🚀 ~ TelegarmBot ~ message ~ background error:",
      "internal JWT details",
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
