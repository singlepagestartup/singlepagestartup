import "reflect-metadata";
import { injectable } from "inversify";
import {
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
import { api as rbacModuleSubjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import * as jwt from "hono/jwt";
import {
  blobifyFiles,
  logger,
  telegramMarkdownFormatter,
} from "@sps/backend-utils";
import { OpenRouter } from "@sps/shared-third-parties";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
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
    const telegramBotCommands = ["/start"];
    const telegramBotCallbackQueries = ["button_1", "button_2"];

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
        const telegramBotCommandMessage = telegramBotCommands.find(
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
        const telegramBotCommandMessage = telegramBotCommands.find(
          (command) => {
            return props.socialModuleMessage.description?.startsWith(command);
          },
        );

        if (telegramBotCommandMessage) {
          return;
        }

        console.log(
          "🚀 ~ agentSocialModuleProfileHandler ~ telegramBotCommandMessage:",
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
    }

    rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate({
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

  async openRouterReplyMessageCreate(props: {
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

    if (!props.socialModuleMessage.description) {
      throw new Error(
        "Validation error. 'props.socialModuleMessage.description' is empty.",
      );
    }

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

    console.log(
      "🚀 ~ openRouterReplyMessageCreate ~ openRouterSanitizedModels:",
      openRouterSanitizedModels.length,
    );

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

    const detectedLanguage = await openRouter.generateText({
      model: "google/gemini-2.5-flash",
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

    let selectModelForRequest = await openRouter.generateText({
      model: "deepseek/deepseek-v3.2-exp",
      context: [
        {
          role: "user",
          content: `I have a task:'\n${props.socialModuleMessage.description}\n'. Select the most suitable AI model, that can finish that task with the best result in ${detectedLanguage} language. Available models: ${JSON.stringify(openRouterSanitizedModels).replaceAll('"', "'")}. Send me a reply with the exact 'id' without any additional text and symbols. Don't try to do the task itself, choose a model. Sort models by price for the requested item 'image' and select the cheapest model, that can solve the task. Check 'input_modalities' to have passed parameters and 'output_modalities' for requesting thing.`,
        },
      ],
    });

    console.log(
      "🚀 ~ openRouterReplyMessageCreate ~ selectModelForRequest:",
      selectModelForRequest,
    );

    // selectModelForRequest =
    //   availableModels.find((model) => {
    //     return model.includes(selectModelForRequest.replaceAll("'", ""));
    //   }) || "z-ai/glm-4.5-air:free";

    // if (!availableModels.includes(selectModelForRequest)) {
    //   return rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageCreate(
    //     {
    //       id: props.rbacModuleSubject.id,
    //       socialModuleProfileId: props.shouldReplySocialModuleProfile.id,
    //       socialModuleChatId: props.socialModuleChat.id,
    //       data: {
    //         description: "Упс\\! Что\\-то пошло не так, попробуйте еще раз",
    //       },
    //       options: {
    //         headers: {
    //           Authorization: "Bearer " + props.jwtToken,
    //         },
    //       },
    //     },
    //   );
    // }

    const generatedMessageDescription = await openRouter.generateText({
      model: selectModelForRequest,
      max_tokens: 1000,
      context: [
        { role: "user", content: `Answer in ${detectedLanguage} language` },
        {
          role: "user",
          content: props.socialModuleMessage.description || "",
        },
      ],
    });

    const data = {
      description: telegramMarkdownFormatter({
        input: generatedMessageDescription + `\n\n__${selectModelForRequest}__`,
      }),
    };

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

    // if (generateTemplateSocilaModuleMessageAttachmentStartFiles?.length) {
    //   data["files"] = await blobifyFiles({
    //     files: generateTemplateSocilaModuleMessageAttachmentStartFiles.map(
    //       (generateTemplateSocilaModuleMessageAttachmentStartFile) => {
    //         return {
    //           ...generateTemplateSocilaModuleMessageAttachmentStartFile,
    //           title: generateTemplateSocilaModuleMessageAttachmentStartFile.id,
    //           type:
    //             generateTemplateSocilaModuleMessageAttachmentStartFile.mimeType ??
    //             "",
    //           extension:
    //             generateTemplateSocilaModuleMessageAttachmentStartFile.extension ??
    //             "",
    //           url: generateTemplateSocilaModuleMessageAttachmentStartFile.file.includes(
    //             "https",
    //           )
    //             ? generateTemplateSocilaModuleMessageAttachmentStartFile.file
    //             : `${NEXT_PUBLIC_API_SERVICE_URL}/public${generateTemplateSocilaModuleMessageAttachmentStartFile.file}`,
    //         };
    //       },
    //     ),
    //   });
    // }

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
}
