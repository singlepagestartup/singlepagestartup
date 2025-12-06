import {
  NEXT_PUBLIC_TELEGRAM_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
  TELEGRAM_SERVICE_BOT_TOKEN,
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
import { api as rbacModuleIdentityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as rbacModuleSubjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as rbacModuleSubjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { api as socialModuleChatApi } from "@sps/social/models/chat/sdk/server";
import * as jwt from "hono/jwt";

export type TelegramBotContext = GrammyContext & GrammyConversationFlavor;

export class TelegarmBot {
  instance: GrammyBot<TelegramBotContext>;
  webhookHandler: ReturnType<typeof webhookCallback>;
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

  /**
   * Should be called after routes and conversations are added
   */
  init() {
    this.instance.on("callback_query:data", async (ctx, next) => {
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

      const { rbacModuleSubject, socialModuleProfile, socialModuleChat } =
        await this.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate({
          ctx,
        });

      const jwtToken = await jwt.sign(
        {
          exp:
            Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
          iat: Math.floor(Date.now() / 1000),
          subject: rbacModuleSubject,
        },
        RBAC_JWT_SECRET,
      );

      console.log(
        "🚀 ~ TelegarmBot ~ init ~ ctx.callbackQuery:",
        ctx.callbackQuery,
      );

      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdActionCreate(
        {
          id: rbacModuleSubject.id,
          socialModuleChatId: socialModuleChat.id,
          socialModuleProfileId: socialModuleProfile.id,
          data: {
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

      ctx.answerCallbackQuery({
        text: `You clicked: ${ctx.callbackQuery.data}`,
      });

      return;
    });

    this.instance.command("start", async (ctx) => {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
      }

      const payload = ctx.match;

      if (payload) {
        ctx.reply(payload);
      }

      const { rbacModuleSubject, socialModuleProfile, socialModuleChat } =
        await this.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate({
          ctx,
        });

      ctx.reply(
        `Hello, ${rbacModuleSubject.slug}! Your chat id: ${socialModuleChat.sourceSystemId}`,
      );
    });

    this.instance.on("message", async (ctx) => {
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

      console.log("🚀 ~ init ~ on message ~ ctx.message", ctx.message);

      const { rbacModuleSubject, socialModuleProfile, socialModuleChat } =
        await this.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate({
          ctx,
        });

      const jwtToken = await jwt.sign(
        {
          exp:
            Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
          iat: Math.floor(Date.now() / 1000),
          subject: rbacModuleSubject,
        },
        RBAC_JWT_SECRET,
      );

      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: rbacModuleSubject.id,
          socialModuleChatId: socialModuleChat.id,
          socialModuleProfileId: socialModuleProfile.id,
          data: {
            description: ctx.message.text || "",
            sourceSystemId: ctx.message?.message_id?.toString() || "",
          },
          options: {
            headers: {
              Authorization: "Bearer " + jwtToken,
            },
          },
        },
      );

      // ctx.reply("", {
      //   parse_mode: "HTML",
      //   reply_markup: {
      //     inline_keyboard: [
      //       [
      //         {
      //           text: "React",
      //           callback_data: "react",
      //         },
      //       ],
      //     ],
      //   },
      // });
    });
  }

  async run() {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN is not set",
      );
    }

    const endpoint = NEXT_PUBLIC_TELEGRAM_SERVICE_URL + "/api/telegram";

    const res = await this.instance.api.setWebhook(endpoint);

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
  }): Promise<{
    rbacModuleSubject: IRbacSubject;
    socialModuleProfile: ISocialModuleProfile;
    socialModuleChat: ISocialModuleChat;
  }> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    let subject: IRbacSubject | null = null;
    let profile: ISocialModuleProfile | null = null;
    let chat: ISocialModuleChat | null = null;

    const identities = await rbacModuleIdentityApi.find({
      params: {
        filters: {
          and: [
            {
              column: "account",
              method: "eq",
              value: props.ctx.from?.id.toString() || "",
            },
            {
              column: "provider",
              method: "eq",
              value: "telegram",
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (identities?.length) {
      if (identities.length > 1) {
        throw new Error(
          "Internal error. Multiple identities found for the same account and type",
        );
      }

      const identity = identities[0];

      const subjectsToIdentities = await rbacModuleSubjectsToIdentitiesApi.find(
        {
          params: {
            filters: {
              and: [
                {
                  column: "identityId",
                  method: "eq",
                  value: identity.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        },
      );

      if (subjectsToIdentities?.length) {
        if (subjectsToIdentities.length > 1) {
          throw new Error(
            "Internal error. Multiple subjects to identities found for the same identity",
          );
        }

        const rbacModuleSubject = await rbacModuleSubjectApi.findById({
          id: subjectsToIdentities[0].subjectId,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });

        if (!rbacModuleSubject) {
          throw new Error(
            "Internal error. Subject not found for the given subjectId",
          );
        }

        subject = rbacModuleSubject;
      } else {
        const rbacModuleSubject = await rbacModuleSubjectApi.create({
          data: {},
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        await rbacModuleSubjectsToIdentitiesApi.create({
          data: {
            subjectId: rbacModuleSubject.id,
            identityId: identity.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        subject = rbacModuleSubject;
      }
    } else {
      const identity = await rbacModuleIdentityApi.create({
        data: {
          account: props.ctx.from?.id.toString() || "",
          provider: "telegram",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!identity) {
        throw new Error("Internal error. Identity not created");
      }

      const rbacModuleSubject = await rbacModuleSubjectApi.create({
        data: {},
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      await rbacModuleSubjectsToIdentitiesApi.create({
        data: {
          subjectId: rbacModuleSubject.id,
          identityId: identity.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!rbacModuleSubject) {
        throw new Error("Internal error. Subject not created");
      }

      subject = rbacModuleSubject;
    }

    const rbacModuleSubjectsToSocialModuleProfiles =
      await rbacModuleSubjectsToSocialModuleProfilesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: subject.id,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (rbacModuleSubjectsToSocialModuleProfiles?.length) {
      const socialModuleProfiles = await socialModuleProfileApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: rbacModuleSubjectsToSocialModuleProfiles.map(
                  (entity) => entity.socialModuleProfileId,
                ),
              },
              {
                column: "variant",
                method: "eq",
                value: "telegram",
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (socialModuleProfiles?.length) {
        if (socialModuleProfiles.length > 1) {
          throw new Error(
            "Internal error. Multiple social module profiles found for the same subject",
          );
        }

        profile = socialModuleProfiles[0];
      } else {
        const socialModuleProfile = await socialModuleProfileApi.create({
          data: {
            variant: "telegram",
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        await rbacModuleSubjectsToSocialModuleProfilesApi.create({
          data: {
            subjectId: subject.id,
            socialModuleProfileId: socialModuleProfile.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        profile = socialModuleProfile;
      }
    } else {
      const socialModuleProfile = await socialModuleProfileApi.create({
        data: {
          variant: "telegram",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      await rbacModuleSubjectsToSocialModuleProfilesApi.create({
        data: {
          subjectId: subject.id,
          socialModuleProfileId: socialModuleProfile.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      profile = socialModuleProfile;
    }

    const socialModuleProfilesToChats =
      await socialModuleProfilesToChatsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: profile.id,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!socialModuleProfilesToChats?.length) {
      chat = await socialModuleChatApi.create({
        data: {
          variant: "telegram",
          sourceSystemId: props.ctx.chat?.id.toString() || "",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      await socialModuleProfilesToChatsApi.create({
        data: {
          profileId: profile.id,
          chatId: chat.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });
    } else {
      const socialModuleChats = await socialModuleChatApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: socialModuleProfilesToChats.map(
                  (entity) => entity.chatId,
                ),
              },
              {
                column: "variant",
                method: "eq",
                value: "telegram",
              },
              {
                column: "sourceSystemId",
                method: "eq",
                value: props.ctx.chat?.id.toString() || "",
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (socialModuleChats?.length) {
        if (socialModuleChats.length > 1) {
          throw new Error(
            "Internal error. Multiple social module chats found for the same profile",
          );
        }

        chat = socialModuleChats[0];
      } else {
        chat = await socialModuleChatApi.create({
          data: {
            variant: "telegram",
            sourceSystemId: props.ctx.chat?.id.toString() || "",
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        await socialModuleProfilesToChatsApi.create({
          data: {
            profileId: profile.id,
            chatId: chat.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      }
    }

    return {
      rbacModuleSubject: subject,
      socialModuleProfile: profile,
      socialModuleChat: chat,
    };
  }
}
