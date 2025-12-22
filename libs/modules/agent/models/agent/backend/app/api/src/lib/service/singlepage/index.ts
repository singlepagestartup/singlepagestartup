import "reflect-metadata";
import { injectable } from "inversify";
import {
  TELEGRAM_SERVICE_BOT_USERNAME,
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/agent/models/agent/backend/repository/database";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import { IModel as ISocialModuleAction } from "@sps/social/models/action/sdk/model";
import { IModel as IRbacModuleSubject } from "@sps/rbac/models/subject/sdk/model";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import { api as rbacModuleSubjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as ecommerceModuleAttributeKeysToAttributesApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";
import { api as ecommerceModuleAttributesToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/server";
import { api as ecommerceModuleAttributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { api as ecommerceModuleAttributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import { api as ecommerceModuleProductApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as rbacModuleRoleApi } from "@sps/rbac/models/role/sdk/server";
import { IModel as IEcommerceModuleProductsToFileStorageFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/model";
import { api as ecommerceModuleProductsToFileStorageFilesApi } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/server";
import { api as ecommerceModuleProductsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { api as rbacModuleRolesToEcommerceModuleProductsApi } from "@sps/rbac/relations/roles-to-ecommerce-module-products/sdk/server";
import { api as rbacModuleSubjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import * as jwt from "hono/jwt";
import {
  blobifyFiles,
  logger,
  telegramMarkdownFormatter,
} from "@sps/backend-utils";
import { OpenRouter } from "@sps/shared-third-parties";

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
  telegramBotCommands = ["/start", "/help", "/referral", "/premium"];

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
      await rbacModuleSubjectsToSocialModuleProfilesApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

    if (!rbacModuleSubjectsToSocialModuleProfiles?.length) {
      return;
    }

    const rbacModuleSubject = await rbacModuleSubjectApi.findById({
      id: rbacModuleSubjectsToSocialModuleProfiles[0].subjectId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
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
      await fileStorageModuleFileApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

    const data = {
      description: "Welcome to the club, Buddy\\!",
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

    rbacModuleSubjectApi
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
      description: "Here is our menu, select what you want\\.",
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

    rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate({
      id: props.rbacModuleSubject.id,
      socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
      socialModuleChatId: props.socialModuleChat.id,
      data,
      options: {
        headers: {
          Authorization: "Bearer " + props.jwtToken,
        },
      },
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
      return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description: "\\'ecommerceModuleProductId\\' not passed.",
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
            description: "\\'extendedEcommerceModuleProduct\\' not found.",
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
      description: "You can subscribe by the clicking buttons below",
    };

    const productPrice =
      extendedEcommerceModuleProduct.productsToAttributes.filter(
        (productToAttribute) => {
          return productToAttribute.attribute.attributeKeysToAttributes.filter(
            (attributeKeyToAttribute) => {
              return attributeKeyToAttribute.attributeKey?.type === "price";
            },
          ).length;
        },
      )?.[0];

    messageWithCTA.interaction = {
      inline_keyboard: [
        [
          {
            text: `Checkout for ${productPrice ? productPrice.attribute.number : ""}${productPrice ? `\ ${productPrice.attribute.attributesToBillingModuleCurrencies?.[0].billingModuleCurrency?.symbol}` : ""}`,
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

    const billingModuleCurrencyId =
      extendedEcommerceModuleProduct.productsToAttributes
        .filter((productToAttribute) => {
          return productToAttribute.attribute
            .attributesToBillingModuleCurrencies.length;
        })
        .map((productToAttribute) => {
          return productToAttribute.attribute.attributesToBillingModuleCurrencies.map(
            (attributeToBillingModuleCurrency) => {
              return attributeToBillingModuleCurrency.billingModuleCurrency;
            },
          );
        })
        .flat()?.[0]?.id;

    const rbacModuleSubjectEcommerceModuleProductCheckoutResult =
      await rbacModuleSubjectApi.ecommerceModuleProductCheckout({
        id: messageFromSubject.id,
        productId: extendedEcommerceModuleProduct.id,
        data: {
          provider: "telegram-star",
          billingModuleCurrencyId,
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
      await rbacModuleRolesToEcommerceModuleProductsApi.find({
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!rbacModuleRolesToEcommerceModuleProducts?.length) {
      return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description:
              "Can\\'t find `rbacModuleRolesToEcommerceModuleProducts`\\.",
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );
    }

    const rbacModulePayableRoles = await rbacModuleRoleApi.find({
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
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
            description: "Can\\'t find `rbacModulePayableRoles`\\.",
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
      await rbacModuleSubjectsToRolesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: messageFromSubject.id,
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

    console.log(
      "🚀 ~ telegramBotPremiumMessageWithKeyboardCreate ~ messageFromSubject:",
      messageFromSubject,
    );

    const data: ISocialModuleTelegramMessageData = {
      description: "",
    };

    if (rbacModuleSubjectsToProSubscriberRoles?.length) {
      data.description = "You have active subscription\\.";
    } else {
      const ecommerceModuleProducts = await ecommerceModuleProductApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
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
              description: "Can\\'t find `ecommerceModuleProducts`\\.",
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
        "You don\\'t have active subscription\\.\nClick button below to buy premium tier\\.";

      const ecommerceModuleProductButtons: {
        text: string;
        url?: string | undefined;
        callback_data?: string | undefined;
      }[] = [];

      for (const ecommerceModuleProduct of ecommerceModuleProducts) {
        const extendedProduct = await this.extendedEcommerceModuleProduct({
          id: ecommerceModuleProduct.id,
        });

        // console.log(
        //   "🚀 ~ telegramBotPremiumMessageWithKeyboardCreate ~ extendedProduct:",
        //   JSON.stringify(extendedProduct, null, 2),
        // );

        const productTitle =
          extendedProduct.title?.en ??
          extendedProduct.title?.ru ??
          extendedProduct.id;

        const productPrice = extendedProduct.productsToAttributes.filter(
          (productToAttribute) => {
            return productToAttribute.attribute.attributeKeysToAttributes.filter(
              (attributeKeyToAttribute) => {
                return attributeKeyToAttribute.attributeKey?.type === "price";
              },
            ).length;
          },
        )?.[0];

        ecommerceModuleProductButtons.push({
          text: `${productTitle} ${productPrice ? productPrice.attribute.number : ""}${productPrice ? `\ ${productPrice.attribute.attributesToBillingModuleCurrencies?.[0].billingModuleCurrency?.symbol}` : ""}`,
          callback_data: `ec_me_pt_${ecommerceModuleProduct.id}`,
        });
      }

      data.interaction = {
        inline_keyboard: [
          ...ecommerceModuleProductButtons.map(
            (ecommerceModuleProductButton) => {
              return [ecommerceModuleProductButton];
            },
          ),
        ],
      };
    }

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
              "Can\\'t create referral link\\, because `props\\.messageFromSocialModuleProfile` is empty\\.",
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
        "You can invite people to subscribe for that Telegram Bot and get benefits\\!\nJust share link below and people\\, that will start the bot with your referral code will get free 3 days of Premium\\.",
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
        "I am Telegram bot, that can help you with any kind of text questions with the help of AI\\.\nIf you have a question, just write it to the chat and I will choose the most relevant AI model for answer\\.\n\nIf you have troubles with Telegram Bot, just write to Support Manager and describle the situation\\. **DO NOT delete autogenerated message** during first wite to Support Manager\\. That message will help us to understand what profile in our system you have\\.",
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
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY is missing.");
      }

      if (!props.socialModuleMessage.description) {
        throw new Error(
          "Validation error. 'props.socialModuleMessage.description' is empty.",
        );
      }

      const messageFromRbacModuleSubject =
        await this.getMessageFromRbacModuleSubject(props);

      const rbacSubjectsToRoles = await rbacModuleSubjectsToRolesApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (!rbacSubjectsToRoles?.length) {
        await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
          {
            id: props.rbacModuleSubject.id,
            socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
            socialModuleChatId: props.socialModuleChat.id,
            data: {
              description: "If you want to use AI models, buy subscription\\.",
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

      console.log(
        "🚀 ~ openRouterReplyMessageCreate ~ messageFromRbacModuleSubject:",
        messageFromRbacModuleSubject,
      );

      const openRouter = new OpenRouter();

      const models = await openRouter.getModels();

      const openRouterSanitizedModels = models.map((model) => {
        return {
          id: model.id,
          description: model.description,
          modality: model.architecture.modality,
          input_modalities: model.architecture.input_modalities,
          output_modalities: model.architecture.output_modalities,
        };
      });

      // console.log(
      //   "🚀 ~ openRouterReplyMessageCreate ~ openRouterSanitizedModels:",
      //   openRouterSanitizedModels.length,
      // );

      // const goodForRoutingModels = [
      //   // // answer with **
      //   // // "cost": 0.005635872,
      //   // // 2.59 s
      //   // // "mistralai/ministral-3b-2512",
      //   // // "cost": 0.0024528636,
      //   // // 16.24 s
      //   // "nvidia/nemotron-nano-9b-v2",
      //   // "cost": 0.0146864421,
      //   // 13.82 s
      //   "deepseek/deepseek-v3.2-exp",
      //   // // "cost": 0,
      //   // // 30.06 s
      //   // "amazon/nova-2-lite-v1:free",
      //   // "cost": 0.0114527655,
      //   // 14.90 s
      //   "x-ai/grok-4.1-fast",
      //   // // "cost": 0.01429128336,
      //   // // 23.98 s
      //   // "minimax/minimax-m2",
      //   // "cost": 0.031756824,
      //   // 6.00 s
      //   "moonshotai/kimi-k2-0905",
      //   // "cost": 0.0116335296,
      //   // 12.64 s
      //   "x-ai/grok-code-fast-1",
      // ];

      const detectedLanguageResult = await openRouter.generate({
        model: "google/gemini-2.5-flash",
        reasoning: false,
        context: [
          {
            role: "system",
            content:
              "You need to detect what language the user is speaking, NOT coding language (JavaScript, C#) - human language (english,spanish,russian and etc). Answer with the language name only (Spanish).",
          },
          {
            role: "user",
            content: props.socialModuleMessage.description,
          },
        ],
      });

      if ("error" in detectedLanguageResult) {
        return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
          {
            id: props.rbacModuleSubject.id,
            socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
            socialModuleChatId: props.socialModuleChat.id,
            data: {
              description: "Упс\\! Что\\-то пошло не так, попробуйте еще раз",
            },
            options: {
              headers: {
                Authorization: "Bearer " + props.jwtToken,
              },
            },
          },
        );
      }

      const detectedLanguage = detectedLanguageResult.text;

      const selectModelResult = await openRouter.generate({
        model: "deepseek/deepseek-v3.2-exp",
        reasoning: false,
        context: [
          {
            role: "user",
            content: `I have a task:'\n${props.socialModuleMessage.description}\n'. Select the most suitable AI model, that can finish that task with the best result in ${detectedLanguage} language. Available models: ${JSON.stringify(openRouterSanitizedModels).replaceAll('"', "'")}. Send me a reply with the exact 'id' without any additional text and symbols. Don't try to do the task itself, choose a model. Sort models by price for the requested item 'image' and select the cheapest model, that can solve the task. Check 'input_modalities' to have passed parameters and 'output_modalities' for requesting thing.`,
          },
        ],
      });

      if ("error" in selectModelResult) {
        return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
          {
            id: props.rbacModuleSubject.id,
            socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
            socialModuleChatId: props.socialModuleChat.id,
            data: {
              description: "Упс\\! Что\\-то пошло не так, попробуйте еще раз",
            },
            options: {
              headers: {
                Authorization: "Bearer " + props.jwtToken,
              },
            },
          },
        );
      }

      let selectModelForRequest = selectModelResult.text;

      console.log(
        "🚀 ~ openRouterReplyMessageCreate ~ selectModelForRequest:",
        selectModelForRequest,
      );

      let generatedMessageDescription = "";
      const data: any = {};

      // Generate content (text or image)
      const result = await openRouter.generate({
        model: selectModelForRequest,
        context: [
          { role: "user", content: `Answer in ${detectedLanguage} language` },
          {
            role: "user",
            content:
              "Ensure the response fits within 4000 characters for Telegram.",
          },
          {
            role: "user",
            content: props.socialModuleMessage.description || "",
          },
        ],
      });

      if ("error" in result) {
        return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
          {
            id: props.rbacModuleSubject.id,
            socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
            socialModuleChatId: props.socialModuleChat.id,
            data: {
              description: "Упс\\! Что\\-то пошло не так, попробуйте еще раз",
            },
            options: {
              headers: {
                Authorization: "Bearer " + props.jwtToken,
              },
            },
          },
        );
      }

      generatedMessageDescription = result.text;

      // Check if images were generated
      if (result.images && result.images.length > 0) {
        try {
          const imageUrl = result.images[0].url;
          if (imageUrl) {
            // Use blobifyFiles to handle both http and data: URLs
            data.files = await blobifyFiles({
              files: [
                {
                  title: "generated-image",
                  type: "image/png",
                  extension: "png",
                  url: imageUrl,
                },
              ],
            });
            generatedMessageDescription = `${generatedMessageDescription || "Изображение сгенерировано"}`;
          }
        } catch (error) {
          console.error("Image processing error:", error);
        }
      }

      generatedMessageDescription += `\n\n__${selectModelForRequest}__`;

      data.description = telegramMarkdownFormatter({
        input: generatedMessageDescription,
      });

      if (data.description == "") {
        return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
          {
            id: props.rbacModuleSubject.id,
            socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
            socialModuleChatId: props.socialModuleChat.id,
            data: {
              description: "Упс\\! Что\\-то пошло не так, попробуйте еще раз",
            },
            options: {
              headers: {
                Authorization: "Bearer " + props.jwtToken,
              },
            },
          },
        );
      }

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
    } catch (error) {
      await rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
        {
          id: props.rbacModuleSubject.id,
          socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
          socialModuleChatId: props.socialModuleChat.id,
          data: {
            description: "Упс\\! Что\\-то пошло не так, попробуйте еще раз",
          },
          options: {
            headers: {
              Authorization: "Bearer " + props.jwtToken,
            },
          },
        },
      );

      throw error;
    }
  }

  async extendedEcommerceModuleProduct(props: {
    id: IEcommerceModuleProduct["id"];
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const ecommerceModuleProduct = await ecommerceModuleProductApi.findById({
      id: props.id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!ecommerceModuleProduct) {
      throw new Error("Not found error. 'ecommerceModuleProduct' not found");
    }

    const ecommerceModuleProductsToFileStorageFiles: (IEcommerceModuleProductsToFileStorageFiles & {
      fileStorageModuleFile: IFileStorageModuleFile;
    })[] = [];

    const foundEcommerceModuleProductsToFileStorageFiles =
      await ecommerceModuleProductsToFileStorageFilesApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (foundEcommerceModuleProductsToFileStorageFiles?.length) {
      const foundFileStorageModuleFiles = await fileStorageModuleFileApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
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
      await ecommerceModuleProductsToAttributesApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!ecommerceModuleProdctsToAttributes?.length) {
      throw new Error(
        "Not found error. 'ecommerceModuleProdctsToAttributes' not found",
      );
    }

    const ecommerceModuleAttributes = await ecommerceModuleAttributeApi.find({
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!ecommerceModuleAttributes?.length) {
      throw new Error("Not found error. 'ecommerceModuleAttributes' not found");
    }

    const ecommerceModuleAttributeKeysToAttributes =
      await ecommerceModuleAttributeKeysToAttributesApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!ecommerceModuleAttributeKeysToAttributes?.length) {
      throw new Error(
        "Not found error. 'ecommerceModuleAttributeKeysToAttributes' not found",
      );
    }

    const ecommerceModuleAttributeKeys =
      await ecommerceModuleAttributeKeyApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!ecommerceModuleAttributeKeys?.length) {
      throw new Error(
        "Not found error. 'ecommerceModuleAttributeKeys' not found",
      );
    }

    const ecommerceModuleAttributesToBillingModuleCurrencies =
      await ecommerceModuleAttributesToBillingModuleCurrenciesApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!ecommerceModuleAttributesToBillingModuleCurrencies?.length) {
      throw new Error(
        "Not found error. 'ecommerceModuleAttributesToBillingModuleCurrencies' not found",
      );
    }

    const billingModuleCurrencies = await billingModuleCurrencyApi.find({
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
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
      await rbacModuleSubjectsToSocialModuleProfilesApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
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

    const messageFromSubject = await rbacModuleSubjectApi.findById({
      id: messageFromRbacModuleSubjectsToSocialModuleProfiles[0].subjectId,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!messageFromSubject) {
      throw new Error("Not found error. 'messageFromSubject' not found.");
    }

    return messageFromSubject;
  }
}
