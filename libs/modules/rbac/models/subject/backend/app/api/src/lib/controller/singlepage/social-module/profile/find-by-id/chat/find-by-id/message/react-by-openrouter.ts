import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
  telegramBotServiceMessages,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { blobifyFiles, getHttpErrorType } from "@sps/backend-utils";
import {
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

type TRequestTask =
  | "qa"
  | "support"
  | "coding"
  | "research"
  | "translate"
  | "summarize"
  | "extract"
  | "image_gen"
  | "image_understanding"
  | "tts"
  | "asr"
  | "music_gen"
  | "file_gen";
type TInputModality = "text" | "image" | "file";
type TOutputModality = "text" | "image" | "audio" | "file";
type TComplexity = "low" | "medium" | "high";
type TRiskLevel = "low" | "medium" | "high";
type TModelClass = "CHAT" | "CODER" | "VISION" | "IMAGE";
type TModelConfigClass = TModelClass | "CLASSIFIER";

interface IRequestClassification {
  language: string;
  task: TRequestTask;
  input_modalities: TInputModality[];
  output_modality: TOutputModality;
  need_web: boolean;
  complexity: TComplexity;
  risk_level: TRiskLevel;
}

interface IModelCandidate {
  id: string;
  enabled: boolean;
  priority: number;
  input_modalities: ReadonlyArray<TInputModality>;
  output_modalities: ReadonlyArray<TOutputModality>;
  strengths: ReadonlyArray<string>;
  best_for?: ReadonlyArray<string>;
  avoid_for?: ReadonlyArray<string>;
}

interface IModelSelectionResult {
  orderedCandidateIds: string[];
  selectedModelId: string | null;
  selectedBy: "llm" | "priority";
}

const MODEL_ROUTER_CONFIG = {
  version: "2026-02-13",
  classes: {
    CLASSIFIER: [
      {
        id: "openai/gpt-5-mini",
        enabled: true,
        priority: 100,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["classification", "routing"],
      },
      {
        id: "anthropic/claude-haiku-4.5",
        enabled: true,
        priority: 90,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["classification", "routing"],
      },
    ],
    CHAT: [
      {
        id: "openai/gpt-5-mini",
        enabled: true,
        priority: 100,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["general_chat", "reasoning", "concise_answers"],
      },
      {
        id: "anthropic/claude-haiku-4.5",
        enabled: true,
        priority: 90,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["general_chat", "instruction_following"],
      },
      {
        id: "anthropic/claude-sonnet-4.6",
        enabled: true,
        priority: 80,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["deep_reasoning", "long_form"],
      },
      {
        id: "google/gemini-2.5-flash",
        enabled: true,
        priority: 70,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["speed", "general_chat"],
      },
    ],
    CODER: [
      {
        id: "openai/gpt-5.2-codex",
        enabled: true,
        priority: 100,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["coding", "debugging", "refactoring"],
        best_for: ["code_generation", "bug_fixing", "architecture_help"],
      },
      {
        id: "qwen/qwen3-coder-plus",
        enabled: true,
        priority: 90,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["coding", "debugging", "tooling"],
        best_for: ["code_generation", "code_review", "optimization"],
      },
      {
        id: "anthropic/claude-sonnet-4.6",
        enabled: true,
        priority: 80,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["reasoning", "code_explanations"],
      },
    ],
    VISION: [
      {
        id: "openai/gpt-5-mini",
        enabled: true,
        priority: 100,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["image_understanding", "ocr", "analysis"],
      },
      {
        id: "anthropic/claude-sonnet-4.6",
        enabled: true,
        priority: 90,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["image_understanding", "deep_reasoning"],
      },
      {
        id: "google/gemini-2.5-flash",
        enabled: true,
        priority: 80,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["vision", "speed", "ocr"],
      },
    ],
    IMAGE: [
      {
        id: "sourceful/riverflow-v2-standard-preview",
        enabled: true,
        priority: 100,
        input_modalities: ["text"],
        output_modalities: ["image"],
        strengths: ["branding", "text_on_image", "poster_design"],
        best_for: ["branding", "logo_style", "marketing_visuals_with_text"],
      },
      {
        id: "black-forest-labs/flux.2-pro",
        enabled: true,
        priority: 95,
        input_modalities: ["text"],
        output_modalities: ["image"],
        strengths: ["photoreal", "portrait", "product_photo"],
        best_for: ["photography_style", "realistic_product_shots"],
      },
      {
        id: "openai/gpt-5-image",
        enabled: true,
        priority: 90,
        input_modalities: ["text"],
        output_modalities: ["image"],
        strengths: ["creative_generation", "art_direction"],
        best_for: ["creative_concepts", "ad_creatives"],
      },
      {
        id: "google/gemini-2.5-flash-image",
        enabled: true,
        priority: 85,
        input_modalities: ["text"],
        output_modalities: ["image"],
        strengths: ["creative_generation", "fast_iterations"],
        best_for: ["creative_concepts", "rapid_prototyping"],
      },
      {
        id: "bytedance-seed/seedream-4.5",
        enabled: true,
        priority: 80,
        input_modalities: ["text"],
        output_modalities: ["image"],
        strengths: ["creative_generation", "stylized_visuals"],
      },
      {
        id: "openai/gpt-5-image-mini",
        enabled: true,
        priority: 70,
        input_modalities: ["text"],
        output_modalities: ["image"],
        strengths: ["creative_generation", "cost_efficiency"],
      },
    ],
  },
} as const;

const ALLOWED_TASKS: TRequestTask[] = [
  "qa",
  "support",
  "coding",
  "research",
  "translate",
  "summarize",
  "extract",
  "image_gen",
  "image_understanding",
  "tts",
  "asr",
  "music_gen",
  "file_gen",
];

const ALLOWED_OUTPUT_MODALITIES: TOutputModality[] = [
  "text",
  "image",
  "audio",
  "file",
];

const ALLOWED_INPUT_MODALITIES: TInputModality[] = ["text", "image", "file"];

const CLASSIFICATION_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "request_classification",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "language",
        "task",
        "input_modalities",
        "output_modality",
        "need_web",
        "complexity",
        "risk_level",
      ],
      properties: {
        language: {
          type: "string",
        },
        task: {
          type: "string",
          enum: [...ALLOWED_TASKS],
        },
        input_modalities: {
          type: "array",
          minItems: 1,
          items: {
            type: "string",
            enum: [...ALLOWED_INPUT_MODALITIES],
          },
        },
        output_modality: {
          type: "string",
          enum: [...ALLOWED_OUTPUT_MODALITIES],
        },
        need_web: {
          type: "boolean",
        },
        complexity: {
          type: "string",
          enum: ["low", "medium", "high"],
        },
        risk_level: {
          type: "string",
          enum: ["low", "medium", "high"],
        },
      },
    },
  },
};

export class Handler {
  service: Service;
  statusMessages = telegramBotServiceMessages;

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
            limit: 20,
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
              const messageDescription =
                socialModuleMessage.description?.trim() || "";

              // Soft context reset marker: keep messages only after the latest /new.
              if (messageDescription.startsWith("/new")) {
                context.length = 0;
                continue;
              }

              const localizedServiceValues = Object.keys(
                telegramBotServiceMessages,
              )
                .flatMap((key) => {
                  return [
                    telegramBotServiceMessages[key]?.["ru"],
                    telegramBotServiceMessages[key]?.["en"],
                  ];
                })
                .filter(Boolean);

              if (localizedServiceValues.includes(messageDescription)) {
                continue;
              }

              if (this.isOpenRouterProgressStatusMessage(messageDescription)) {
                continue;
              }

              if (!messageDescription) {
                continue;
              }

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
                      text: messageDescription,
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
                  content: messageDescription,
                });
              }
            }
          }
        }
      }

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

      const requiredInputModalitiesList =
        this.detectInputModalitiesFromContext(context);

      const rawRequestClassification = await this.classifyRequest({
        openRouter,
        requestText: socialModuleMessage.description,
        requiredInputModalitiesList,
      });

      const requestClassification = this.adaptClassificationForEndpoint({
        classification: rawRequestClassification,
        requiredInputModalitiesList,
      });

      console.log("react-by-openrouter/classification", {
        raw: rawRequestClassification,
        adapted: requestClassification,
      });

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

      const selectedModelClass = this.resolveModelClass({
        classification: requestClassification,
        requiredInputModalitiesList,
      });
      const expectedOutputModality: TOutputModality =
        selectedModelClass === "IMAGE"
          ? "image"
          : requestClassification.output_modality;
      const modelCandidates = this.resolveModelCandidates({
        modelClass: selectedModelClass,
        requiredInputModalitiesList,
        expectedOutputModality,
      });

      if (!modelCandidates.length) {
        throw new Error(
          `No models configured for model class: ${selectedModelClass}`,
        );
      }

      const modelSelection = await this.selectModelCandidatesForRequest({
        openRouter,
        requestText: socialModuleMessage.description,
        requestClassification,
        selectedModelClass,
        modelCandidates,
      });

      console.log("react-by-openrouter/router", {
        configVersion: MODEL_ROUTER_CONFIG.version,
        selectedModelClass,
        modelCandidates: modelCandidates.map((candidate) => candidate.id),
        selection: modelSelection,
      });

      const generationContext: IOpenRouterRequestMessage[] = [
        {
          role: "system",
          content: `Answer in ${requestClassification.language} language.`,
        },
        {
          role: "system",
          content:
            expectedOutputModality === "image"
              ? "The user requested image output. You must return at least one generated image."
              : "Return a text response only.",
        },
        {
          role: "user",
          content:
            "Ensure the response fits within 4000 characters for Telegram.",
        },
        ...context,
      ];

      let selectModelForRequest: string | null = null;
      let generationResult:
        | {
            text: string;
            images?: { url?: string; b64_json?: string }[];
          }
        | undefined;
      const fallbackReasons: string[] = [];

      for (const modelCandidateId of modelSelection.orderedCandidateIds) {
        await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
          id: replyBySubject.id,
          socialModuleProfileId: replyBySocialModuleProfile.id,
          socialModuleChatId: socialModuleChatId,
          socialModuleMessageId: statusMessage.id,
          data: {
            description:
              this.statusMessages.openRouterGeneratingResponse.ru.replace(
                "[selectModelForRequest]",
                modelCandidateId,
              ),
          },
          options: {
            headers: {
              Authorization: "Bearer " + replyByJwt,
            },
          },
        });

        const candidateResult = await openRouter.generate({
          model: modelCandidateId,
          context: generationContext,
          stripNonTextOnRetry: false,
        });

        if ("error" in candidateResult) {
          const reason = `model=${modelCandidateId}: generation error`;
          fallbackReasons.push(reason);
          console.log("react-by-openrouter/fallback", reason);
          continue;
        }

        const validationError = this.getGenerationValidationError({
          expectedOutputModality,
          result: candidateResult,
        });

        if (validationError) {
          const reason = `model=${modelCandidateId}: ${validationError}`;
          fallbackReasons.push(reason);
          console.log("react-by-openrouter/fallback", reason);
          continue;
        }

        selectModelForRequest = modelCandidateId;
        generationResult = candidateResult;
        break;
      }

      if (!selectModelForRequest || !generationResult) {
        throw new Error(
          "No valid model response received. " + fallbackReasons.join(" | "),
        );
      }

      let generatedMessageDescription = "";
      const replyMessageData: any = {};

      if (expectedOutputModality === "image") {
        const imageUrl = generationResult.images?.[0]?.url;

        if (!imageUrl) {
          throw new Error(
            "Model selected for image response returned no images.",
          );
        }

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

        generatedMessageDescription =
          generationResult.text?.trim() || "Изображение сгенерировано";
      } else {
        generatedMessageDescription = generationResult.text?.trim() || "";
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

  private detectInputModalitiesFromContext(
    context: IOpenRouterRequestMessage[],
  ): TInputModality[] {
    const latestMessage = context[context.length - 1];

    if (!latestMessage) {
      return ["text"];
    }

    const modalities = new Set<TInputModality>();

    if (typeof latestMessage.content === "string") {
      modalities.add("text");
    } else {
      for (const part of latestMessage.content) {
        if (part.type === "text") {
          modalities.add("text");
        } else if (part.type === "image_url") {
          modalities.add("image");
        } else if (part.type === "file" || part.type === "file_url") {
          modalities.add("file");
        }
      }
    }

    if (!modalities.size) {
      modalities.add("text");
    }

    return ALLOWED_INPUT_MODALITIES.filter((modality) =>
      modalities.has(modality),
    );
  }

  private isOpenRouterProgressStatusMessage(
    messageDescription: string,
  ): boolean {
    const selectingVariants = [
      this.statusMessages.openRouterSelectingModels?.ru,
      this.statusMessages.openRouterSelectingModels?.en,
    ].filter(Boolean) as string[];

    if (
      selectingVariants.some((variant) => messageDescription.includes(variant))
    ) {
      return true;
    }

    const generatingVariants = [
      this.statusMessages.openRouterGeneratingResponse?.ru,
      this.statusMessages.openRouterGeneratingResponse?.en,
    ].filter(Boolean) as string[];

    for (const variant of generatingVariants) {
      const placeholder = "[selectModelForRequest]";
      if (!variant.includes(placeholder)) {
        if (messageDescription.includes(variant)) {
          return true;
        }
        continue;
      }

      const [prefix, suffix] = variant.split(placeholder);
      if (!prefix) {
        continue;
      }

      if (messageDescription.startsWith(prefix)) {
        if (!suffix || messageDescription.includes(suffix)) {
          return true;
        }
      }
    }

    return false;
  }

  private getEnabledCandidatesByClass(
    modelClass: TModelConfigClass,
  ): IModelCandidate[] {
    return [...MODEL_ROUTER_CONFIG.classes[modelClass]]
      .filter((candidate) => candidate.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  private resolveModelCandidates(props: {
    modelClass: TModelClass;
    requiredInputModalitiesList: TInputModality[];
    expectedOutputModality: TOutputModality;
  }): IModelCandidate[] {
    const enabledCandidates = this.getEnabledCandidatesByClass(
      props.modelClass,
    );

    const filteredCandidates = enabledCandidates.filter((candidate) => {
      if (!candidate.output_modalities.includes(props.expectedOutputModality)) {
        return false;
      }

      return props.requiredInputModalitiesList.every((requiredInputModality) =>
        candidate.input_modalities.includes(requiredInputModality),
      );
    });

    if (filteredCandidates.length) {
      return filteredCandidates;
    }

    return enabledCandidates;
  }

  private buildModelSelectionResponseFormat(candidateIds: string[]) {
    return {
      type: "json_schema" as const,
      json_schema: {
        name: "model_selection",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["selected_model_id", "reason"],
          properties: {
            selected_model_id: {
              type: "string",
              enum: candidateIds,
            },
            reason: {
              type: "string",
            },
          },
        },
      },
    };
  }

  private async selectModelCandidatesForRequest(props: {
    openRouter: OpenRouter;
    requestText: string;
    requestClassification: IRequestClassification;
    selectedModelClass: TModelClass;
    modelCandidates: IModelCandidate[];
  }): Promise<IModelSelectionResult> {
    const defaultOrderedCandidateIds = props.modelCandidates
      .slice()
      .sort((a, b) => b.priority - a.priority)
      .map((candidate) => candidate.id);
    const modelSelectionResponseFormat = this.buildModelSelectionResponseFormat(
      defaultOrderedCandidateIds,
    );
    const classifierModelIds = this.getEnabledCandidatesByClass(
      "CLASSIFIER",
    ).map((candidate) => candidate.id);

    for (const selectorModelId of classifierModelIds) {
      const selectorResponse = await props.openRouter.generate({
        model: selectorModelId,
        reasoning: false,
        max_tokens: 300,
        responseFormat: modelSelectionResponseFormat,
        temperature: 0,
        context: [
          {
            role: "system",
            content: `You are a model router. Return STRICT JSON only:
{
  "selected_model_id": "one-of-candidate-ids",
  "reason": "short reason"
}
No markdown. No extra keys.`,
          },
          {
            role: "user",
            content: `User request: ${props.requestText}`,
          },
          {
            role: "user",
            content: `Classification: ${JSON.stringify(props.requestClassification)}`,
          },
          {
            role: "user",
            content: `Target class: ${props.selectedModelClass}`,
          },
          {
            role: "user",
            content: `Candidates: ${JSON.stringify(
              props.modelCandidates.map((candidate) => ({
                id: candidate.id,
                priority: candidate.priority,
                strengths: candidate.strengths,
                best_for: candidate.best_for || [],
                avoid_for: candidate.avoid_for || [],
                input_modalities: candidate.input_modalities,
                output_modalities: candidate.output_modalities,
              })),
            )}`,
          },
        ],
      });

      if ("error" in selectorResponse) {
        console.log(
          "react-by-openrouter/model-selector-fallback",
          `model=${selectorModelId}: generation error`,
        );
        continue;
      }

      const selectedModelId = await this.parseAndNormalizeModelSelection({
        openRouter: props.openRouter,
        selectorModelId,
        requestText: props.requestText,
        requestClassification: props.requestClassification,
        selectedModelClass: props.selectedModelClass,
        modelCandidates: props.modelCandidates,
        rawSelectorOutput: selectorResponse.text,
        modelSelectionResponseFormat,
      });

      if (!selectedModelId) {
        console.log(
          "react-by-openrouter/model-selector-retry",
          `model=${selectorModelId}: invalid json or invalid selected_model_id`,
        );
        continue;
      }

      return {
        orderedCandidateIds: [
          selectedModelId,
          ...defaultOrderedCandidateIds.filter((id) => id !== selectedModelId),
        ],
        selectedModelId,
        selectedBy: "llm",
      };
    }

    return {
      orderedCandidateIds: defaultOrderedCandidateIds,
      selectedModelId: defaultOrderedCandidateIds[0] || null,
      selectedBy: "priority",
    };
  }

  private async parseAndNormalizeModelSelection(props: {
    openRouter: OpenRouter;
    selectorModelId: string;
    requestText: string;
    requestClassification: IRequestClassification;
    selectedModelClass: TModelClass;
    modelCandidates: IModelCandidate[];
    rawSelectorOutput: string;
    modelSelectionResponseFormat: {
      type: "json_schema";
      json_schema: {
        name: string;
        strict: boolean;
        schema: Record<string, unknown>;
      };
    };
  }): Promise<string | null> {
    const candidateIds = props.modelCandidates.map((candidate) => candidate.id);
    const availableIds = new Set(candidateIds);

    const parseSelectedModelId = (
      parsed: Record<string, unknown> | null,
    ): string | null => {
      if (!parsed) {
        return null;
      }

      const selectedModelId = parsed.selected_model_id;

      if (typeof selectedModelId !== "string") {
        return null;
      }

      if (!availableIds.has(selectedModelId)) {
        return null;
      }

      return selectedModelId;
    };

    const directParsed = this.tryParseJsonObject(props.rawSelectorOutput);
    const directSelectedModelId = parseSelectedModelId(directParsed);

    if (directSelectedModelId) {
      return directSelectedModelId;
    }

    const repairResponse = await props.openRouter.generate({
      model: props.selectorModelId,
      reasoning: false,
      max_tokens: 300,
      responseFormat: props.modelSelectionResponseFormat,
      temperature: 0,
      context: [
        {
          role: "system",
          content: `Convert assistant output to STRICT JSON:
{
  "selected_model_id": "one-of-candidate-ids",
  "reason": "short reason"
}
No markdown. No extra keys.`,
        },
        {
          role: "user",
          content: `User request: ${props.requestText}`,
        },
        {
          role: "user",
          content: `Classification: ${JSON.stringify(props.requestClassification)}`,
        },
        {
          role: "user",
          content: `Target class: ${props.selectedModelClass}`,
        },
        {
          role: "user",
          content: `Candidate IDs: ${JSON.stringify(candidateIds)}`,
        },
        {
          role: "user",
          content: `Assistant output to normalize: ${props.rawSelectorOutput}`,
        },
      ],
    });

    if ("error" in repairResponse) {
      return null;
    }

    const repairedParsed = this.tryParseJsonObject(repairResponse.text);
    return parseSelectedModelId(repairedParsed);
  }

  private async classifyRequest(props: {
    openRouter: OpenRouter;
    requestText: string;
    requiredInputModalitiesList: TInputModality[];
  }): Promise<IRequestClassification> {
    const classifierModels = this.getEnabledCandidatesByClass("CLASSIFIER").map(
      (candidate) => candidate.id,
    );

    for (const classifierModel of classifierModels) {
      const classificationResponse = await props.openRouter.generate({
        model: classifierModel,
        reasoning: false,
        max_tokens: 300,
        responseFormat: CLASSIFICATION_RESPONSE_FORMAT,
        temperature: 0,
        context: [
          {
            role: "system",
            content: `Return STRICT JSON only with keys:
{
  "language": "ru|en|other",
  "task": "${ALLOWED_TASKS.join(" | ")}",
  "input_modalities": ["text|image|file"],
  "output_modality": "text|image|audio|file",
  "need_web": false,
  "complexity": "low|medium|high",
  "risk_level": "low|medium|high"
}
No markdown. No explanation. No extra keys.`,
          },
          {
            role: "user",
            content: `Request text: ${props.requestText}`,
          },
          {
            role: "user",
            content: `Detected input modalities from message payload: ${JSON.stringify(props.requiredInputModalitiesList)}`,
          },
        ],
      });

      if ("error" in classificationResponse) {
        console.log(
          "react-by-openrouter/classifier-fallback",
          `model=${classifierModel}: generation error`,
        );
        continue;
      }

      const normalizedClassification =
        await this.parseAndNormalizeClassification({
          openRouter: props.openRouter,
          classifierModel,
          requestText: props.requestText,
          requiredInputModalitiesList: props.requiredInputModalitiesList,
          rawClassifierOutput: classificationResponse.text,
        });

      if (!normalizedClassification) {
        console.log(
          "react-by-openrouter/classifier-fallback",
          `model=${classifierModel}: invalid json`,
        );
        continue;
      }

      return normalizedClassification;
    }

    throw new Error("Classification failed: no model returned valid JSON.");
  }

  private resolveModelClass(props: {
    classification: IRequestClassification;
    requiredInputModalitiesList: TInputModality[];
  }): TModelClass {
    if (
      props.classification.task === "image_gen" ||
      props.classification.output_modality === "image"
    ) {
      return "IMAGE";
    }

    if (props.classification.task === "coding") {
      return "CODER";
    }

    if (
      props.classification.task === "image_understanding" ||
      props.requiredInputModalitiesList.includes("image") ||
      props.requiredInputModalitiesList.includes("file")
    ) {
      return "VISION";
    }

    return "CHAT";
  }

  private getGenerationValidationError(props: {
    expectedOutputModality: TOutputModality;
    result: { text: string; images?: { url?: string; b64_json?: string }[] };
  }): string | null {
    if (props.expectedOutputModality === "image") {
      if (!props.result.images?.length) {
        return "expected image output, but model returned no images";
      }
      return null;
    }

    if (props.expectedOutputModality === "text") {
      if (!props.result.text?.trim()) {
        return "expected text output, but model returned empty text";
      }
      return null;
    }

    return `output modality is not supported by endpoint: ${props.expectedOutputModality}`;
  }

  private async parseAndNormalizeClassification(props: {
    openRouter: OpenRouter;
    classifierModel: string;
    requestText: string;
    requiredInputModalitiesList: TInputModality[];
    rawClassifierOutput: string;
  }): Promise<IRequestClassification | null> {
    const directParsed = this.tryParseJsonObject(props.rawClassifierOutput);

    if (directParsed) {
      return this.normalizeClassificationPayload({
        parsedJson: directParsed,
        requestText: props.requestText,
        requiredInputModalitiesList: props.requiredInputModalitiesList,
      });
    }

    const repairResponse = await props.openRouter.generate({
      model: props.classifierModel,
      reasoning: false,
      max_tokens: 300,
      responseFormat: CLASSIFICATION_RESPONSE_FORMAT,
      temperature: 0,
      context: [
        {
          role: "system",
          content: `Convert the assistant output into STRICT JSON with keys:
{
  "language": "ru|en|other",
  "task": "${ALLOWED_TASKS.join(" | ")}",
  "input_modalities": ["text|image|file"],
  "output_modality": "text|image|audio|file",
  "need_web": false,
  "complexity": "low|medium|high",
  "risk_level": "low|medium|high"
}
No markdown. No explanation. No extra keys.`,
        },
        {
          role: "user",
          content: `Request text: ${props.requestText}`,
        },
        {
          role: "user",
          content: `Detected input modalities from message payload: ${JSON.stringify(props.requiredInputModalitiesList)}`,
        },
        {
          role: "user",
          content: `Assistant output to normalize: ${props.rawClassifierOutput}`,
        },
      ],
    });

    if ("error" in repairResponse) {
      return null;
    }

    const repairedParsed = this.tryParseJsonObject(repairResponse.text);

    if (!repairedParsed) {
      return null;
    }

    return this.normalizeClassificationPayload({
      parsedJson: repairedParsed,
      requestText: props.requestText,
      requiredInputModalitiesList: props.requiredInputModalitiesList,
    });
  }

  private normalizeClassificationPayload(props: {
    parsedJson: Record<string, unknown>;
    requestText: string;
    requiredInputModalitiesList: TInputModality[];
  }): IRequestClassification {
    const task = ALLOWED_TASKS.includes(props.parsedJson.task as TRequestTask)
      ? (props.parsedJson.task as TRequestTask)
      : "qa";
    const output_modality = ALLOWED_OUTPUT_MODALITIES.includes(
      props.parsedJson.output_modality as TOutputModality,
    )
      ? (props.parsedJson.output_modality as TOutputModality)
      : "text";
    const input_modalities = (
      Array.isArray(props.parsedJson.input_modalities)
        ? props.parsedJson.input_modalities
        : props.requiredInputModalitiesList
    ).filter((modality) =>
      ALLOWED_INPUT_MODALITIES.includes(modality as TInputModality),
    ) as TInputModality[];

    return {
      language: this.normalizeLanguage(
        props.parsedJson.language || props.requestText,
      ),
      task,
      input_modalities:
        input_modalities.length > 0
          ? input_modalities
          : props.requiredInputModalitiesList,
      output_modality,
      need_web: Boolean(props.parsedJson.need_web),
      complexity:
        props.parsedJson.complexity === "low" ||
        props.parsedJson.complexity === "medium" ||
        props.parsedJson.complexity === "high"
          ? props.parsedJson.complexity
          : "medium",
      risk_level:
        props.parsedJson.risk_level === "low" ||
        props.parsedJson.risk_level === "medium" ||
        props.parsedJson.risk_level === "high"
          ? props.parsedJson.risk_level
          : "medium",
    };
  }

  private adaptClassificationForEndpoint(props: {
    classification: IRequestClassification;
    requiredInputModalitiesList: TInputModality[];
  }): IRequestClassification {
    let task = props.classification.task;
    const initialTask = task;
    let outputModality = props.classification.output_modality;
    const hasImageInput = props.requiredInputModalitiesList.includes("image");

    // This endpoint currently supports text/image generation only.
    if (outputModality === "file") {
      if (hasImageInput || task === "image_gen" || task === "file_gen") {
        outputModality = "image";
        if (task === "file_gen") {
          task = "image_gen";
        }
      } else {
        outputModality = "text";
        if (initialTask === "file_gen") {
          task = "qa";
        }
      }
    }

    if (outputModality === "audio") {
      outputModality = "text";
      if (task === "tts" || task === "asr" || task === "music_gen") {
        task = "qa";
      }
    }

    return {
      ...props.classification,
      task,
      output_modality: outputModality,
      input_modalities: props.requiredInputModalitiesList,
    };
  }

  private normalizeLanguage(value: unknown): string {
    if (typeof value !== "string") {
      return "en";
    }

    const lowered = value.toLowerCase().trim();

    if (lowered.includes("russian") || lowered === "ru") {
      return "ru";
    }

    if (lowered.includes("english") || lowered === "en") {
      return "en";
    }

    if (/[а-яё]/i.test(lowered)) {
      return "ru";
    }

    if (/[a-z]/i.test(lowered)) {
      return "en";
    }

    return "en";
  }

  private tryParseJsonObject(value: string): Record<string, unknown> | null {
    const trimmed = value.trim();
    const candidateValues = [trimmed];

    const fencedJsonMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
    if (fencedJsonMatch?.[1]) {
      candidateValues.push(fencedJsonMatch[1].trim());
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      candidateValues.push(trimmed.slice(firstBrace, lastBrace + 1));
    }

    for (const candidate of candidateValues) {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }
}
