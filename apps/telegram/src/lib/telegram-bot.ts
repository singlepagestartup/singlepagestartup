import {
  NEXT_PUBLIC_TELEGRAM_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
  TELEGRAM_SERVICE_BOT_TOKEN,
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
import { api as rbacModuleIdentityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as rbacModuleRoleApi } from "@sps/rbac/models/role/sdk/server";
import { api as rbacModuleSubjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as rbacModuleSubjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { api as rbacModuleSubjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleAttributeKeyApi } from "@sps/social/models/attribute-key/sdk/server";
import { api as socialModuleAttributeApi } from "@sps/social/models/attribute/sdk/server";
import { api as socialModuleProfilesToAttributesApi } from "@sps/social/relations/profiles-to-attributes/sdk/server";
import { api as socialModuleAttributeKeysToAttributesApi } from "@sps/social/relations/attribute-keys-to-attributes/sdk/server";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { IModel as ISocialModuleAttributeKey } from "@sps/social/models/attribute-key/sdk/model";
import { IModel as ISocialModuleAttribute } from "@sps/social/models/attribute/sdk/model";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleAttributeKeysToAttributes } from "@sps/social/relations/attribute-keys-to-attributes/sdk/model";
import { IModel as ISocialModuleProfilesToAttributes } from "@sps/social/relations/profiles-to-attributes/sdk/model";
import { api as socialModuleChatApi } from "@sps/social/models/chat/sdk/server";
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

    this.instance.on("callback_query:data", async (ctx, next) => {
      console.log(
        "🚀 ~ TelegarmBot ~ init ~ ctx.callbackQuery:",
        ctx.callbackQuery,
      );

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

        return await ctx.answerPreCheckoutQuery(true);
      } catch (error: any) {
        console.log("🚀 ~ init ~ pre_checkout_query ~ error:", error.message);
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
      });
    });

    this.instance.on("message", async (ctx) => {
      console.log("🚀 ~ init ~ on message ~ ctx.message", ctx.message);

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

      await this.handleIncomingMessage({
        ctx,
        data: await this.buildTelegramMessageData({ ctx }),
      });
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
    let registration = false;

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

      registration = true;
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

    if (
      registration &&
      props.ctx?.message?.text &&
      props.ctx.message.text.startsWith("/start") &&
      props.ctx.message.text.replace("/start ", "")
    ) {
      const referralCode = props.ctx.message.text.replace("/start ", "");

      console.log(
        "🚀 ~ rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate ~ referralCode:",
        referralCode,
      );

      let socialModuleReferrerAttributeKey: ISocialModuleAttributeKey;

      const socialModuleAttributeKeys = await socialModuleAttributeKeyApi.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: "referrer",
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

      if (socialModuleAttributeKeys?.length) {
        socialModuleReferrerAttributeKey = socialModuleAttributeKeys[0];
      } else {
        socialModuleReferrerAttributeKey =
          await socialModuleAttributeKeyApi.create({
            data: {
              adminTitle: "Referrer",
              title: {
                ru: "Реферрер",
                en: "Referrer",
              },
              slug: "referrer",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });
      }

      let socialModuleReferrerAttribute: ISocialModuleAttribute;

      const socialModuleAttributes = await socialModuleAttributeApi.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: `${profile.id}-invitedby-${referralCode}`,
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

      if (socialModuleAttributes?.length) {
        socialModuleReferrerAttribute = socialModuleAttributes[0];
      } else {
        socialModuleReferrerAttribute = await socialModuleAttributeApi.create({
          data: {
            adminTitle: `${profile.id} | Referral Code | ${referralCode}`,
            string: {
              ru: referralCode,
              en: referralCode,
            },
            slug: `${profile.id}-invitedby-${referralCode}`,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      }

      let socialModuleReferrerAttributeKeyToReferrerAttribute: ISocialModuleAttributeKeysToAttributes;

      const socialModuleAttributeKeysToAttributes =
        await socialModuleAttributeKeysToAttributesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeKeyId",
                  method: "eq",
                  value: socialModuleReferrerAttributeKey.id,
                },
                {
                  column: "attributeId",
                  method: "eq",
                  value: socialModuleReferrerAttribute.id,
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

      if (!socialModuleAttributeKeysToAttributes?.length) {
        socialModuleReferrerAttributeKeyToReferrerAttribute =
          await socialModuleAttributeKeysToAttributesApi.create({
            data: {
              attributeKeyId: socialModuleReferrerAttributeKey.id,
              attributeId: socialModuleReferrerAttribute.id,
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });
      }

      let socialModuleProfileToAttribute: ISocialModuleProfilesToAttributes;

      const socialModuleProfilesToAttributes =
        await socialModuleProfilesToAttributesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "profileId",
                  method: "eq",
                  value: profile.id,
                },
                {
                  column: "attributeId",
                  method: "eq",
                  value: socialModuleReferrerAttribute.id,
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

      if (!socialModuleProfilesToAttributes?.length) {
        socialModuleProfileToAttribute =
          await socialModuleProfilesToAttributesApi.create({
            data: {
              profileId: profile.id,
              attributeId: socialModuleReferrerAttribute.id,
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
      }
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

    const telegramBotAgentSocialModuleProfiles =
      await socialModuleProfileApi.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "inArray",
                value: ["agent", "artificial-intelligence"],
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

    if (telegramBotAgentSocialModuleProfiles?.length) {
      const socialModuleProfilesToChats =
        await socialModuleProfilesToChatsApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "chatId",
                  method: "eq",
                  value: chat.id,
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

      if (socialModuleProfilesToChats?.length) {
        for (const telegramBotAgentSocialModuleProfile of telegramBotAgentSocialModuleProfiles) {
          const existingSocialModuleProfilesToChats =
            socialModuleProfilesToChats.find((socialModuleProfileToChat) => {
              return (
                socialModuleProfileToChat.profileId ===
                telegramBotAgentSocialModuleProfile.id
              );
            });

          if (!existingSocialModuleProfilesToChats) {
            await socialModuleProfilesToChatsApi.create({
              data: {
                profileId: telegramBotAgentSocialModuleProfile.id,
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
      }
    }

    return {
      rbacModuleSubject: subject,
      socialModuleProfile: profile,
      socialModuleChat: chat,
    };
  }

  async synchronizeRbacModuleRole(props: {
    ctx: GrammyContext;
    rbacModuleSubject: IRbacSubject;
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. 'RBAC_SECRET_KEY' no set.");
    }
    if (
      TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID &&
      props.ctx.from?.id
    ) {
      const member = await props.ctx.api.getChatMember(
        TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_ID,
        props.ctx.from.id,
      );

      const rbacModuleRoles = await rbacModuleRoleApi.find({
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const requiredTelegramChannelSubscriptionRbacModuleRole =
        rbacModuleRoles?.find((role) => {
          return role.slug === "required-telegram-channel-subscriber";
        });

      if (!requiredTelegramChannelSubscriptionRbacModuleRole) {
        return;
      }

      const rbacModuleSubjectsToRoles = await rbacModuleSubjectsToRolesApi.find(
        {
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: props.rbacModuleSubject.id,
                },
                {
                  column: "roleId",
                  method: "eq",
                  value: requiredTelegramChannelSubscriptionRbacModuleRole.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        },
      );

      if (
        ["administrator", "member", "creator"].includes(member.status) &&
        !rbacModuleSubjectsToRoles?.length
      ) {
        await rbacModuleSubjectsToRolesApi.create({
          data: {
            subjectId: props.rbacModuleSubject.id,
            roleId: requiredTelegramChannelSubscriptionRbacModuleRole.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      } else if (
        ["restricted", "left", "kicked"].includes(member.status) &&
        rbacModuleSubjectsToRoles?.length
      ) {
        for (const rbacModuleSubjectsToRole of rbacModuleSubjectsToRoles) {
          if (
            rbacModuleSubjectsToRole.roleId !==
            requiredTelegramChannelSubscriptionRbacModuleRole.id
          ) {
            continue;
          }

          await rbacModuleSubjectsToRolesApi.delete({
            id: rbacModuleSubjectsToRole.id,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        }
        // left
      }

      console.log("🚀 ~ init ~ member:", member);
    }

    const availableOnRegistrationRbacModuleRoles = await rbacModuleRoleApi.find(
      {
        params: {
          filters: {
            and: [
              {
                column: "availableOnRegistration",
                method: "eq",
                value: true,
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

    if (availableOnRegistrationRbacModuleRoles?.length) {
      const rbacModuleSubjectsToRoles = await rbacModuleSubjectsToRolesApi.find(
        {
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: props.rbacModuleSubject.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "Cache-Control": "no-store",
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        },
      );

      const toAddRoles = availableOnRegistrationRbacModuleRoles.filter(
        (role) => {
          return !rbacModuleSubjectsToRoles
            ?.map((subjectToRole) => {
              return subjectToRole.roleId;
            })
            .includes(role.id);
        },
      );

      if (toAddRoles.length) {
        for (const toAddRole of toAddRoles) {
          await rbacModuleSubjectsToRolesApi.create({
            data: {
              subjectId: props.rbacModuleSubject.id,
              roleId: toAddRole.id,
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        }
      }

      console.log("🚀 ~ synchronizeRbacModuleRole ~ toAddRoleIds:", toAddRoles);
    }
    //
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

    const { rbacModuleSubject, socialModuleProfile, socialModuleChat } =
      await this.rbacModuleSubjectWithSocialModuleProfileAndChatFindOrCreate({
        ctx: props.ctx,
      });

    await this.synchronizeRbacModuleRole({
      ctx: props.ctx,
      rbacModuleSubject,
    });

    const jwtToken = await jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
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
        data: props.data,
        options: {
          headers: {
            Authorization: "Bearer " + jwtToken,
          },
        },
      },
    );
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
