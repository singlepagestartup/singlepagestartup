import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
  TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK,
  TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { blobifyFiles, getHttpErrorType } from "@sps/backend-utils";
import {
  OpenAI,
  OpenRouter,
  type IOpenRouterRequestMessage,
} from "@sps/shared-third-parties";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleChatsToMessagesApi } from "@sps/social/relations/chats-to-messages/sdk/server";
import { api as socialModuleMessagesToFileStorageModuleFilesApi } from "@sps/social/relations/messages-to-file-storage-module-files/sdk/server";
import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { api as socialModuleProfilesToMessagesApi } from "@sps/social/relations/profiles-to-messages/sdk/server";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import * as jwt from "hono/jwt";

export class Handler {
  service: Service;
  private readonly telegramRequiredChannelName =
    TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME || "наш Telegram-канал";
  private readonly telegramRequiredChannelLink =
    TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_LINK ||
    (TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME
      ? `https://t.me/${TELEGRAM_SERVICE_REQUIRED_SUBSCRIPTION_CHANNEL_NAME}`
      : "https://t.me");
  statusMessages = {
    openRouterStarted: {
      ru: "Начинаю обрабатывать ваш запрос. Пожалуйста, подождите.",
      en: "Starting to process your request. Please wait.",
    },
    openRouterFetchingModels: {
      ru: "Получаю список моделей. Пожалуйста, подождите.",
      en: "Fetching models list. Please wait.",
    },
    openRouterDetectingLanguage: {
      ru: "Определяю язык сообщения. Пожалуйста, подождите.",
      en: "Detecting message language. Please wait.",
    },
    openRouterSelectingModels: {
      ru: "Выбираю модель для ответа. Пожалуйста, подождите.",
      en: "Selecting model for response. Please wait.",
    },
    openRouterGeneratingResponse: {
      ru: "Генерирую ответ с помощью [selectModelForRequest]. Пожалуйста, подождите.",
      en: "Generating response using [selectModelForRequest]. Please wait.",
    },
    openRouterError: {
      ru: "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.",
      en: "An error occurred while processing your request. Please try again later.",
    },
    openRouterRequiredTelegamChannelSubscriptionError: {
      ru: `Для использования этой функции необходимо подписаться на наш Telegram-канал - [${this.telegramRequiredChannelName}](${this.telegramRequiredChannelLink})`,
      en: `You need to subscribe to our Telegram channel  - [${this.telegramRequiredChannelName}](${this.telegramRequiredChannelLink}) to use this feature.`,
    },
    ecommerceModuleSelectSubscriptionProductsOffer: {
      ru: "Пожалуйста, выберите один из наших продуктов-подписок, чтобы продолжить.",
      en: "Please select one of our subscription products to continue.",
    },
    openRouterNotFoundSubscription: {
      ru: "У вас нет активной подписки. Пожалуйста, оформите подписку, чтобы использовать эту функцию.",
      en: "You do not have an active subscription. Please subscribe to use this feature.",
    },
    ecommerceModuleOrderPayButtonDescription: {
      ru: "Для оплаты подписки нажмите на кнопку с выбором способа оплаты",
      en: "You can subscribe by the clicking buttons below",
    },
    ecommerceModuleOrderAlreadyHaveSubscription: {
      ru: "У вас уже есть активная подписка.",
      en: "You have active subscription.",
    },
  };

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const socialModuleProfileId = c.req.param("socialModuleProfileId");

      if (!socialModuleProfileId) {
        throw new Error("Validation error. No socialModuleProfileId provided");
      }

      const socialModuleChatId = c.req.param("socialModuleChatId");

      if (!socialModuleChatId) {
        throw new Error("Validation error. No socialModuleChatId provided");
      }

      const socialModuleMessageId = c.req.param("socialModuleMessageId");

      if (!socialModuleMessageId) {
        throw new Error("Validation error. No socialModuleMessageId provided");
      }

      const socialModuleSendMessageProfilesToMessages =
        await socialModuleProfilesToMessagesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "messageId",
                  method: "eq",
                  value: socialModuleMessageId,
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

      if (!socialModuleSendMessageProfilesToMessages?.length) {
        throw new Error(
          "Validation error. No socialModuleSendMessageProfile found",
        );
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let data;
      try {
        data = JSON.parse(body["data"]);
      } catch (error) {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " +
            body["data"],
        );
      }

      const socialModuleProfile = await socialModuleProfileApi.findById({
        id: socialModuleProfileId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!socialModuleProfile) {
        throw new Error(
          "Not found error. Requested social-module profile not found",
        );
      }

      const socialModuleMessage = await socialModuleMessageApi.findById({
        id: socialModuleMessageId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!socialModuleMessage?.description) {
        throw new Error(
          "Not found. Social module message description not found",
        );
      }

      const socialModuleChatToMessages =
        await socialModuleChatsToMessagesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "chatId",
                  method: "eq",
                  value: socialModuleChatId,
                },
              ],
            },
            orderBy: {
              and: [
                {
                  column: "createdAt",
                  method: "desc",
                },
              ],
            },
            limit: 5,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });

      const context: IOpenRouterRequestMessage[] = [];

      const replyBySocialModuleProfile = data.shouldReplySocialModuleProfile;

      if (!replyBySocialModuleProfile) {
        throw new Error(
          "Validation error. 'data.shouldReplySocialModuleProfile' not passed.",
        );
      }

      if (socialModuleChatToMessages?.length) {
        const socialModuleMessages = await socialModuleMessageApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: socialModuleChatToMessages.map(
                    (socialModuleChatToMessage) =>
                      socialModuleChatToMessage.messageId,
                  ),
                },
              ],
            },
            orderBy: {
              and: [
                {
                  column: "createdAt",
                  method: "asc",
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

        if (socialModuleMessages?.length) {
          const socialModuleProfilesToMessages =
            await socialModuleProfilesToMessagesApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "messageId",
                      method: "inArray",
                      value: socialModuleMessages.map(
                        (socialModuleChatToMessage) =>
                          socialModuleChatToMessage.id,
                      ),
                    },
                  ],
                },
                orderBy: {
                  and: [
                    {
                      column: "createdAt",
                      method: "asc",
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

          if (socialModuleProfilesToMessages?.length) {
            for (const socialModuleMessage of socialModuleMessages) {
              const isAssistantMessage = socialModuleProfilesToMessages.find(
                (socialModuleProfileToMessage) =>
                  socialModuleProfileToMessage.messageId ===
                    socialModuleMessage.id &&
                  socialModuleProfileToMessage.profileId ===
                    replyBySocialModuleProfile.id,
              );

              let fileStorageFiles: IFileStorageModuleFile[] | undefined = [];

              const socialModuleMessagesToFileStorageModuleFiles =
                await socialModuleMessagesToFileStorageModuleFilesApi.find({
                  params: {
                    filters: {
                      and: [
                        {
                          column: "messageId",
                          method: "eq",
                          value: socialModuleMessage.id,
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

              if (socialModuleMessagesToFileStorageModuleFiles?.length) {
                fileStorageFiles = await fileStorageModuleFileApi.find({
                  params: {
                    filters: {
                      and: [
                        {
                          column: "id",
                          method: "inArray",
                          value:
                            socialModuleMessagesToFileStorageModuleFiles.map(
                              (relation) => relation.fileStorageModuleFileId,
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
              }
              if (fileStorageFiles?.length) {
                context.push({
                  role: isAssistantMessage ? "assistant" : "user",
                  content: [
                    {
                      type: "text",
                      text: socialModuleMessage.description || "",
                    },
                    ...fileStorageFiles?.map((fileStorageFile) => {
                      if (fileStorageFile.mimeType?.includes("image")) {
                        return {
                          type: "image_url" as const,
                          image_url: {
                            url: `${NEXT_PUBLIC_API_SERVICE_URL}/public${fileStorageFile.file}`,
                          },
                        };
                      }

                      return {
                        type: "file_url" as const,
                        file_url: {
                          url: `${NEXT_PUBLIC_API_SERVICE_URL}/public${fileStorageFile.file}`,
                        },
                      };
                    }),
                  ],
                });
              } else {
                context.push({
                  role: isAssistantMessage ? "assistant" : "user",
                  content: socialModuleMessage.description || "",
                });
              }
            }
          }
        }
      }

      console.log("🚀 ~ execute ~ context:", context);

      const subjectsToSocialModuleProfiles =
        await subjectsToSocialModuleProfilesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "socialModuleProfileId",
                  method: "eq",
                  value: replyBySocialModuleProfile.id,
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

      if (!subjectsToSocialModuleProfiles?.length) {
        throw new Error(
          "Validation error. 'subjectsToSocialModuleProfiles' not found.",
        );
      }

      const replyBySubject = await api.findById({
        id: subjectsToSocialModuleProfiles[0].subjectId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!replyBySubject) {
        throw new Error("Not found error. 'replyBySubject' not foud");
      }

      const replyByJwt = await jwt.sign(
        {
          exp:
            Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
          iat: Math.floor(Date.now() / 1000),
          subject: replyBySubject,
        },
        RBAC_JWT_SECRET,
      );

      const openRouter = new OpenRouter();

      const statusMessage =
        await api.socialModuleProfileFindByIdChatFindByIdMessageCreate({
          id: replyBySubject.id,
          socialModuleProfileId: replyBySocialModuleProfile.id,
          socialModuleChatId: socialModuleChatId,
          data: {
            description: this.statusMessages.openRouterStarted.ru,
          },
          options: {
            headers: {
              Authorization: "Bearer " + replyByJwt,
            },
          },
        });

      await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
        id: replyBySubject.id,
        socialModuleProfileId: replyBySocialModuleProfile.id,
        socialModuleChatId: socialModuleChatId,
        socialModuleMessageId: statusMessage.id,
        data: {
          description: this.statusMessages.openRouterFetchingModels.ru,
        },
        options: {
          headers: {
            Authorization: "Bearer " + replyByJwt,
          },
        },
      });

      const models = await openRouter.getModels();

      const openRouterSanitizedModels = models.map((model) => {
        return {
          id: model.id,
          description: model.description,
          modality: model.architecture.modality,
          input_modalities: model.architecture.input_modalities,
          output_modalities: model.architecture.output_modalities,
          is_free: model.pricing.completion === "0" ? true : false,
          pricePerMillionTokens: parseFloat(model.pricing.prompt) * 1e6,
        };
      });

      const openRouterNotFreeSanitizedModels = openRouterSanitizedModels
        .filter((model) => {
          return (
            !model.is_free &&
            !model.id.includes("-max") &&
            model.id !== "openrouter/auto"
          );
        })
        .filter((model) => {
          return (
            model.pricePerMillionTokens > 0.1 && model.pricePerMillionTokens < 3
          );
        });

      await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
        id: replyBySubject.id,
        socialModuleProfileId: replyBySocialModuleProfile.id,
        socialModuleChatId: socialModuleChatId,
        socialModuleMessageId: statusMessage.id,
        data: {
          description: this.statusMessages.openRouterDetectingLanguage.ru,
        },
        options: {
          headers: {
            Authorization: "Bearer " + replyByJwt,
          },
        },
      });

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
            content: socialModuleMessage.description,
          },
        ],
      });

      console.log(
        "🚀 ~ openRouterReplyMessageCreate ~ detectedLanguageResult:",
        detectedLanguageResult,
      );

      if ("error" in detectedLanguageResult) {
        throw new Error("Language detection error");
      }

      await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
        id: replyBySubject.id,
        socialModuleProfileId: replyBySocialModuleProfile.id,
        socialModuleChatId: socialModuleChatId,
        socialModuleMessageId: statusMessage.id,
        data: {
          description: this.statusMessages.openRouterSelectingModels.ru,
        },
        options: {
          headers: {
            Authorization: "Bearer " + replyByJwt,
          },
        },
      });

      const detectedLanguage = detectedLanguageResult.text;

      const selectModelResult = await openRouter.generate({
        model: "x-ai/grok-4.1-fast",
        reasoning: false,
        context: [
          {
            role: "user",
            content: `I have such content from previous conversation: '${JSON.stringify(context)}'`,
          },
          {
            role: "user",
            content: `Now I have the task:'\n${socialModuleMessage.description}\n'. Select the most suitable AI model, that can finish that task with the best result in ${detectedLanguage} language. Available models: ${JSON.stringify(openRouterNotFreeSanitizedModels).replaceAll('"', "'")}. Send me a reply with the exact 'id' without any additional text and symbols. Don't try to do the task itself, choose a model. Sort models by price for the requested item 'image' and select the cheapest model, that can solve the task. Check 'input_modalities' to have passed parameters and 'output_modalities' for requesting thing.`,
          },
        ],
      });

      if ("error" in selectModelResult) {
        throw new Error("Model selection error");
      }

      let selectModelForRequest = selectModelResult.text;

      console.log(
        "🚀 ~ openRouterReplyMessageCreate ~ selectModelForRequest:",
        selectModelForRequest,
      );

      let generatedMessageDescription = "";
      const replyMessageData: any = {};

      await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
        id: replyBySubject.id,
        socialModuleProfileId: replyBySocialModuleProfile.id,
        socialModuleChatId: socialModuleChatId,
        socialModuleMessageId: statusMessage.id,
        data: {
          description:
            this.statusMessages.openRouterGeneratingResponse.ru.replace(
              "[selectModelForRequest]",
              selectModelForRequest,
            ),
        },
        options: {
          headers: {
            Authorization: "Bearer " + replyByJwt,
          },
        },
      });

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
          ...context,
        ],
      });

      if ("error" in result) {
        throw new Error("Generation error");
      }

      generatedMessageDescription = result.text;

      // Check if images were generated
      if (result.images && result.images.length > 0) {
        try {
          const imageUrl = result.images[0].url;
          if (imageUrl) {
            // Use blobifyFiles to handle both http and data: URLs
            replyMessageData.files = await blobifyFiles({
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

      replyMessageData.description = generatedMessageDescription;

      if (replyMessageData.description == "") {
        throw new Error("Generated message is empty");
      }

      await api.socialModuleProfileFindByIdChatFindByIdMessageDelete({
        id: replyBySubject.id,
        socialModuleProfileId: replyBySocialModuleProfile.id,
        socialModuleChatId: socialModuleChatId,
        socialModuleMessageId: statusMessage.id,
        options: {
          headers: {
            Authorization: "Bearer " + replyByJwt,
          },
        },
      });

      const repliedSocialModuleMessage =
        await api.socialModuleProfileFindByIdChatFindByIdMessageCreate({
          id: replyBySubject.id,
          socialModuleProfileId: replyBySocialModuleProfile.id,
          socialModuleChatId: socialModuleChatId,
          data: replyMessageData,
          options: {
            headers: {
              Authorization: "Bearer " + replyByJwt,
            },
          },
        });

      return c.json({
        data: {
          socialModule: {
            message: repliedSocialModuleMessage,
          },
        },
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
