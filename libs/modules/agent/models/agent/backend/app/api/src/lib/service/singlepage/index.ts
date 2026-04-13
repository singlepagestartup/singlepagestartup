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

interface ISocialModuleTelegramMessageData {
  description: string;
  interaction?:
    | {
        inline_keyboard: {
          text: string;
          url?: string;
          callback_data?: string;
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

  telegramRequiredChannelName =
    TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME || "наш Telegram-канал";
  telegramRequiredChannelLink =
    TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK ||
    (TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME
      ? `https://t.me/${TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME}`
      : "https://t.me");

  telegramBotCommands = ["/start", "/help", "/referral", "/premium", "/new"];
  statusMessages = telegramBotServiceMessages;

  async agentSocialModuleProfileHandler(
    props:
      | {
          shouldReplySocialModuleProfile: ISocialModuleProfile;
          socialModuleChat: ISocialModuleChat;
          socialModuleMessage: ISocialModuleMessage;
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

    if (props.shouldReplySocialModuleProfile.slug === "telegram-bot") {
      if ("socialModuleMessage" in props) {
        const telegramBotCommandMessage = this.telegramBotCommands.find(
          (command) => {
            return props.socialModuleMessage.description?.startsWith(command);
          },
        );

        if (telegramBotCommandMessage) {
          await this.telegramBotCommandReplyMessageCreate({
            jwtToken,
            rbacModuleSubject,
            shouldReplySocialModuleProfile:
              props.shouldReplySocialModuleProfile,
            socialModuleChat: props.socialModuleChat,
            socialModuleMessage: props.socialModuleMessage,
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
    } else if (props.shouldReplySocialModuleProfile.slug === "open-router") {
      if ("socialModuleMessage" in props) {
        const telegramBotCommandMessage = this.telegramBotCommands.find(
          (command) => {
            return props.socialModuleMessage.description?.startsWith(command);
          },
        );

        if (telegramBotCommandMessage) {
          return;
        }

        const messageFromRbacModuleSubject =
          await this.getMessageFromRbacModuleSubject({
            jwtToken,
            rbacModuleSubject,
            shouldReplySocialModuleProfile:
              props.shouldReplySocialModuleProfile,
            socialModuleChat: props.socialModuleChat,
            socialModuleMessage: props.socialModuleMessage,
            messageFromSocialModuleProfile:
              props.messageFromSocialModuleProfile,
          });

        console.log(
          "🚀 ~ agentSocialModuleProfileHandler ~ telegramBotCommandMessage:",
          messageFromRbacModuleSubject,
          telegramBotCommandMessage,
          props.socialModuleMessage.description,
        );

        await this.openRouterReplyMessageCreate({
          jwtToken,
          rbacModuleSubject,
          shouldReplySocialModuleProfile: props.shouldReplySocialModuleProfile,
          socialModuleChat: props.socialModuleChat,
          socialModuleMessage: props.socialModuleMessage,
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
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    if (props.socialModuleMessage.description?.startsWith("/start")) {
      return this.telegramBotWelcomeMessageCreate(props).then(async () => {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve("");
          }, 4000);
        });
        await this.telegramBotWelcomeMessageWithKeyboardCreate(props);
      });
    } else if (props.socialModuleMessage.description?.startsWith("/help")) {
      return this.telegramBotHelpMessageWithKeyboardCreate(props);
    } else if (props.socialModuleMessage.description?.startsWith("/premium")) {
      return this.telegramBotPremiumMessageWithKeyboardCreate(props);
    } else if (props.socialModuleMessage.description?.startsWith("/referral")) {
      return this.telegramBotReferralMessageWithKeyboardCreate(props);
    } else if (props.socialModuleMessage.description?.startsWith("/new")) {
      return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description: this.statusMessages.openRouterContextResetByNew.ru,
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );
    }

    await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
      {
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
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
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      },
    );
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
      const telegramBotTargetCommand = this.telegramBotCommands
        .map((command) => {
          return command.replace("/", "");
        })
        .find((command) => {
          return command === passedCommand;
        });

      console.log(
        "🚀 ~ telegramBotCallbackQueryHandler ~ telegramBotTargetCommand:",
        telegramBotTargetCommand,
      );

      switch (telegramBotTargetCommand) {
        case "help":
          return this.telegramBotHelpMessageWithKeyboardCreate(props);
        case "premium":
          return this.telegramBotPremiumMessageWithKeyboardCreate(props);
        case "referral":
          return this.telegramBotReferralMessageWithKeyboardCreate(props);
      }

      console.log(
        "🚀 ~ telegramBotCallbackQueryHandler ~ callbackQueryData:",
        callbackQueryData,
        telegramBotTargetCommand,
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

    return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
      {
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        data: {
          description: "telegramBotCallbackQueryHandler",
        },
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      },
    );
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

    await rbacModuleSubjectApi
      .socialModuleProfileFindByIdChatFindByIdMessageCreate({
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        data,
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      })
      .catch((error) => {
        logger.error(error);
      });
  }

  async telegramBotWelcomeMessageWithKeyboardCreate(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
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

    return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
      {
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        data,
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      },
    );
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
      return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description: "'ecommerceModuleProductId' not passed.",
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );
    }

    const extendedEcommerceModuleProduct =
      await this.extendedEcommerceModuleProduct({
        id: props.ecommerceModuleProductId,
      });

    if (!extendedEcommerceModuleProduct) {
      return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description: "'extendedEcommerceModuleProduct' not found.",
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );
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

    await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
      {
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        data,
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      },
    );

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

    return await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
      {
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        data: messageWithCTA,
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      },
    );
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

    const rbacModuleSubjectEcommerceModuleProductCheckoutResult =
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
      return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description:
              "Can't find `rbacModuleRolesToEcommerceModuleProducts`.",
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );
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
      return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description: "Can't find `rbacModulePayableRoles`.",
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );
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
      return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description: "Can't find `ecommerceModuleProducts`.",
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );
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

    return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
      {
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        data,
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      },
    );
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
      return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description:
              "Can't create referral link, because `props.messageFromSocialModuleProfile` is empty.",
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );
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

    return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
      {
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        data,
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      },
    );
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

    return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
      {
        id: props.rbacModuleSubject.id,
        socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
        socialModuleChatId: props.socialModuleChat.id,
        data,
        options: {
          headers: {
            Authorization: "Bearer " + props.jwtToken,
          },
        },
      },
    );
  }

  async openRouterReplyMessageCreate(props: {
    jwtToken: string;
    rbacModuleSubject: IRbacModuleSubject;
    shouldReplySocialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleMessage: ISocialModuleMessage;
    messageFromSocialModuleProfile: ISocialModuleProfile | null;
  }) {
    let socialModuleThreadId: string | undefined;

    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
      }

      const secretKey = RBAC_SECRET_KEY;

      if (
        TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID &&
        (!TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK ||
          !TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME)
      ) {
        throw new Error(
          "Configuration error. Telegram required subscription channel information is incomplete - expected TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID, TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME, and TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK in .env",
        );
      }

      if (!props.socialModuleMessage.description) {
        throw new Error(
          "Validation error. 'props.socialModuleMessage.description' is empty.",
        );
      }

      socialModuleThreadId = await this.resolveThreadIdForMessageInChat({
        socialModuleChatId: props.socialModuleChat.id,
        socialModuleMessageId: props.socialModuleMessage.id,
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
                this.statusMessages
                  .openRouterRequiredTelegamChannelSubscriptionError.ru,
              interaction: {
                inline_keyboard: [
                  [
                    {
                      text:
                        TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME ||
                        "Subscribe",
                      url: this.telegramRequiredChannelLink,
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

      if (socialModuleThreadId) {
        await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
          {
            id: props.rbacModuleSubject.id,
            socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
            socialModuleChatId: props.socialModuleChat.id,
            socialModuleThreadId,
            data: {
              description:
                this.statusMessages.openRouterError.ru +
                "\n`" +
                (error as Error).message +
                "`",
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
              description:
                this.statusMessages.openRouterError.ru +
                "\n`" +
                (error as Error).message +
                "`",
            },
            options: {
              headers: {
                Authorization: "Bearer " + props.jwtToken,
              },
            },
          },
        );
      }

      throw error;
    }
  }

  async resolveThreadIdForMessageInChat(props: {
    socialModuleChatId: string;
    socialModuleMessageId: string;
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

    const chatThreadIds =
      socialModuleChatsToThreads
        ?.map((socialModuleChatToThread) => {
          return socialModuleChatToThread.threadId;
        })
        .filter((threadId): threadId is string => Boolean(threadId)) || [];

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

    const messageThreadIds =
      socialModuleThreadsToMessages
        ?.map((socialModuleThreadToMessage) => {
          return socialModuleThreadToMessage.threadId;
        })
        .filter((threadId): threadId is string => Boolean(threadId)) || [];

    const chatThreadIdsSet = new Set(chatThreadIds);
    const validMessageThreadIds = messageThreadIds.filter((threadId) => {
      return chatThreadIdsSet.has(threadId);
    });

    if (validMessageThreadIds.length > 1) {
      throw new Error(
        "Validation error. Requested message is linked to multiple chat threads",
      );
    }

    if (validMessageThreadIds.length === 1) {
      return validMessageThreadIds[0];
    }

    if (messageThreadIds.length) {
      throw new Error(
        "Validation error. Requested message thread is not linked to the requested chat",
      );
    }

    const socialModuleDefaultThread = await this.ensureDefaultThreadForChat({
      socialModuleChatId: props.socialModuleChatId,
      secretKey: props.secretKey,
    });

    await socialModuleThreadsToMessagesApi.create({
      data: {
        threadId: socialModuleDefaultThread.id,
        messageId: props.socialModuleMessageId,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": props.secretKey,
        },
      },
    });

    return socialModuleDefaultThread.id;
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

      const defaultSocialModuleThreads =
        socialModuleThreads?.filter((socialModuleThread) => {
          return socialModuleThread.variant === "default";
        }) || [];

      if (defaultSocialModuleThreads.length > 1) {
        throw new Error(
          "Validation error. Requested social-module chat has multiple default threads",
        );
      }

      if (defaultSocialModuleThreads.length === 1) {
        return defaultSocialModuleThreads[0];
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
