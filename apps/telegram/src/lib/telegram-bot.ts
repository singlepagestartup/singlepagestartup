import {
  NEXT_PUBLIC_TELEGRAM_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
  TELEGRAM_SERVICE_BOT_TOKEN,
  TELEGRAM_SERVICE_BOT_USERNAME,
  TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID,
} from "@sps/shared-utils";
import {
  Bot as GrammyBot,
  webhookCallback,
  Context as GrammyContext,
} from "grammy";
import {
  Conversation,
  ConversationFlavor as GrammyConversationFlavor,
} from "@grammyjs/conversations";
import { IModel as IRbacSubject } from "@sps/rbac/models/subject/sdk/model";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { api as billingModulePaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { blobifyFiles } from "@sps/backend-utils";
import * as jwt from "hono/jwt";

export type TelegramBotContext = GrammyContext & GrammyConversationFlavor;

type TelegramAttachmentCandidate = {
  fileId: string;
  fileName?: string;
  title?: string;
  mimeType?: string;
};

function splitFileName(value: string) {
  const cleanValue = value.split("?")[0];
  const baseName = cleanValue.split("/").pop() || cleanValue;
  const dotIndex = baseName.lastIndexOf(".");

  if (dotIndex > 0) {
    return {
      title: baseName.slice(0, dotIndex),
      extension: baseName.slice(dotIndex + 1),
    };
  }

  return { title: baseName, extension: "" };
}

export class TelegarmBot {
  instance: GrammyBot<TelegramBotContext>;
  webhookHandler: ReturnType<typeof webhookCallback>;
  private mediaGroupBuffer = new Map<
    string,
    { messages: GrammyContext[]; timer: ReturnType<typeof setTimeout> }
  >();
  conversations: {
    path: string;
    handler: (
      conversation: Conversation<any>,
      ctx: GrammyContext & GrammyConversationFlavor,
    ) => void;
  }[] = [];

  constructor() {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      return;
    }

    this.instance = new GrammyBot<TelegramBotContext>(
      TELEGRAM_SERVICE_BOT_TOKEN || "",
    );

    this.addServiceActions();

    this.webhookHandler = webhookCallback(this.instance, "hono") as any;
  }

  addServiceActions() {
    this.instance.command(["cancel", "exit", "stop"], async (ctx) => {
      await ctx.conversation.exit();
      await ctx.reply("Leaving.");
    });
  }

  private getTelegramMessageThreadId(props: { ctx: GrammyContext }) {
    const messageThreadId = (props.ctx.message as any)?.message_thread_id;

    if (messageThreadId === undefined || messageThreadId === null) {
      return undefined;
    }

    return String(messageThreadId);
  }

  private isTelegramForumTopicServiceMessage(props: { ctx: GrammyContext }) {
    const message = props.ctx.message as any;

    return Boolean(
      message?.forum_topic_edited ||
        message?.forum_topic_closed ||
        message?.forum_topic_reopened ||
        message?.general_forum_topic_hidden ||
        message?.general_forum_topic_unhidden,
    );
  }

  private getTelegramForumTopicCreated(props: { ctx: GrammyContext }) {
    const message = props.ctx.message as any;

    if (!message?.forum_topic_created) {
      return;
    }

    const messageThreadId = this.getTelegramMessageThreadId({
      ctx: props.ctx,
    });

    if (!messageThreadId) {
      return;
    }

    return {
      messageThreadId,
    };
  }

  private async signSubjectJwt(props: { rbacModuleSubject: IRbacSubject }) {
    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET is not set");
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new Error(
        "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS is not set",
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

  private runInBackground(props: { label: string; task: () => Promise<void> }) {
    void props.task().catch((error) => {
      console.error(
        `🚀 ~ TelegarmBot ~ ${props.label} ~ background error:`,
        error?.message || error,
      );
    });
  }

  /**
   * Should be called after routes and conversations are added
   */
  init() {
    this.instance.on("chat_member", async (ctx) => {
      console.log("🚀 ~ init ~ ctx:", ctx);
      //
    });

    this.instance.on("channel_post", async (ctx) => {
      console.log("🚀 ~ init ~ ctx:", ctx);
      //
    });

    this.instance.on("callback_query:data", async (ctx) => {
      console.log(
        "🚀 ~ TelegarmBot ~ init ~ ctx.callbackQuery:",
        ctx.callbackQuery,
      );

      void ctx
        .answerCallbackQuery({
          text: `You clicked: ${ctx.callbackQuery.data}`,
        })
        .catch((error) => {
          console.error(
            "🚀 ~ TelegarmBot ~ callback_query:data ~ answer error:",
            error?.message || error,
          );
        });

      this.runInBackground({
        label: "callback_query:data",
        task: async () => {
          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
          }

          if (!RBAC_JWT_SECRET) {
            throw new Error("Configuration error. RBAC_JWT_SECRET is not set");
          }

          if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
            throw new Error(
              "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS is not set",
            );
          }

          const callbackMessage = ctx.callbackQuery.message as any;
          const callbackMessageThreadId =
            callbackMessage?.message_thread_id !== undefined &&
            callbackMessage?.message_thread_id !== null
              ? String(callbackMessage.message_thread_id)
              : undefined;

          const {
            rbacModuleSubject,
            socialModuleProfile,
            socialModuleChat,
            socialModuleThread,
          } =
            await this.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate(
              {
                ctx,
                telegram: callbackMessageThreadId
                  ? {
                      messageThreadId: callbackMessageThreadId,
                      isTopicMessage: Boolean(
                        callbackMessage?.is_topic_message,
                      ),
                    }
                  : undefined,
              },
            );

          console.log("🚀 ~ init ~ rbacModuleSubject:", rbacModuleSubject);

          const jwtToken = await jwt.sign(
            {
              exp:
                Math.floor(Date.now() / 1000) +
                RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
              iat: Math.floor(Date.now() / 1000),
              subject: rbacModuleSubject,
            },
            RBAC_JWT_SECRET,
          );

          await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdActionCreate(
            {
              id: rbacModuleSubject.id,
              socialModuleChatId: socialModuleChat.id,
              socialModuleProfileId: socialModuleProfile.id,
              data: {
                socialModuleThreadId: socialModuleThread.id,
                payload: {
                  telegram: {
                    callback_query: ctx.callbackQuery,
                  },
                },
              },
              options: {
                headers: {
                  Authorization: "Bearer " + jwtToken,
                },
              },
            },
          );
        },
      });

      return;
    });

    // Telegram Stars requires answering the pre-checkout query, otherwise Telegram will not send the payment to completion.
    /**
     * update: {
    update_id: 811067301,
    pre_checkout_query: {
      id: "2365707987652326824",
      from: {
        id: 450805355,
        is_bot: false,
        first_name: "NAME",
        username: "slug",
        language_code: "ru",
        is_premium: true,
      },
      currency: "XTR",
      total_amount: 1,
      invoice_payload: "123",
    },
  },
     */
    this.instance.on("pre_checkout_query", async (ctx) => {
      try {
        console.log("🚀 ~ init ~ pre_checkout_query ~ ctx.update:", ctx.update);

        await ctx.answerPreCheckoutQuery(true);
        return;
      } catch (error: any) {
        console.log("🚀 ~ init ~ pre_checkout_query ~ error:", error.message);
        return;
      }
    });

    // Handle successful payment update to finalize flow and notify the user.
    /**
     * update: {
    update_id: 811067302,
    message: {
      message_id: 1833,
      from: {
        id: 450805355,
        is_bot: false,
        first_name: "NAME",
        username: "slug",
        language_code: "ru",
        is_premium: true,
      },
      chat: {
        id: 450805355,
        first_name: "NAME",
        username: "slug",
        type: "private",
      },
      date: 1766269675,
      successful_payment: {
        currency: "XTR",
        total_amount: 1,
        invoice_payload: "123",
        telegram_payment_charge_id: "stxg0Uc3yXT5P7_DbX8cufsr4Ioxybu62SQsfCnGUSpalt-EQwyRzNt04ssHyggdsJ5DWRLxOQi64aJ1duinyQvpAEGcFMB90E54riVs-U8bS4",
        provider_payment_charge_id: "550809313_1",
      },
    },
  },
     */
    this.instance.on("message:successful_payment", async (ctx) => {
      console.log(
        "🚀 ~ init ~ message:successful_payment ~ payment:",
        ctx.message.successful_payment,
      );

      this.runInBackground({
        label: "message:successful_payment",
        task: async () => {
          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
          }

          await billingModulePaymentIntentApi.providerWebhook({
            data: {
              provider: "telegram-star",
              currency: "XTR",
              invoice_payload: ctx.message.successful_payment.invoice_payload,
              provider_payment_charge_id:
                ctx.message.successful_payment.provider_payment_charge_id,
              telegram_payment_charge_id:
                ctx.message.successful_payment.telegram_payment_charge_id,
              total_amount: ctx.message.successful_payment.total_amount,
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });
        },
      });

      return;
    });

    this.instance.on("message", async (ctx) => {
      console.log("🚀 ~ init ~ on message ~ ctx.message", ctx.message);

      const telegramForumTopicCreated = this.getTelegramForumTopicCreated({
        ctx,
      });

      if (telegramForumTopicCreated) {
        this.runInBackground({
          label: "message:forum_topic_created",
          task: async () => {
            await this.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate(
              {
                ctx,
                telegram: {
                  messageThreadId: telegramForumTopicCreated.messageThreadId,
                  isTopicMessage: true,
                },
              },
            );
          },
        });

        return;
      }

      if (
        this.isTelegramForumTopicServiceMessage({
          ctx,
        })
      ) {
        return;
      }

      const mediaGroupId = ctx.message?.media_group_id;

      if (mediaGroupId) {
        const existing = this.mediaGroupBuffer.get(mediaGroupId);
        const messages = existing?.messages ?? [];
        messages.push(ctx);

        if (existing?.timer) {
          clearTimeout(existing.timer);
        }

        const timer = setTimeout(() => {
          this.flushMediaGroup({
            mediaGroupId,
          }).catch((error) => {
            console.error(
              "🚀 ~ flushMediaGroup ~ error:",
              error?.message || error,
            );
          });
        }, 600);

        this.mediaGroupBuffer.set(mediaGroupId, { messages, timer });
        return;
      }

      this.runInBackground({
        label: "message",
        task: async () => {
          await this.handleIncomingMessage({
            ctx,
            data: await this.buildTelegramMessageData({ ctx }),
          });
        },
      });

      return;
    });
  }

  async run() {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN is not set",
      );
    }

    const endpoint = NEXT_PUBLIC_TELEGRAM_SERVICE_URL + "/api/telegram";

    const res = await this.instance.api.setWebhook(endpoint, {
      // Empty list resets any previous webhook update filter and enables all updates.
      allowed_updates: [],
    });

    return res;
  }

  async stop() {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN is not set",
      );
    }

    const res = await this.instance.api.deleteWebhook();

    return res;
  }

  async rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate(props: {
    ctx: GrammyContext;
    telegram?: {
      messageText?: string;
      messageThreadId?: string;
      isTopicMessage?: boolean;
    };
  }): Promise<{
    rbacModuleSubject: IRbacSubject;
    socialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
    socialModuleThread: ISocialModuleThread;
  }> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    if (!props.ctx.from?.id) {
      throw new Error("Validation error. Telegram user id is required");
    }

    if (!props.ctx.chat?.id) {
      throw new Error("Validation error. Telegram chat id is required");
    }

    const messageText =
      props.telegram?.messageText ||
      props.ctx.message?.text ||
      props.ctx.message?.caption;
    const messageThreadId =
      props.telegram?.messageThreadId ||
      this.getTelegramMessageThreadId({
        ctx: props.ctx,
      });

    const bootstrap = await rbacModuleSubjectApi.telegramBootstrap({
      data: {
        telegram: {
          fromId: props.ctx.from.id,
          chatId: props.ctx.chat.id,
          messageText,
          messageThreadId,
          isTopicMessage:
            props.telegram?.isTopicMessage ??
            Boolean((props.ctx.message as any)?.is_topic_message),
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    await this.synchronizeRbacModuleRole({
      ctx: props.ctx,
      rbacModuleSubject: bootstrap.rbacModuleSubject,
    });

    await this.checkoutFreeSubscriptionEcommerceModuleProducts({
      ctx: props.ctx,
      rbacModuleSubject: bootstrap.rbacModuleSubject,
    });

    return {
      rbacModuleSubject: bootstrap.rbacModuleSubject,
      socialModuleProfile: bootstrap.socialModuleProfile,
      socialModuleChat: bootstrap.socialModuleChat,
      socialModuleThread: bootstrap.socialModuleThread,
    };
  }

  async synchronizeRbacModuleRole(props: {
    ctx: GrammyContext;
    rbacModuleSubject: IRbacSubject;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. 'RBAC_SECRET_KEY' no set.");
    }
    let memberStatus: string | undefined;

    if (
      TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID &&
      props.ctx.from?.id
    ) {
      const member = await props.ctx.api.getChatMember(
        TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID,
        props.ctx.from.id,
      );

      memberStatus = member.status;
    }

    await rbacModuleSubjectApi.telegramSyncMembership({
      id: props.rbacModuleSubject.id,
      data: {
        memberStatus,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });
  }

  async checkoutFreeSubscriptionEcommerceModuleProducts(props: {
    ctx: GrammyContext;
    rbacModuleSubject: IRbacSubject;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. 'RBAC_SECRET_KEY' no set.");
    }

    if (!props.ctx.chatId) {
      return;
    }

    await rbacModuleSubjectApi.telegramCheckoutFreeSubscription({
      id: props.rbacModuleSubject.id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
      data: {
        chatId: String(props.ctx.chatId),
      },
    });
  }

  private async buildTelegramMessageData(props: { ctx: GrammyContext }) {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN is not set",
      );
    }

    const message = props.ctx.message;
    const description = message?.text || message?.caption || "";
    const sourceSystemId = message?.message_id?.toString() || "";

    if (!message) {
      return { description, sourceSystemId };
    }

    const attachments: TelegramAttachmentCandidate[] = [];

    if (message.photo?.length) {
      const photo = message.photo[message.photo.length - 1];
      attachments.push({
        fileId: photo.file_id,
        title: `photo-${photo.file_unique_id}`,
        mimeType: "image/jpeg",
      });
    }

    if (message.document) {
      attachments.push({
        fileId: message.document.file_id,
        fileName: message.document.file_name,
        title: message.document.file_name
          ? splitFileName(message.document.file_name).title
          : `document-${message.document.file_unique_id}`,
        mimeType: message.document.mime_type,
      });
    }

    if (message.video) {
      attachments.push({
        fileId: message.video.file_id,
        fileName: message.video.file_name,
        title: message.video.file_name
          ? splitFileName(message.video.file_name).title
          : `video-${message.video.file_unique_id}`,
        mimeType: message.video.mime_type,
      });
    }

    if (message.audio) {
      attachments.push({
        fileId: message.audio.file_id,
        fileName: message.audio.file_name,
        title: message.audio.file_name
          ? splitFileName(message.audio.file_name).title
          : `audio-${message.audio.file_unique_id}`,
        mimeType: message.audio.mime_type,
      });
    }

    if (!attachments.length) {
      return { description, sourceSystemId };
    }

    const files = await this.buildTelegramFiles({
      ctx: props.ctx,
      attachments,
    });

    return {
      description,
      sourceSystemId,
      files,
    };
  }

  private async buildTelegramMessageDataFromMessages(props: {
    ctx: GrammyContext;
    messages: GrammyContext[];
  }) {
    const messageList = props.messages
      .map((item) => item.message)
      .filter(Boolean);

    const description =
      messageList.find((message) => message?.caption || message?.text)
        ?.caption ||
      messageList.find((message) => message?.text)?.text ||
      "";

    const sourceSystemId =
      messageList.find((message) => message?.media_group_id)?.media_group_id ||
      messageList[0]?.message_id?.toString() ||
      "";

    const attachments = messageList.flatMap((message) =>
      this.extractTelegramAttachments(message),
    );

    if (!attachments.length) {
      return { description, sourceSystemId };
    }

    const files = await this.buildTelegramFiles({
      ctx: props.ctx,
      attachments,
    });

    return {
      description,
      sourceSystemId,
      files,
    };
  }

  private extractTelegramAttachments(
    message: any,
  ): TelegramAttachmentCandidate[] {
    const attachments: TelegramAttachmentCandidate[] = [];

    if (message?.photo?.length) {
      const photo = message.photo[message.photo.length - 1];
      attachments.push({
        fileId: photo.file_id,
        title: `photo-${photo.file_unique_id}`,
        mimeType: "image/jpeg",
      });
    }

    if (message?.document) {
      attachments.push({
        fileId: message.document.file_id,
        fileName: message.document.file_name,
        title: message.document.file_name
          ? splitFileName(message.document.file_name).title
          : `document-${message.document.file_unique_id}`,
        mimeType: message.document.mime_type,
      });
    }

    if (message?.video) {
      attachments.push({
        fileId: message.video.file_id,
        fileName: message.video.file_name,
        title: message.video.file_name
          ? splitFileName(message.video.file_name).title
          : `video-${message.video.file_unique_id}`,
        mimeType: message.video.mime_type,
      });
    }

    if (message?.audio) {
      attachments.push({
        fileId: message.audio.file_id,
        fileName: message.audio.file_name,
        title: message.audio.file_name
          ? splitFileName(message.audio.file_name).title
          : `audio-${message.audio.file_unique_id}`,
        mimeType: message.audio.mime_type,
      });
    }

    return attachments;
  }

  private async buildTelegramFiles(props: {
    ctx: GrammyContext;
    attachments: TelegramAttachmentCandidate[];
  }) {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN is not set",
      );
    }

    const uniqueAttachments = new Map(
      props.attachments.map((attachment) => [attachment.fileId, attachment]),
    );

    return blobifyFiles({
      files: await Promise.all(
        [...uniqueAttachments.values()].map(async (attachment) => {
          const fileInfo = await props.ctx.api.getFile(attachment.fileId);

          if (!fileInfo.file_path) {
            throw new Error(
              `Telegram file_path missing for file_id ${attachment.fileId}`,
            );
          }

          const inferred = splitFileName(
            attachment.fileName || fileInfo.file_path,
          );
          const title = attachment.title || inferred.title || attachment.fileId;
          const extension = inferred.extension || "bin";
          const type = attachment.mimeType || "application/octet-stream";
          const url = `https://api.telegram.org/file/bot${TELEGRAM_SERVICE_BOT_TOKEN}/${fileInfo.file_path}`;

          return {
            title,
            extension,
            type,
            url,
          };
        }),
      ),
    });
  }

  private async handleIncomingMessage(props: {
    ctx: GrammyContext;
    data: {
      description: string;
      sourceSystemId: string;
      files?: File[];
    };
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET is not set");
    }

    if (!RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS) {
      throw new Error(
        "Configuration error. RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS is not set",
      );
    }

    if (!TELEGRAM_SERVICE_BOT_USERNAME) {
      throw new Error(
        "Configuration error. 'TELEGRAM_SERVICE_BOT_USERNAME' is not set",
      );
    }

    const {
      rbacModuleSubject,
      socialModuleProfile,
      socialModuleChat,
      socialModuleThread,
    } = await this.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate({
      ctx: props.ctx,
    });

    const jwtToken = await this.signSubjectJwt({ rbacModuleSubject });

    const sanitizedDescription = props.data.description.replaceAll(
      `@${TELEGRAM_SERVICE_BOT_USERNAME} `,
      "",
    );

    const isGroup = props.ctx.chat?.id && props.ctx.chat.id < 0;
    const isMentioned =
      props.ctx.message?.text &&
      props.ctx.message.text.startsWith(`@${TELEGRAM_SERVICE_BOT_USERNAME}`);

    if (!isGroup) {
      return await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
        {
          id: rbacModuleSubject.id,
          socialModuleChatId: socialModuleChat.id,
          socialModuleThreadId: socialModuleThread.id,
          socialModuleProfileId: socialModuleProfile.id,
          data: { ...props.data, description: sanitizedDescription },
          options: {
            headers: {
              Authorization: "Bearer " + jwtToken,
            },
          },
        },
      );
    }

    if (isMentioned) {
      return await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
        {
          id: rbacModuleSubject.id,
          socialModuleChatId: socialModuleChat.id,
          socialModuleThreadId: socialModuleThread.id,
          socialModuleProfileId: socialModuleProfile.id,
          data: { ...props.data, description: sanitizedDescription },
          options: {
            headers: {
              Authorization: "Bearer " + jwtToken,
            },
          },
        },
      );
    }

    return;
  }

  private async flushMediaGroup(props: { mediaGroupId: string }) {
    const entry = this.mediaGroupBuffer.get(props.mediaGroupId);

    if (!entry) {
      return;
    }

    this.mediaGroupBuffer.delete(props.mediaGroupId);

    const ctx = entry.messages[0];
    if (!ctx) {
      return;
    }

    const data = await this.buildTelegramMessageDataFromMessages({
      ctx,
      messages: entry.messages,
    });

    await this.handleIncomingMessage({
      ctx,
      data,
    });
  }
}
