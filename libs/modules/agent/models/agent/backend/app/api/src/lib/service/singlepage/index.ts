import "reflect-metadata";
import { inject, injectable } from "inversify";
import {
  TELEGRAM_SERVICE_BOT_USERNAME,
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
  TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME,
  TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK,
  TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID,
  telegramBotServiceMessages,
} from "@sps/shared-utils";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/agent/models/agent/backend/repository/database";
import { Repository } from "../../repository";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import {
  IModel as ISocialModuleThread,
  selectPrimaryLinkedThread,
} from "@sps/social/models/thread/sdk/model";
import { IModel as ISocialModuleAction } from "@sps/social/models/action/sdk/model";
import { IModel as IRbacModuleSubject } from "@sps/rbac/models/subject/sdk/model";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleThreadApi } from "@sps/social/models/thread/sdk/server";
import { api as socialModuleChatsToThreadsApi } from "@sps/social/relations/chats-to-threads/sdk/server";
import { api as socialModuleThreadsToMessagesApi } from "@sps/social/relations/threads-to-messages/sdk/server";
import { IModel as IEcommerceModuleProductsToFileStorageFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/model";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { api as notificationNotificationApi } from "@sps/notification/models/notification/sdk/server";
import * as jwt from "hono/jwt";
import { blobifyFiles, logger } from "@sps/backend-utils";
import {
  AgentDI,
  type IBillingModule,
  type IBroadcastModule,
  type IEcommerceModule,
  type IFileStorageModule,
  type IHostModule,
  type INotificationModule,
  type IRbacModule,
  type ISocialModule,
} from "../../di";
import {
  type ITelegramRequiredSubscriptionChannelConfiguration,
  resolveTelegramRequiredSubscriptionChannelConfiguration,
} from "./telegram-required-subscription-channel";

const activeSubscriptionProductsCheckoutMessage =
  "Checking out order has active subscription products.";
const openRouterTerminalMessageWrittenMarker =
  "open-router-terminal-message-written";

interface ISocialModuleTelegramMessageData {
  description: string;
  interaction?:
    | {
        inline_keyboard: {
          text: string;
          url?: string;
          callback_data?: string;
          copy_text?: {
            text: string;
          };
        }[][];
      }
    | {
        keyboard: {
          text: string;
          url?: string;
          callback_data?: string;
        }[][];
      };
  files?: File[];
}

export type ITelegramBotReplyContext = {
  jwtToken: string;
  rbacModuleSubject: IRbacModuleSubject;
  shouldReplySocialModuleProfile: ISocialModuleProfile;
  socialModuleChat: ISocialModuleChat;
  socialModuleThreadId?: string;
  messageFromSocialModuleProfile: ISocialModuleProfile | null;
} & (
  | {
      socialModuleMessage: ISocialModuleMessage;
    }
  | {
      socialModuleAction: ISocialModuleAction;
    }
);

export type TTelegramCommandTarget = "telegram-bot" | "artificial-intelligence";

export type ITelegramCommandMessageContext = ITelegramBotReplyContext & {
  socialModuleMessage: ISocialModuleMessage;
  command: string;
  args: string;
};

export type ITelegramCommandCallbackContext = ITelegramBotReplyContext & {
  socialModuleAction: ISocialModuleAction;
  command: string;
};

export interface ITelegramCommandDefinition {
  command: string;
  description: string;
  target: TTelegramCommandTarget;
  handleMessage?: (props: ITelegramCommandMessageContext) => Promise<unknown>;
  handleCallbackQuery?: (
    props: ITelegramCommandCallbackContext,
  ) => Promise<unknown>;
  enabled?: boolean;
}

export type ITelegramCommandDefinitionOverride = Pick<
  ITelegramCommandDefinition,
  "command"
> &
  Partial<Omit<ITelegramCommandDefinition, "command">>;

export interface ITelegramPublishedCommand {
  command: string;
  description: string;
}

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  socialModule: ISocialModule;
  rbacModule: IRbacModule;
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
  broadcastModule: IBroadcastModule;
  hostModule: IHostModule;
  notificationModule: INotificationModule;
  fileStorageModule: IFileStorageModule;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(AgentDI.ISocialModule) socialModule: ISocialModule,
    @inject(AgentDI.IRbacModule) rbacModule: IRbacModule,
    @inject(AgentDI.IEcommerceModule) ecommerceModule: IEcommerceModule,
    @inject(AgentDI.IBillingModule) billingModule: IBillingModule,
    @inject(AgentDI.IBroadcastModule) broadcastModule: IBroadcastModule,
    @inject(AgentDI.IHostModule) hostModule: IHostModule,
    @inject(AgentDI.INotificationModule)
    notificationModule: INotificationModule,
    @inject(AgentDI.IFileStorageModule) fileStorageModule: IFileStorageModule,
  ) {
    super(repository);
    this.socialModule = socialModule;
    this.rbacModule = rbacModule;
    this.ecommerceModule = ecommerceModule;
    this.billingModule = billingModule;
    this.broadcastModule = broadcastModule;
    this.hostModule = hostModule;
    this.notificationModule = notificationModule;
    this.fileStorageModule = fileStorageModule;
  }

  statusMessages = telegramBotServiceMessages;

  protected getTelegramRequiredSubscriptionChannelConfiguration(): ITelegramRequiredSubscriptionChannelConfiguration {
    return resolveTelegramRequiredSubscriptionChannelConfiguration({
      id: TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID,
      name: TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME,
      link: TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK,
    });
  }

  protected getTelegramCommandDefinitions(): ITelegramCommandDefinition[] {
    return [
      {
        command: "/start",
        description: "Начать работу с ботом",
        target: "telegram-bot",
        handleMessage: async (props) => {
          await this.telegramBotWelcomeMessageCreate(props);
          await new Promise((resolve) => {
            setTimeout(resolve, 4_000);
          });
          return this.telegramBotWelcomeMessageWithKeyboardCreate(props);
        },
      },
      {
        command: "/help",
        description: "Показать справку",
        target: "telegram-bot",
        handleMessage: (props) =>
          this.telegramBotHelpMessageWithKeyboardCreate(props),
        handleCallbackQuery: (props) =>
          this.telegramBotHelpMessageWithKeyboardCreate(props),
      },
      {
        command: "/referral",
        description: "Открыть реферальную программу",
        target: "telegram-bot",
        handleMessage: (props) =>
          this.telegramBotReferralMessageWithKeyboardCreate(props),
        handleCallbackQuery: (props) =>
          this.telegramBotReferralMessageWithKeyboardCreate(props),
      },
      {
        command: "/premium",
        description: "Открыть Premium",
        target: "telegram-bot",
        handleMessage: (props) =>
          this.telegramBotPremiumMessageWithKeyboardCreate(props),
        handleCallbackQuery: (props) =>
          this.telegramBotPremiumMessageWithKeyboardCreate(props),
      },
      {
        command: "/new",
        description: "Начать новый контекст диалога",
        target: "telegram-bot",
        handleMessage: (props) =>
          this.telegramBotReplyMessageCreate({
            ...props,
            data: {
              description: this.statusMessages.openRouterContextResetByNew.ru,
            },
          }),
      },
      ...["/threads", "/thread_new", "/thread_rename", "/thread_delete"].map(
        (command): ITelegramCommandDefinition => {
          const descriptions: Record<string, string> = {
            "/threads": "Показать треды",
            "/thread_new": "Создать тред",
            "/thread_rename": "Переименовать текущий тред",
            "/thread_delete": "Удалить текущий тред",
          };

          return {
            command,
            description: descriptions[command],
            target: "telegram-bot",
            handleMessage: (props) =>
              this.telegramBotThreadCommandReplyMessageCreate(props),
          };
        },
      ),
      {
        command: "/knowledge",
        description: "Использовать знания профиля",
        target: "artificial-intelligence",
      },
      {
        command: "/learn",
        description: "Добавить сообщение в знания профиля",
        target: "artificial-intelligence",
      },
    ];
  }

  protected mergeTelegramCommandDefinitions(props: {
    base: ITelegramCommandDefinition[];
    overrides: ITelegramCommandDefinitionOverride[];
  }) {
    const definitions = new Map<string, ITelegramCommandDefinition>();

    for (const definition of props.base) {
      definitions.set(definition.command.toLowerCase(), definition);
    }

    for (const override of props.overrides) {
      const key = override.command.toLowerCase();
      const definition = definitions.get(key);

      if (!definition && (!override.description || !override.target)) {
        throw new Error(
          `Configuration error. New Telegram command ${override.command} requires description and target`,
        );
      }

      definitions.set(key, {
        ...definition,
        ...override,
      } as ITelegramCommandDefinition);
    }

    return [...definitions.values()].filter(
      (definition) => definition.enabled !== false,
    );
  }

  telegramPublishedCommandsFind(): ITelegramPublishedCommand[] {
    return this.getTelegramCommandDefinitions().map((definition) => {
      const command = definition.command.replace(/^\//, "").trim();
      const description = definition.description.trim();

      if (!/^[a-z0-9_]{1,32}$/.test(command)) {
        throw new Error(
          `Configuration error. Invalid Telegram command: ${definition.command}`,
        );
      }

      if (!description || description.length > 256) {
        throw new Error(
          `Configuration error. Invalid Telegram command description: ${definition.command}`,
        );
      }

      return {
        command,
        description,
      };
    });
  }

  protected findTelegramCommandDefinition(props: {
    description?: string | null;
  }) {
    const parsedCommand = this.parseTelegramBotCommand(props);

    if (!parsedCommand) {
      return;
    }

    const definition = this.getTelegramCommandDefinitions().find(
      (item) =>
        item.command.toLowerCase() === parsedCommand.command.toLowerCase(),
    );

    if (!definition || definition.enabled === false) {
      return;
    }

    return {
      definition,
      parsedCommand,
    };
  }

  protected collectErrorMessages(error: unknown): string[] {
    const messages = new Set<string>();
    const seen = new WeakSet<object>();

    const visit = (value: unknown) => {
      if (!value) {
        return;
      }

      if (typeof value === "string") {
        messages.add(value);

        try {
          visit(JSON.parse(value));
        } catch {
          //
        }

        return;
      }

      if (value instanceof Error) {
        visit(value.message);
        visit((value as { cause?: unknown }).cause);
        return;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          visit(item);
        }

        return;
      }

      if (typeof value === "object") {
        if (seen.has(value)) {
          return;
        }

        seen.add(value);

        const payload = value as {
          message?: unknown;
          error?: unknown;
          data?: unknown;
          cause?: unknown;
        };

        visit(payload.message);
        visit(payload.error);
        visit(payload.data);
        visit(payload.cause);
      }
    };

    visit(error);

    return Array.from(messages);
  }

  protected isActiveSubscriptionProductsCheckoutError(error: unknown) {
    return this.collectErrorMessages(error).some((message) => {
      return message.includes(activeSubscriptionProductsCheckoutMessage);
    });
  }

  protected activeSubscriptionProductsCheckoutTelegramMessage() {
    return (
      this.statusMessages.ecommerceModuleOrderAlreadyHaveSubscription?.ru ||
      "У вас уже есть активная подписка."
    );
  }

  protected isRecoverableOpenRouterReplyError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    return [
      "OpenRouter request failed",
      "OpenRouter file fetch failed",
      "No valid model response received",
      "certificate",
      "fetch failed",
      "network",
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
    ].some((marker) => {
      return message.toLowerCase().includes(marker.toLowerCase());
    });
  }

  protected isOpenRouterTerminalMessageWrittenError(error: unknown) {
    return this.collectErrorMessages(error).some((message) => {
      return message.includes(openRouterTerminalMessageWrittenMarker);
    });
  }

  async agentSocialModuleProfileHandler(
    props:
      | {
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleMessage: ISocialModuleMessage;
          socialModuleThreadId?: string;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        }
      | {
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleAction: ISocialModuleAction;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new Error(
        "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS not set",
      );
    }

    const rbacModuleSubjectsToSocialModuleProfiles =
      await this.rbacModule.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              {
                column: "socialModuleProfileId",
                method: "eq",
                value: props.shouldReplySocialModuleProfile.id,
              },
            ],
          },
        },
      });

    if (!rbacModuleSubjectsToSocialModuleProfiles?.length) {
      logger.warn(
        "agentSocialModuleProfileHandler: missing RBAC subject relation for automatic social profile",
        {
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleProfileSlug: props.shouldReplySocialModuleProfile.slug,
          socialModuleChatId: props.socialModuleChat.id,
        },
      );

      return;
    }

    const rbacModuleSubject = await this.rbacModule.subject.findById({
      id: rbacModuleSubjectsToSocialModuleProfiles[0].subjectId,
    });

    if (!rbacModuleSubject) {
      return;
    }

    const jwtToken = await jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
        iat: Math.floor(Date.now() / 1000),
        subject: rbacModuleSubject,
      },
      RBAC_JWT_SECRET,
    );

    const telegramCommand =
      "socialModuleMessage" in props
        ? this.findTelegramCommandDefinition({
            description: props.socialModuleMessage.description,
          })
        : undefined;

    if (props.shouldReplySocialModuleProfile.slug === "telegram-bot") {
      if ("socialModuleMessage" in props) {
        if (telegramCommand?.definition.target === "telegram-bot") {
          await this.telegramBotCommandReplyMessageCreate({
            jwtToken,
            rbacModuleSubject,
            shouldReplySocialModuleProfile:
              props.shouldReplySocialModuleProfile,
            socialModuleChat: props.socialModuleChat,
            socialModuleMessage: props.socialModuleMessage,
            socialModuleThreadId: props.socialModuleThreadId,
            messageFromSocialModuleProfile:
              props.messageFromSocialModuleProfile,
          });
        }
      } else if ("socialModuleAction" in props) {
        if (props.socialModuleAction.payload?.telegram?.callback_query) {
          await this.telegramBotCallbackQueryHandler({
            jwtToken,
            rbacModuleSubject,
            shouldReplySocialModuleProfile:
              props.shouldReplySocialModuleProfile,
            socialModuleChat: props.socialModuleChat,
            socialModuleAction: props.socialModuleAction,
            messageFromSocialModuleProfile:
              props.messageFromSocialModuleProfile,
          });
        }
      }
    } else if (
      props.shouldReplySocialModuleProfile.variant === "artificial-intelligence"
    ) {
      if ("socialModuleMessage" in props) {
        if (telegramCommand?.definition.target === "telegram-bot") {
          return;
        }

        if (!props.socialModuleMessage.description?.trim()) {
          return;
        }

        await this.openRouterReplyMessageCreate({
          jwtToken,
          rbacModuleSubject,
          shouldReplySocialModuleProfile: props.shouldReplySocialModuleProfile,
          socialModuleChat: props.socialModuleChat,
          socialModuleMessage: props.socialModuleMessage,
          socialModuleThreadId: props.socialModuleThreadId,
          messageFromSocialModuleProfile: props.messageFromSocialModuleProfile,
        });
      }
    }
  }

  async telegramBotCommandReplyMessageCreate(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
    socialModuleThreadId?: string;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    const telegramCommand = this.findTelegramCommandDefinition({
      description: props.socialModuleMessage.description,
    });

    if (
      telegramCommand?.definition.target === "telegram-bot" &&
      telegramCommand.definition.handleMessage
    ) {
      return telegramCommand.definition.handleMessage({
        ...props,
        command: telegramCommand.parsedCommand.command,
        args: telegramCommand.parsedCommand.args,
      });
    }

    return this.telegramBotReplyMessageCreate({
      ...props,
      data: {
        description: `Caught command ${props.socialModuleMessage.description}`,
        interaction: {
          inline_keyboard: [
            [
              {
                text: "Button 1",
                callback_data: "button_1",
              },
              {
                text: "Button 2",
                callback_data: "button_2",
              },
            ],
          ],
        },
      },
    });
  }

  protected parseTelegramBotCommand(props: { description?: string | null }) {
    const description = props.description?.trim();

    if (!description?.startsWith("/")) {
      return;
    }

    const rawCommand = description.split(/\s+/)[0] || "";
    const command = rawCommand.split("@")[0];
    const args = description.slice(rawCommand.length).trim();

    if (!command) {
      return;
    }

    return {
      command,
      args,
    };
  }

  protected async signRbacModuleSubjectJwt(props: {
    rbacModuleSubject: IRbacModuleSubject;
  }) {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new Error(
        "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS not set",
      );
    }

    return jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
        iat: Math.floor(Date.now() / 1000),
        subject: props.rbacModuleSubject,
      },
      RBAC_JWT_SECRET,
    );
  }

  protected async getTelegramThreadCommandSubjectContext(
    props: ITelegramBotReplyContext & {
      socialModuleMessage: ISocialModuleMessage;
    },
  ) {
    const messageFromRbacModuleSubject =
      await this.getMessageFromRbacModuleSubject(props);
    const messageFromRbacModuleSubjectJwt = await this.signRbacModuleSubjectJwt(
      {
        rbacModuleSubject: messageFromRbacModuleSubject,
      },
    );

    return {
      rbacModuleSubject: messageFromRbacModuleSubject,
      jwtToken: messageFromRbacModuleSubjectJwt,
    };
  }

  protected formatTelegramThreadTitle(props: {
    thread: { title?: string | null; variant?: string | null };
    index: number;
  }) {
    const title = props.thread.title?.trim();

    if (title) {
      return title;
    }

    if (props.thread.variant === "default") {
      return "Default thread";
    }

    return `Thread ${props.index + 1}`;
  }

  protected async getCurrentTelegramCommandThread(props: {
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
    socialModuleThreadId?: string;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    const socialModuleThreadId = await this.resolveThreadIdForMessageInChat({
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleMessageId: props.socialModuleMessage.id,
      requestedSocialModuleThreadId: props.socialModuleThreadId,
      secretKey: RBAC_SECRET_KEY,
    });

    const socialModuleThread = await this.socialModule.thread.findById({
      id: socialModuleThreadId,
    });

    if (!socialModuleThread) {
      throw new Error("Not found error. Social module thread not found");
    }

    return socialModuleThread;
  }

  protected async telegramBotThreadCommandReplyMessageCreate(
    props: ITelegramBotReplyContext & {
      socialModuleMessage: ISocialModuleMessage;
      command: string;
      args: string;
    },
  ) {
    try {
      switch (props.command) {
        case "/threads":
          return this.telegramBotThreadsMessageCreate(props);
        case "/thread_new":
          return this.telegramBotThreadCreateMessageCreate(props);
        case "/thread_rename":
          return this.telegramBotThreadRenameMessageCreate(props);
        case "/thread_delete":
          return this.telegramBotThreadDeleteMessageCreate(props);
      }

      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description: `Unsupported thread command: ${props.command}`,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error || "Unknown");

      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description: `Error: ${message}`,
        },
      });
    }
  }

  protected async telegramBotThreadsMessageCreate(
    props: ITelegramBotReplyContext & {
      socialModuleMessage: ISocialModuleMessage;
    },
  ) {
    const commandSubject =
      await this.getTelegramThreadCommandSubjectContext(props);
    const threads =
      await rbacModuleSubjectApi.socialModuleChatFindByIdThreadFind({
        id: commandSubject.rbacModuleSubject.id,
        socialModuleChatId: props.socialModuleChat.id,
        options: {
          headers: {
            Authorization: "Bearer " + commandSubject.jwtToken,
          },
        },
      });
    const lines = threads.length
      ? threads.map((thread, index) => {
          const title = this.formatTelegramThreadTitle({ thread, index });
          return `${index + 1}. ${title}${thread.sourceSystemId ? ` (${thread.sourceSystemId})` : ""}`;
        })
      : ["No threads found."];

    return this.telegramBotReplyMessageCreate({
      ...props,
      data: {
        description: lines.join("\n"),
      },
    });
  }

  protected async telegramBotThreadCreateMessageCreate(
    props: ITelegramBotReplyContext & {
      socialModuleMessage: ISocialModuleMessage;
      args: string;
    },
  ) {
    const title = props.args.trim();

    if (!title) {
      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description: "Usage: /thread_new Thread title",
        },
      });
    }

    const commandSubject =
      await this.getTelegramThreadCommandSubjectContext(props);
    const socialModuleThread =
      await rbacModuleSubjectApi.socialModuleChatFindByIdThreadCreate({
        id: commandSubject.rbacModuleSubject.id,
        socialModuleChatId: props.socialModuleChat.id,
        data: {
          title,
        },
        options: {
          headers: {
            Authorization: "Bearer " + commandSubject.jwtToken,
          },
        },
      });

    return this.telegramBotReplyMessageCreate({
      ...props,
      data: {
        description: `Thread created: ${socialModuleThread.title || title}`,
      },
    });
  }

  protected async telegramBotThreadRenameMessageCreate(
    props: ITelegramBotReplyContext & {
      socialModuleMessage: ISocialModuleMessage;
      args: string;
    },
  ) {
    const title = props.args.trim();

    if (!title) {
      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description: "Usage: /thread_rename New thread title",
        },
      });
    }

    const socialModuleThread = await this.getCurrentTelegramCommandThread({
      socialModuleChat: props.socialModuleChat,
      socialModuleMessage: props.socialModuleMessage,
      socialModuleThreadId: props.socialModuleThreadId,
    });

    if (socialModuleThread.variant === "default") {
      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description: "Run /thread_rename inside a Telegram topic.",
        },
      });
    }

    const commandSubject =
      await this.getTelegramThreadCommandSubjectContext(props);
    const updatedSocialModuleThread =
      await rbacModuleSubjectApi.socialModuleChatFindByIdThreadUpdate({
        id: commandSubject.rbacModuleSubject.id,
        socialModuleChatId: props.socialModuleChat.id,
        socialModuleThreadId: socialModuleThread.id,
        data: {
          title,
        },
        options: {
          headers: {
            Authorization: "Bearer " + commandSubject.jwtToken,
          },
        },
      });

    return this.telegramBotReplyMessageCreate({
      ...props,
      data: {
        description: `Thread renamed: ${
          updatedSocialModuleThread.title || title
        }`,
      },
    });
  }

  protected async telegramBotThreadDeleteMessageCreate(
    props: ITelegramBotReplyContext & {
      socialModuleMessage: ISocialModuleMessage;
      args: string;
    },
  ) {
    const confirmation = props.args.trim().toLowerCase();

    if (confirmation !== "confirm") {
      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description: "Usage: /thread_delete confirm",
        },
      });
    }

    const socialModuleThread = await this.getCurrentTelegramCommandThread({
      socialModuleChat: props.socialModuleChat,
      socialModuleMessage: props.socialModuleMessage,
      socialModuleThreadId: props.socialModuleThreadId,
    });

    if (socialModuleThread.variant === "default") {
      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description:
            "Default thread cannot be deleted from Telegram. Use SPS UI or open a concrete topic.",
        },
      });
    }

    const commandSubject =
      await this.getTelegramThreadCommandSubjectContext(props);

    await this.telegramBotReplyMessageCreate({
      ...props,
      data: {
        description: `Deleting thread: ${
          socialModuleThread.title || "Untitled thread"
        }`,
      },
    });

    return rbacModuleSubjectApi.socialModuleChatFindByIdThreadDelete({
      id: commandSubject.rbacModuleSubject.id,
      socialModuleChatId: props.socialModuleChat.id,
      socialModuleThreadId: socialModuleThread.id,
      options: {
        headers: {
          Authorization: "Bearer " + commandSubject.jwtToken,
        },
      },
    });
  }

  protected async telegramBotReplyMessageCreate(
    props: ITelegramBotReplyContext & {
      data: ISocialModuleTelegramMessageData;
    },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    const socialModuleThreadId = await this.resolveThreadIdForReplyContext({
      ...props,
      secretKey: RBAC_SECRET_KEY,
    });

    return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
      {
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        socialModuleThreadId,
        data: props.data,
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      },
    );
  }

  protected async resolveThreadIdForReplyContext(
    props: ITelegramBotReplyContext & {
      secretKey: string;
    },
  ) {
    if ("socialModuleMessage" in props) {
      return this.resolveThreadIdForMessageInChat({
        socialModuleChatId: props.socialModuleChat.id,
        socialModuleMessageId: props.socialModuleMessage.id,
        requestedSocialModuleThreadId: props.socialModuleThreadId,
        secretKey: props.secretKey,
      });
    }

    const messageThreadId =
      props.socialModuleAction.payload?.telegram?.callback_query?.message
        ?.message_thread_id;

    if (messageThreadId !== undefined && messageThreadId !== null) {
      return this.resolveThreadIdBySourceSystemIdInChat({
        socialModuleChatId: props.socialModuleChat.id,
        sourceSystemId: String(messageThreadId),
        secretKey: props.secretKey,
      });
    }

    const defaultThread = await this.ensureDefaultThreadForChat({
      socialModuleChatId: props.socialModuleChat.id,
      secretKey: props.secretKey,
    });

    return defaultThread.id;
  }

  async telegramBotCallbackQueryHandler(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleAction: ISocialModuleAction;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    const callbackQueryData =
      props.socialModuleAction.payload?.telegram?.callback_query?.data;

    if (!callbackQueryData) {
      throw new Error("Validation error. Callback query data is missing");
    }

    if (callbackQueryData.startsWith("command_")) {
      const passedCommand = callbackQueryData.replace("command_", "");
      const telegramCommand = this.getTelegramCommandDefinitions().find(
        (definition) =>
          definition.enabled !== false &&
          definition.target === "telegram-bot" &&
          definition.command.replace(/^\//, "") === passedCommand,
      );

      console.log(
        "🚀 ~ telegramBotCallbackQueryHandler ~ telegramCommand:",
        telegramCommand?.command,
      );

      if (telegramCommand?.handleCallbackQuery) {
        return telegramCommand.handleCallbackQuery({
          ...props,
          command: telegramCommand.command,
        });
      }

      console.log(
        "🚀 ~ telegramBotCallbackQueryHandler ~ callbackQueryData:",
        callbackQueryData,
        telegramCommand?.command,
      );
    } else if (callbackQueryData.startsWith("ec_me_pt_")) {
      const ecommerceModuleProductId = callbackQueryData.replace(
        "ec_me_pt_",
        "",
      );

      return this.telegramBotEcommerceModuleProductFindById({
        ...props,
        ecommerceModuleProductId,
      });
    } else if (callbackQueryData.startsWith("checkout_ec_me_pt_")) {
      const ecommerceModuleProductId = callbackQueryData.replace(
        "checkout_ec_me_pt_",
        "",
      );

      return this.telegramBotEcommerceModuleProductFindByIdCheckout({
        ...props,
        ecommerceModuleProductId: ecommerceModuleProductId,
      });
    }

    return this.telegramBotReplyMessageCreate({
      ...props,
      data: {
        description: "telegramBotCallbackQueryHandler",
      },
    });
  }

  async notificationMessageUpdate(props: {
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
  }) {
    if (
      !props.socialModuleChat.sourceSystemId ||
      !props.socialModuleMessage.sourceSystemId ||
      !props.socialModuleMessage.description
    ) {
      return;
    }

    const chatId = Number.isNaN(Number(props.socialModuleChat.sourceSystemId))
      ? props.socialModuleChat.sourceSystemId
      : Number(props.socialModuleChat.sourceSystemId);
    const messageId = Number.isNaN(
      Number(props.socialModuleMessage.sourceSystemId),
    )
      ? props.socialModuleMessage.sourceSystemId
      : Number(props.socialModuleMessage.sourceSystemId);

    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
      }

      const notifications = await this.notificationModule.notification.find({
        params: {
          filters: {
            and: [
              {
                column: "reciever",
                method: "eq",
                value: String(chatId),
              },
              {
                column: "sourceSystemId",
                method: "eq",
                value: String(messageId),
              },
            ],
          },
        },
      });

      if (!notifications?.length) {
        throw new Error("Not found error. Notification not found.");
      }

      await notificationNotificationApi.update({
        id: notifications[0].id,
        data: {
          ...notifications[0],
          data: {
            socialModule: {
              message: props.socialModuleMessage,
            },
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("message is not modified")
      ) {
        return;
      }

      logger.error(error);
    }
  }

  async notificationMessageDelete(props: {
    chatSourceSystemId: string | number;
    messageSourceSystemId: string | number;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const notifications = await this.notificationModule.notification.find({
      params: {
        filters: {
          and: [
            {
              column: "reciever",
              method: "eq",
              value: String(props.chatSourceSystemId),
            },
            {
              column: "sourceSystemId",
              method: "eq",
              value: String(props.messageSourceSystemId),
            },
          ],
        },
      },
    });

    if (!notifications?.length) {
      throw new Error("Not found error. Notification not found.");
    }

    await notificationNotificationApi.delete({
      id: notifications[0].id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });
  }

  async telegramBotWelcomeMessageCreate(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
    socialModuleThreadId?: string;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    const generateTemplateSocilaModuleMessageAttachmentStartFiles =
      await this.fileStorageModule.file.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "eq",
                value:
                  "generate-template-social-module-message-attachment-start",
              },
            ],
          },
        },
      });

    const data = {
      description: "Welcome to the club, Buddy!",
    };

    if (generateTemplateSocilaModuleMessageAttachmentStartFiles?.length) {
      data["files"] = await blobifyFiles({
        files: generateTemplateSocilaModuleMessageAttachmentStartFiles.map(
          (generateTemplateSocilaModuleMessageAttachmentStartFile) => {
            return {
              ...generateTemplateSocilaModuleMessageAttachmentStartFile,
              title: generateTemplateSocilaModuleMessageAttachmentStartFile.id,
              type:
                generateTemplateSocilaModuleMessageAttachmentStartFile.mimeType ??
                "",
              extension:
                generateTemplateSocilaModuleMessageAttachmentStartFile.extension ??
                "",
              url: generateTemplateSocilaModuleMessageAttachmentStartFile.file.includes(
                "https",
              )
                ? generateTemplateSocilaModuleMessageAttachmentStartFile.file
                : `${NEXT_PUBLIC_API_SERVICE_URL}/public${generateTemplateSocilaModuleMessageAttachmentStartFile.file}`,
            };
          },
        ),
      });
    }

    await this.telegramBotReplyMessageCreate({
      ...props,
      data,
    }).catch((error) => {
      logger.error(error);
    });
  }

  async telegramBotWelcomeMessageWithKeyboardCreate(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
    socialModuleThreadId?: string;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    const data = {
      description: "Here is our menu, select what you want.",
      interaction: {
        inline_keyboard: [
          [
            {
              text: "Help",
              callback_data: "command_help",
            },
            {
              text: "Premium",
              callback_data: "command_premium",
            },
          ],
          [
            {
              text: "Invite friends",
              callback_data: "command_referral",
            },
          ],
        ],
      },
    };

    return this.telegramBotReplyMessageCreate({
      ...props,
      data,
    });
  }

  async telegramBotEcommerceModuleProductFindById(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleAction: ISocialModuleAction;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
    ecommerceModuleProductId: IEcommerceModuleProduct["id"];
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    if (!props.ecommerceModuleProductId) {
      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description: "'ecommerceModuleProductId' not passed.",
        },
      });
    }

    const extendedEcommerceModuleProduct =
      await this.extendedEcommerceModuleProduct({
        id: props.ecommerceModuleProductId,
      });

    if (!extendedEcommerceModuleProduct) {
      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description: "'extendedEcommerceModuleProduct' not found.",
        },
      });
    }

    const data: ISocialModuleTelegramMessageData = {
      description: `*${extendedEcommerceModuleProduct.title?.ru ?? extendedEcommerceModuleProduct.title?.en ?? extendedEcommerceModuleProduct.id}*\n${
        extendedEcommerceModuleProduct.shortDescription?.ru ??
        extendedEcommerceModuleProduct.shortDescription?.en ??
        ""
      }`,
    };

    if (
      extendedEcommerceModuleProduct?.["productsToFileStorageModuleFiles"]
        ?.length
    ) {
      data["files"] = await blobifyFiles({
        files: extendedEcommerceModuleProduct?.[
          "productsToFileStorageModuleFiles"
        ].map((productToFileStorageModuleFile) => {
          return {
            ...productToFileStorageModuleFile.fileStorageModuleFile,
            title: productToFileStorageModuleFile.fileStorageModuleFile.id,
            type:
              productToFileStorageModuleFile.fileStorageModuleFile.mimeType ??
              "",
            extension:
              productToFileStorageModuleFile.fileStorageModuleFile.extension ??
              "",
            url: productToFileStorageModuleFile.fileStorageModuleFile.file.includes(
              "https",
            )
              ? productToFileStorageModuleFile.fileStorageModuleFile.file
              : `${NEXT_PUBLIC_API_SERVICE_URL}/public${productToFileStorageModuleFile.fileStorageModuleFile.file}`,
          };
        }),
      });
    }

    console.log("🚀 ~ telegramBotCallbackQueryHandler ~ data:", data);

    await this.telegramBotReplyMessageCreate({
      ...props,
      data,
    });

    const messageWithCTA: ISocialModuleTelegramMessageData = {
      description:
        this.statusMessages.ecommerceModuleOrderPayButtonDescription.ru,
    };

    const telegramStarBillingModuleCurrencies =
      await this.billingModule.currency.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: "telegram-star",
              },
            ],
          },
        },
      });

    const productPrice = extendedEcommerceModuleProduct.productsToAttributes
      .filter((productToAttribute) => {
        return productToAttribute.attribute.attributeKeysToAttributes.filter(
          (attributeKeyToAttribute) => {
            return attributeKeyToAttribute.attributeKey?.type === "price";
          },
        ).length;
      })
      .filter((productToAttribute) => {
        return productToAttribute.attribute.attributesToBillingModuleCurrencies.find(
          (attributeToBillingModuleCurrency) => {
            return (
              attributeToBillingModuleCurrency.billingModuleCurrencyId ===
              telegramStarBillingModuleCurrencies?.[0].id
            );
          },
        );
      })?.[0];

    messageWithCTA.interaction = {
      inline_keyboard: [
        [
          {
            text: `Оформить подписку за ${productPrice ? productPrice.attribute.number : ""}${productPrice ? `\ ${productPrice.attribute.attributesToBillingModuleCurrencies?.[0].billingModuleCurrency?.symbol}` : ""}`,
            callback_data:
              "checkout_ec_me_pt_" + extendedEcommerceModuleProduct.id,
          },
        ],
      ],
    };

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve("");
      }, 2000);
    });

    return await this.telegramBotReplyMessageCreate({
      ...props,
      data: messageWithCTA,
    });
  }

  async telegramBotEcommerceModuleProductFindByIdCheckout(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleAction: ISocialModuleAction;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
    ecommerceModuleProductId: IEcommerceModuleProduct["id"];
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    const extendedEcommerceModuleProduct =
      await this.extendedEcommerceModuleProduct({
        id: props.ecommerceModuleProductId,
      });

    const messageFromSubject =
      await this.getMessageFromRbacModuleSubject(props);

    const telegramStarBillingModuleCurrencies =
      await this.billingModule.currency.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: "telegram-star",
              },
            ],
          },
        },
      });

    if (!telegramStarBillingModuleCurrencies?.length) {
      throw new Error(
        "Not found error. 'telegramStarBillingModuleCurrencies' not found",
      );
    }

    try {
      await rbacModuleSubjectApi.ecommerceModuleProductCheckout({
        id: messageFromSubject.id,
        productId: extendedEcommerceModuleProduct.id,
        data: {
          provider: "telegram-star",
          billingModule: {
            currency: telegramStarBillingModuleCurrencies[0],
          },
          account: props.socialModuleChat.sourceSystemId,
        },
      });
    } catch (error) {
      if (this.isActiveSubscriptionProductsCheckoutError(error)) {
        await this.telegramBotReplyMessageCreate({
          ...props,
          data: {
            description:
              this.activeSubscriptionProductsCheckoutTelegramMessage(),
          },
        });

        return;
      }

      throw error;
    }
  }

  async telegramBotPremiumMessageWithKeyboardCreate(
    props:
      | {
          jwtToken: string;
          rbacModuleSubject: IRbacModuleSubject;
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleMessage: ISocialModuleMessage;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        }
      | {
          jwtToken: string;
          rbacModuleSubject: IRbacModuleSubject;
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleAction: ISocialModuleAction;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    const messageFromSubject =
      await this.getMessageFromRbacModuleSubject(props);

    const rbacModuleRolesToEcommerceModuleProducts =
      await this.rbacModule.rolesToEcommerceModuleProducts.find({});

    if (!rbacModuleRolesToEcommerceModuleProducts?.length) {
      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description: "Can't find `rbacModuleRolesToEcommerceModuleProducts`.",
        },
      });
    }

    const rbacModulePayableRoles = await this.rbacModule.role.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: rbacModuleRolesToEcommerceModuleProducts.map(
                (roleToProduct) => {
                  return roleToProduct.roleId;
                },
              ),
            },
          ],
        },
      },
    });

    if (!rbacModulePayableRoles?.length) {
      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description: "Can't find `rbacModulePayableRoles`.",
        },
      });
    }

    const rbacModuleSubjectsToProSubscriberRoles =
      await this.rbacModule.subjectsToRoles.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: messageFromSubject.id,
              },
              {
                column: "roleId",
                method: "inArray",
                value: rbacModulePayableRoles.map((role) => {
                  return role.id;
                }),
              },
            ],
          },
        },
      });

    console.log(
      "🚀 ~ telegramBotPremiumMessageWithKeyboardCreate ~ messageFromSubject:",
      rbacModuleSubjectsToProSubscriberRoles,
    );

    const data: ISocialModuleTelegramMessageData = {
      description: "",
    };

    const ecommerceModuleProducts = await this.ecommerceModule.product.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: rbacModuleRolesToEcommerceModuleProducts.map(
                (roleToEcommerceModuleProduct) => {
                  return roleToEcommerceModuleProduct.ecommerceModuleProductId;
                },
              ),
            },
          ],
        },
      },
    });

    if (!ecommerceModuleProducts?.length) {
      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description: "Can't find `ecommerceModuleProducts`.",
        },
      });
    }

    data.description =
      this.statusMessages.ecommerceModuleSelectSubscriptionProductsOffer.ru;

    const ecommerceModuleProductButtons: {
      text: string;
      url?: string | undefined;
      callback_data?: string | undefined;
    }[] = [];

    for (const ecommerceModuleProduct of ecommerceModuleProducts) {
      const extendedProduct = await this.extendedEcommerceModuleProduct({
        id: ecommerceModuleProduct.id,
      });

      const productTitle =
        extendedProduct.title?.ru ??
        extendedProduct.title?.en ??
        extendedProduct.id;

      const telegramStarBillingModuleCurrencies =
        await this.billingModule.currency.find({
          params: {
            filters: {
              and: [
                {
                  column: "slug",
                  method: "eq",
                  value: "telegram-star",
                },
              ],
            },
          },
        });

      const productPrice = extendedProduct.productsToAttributes
        .filter((productToAttribute) => {
          return productToAttribute.attribute.attributeKeysToAttributes.filter(
            (attributeKeyToAttribute) => {
              return attributeKeyToAttribute.attributeKey?.type === "price";
            },
          ).length;
        })
        .filter((productToAttribute) => {
          return productToAttribute.attribute.attributesToBillingModuleCurrencies.find(
            (attributeToBillingModuleCurrency) => {
              return (
                attributeToBillingModuleCurrency.billingModuleCurrencyId ===
                telegramStarBillingModuleCurrencies?.[0].id
              );
            },
          );
        })?.[0];

      ecommerceModuleProductButtons.push({
        text: `${productTitle} - ${productPrice ? productPrice.attribute.number : ""}${productPrice ? `\ ${productPrice.attribute.attributesToBillingModuleCurrencies?.[0].billingModuleCurrency?.symbol}` : ""}`,
        callback_data: `ec_me_pt_${ecommerceModuleProduct.id}`,
      });
    }

    data.interaction = {
      inline_keyboard: [
        ...ecommerceModuleProductButtons.map((ecommerceModuleProductButton) => {
          return [ecommerceModuleProductButton];
        }),
      ],
    };

    return this.telegramBotReplyMessageCreate({
      ...props,
      data,
    });
  }

  async telegramBotReferralMessageWithKeyboardCreate(
    props:
      | {
          jwtToken: string;
          rbacModuleSubject: IRbacModuleSubject;
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleMessage: ISocialModuleMessage;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        }
      | {
          jwtToken: string;
          rbacModuleSubject: IRbacModuleSubject;
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleAction: ISocialModuleAction;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    if (!TELEGRAM_SERVICE_BOT_USERNAME) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_USERNAME is missing.",
      );
    }

    if (!props.messageFromSocialModuleProfile?.id) {
      return this.telegramBotReplyMessageCreate({
        ...props,
        data: {
          description:
            "Can't create referral link, because `props.messageFromSocialModuleProfile` is empty.",
        },
      });
    }

    const data = {
      description:
        "You can invite people to subscribe for that Telegram Bot and get benefits!\nJust share link below and people, that will start the bot with your referral code will get free 3 days of Premium.",
      interaction: {
        inline_keyboard: [
          [
            {
              text: "Referral link",
              copy_text: {
                text: `https://t.me/${TELEGRAM_SERVICE_BOT_USERNAME}?start=${props.messageFromSocialModuleProfile.id}`,
              },
            },
          ],
        ],
      },
    };

    return this.telegramBotReplyMessageCreate({
      ...props,
      data,
    });
  }

  async telegramBotHelpMessageWithKeyboardCreate(
    props:
      | {
          jwtToken: string;
          rbacModuleSubject: IRbacModuleSubject;
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleMessage: ISocialModuleMessage;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        }
      | {
          jwtToken: string;
          rbacModuleSubject: IRbacModuleSubject;
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleAction: ISocialModuleAction;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    const data = {
      description:
        "I am Telegram bot, that can help you with any kind of text questions with the help of AI.\nIf you have a question, just write it to the chat and I will choose the most relevant AI model for answer.\n\nIf you have troubles with Telegram Bot, just write to Support Manager and describle the situation. **DO NOT delete autogenerated message** during first wite to Support Manager. That message will help us to understand what profile in our system you have.",
      interaction: {
        inline_keyboard: [
          [
            {
              text: "Contact with Support Manager",
              url: `https://t.me/rogwild?text=Hello! I have social-module id: ${props.messageFromSocialModuleProfile?.id}`,
            },
          ],
        ],
      },
    };

    return this.telegramBotReplyMessageCreate({
      ...props,
      data,
    });
  }

  async openRouterReplyMessageCreate(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
    socialModuleThreadId?: string;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    let socialModuleThreadId: string | undefined;

    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
      }

      const secretKey = RBAC_SECRET_KEY;

      const telegramRequiredSubscriptionChannel =
        this.getTelegramRequiredSubscriptionChannelConfiguration();

      if (telegramRequiredSubscriptionChannel.isPartiallyConfigured) {
        throw new Error(
          "Configuration error. Telegram required subscription channel information is incomplete. Set TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID, TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME, and TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK together, or omit all three to disable subscription enforcement.",
        );
      }

      if (!props.socialModuleMessage.description?.trim()) {
        return;
      }

      socialModuleThreadId = await this.resolveThreadIdForMessageInChat({
        socialModuleChatId: props.socialModuleChat.id,
        socialModuleMessageId: props.socialModuleMessage.id,
        requestedSocialModuleThreadId: props.socialModuleThreadId,
        secretKey,
      });

      if (!socialModuleThreadId) {
        throw new Error(
          "Validation error. Failed to resolve social module thread",
        );
      }

      const messageFromRbacModuleSubject =
        await this.getMessageFromRbacModuleSubject(props);

      const rbacModuleRolesToEcommerceModuleProducts =
        await this.rbacModule.rolesToEcommerceModuleProducts.find({});

      const rbacModuleRoles = await this.rbacModule.role.find({});

      if (!rbacModuleRoles?.length) {
        throw new Error("Not found error. 'rbacModuleRoles' is empty.");
      }

      const rbacModulePayableRoles = rbacModuleRoles.filter((role) => {
        return rbacModuleRolesToEcommerceModuleProducts
          ?.map((roleToProduct) => {
            return roleToProduct.roleId;
          })
          .includes(role.id);
      });

      const rbacSubjectsToRoles = await this.rbacModule.subjectsToRoles.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: messageFromRbacModuleSubject.id,
              },
            ],
          },
        },
      });

      const rbacModuleSubjectToPayableRoles = rbacSubjectsToRoles?.filter(
        (rbacModuleSubjectToRole) => {
          return rbacModulePayableRoles
            .map((role) => {
              return role.id;
            })
            .includes(rbacModuleSubjectToRole.roleId);
        },
      );

      const requiredTelegramChannelSubscriptionRbacModuleRole =
        rbacModuleRoles?.find((role) => {
          return role.slug === "required-telegram-channel-subscriber";
        });

      const requiredTelegramChannelSubscriptionRbacModuleSubjectToRole =
        rbacSubjectsToRoles?.find((rbacModuleSubjectToRole) => {
          return (
            rbacModuleSubjectToRole.roleId ===
            requiredTelegramChannelSubscriptionRbacModuleRole?.id
          );
        });

      if (
        telegramRequiredSubscriptionChannel.isConfigured &&
        requiredTelegramChannelSubscriptionRbacModuleRole &&
        !requiredTelegramChannelSubscriptionRbacModuleSubjectToRole
      ) {
        return await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
          {
            id: props.rbacModuleSubject.id,
            socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
            socialModuleChatId: props.socialModuleChat.id,
            socialModuleThreadId,
            data: {
              description:
                `${this.statusMessages.openRouterRequiredTelegamChannelSubscriptionError.ru}\n\n` +
                `[${telegramRequiredSubscriptionChannel.name}](${telegramRequiredSubscriptionChannel.link})`,
              interaction: {
                inline_keyboard: [
                  [
                    {
                      text: telegramRequiredSubscriptionChannel.name,
                      url: telegramRequiredSubscriptionChannel.link,
                    },
                  ],
                ],
              },
            },
            options: {
              headers: {
                Authorization: "Bearer " + props.jwtToken,
              },
            },
          },
        );
      }

      if (!rbacModuleSubjectToPayableRoles?.length) {
        return await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
          {
            id: props.rbacModuleSubject.id,
            socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
            socialModuleChatId: props.socialModuleChat.id,
            socialModuleThreadId,
            data: {
              description:
                this.statusMessages.openRouterNotFoundSubscription.ru,
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
            },
            options: {
              headers: {
                Authorization: "Bearer " + props.jwtToken,
              },
            },
          },
        );
      }

      if (!props.messageFromSocialModuleProfile?.id) {
        throw new Error(
          "Not found error. 'messageFromSocialModuleProfile.id' not found",
        );
      }

      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. 'RBAC_JWT_SECRET' not setted.");
      }

      const messageFromRbacModuleSubjectJwt = await jwt.sign(
        {
          exp:
            Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
          iat: Math.floor(Date.now() / 1000),
          subject: messageFromRbacModuleSubject,
        },
        RBAC_JWT_SECRET,
      );

      return await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter(
        {
          id: messageFromRbacModuleSubject.id,
          socialModuleChatId: props.socialModuleChat.id,
          socialModuleMessageId: props.socialModuleMessage.id,
          socialModuleProfileId: props.messageFromSocialModuleProfile.id,
          data: {
            shouldReplySocialModuleProfile:
              props.shouldReplySocialModuleProfile,
          },
          options: {
            headers: {
              Authorization: "Bearer " + messageFromRbacModuleSubjectJwt,
            },
          },
        },
      );
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes("do not have enough balance for that route") ||
          error.message.includes(
            "Validation error. You do not have access to this resource because you have not 'subjectsToBillingModuleCurrencies' for pay that route",
          )
        ) {
          if (socialModuleThreadId) {
            await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
              {
                id: props.rbacModuleSubject.id,
                socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
                socialModuleChatId: props.socialModuleChat.id,
                socialModuleThreadId,
                data: {
                  description: this.statusMessages.openRouterNotEnoughTokens.ru,
                },
                options: {
                  headers: {
                    Authorization: "Bearer " + props.jwtToken,
                  },
                },
              },
            );
          } else {
            await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
              {
                id: props.rbacModuleSubject.id,
                socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
                socialModuleChatId: props.socialModuleChat.id,
                data: {
                  description: this.statusMessages.openRouterNotEnoughTokens.ru,
                },
                options: {
                  headers: {
                    Authorization: "Bearer " + props.jwtToken,
                  },
                },
              },
            );
          }
          await this.telegramBotPremiumMessageWithKeyboardCreate({
            jwtToken: props.jwtToken,
            messageFromSocialModuleProfile:
              props.messageFromSocialModuleProfile,
            rbacModuleSubject: props.rbacModuleSubject,
            shouldReplySocialModuleProfile:
              props.shouldReplySocialModuleProfile,
            socialModuleMessage: props.socialModuleMessage,
            socialModuleChat: props.socialModuleChat,
          });

          throw error;
        }
      }

      if (this.isOpenRouterTerminalMessageWrittenError(error)) {
        logger.error(error);
        return;
      }

      if (socialModuleThreadId) {
        await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
          {
            id: props.rbacModuleSubject.id,
            socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
            socialModuleChatId: props.socialModuleChat.id,
            socialModuleThreadId,
            data: {
              description: this.statusMessages.openRouterError.ru,
            },
            options: {
              headers: {
                Authorization: "Bearer " + props.jwtToken,
              },
            },
          },
        );
      } else {
        await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
          {
            id: props.rbacModuleSubject.id,
            socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
            socialModuleChatId: props.socialModuleChat.id,
            data: {
              description: this.statusMessages.openRouterError.ru,
            },
            options: {
              headers: {
                Authorization: "Bearer " + props.jwtToken,
              },
            },
          },
        );
      }

      if (this.isRecoverableOpenRouterReplyError(error)) {
        logger.error(error);
        return;
      }

      throw error;
    }
  }

  async resolveThreadIdForMessageInChat(props: {
    socialModuleChatId: string;
    socialModuleMessageId: string;
    requestedSocialModuleThreadId?: string;
    secretKey: string;
  }): Promise<string> {
    const socialModuleChatsToThreads =
      await this.socialModule.chatsToThreads.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });

    const chatThreadIds: string[] = Array.from(
      new Set(
        socialModuleChatsToThreads
          ?.map((socialModuleChatToThread) => {
            return socialModuleChatToThread.threadId;
          })
          .filter((threadId): threadId is string => Boolean(threadId)) || [],
      ),
    );
    const chatThreadIdsSet = new Set(chatThreadIds);

    if (
      props.requestedSocialModuleThreadId &&
      !chatThreadIdsSet.has(props.requestedSocialModuleThreadId)
    ) {
      throw new Error(
        "Validation error. Requested thread is not linked to the requested chat",
      );
    }

    const socialModuleThreadsToMessages =
      await this.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "messageId",
                method: "eq",
                value: props.socialModuleMessageId,
              },
            ],
          },
        },
      });

    const messageThreadIds: string[] = Array.from(
      new Set(
        socialModuleThreadsToMessages
          ?.map((socialModuleThreadToMessage) => {
            return socialModuleThreadToMessage.threadId;
          })
          .filter((threadId): threadId is string => Boolean(threadId)) || [],
      ),
    );

    const validMessageThreadIds = messageThreadIds.filter((threadId) => {
      return chatThreadIdsSet.has(threadId);
    });

    if (validMessageThreadIds.length > 1) {
      throw new Error(
        "Validation error. Requested message is linked to multiple chat threads",
      );
    }

    if (props.requestedSocialModuleThreadId) {
      if (
        messageThreadIds.length &&
        messageThreadIds.some((threadId) => {
          return threadId !== props.requestedSocialModuleThreadId;
        })
      ) {
        throw new Error(
          "Validation error. Requested message is linked to a different thread",
        );
      }

      if (!messageThreadIds.includes(props.requestedSocialModuleThreadId)) {
        await socialModuleThreadsToMessagesApi.create({
          data: {
            threadId: props.requestedSocialModuleThreadId,
            messageId: props.socialModuleMessageId,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": props.secretKey,
            },
          },
        });
      }

      return props.requestedSocialModuleThreadId;
    }

    if (validMessageThreadIds.length === 1) {
      return validMessageThreadIds[0];
    }

    if (messageThreadIds.length) {
      throw new Error(
        "Validation error. Requested message thread is not linked to the requested chat",
      );
    }

    return this.normalizeChatThreadsAndMessageLinks({
      socialModuleChatId: props.socialModuleChatId,
      secretKey: props.secretKey,
    });
  }

  async resolveThreadIdBySourceSystemIdInChat(props: {
    socialModuleChatId: string;
    sourceSystemId: string;
    secretKey: string;
  }): Promise<string> {
    await this.normalizeChatThreadsAndMessageLinks({
      socialModuleChatId: props.socialModuleChatId,
      secretKey: props.secretKey,
    });

    const socialModuleChatsToThreads =
      await this.socialModule.chatsToThreads.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });

    const threadIds =
      socialModuleChatsToThreads
        ?.map((socialModuleChatToThread) => {
          return socialModuleChatToThread.threadId;
        })
        .filter((threadId): threadId is string => Boolean(threadId)) || [];

    if (!threadIds.length) {
      const defaultThread = await this.ensureDefaultThreadForChat({
        socialModuleChatId: props.socialModuleChatId,
        secretKey: props.secretKey,
      });

      return defaultThread.id;
    }

    const socialModuleThreads = await this.socialModule.thread.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: threadIds,
            },
            {
              column: "sourceSystemId",
              method: "eq",
              value: props.sourceSystemId,
            },
          ],
        },
      },
    });

    if (socialModuleThreads?.length) {
      if (socialModuleThreads.length > 1) {
        throw new Error(
          "Validation error. Requested Telegram topic is linked to multiple SPS threads",
        );
      }

      return socialModuleThreads[0].id;
    }

    const defaultThread = await this.ensureDefaultThreadForChat({
      socialModuleChatId: props.socialModuleChatId,
      secretKey: props.secretKey,
    });

    return defaultThread.id;
  }

  async normalizeChatThreadsAndMessageLinks(props: {
    socialModuleChatId: string;
    secretKey: string;
  }) {
    const socialModuleDefaultThread = await this.ensureDefaultThreadForChat({
      socialModuleChatId: props.socialModuleChatId,
      secretKey: props.secretKey,
    });

    const socialModuleChatsToMessages =
      await this.socialModule.chatsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });

    if (!socialModuleChatsToMessages?.length) {
      return socialModuleDefaultThread.id;
    }

    const socialModuleMessageIds = Array.from(
      new Set(
        socialModuleChatsToMessages
          .map((socialModuleChatToMessage) => {
            return socialModuleChatToMessage.messageId;
          })
          .filter((messageId): messageId is string => Boolean(messageId)),
      ),
    );

    if (!socialModuleMessageIds.length) {
      return socialModuleDefaultThread.id;
    }

    const socialModuleChatsToThreads =
      await this.socialModule.chatsToThreads.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });

    const chatThreadIdsSet = new Set(
      socialModuleChatsToThreads
        ?.map((socialModuleChatToThread) => {
          return socialModuleChatToThread.threadId;
        })
        .filter((threadId): threadId is string => Boolean(threadId)) || [],
    );
    chatThreadIdsSet.add(socialModuleDefaultThread.id);

    const socialModuleThreadsToMessages =
      await this.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "messageId",
                method: "inArray",
                value: socialModuleMessageIds,
              },
            ],
          },
        },
      });

    const normalizedMessageIds = new Set(
      socialModuleThreadsToMessages
        ?.filter((socialModuleThreadToMessage) => {
          if (!socialModuleThreadToMessage.messageId) {
            return false;
          }

          if (!socialModuleThreadToMessage.threadId) {
            return false;
          }

          return chatThreadIdsSet.has(socialModuleThreadToMessage.threadId);
        })
        .map((socialModuleThreadToMessage) => {
          return socialModuleThreadToMessage.messageId;
        }) || [],
    );

    const notNormalizedMessageIds = socialModuleMessageIds.filter(
      (socialModuleMessageId) => {
        return !normalizedMessageIds.has(socialModuleMessageId);
      },
    );

    for (const socialModuleMessageId of notNormalizedMessageIds) {
      await socialModuleThreadsToMessagesApi.create({
        data: {
          threadId: socialModuleDefaultThread.id,
          messageId: socialModuleMessageId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": props.secretKey,
          },
        },
      });
    }

    return socialModuleDefaultThread.id;
  }

  async ensureDefaultThreadForChat(props: {
    socialModuleChatId: string;
    secretKey: string;
  }) {
    const socialModuleChatsToThreads =
      await this.socialModule.chatsToThreads.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });

    const threadIds =
      socialModuleChatsToThreads
        ?.map((socialModuleChatToThread) => {
          return socialModuleChatToThread.threadId;
        })
        .filter((threadId): threadId is string => Boolean(threadId)) || [];

    if (threadIds.length) {
      const socialModuleThreads = await this.socialModule.thread.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: threadIds,
              },
            ],
          },
        },
      });

      const primarySocialModuleThread =
        selectPrimaryLinkedThread<ISocialModuleThread>({
          socialModuleChatsToThreads: socialModuleChatsToThreads || [],
          socialModuleThreads: socialModuleThreads || [],
        });

      if (primarySocialModuleThread) {
        return primarySocialModuleThread;
      }
    }

    const socialModuleDefaultThread = await socialModuleThreadApi.create({
      data: {
        variant: "default",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": props.secretKey,
        },
      },
    });

    await socialModuleChatsToThreadsApi.create({
      data: {
        chatId: props.socialModuleChatId,
        threadId: socialModuleDefaultThread.id,
        variant: "default",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": props.secretKey,
        },
      },
    });

    return socialModuleDefaultThread;
  }

  async extendedEcommerceModuleProduct(props: {
    id: IEcommerceModuleProduct["id"];
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const ecommerceModuleProduct = await this.ecommerceModule.product.findById({
      id: props.id,
    });

    if (!ecommerceModuleProduct) {
      throw new Error("Not found error. 'ecommerceModuleProduct' not found");
    }

    const ecommerceModuleProductsToFileStorageFiles: (IEcommerceModuleProductsToFileStorageFiles & {
      fileStorageModuleFile: IFileStorageModuleFile;
    })[] = [];

    const foundEcommerceModuleProductsToFileStorageFiles =
      await this.ecommerceModule.productsToFileStorageModuleFiles.find({
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "eq",
                value: ecommerceModuleProduct.id,
              },
              {
                column: "variant",
                method: "eq",
                value: "default",
              },
            ],
          },
        },
      });

    if (foundEcommerceModuleProductsToFileStorageFiles?.length) {
      const foundFileStorageModuleFiles =
        await this.fileStorageModule.file.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: foundEcommerceModuleProductsToFileStorageFiles.map(
                    (foundEcommerceModuleProductsToFileStorageFile) => {
                      return foundEcommerceModuleProductsToFileStorageFile.fileStorageModuleFileId;
                    },
                  ),
                },
              ],
            },
          },
        });
      if (foundFileStorageModuleFiles?.length) {
        foundEcommerceModuleProductsToFileStorageFiles.forEach(
          (foundEcommerceModuleProductsToFileStorageFile) => {
            const fileStorageModuleFile = foundFileStorageModuleFiles.find(
              (foundFileStorageModuleFile) => {
                return (
                  foundFileStorageModuleFile.id ===
                  foundEcommerceModuleProductsToFileStorageFile.fileStorageModuleFileId
                );
              },
            );
            if (!fileStorageModuleFile) {
              return;
            }

            ecommerceModuleProductsToFileStorageFiles.push({
              ...foundEcommerceModuleProductsToFileStorageFile,
              fileStorageModuleFile,
            });
          },
        );
      }
    }

    const ecommerceModuleProdctsToAttributes =
      await this.ecommerceModule.productsToAttributes.find({
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "eq",
                value: ecommerceModuleProduct.id,
              },
            ],
          },
        },
      });

    if (!ecommerceModuleProdctsToAttributes?.length) {
      throw new Error(
        "Not found error. 'ecommerceModuleProdctsToAttributes' not found",
      );
    }

    const ecommerceModuleAttributes = await this.ecommerceModule.attribute.find(
      {
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: ecommerceModuleProdctsToAttributes.map(
                  (productToAttribute) => {
                    return productToAttribute.attributeId;
                  },
                ),
              },
            ],
          },
        },
      },
    );

    if (!ecommerceModuleAttributes?.length) {
      throw new Error("Not found error. 'ecommerceModuleAttributes' not found");
    }

    const ecommerceModuleAttributeKeysToAttributes =
      await this.ecommerceModule.attributeKeysToAttributes.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeId",
                method: "inArray",
                value: ecommerceModuleAttributes.map(
                  (ecommerceModuleAttribute) => {
                    return ecommerceModuleAttribute.id;
                  },
                ),
              },
            ],
          },
        },
      });

    if (!ecommerceModuleAttributeKeysToAttributes?.length) {
      throw new Error(
        "Not found error. 'ecommerceModuleAttributeKeysToAttributes' not found",
      );
    }

    const ecommerceModuleAttributeKeys =
      await this.ecommerceModule.attributeKey.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: ecommerceModuleAttributeKeysToAttributes.map(
                  (ecommerceModuleAttributeKeyToAttribute) => {
                    return ecommerceModuleAttributeKeyToAttribute.attributeKeyId;
                  },
                ),
              },
            ],
          },
        },
      });

    if (!ecommerceModuleAttributeKeys?.length) {
      throw new Error(
        "Not found error. 'ecommerceModuleAttributeKeys' not found",
      );
    }

    const ecommerceModuleAttributesToBillingModuleCurrencies =
      await this.ecommerceModule.attributesToBillingModuleCurrencies.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeId",
                method: "inArray",
                value: ecommerceModuleAttributes.map(
                  (ecommerceModuleAttribute) => {
                    return ecommerceModuleAttribute.id;
                  },
                ),
              },
            ],
          },
        },
      });

    if (!ecommerceModuleAttributesToBillingModuleCurrencies?.length) {
      throw new Error(
        "Not found error. 'ecommerceModuleAttributesToBillingModuleCurrencies' not found",
      );
    }

    const billingModuleCurrencies = await this.billingModule.currency.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: ecommerceModuleAttributesToBillingModuleCurrencies.map(
                (ecommerceModuleAttributeToBillingModuleCurrency) => {
                  return ecommerceModuleAttributeToBillingModuleCurrency.billingModuleCurrencyId;
                },
              ),
            },
          ],
        },
      },
    });

    if (!billingModuleCurrencies?.length) {
      throw new Error("Not found error. 'billingModuleCurrencies' not found");
    }

    return {
      ...ecommerceModuleProduct,
      productsToAttributes: ecommerceModuleProdctsToAttributes.map(
        (ecommerceModuleProdctToAttribute) => {
          return {
            ...ecommerceModuleProdctToAttribute,
            attribute: {
              ...ecommerceModuleAttributes.find((ecommerceModuleAttribute) => {
                return (
                  ecommerceModuleAttribute.id ===
                  ecommerceModuleProdctToAttribute.attributeId
                );
              }),
              attributesToBillingModuleCurrencies:
                ecommerceModuleAttributesToBillingModuleCurrencies
                  .filter((ecommerceModuleAttributeToBillingModuleCurrency) => {
                    return (
                      ecommerceModuleAttributeToBillingModuleCurrency.attributeId ===
                      ecommerceModuleProdctToAttribute.attributeId
                    );
                  })
                  .map((ecommerceModuleAttributeToBillingModuleCurrency) => {
                    return {
                      ...ecommerceModuleAttributeToBillingModuleCurrency,
                      billingModuleCurrency: billingModuleCurrencies.find(
                        (billingModuleCurrency) => {
                          return (
                            billingModuleCurrency.id ===
                            ecommerceModuleAttributeToBillingModuleCurrency.billingModuleCurrencyId
                          );
                        },
                      ),
                    };
                  }),
              attributeKeysToAttributes:
                ecommerceModuleAttributeKeysToAttributes
                  .filter((ecommerceModuleAttributeKeyToAttribute) => {
                    return (
                      ecommerceModuleAttributeKeyToAttribute.attributeId ===
                      ecommerceModuleProdctToAttribute.attributeId
                    );
                  })
                  .map((ecommerceModuleAttributeKeyToAttribute) => {
                    return {
                      ...ecommerceModuleAttributeKeyToAttribute,
                      attributeKey: ecommerceModuleAttributeKeys.find(
                        (ecommerceModuleAttributeKey) => {
                          return (
                            ecommerceModuleAttributeKey.id ===
                            ecommerceModuleAttributeKeyToAttribute.attributeKeyId
                          );
                        },
                      ),
                    };
                  }),
            },
          };
        },
      ),
      productsToFileStorageModuleFiles:
        ecommerceModuleProductsToFileStorageFiles,
    };
  }

  async getMessageFromRbacModuleSubject(
    props:
      | {
          jwtToken: string;
          rbacModuleSubject: IRbacModuleSubject;
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleMessage: ISocialModuleMessage;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        }
      | {
          jwtToken: string;
          rbacModuleSubject: IRbacModuleSubject;
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleAction: ISocialModuleAction;
          messageFromSocialModuleProfile: ISocialModuleProfile | null;
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
    }

    if (!props.messageFromSocialModuleProfile) {
      throw new Error(
        "Validation error. 'props.messageFromSocialModuleProfile' is not passed",
      );
    }

    const messageFromRbacModuleSubjectsToSocialModuleProfiles =
      await this.rbacModule.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              {
                column: "socialModuleProfileId",
                method: "eq",
                value: props.messageFromSocialModuleProfile.id,
              },
            ],
          },
        },
      });

    if (!messageFromRbacModuleSubjectsToSocialModuleProfiles?.length) {
      throw new Error(
        "Not found error. 'messageFromRbacModuleSubjectsToSocialModuleProfiles' not found",
      );
    }

    const everyMessageFromRbacModuleSubjectsToSocialModuleProfilesHasOneSubjectId =
      messageFromRbacModuleSubjectsToSocialModuleProfiles.every(
        (subjectsToSocialModuleProfiles) => {
          return (
            subjectsToSocialModuleProfiles.subjectId ===
            messageFromRbacModuleSubjectsToSocialModuleProfiles[0].subjectId
          );
        },
      );

    if (
      !everyMessageFromRbacModuleSubjectsToSocialModuleProfilesHasOneSubjectId
    ) {
      throw new Error(
        "Validation error. 'everyMessageFromRbacModuleSubjectsToSocialModuleProfilesHasOneSubjectId' in not passed.",
      );
    }

    const messageFromSubject = await this.rbacModule.subject.findById({
      id: messageFromRbacModuleSubjectsToSocialModuleProfiles[0].subjectId,
    });

    if (!messageFromSubject) {
      throw new Error("Not found error. 'messageFromSubject' not found.");
    }

    return messageFromSubject;
  }
}
