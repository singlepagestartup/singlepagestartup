import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  telegramBotServiceMessages,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { blobifyFiles, getHttpErrorType } from "@sps/backend-utils";
import {
  OpenRouter,
  type IOpenRouterGenerateResult,
  type IOpenRouterGenerationSuccess,
  type IOpenRouterRequestMessage,
} from "@sps/shared-third-parties";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import * as jwt from "hono/jwt";
import {
  OPEN_ROUTER_PRECHARGE_TOKENS,
  summarizeOpenRouterBilling,
  type IOpenRouterBillingLedgerEntry,
  type TOpenRouterBillingPurpose,
} from "../../../../../../../../service/singlepage/open-router-billing";

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
        id: "openai/gpt-5.2",
        enabled: true,
        priority: 100,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["classification", "routing"],
      },
      {
        id: "anthropic/claude-sonnet-4.6",
        enabled: true,
        priority: 90,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["classification", "routing"],
      },
    ],
    CHAT: [
      {
        id: "openai/gpt-5.2",
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
        id: "openai/gpt-5.2",
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
        best_for: [
          "photography_style",
          "realistic_product_shots",
          "image_editing",
        ],
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
const THREAD_CONTEXT_PAGE_SIZE = 100;

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

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  private async generateWithBillingLedger(props: {
    billingLedger: IOpenRouterBillingLedgerEntry[];
    purpose: TOpenRouterBillingPurpose;
    openRouter: OpenRouter;
    model: string;
    context: IOpenRouterRequestMessage[];
    max_tokens?: number;
    reasoning?: boolean;
    responseFormat?:
      | {
          type: "json_object";
        }
      | {
          type: "json_schema";
          json_schema: {
            name: string;
            schema: Record<string, unknown>;
            strict?: boolean;
          };
        };
    temperature?: number;
    stripNonTextOnRetry?: boolean;
  }): Promise<IOpenRouterGenerateResult> {
    const result = await props.openRouter.generate({
      model: props.model,
      context: props.context,
      max_tokens: props.max_tokens,
      reasoning: props.reasoning,
      responseFormat: props.responseFormat,
      temperature: props.temperature,
      stripNonTextOnRetry: props.stripNonTextOnRetry,
    });

    props.billingLedger.push({
      purpose: props.purpose,
      modelId: props.model,
      status: "error" in result ? "error" : "success",
      billing: result.billing,
      ...("error" in result
        ? { error: this.stringifyError(result.error) }
        : {}),
    });

    return result;
  }

  private setLatestBillingLedgerFallbackReason(props: {
    billingLedger: IOpenRouterBillingLedgerEntry[];
    fallbackReason: string;
  }) {
    const latestEntry = props.billingLedger[props.billingLedger.length - 1];

    if (!latestEntry) {
      return;
    }

    latestEntry.fallbackReason = props.fallbackReason;
  }

  private async settleOpenRouterBilling(props: {
    billingLedger: IOpenRouterBillingLedgerEntry[];
    selectedModelId: string | null;
    route: string;
    method: string;
    authorization?: string;
  }) {
    const summary = summarizeOpenRouterBilling({
      calls: props.billingLedger,
      selectedModelId: props.selectedModelId,
      prechargeTokens: OPEN_ROUTER_PRECHARGE_TOKENS,
    });
    const settlement = await this.service.billRouteSettle({
      permission: {
        route: props.route,
        method: props.method,
        type: "HTTP",
      },
      authorization: {
        value: props.authorization,
      },
      exactAmount: String(summary.exactTokens),
    });

    return {
      summary,
      settlement,
    };
  }

  private async findThreadMessageIdsInChat(props: {
    socialModuleChatId: string;
    socialModuleThreadId: string;
  }) {
    const threadMessageIds: string[] = [];
    let offset = 0;

    while (true) {
      const socialModuleThreadToMessages =
        await this.service.socialModule.threadsToMessages.find({
          params: {
            filters: {
              and: [
                {
                  column: "threadId",
                  method: "eq",
                  value: props.socialModuleThreadId,
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
            limit: THREAD_CONTEXT_PAGE_SIZE,
            offset,
          },
        });

      if (!socialModuleThreadToMessages?.length) {
        break;
      }

      for (const socialModuleThreadToMessage of socialModuleThreadToMessages) {
        if (socialModuleThreadToMessage.messageId) {
          threadMessageIds.push(socialModuleThreadToMessage.messageId);
        }
      }

      if (socialModuleThreadToMessages.length < THREAD_CONTEXT_PAGE_SIZE) {
        break;
      }

      offset += THREAD_CONTEXT_PAGE_SIZE;
    }

    const uniqueThreadMessageIds = [...new Set(threadMessageIds)];

    if (!uniqueThreadMessageIds.length) {
      return [];
    }

    const socialModuleChatToMessages =
      await this.service.socialModule.chatsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
              {
                column: "messageId",
                method: "inArray",
                value: uniqueThreadMessageIds,
              },
            ],
          },
        },
      });

    const chatMessageIds = new Set(
      socialModuleChatToMessages
        ?.map((socialModuleChatToMessage) => {
          return socialModuleChatToMessage.messageId;
        })
        .filter((messageId): messageId is string => Boolean(messageId)) || [],
    );

    return uniqueThreadMessageIds.filter((messageId) => {
      return chatMessageIds.has(messageId);
    });
  }

  async execute(c: Context, next: any): Promise<Response> {
    const billingLedger: IOpenRouterBillingLedgerEntry[] = [];
    let selectedModelIdForBilling: string | null = null;
    let billingSettled = false;
    const requestRoute = c.req.path.toLowerCase();
    const requestMethod = c.req.method;
    const authorizationHeader = c.req.header("Authorization");
    const requestAuthorization = authorizationHeader?.startsWith("Bearer ")
      ? authorizationHeader.replace("Bearer ", "")
      : authorizationHeader;

    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
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
        await this.service.socialModule.profilesToMessages.find({
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

      const socialModuleProfile =
        await this.service.socialModule.profile.findById({
          id: socialModuleProfileId,
        });

      if (!socialModuleProfile) {
        throw new Error(
          "Not found error. Requested social-module profile not found",
        );
      }

      const socialModuleMessage =
        await this.service.socialModule.message.findById({
          id: socialModuleMessageId,
        });

      if (!socialModuleMessage?.description) {
        throw new Error(
          "Not found. Social module message description not found",
        );
      }

      const socialModuleThreadId = await this.resolveThreadIdForMessageInChat({
        socialModuleChatId,
        socialModuleMessageId,
      });

      const context: IOpenRouterRequestMessage[] = [];

      const replyBySocialModuleProfile = data.shouldReplySocialModuleProfile;

      if (!replyBySocialModuleProfile) {
        throw new Error(
          "Validation error. 'data.shouldReplySocialModuleProfile' not passed.",
        );
      }

      const chatThreadMessageIds = await this.findThreadMessageIdsInChat({
        socialModuleChatId,
        socialModuleThreadId,
      });

      if (chatThreadMessageIds.length) {
        const socialModuleMessages =
          await this.service.socialModule.message.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: chatThreadMessageIds,
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
          });

        if (socialModuleMessages?.length) {
          const socialModuleProfilesToMessages =
            await this.service.socialModule.profilesToMessages.find({
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
                await this.service.socialModule.messagesToFileStorageModuleFiles.find(
                  {
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
                  },
                );

              if (socialModuleMessagesToFileStorageModuleFiles?.length) {
                fileStorageFiles =
                  await this.service.fileStorageModule.file.find({
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
        await this.service.subjectsToSocialModuleProfiles.find({
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
        });

      if (!subjectsToSocialModuleProfiles?.length) {
        throw new Error(
          "Validation error. 'subjectsToSocialModuleProfiles' not found.",
        );
      }

      const replyBySubject = await this.service.findById({
        id: subjectsToSocialModuleProfiles[0].subjectId,
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
        await api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
          {
            id: replyBySubject.id,
            socialModuleProfileId: replyBySocialModuleProfile.id,
            socialModuleChatId: socialModuleChatId,
            socialModuleThreadId,
            data: {
              description: this.statusMessages.openRouterStarted.ru,
            },
            options: {
              headers: {
                Authorization: "Bearer " + replyByJwt,
              },
            },
          },
        );

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

      await openRouter.getModels();

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
        billingLedger,
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
        billingLedger,
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
      let generationResult: IOpenRouterGenerationSuccess | undefined;
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

        const candidateResult = await this.generateWithBillingLedger({
          billingLedger,
          purpose: "generation",
          openRouter,
          model: modelCandidateId,
          context: generationContext,
          stripNonTextOnRetry: false,
        });

        if ("error" in candidateResult) {
          const reason = `model=${modelCandidateId}: generation error`;
          fallbackReasons.push(reason);
          this.setLatestBillingLedgerFallbackReason({
            billingLedger,
            fallbackReason: reason,
          });
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
          this.setLatestBillingLedgerFallbackReason({
            billingLedger,
            fallbackReason: reason,
          });
          console.log("react-by-openrouter/fallback", reason);
          continue;
        }

        selectModelForRequest = modelCandidateId;
        selectedModelIdForBilling = modelCandidateId;
        generationResult = candidateResult;
        break;
      }

      if (!selectModelForRequest || !generationResult) {
        selectedModelIdForBilling = modelSelection.selectedModelId;
        await this.settleOpenRouterBilling({
          billingLedger,
          selectedModelId: selectedModelIdForBilling,
          route: requestRoute,
          method: requestMethod,
          authorization: requestAuthorization,
        });
        billingSettled = true;
        const fallbackMessage =
          "No valid model response received. " + fallbackReasons.join(" | ");
        const updatedStatusMessage =
          await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
            id: replyBySubject.id,
            socialModuleProfileId: replyBySocialModuleProfile.id,
            socialModuleChatId: socialModuleChatId,
            socialModuleMessageId: statusMessage.id,
            data: {
              description:
                this.statusMessages.openRouterError.ru +
                "\n`" +
                fallbackMessage +
                "`",
            },
            options: {
              headers: {
                Authorization: "Bearer " + replyByJwt,
              },
            },
          });

        return c.json({
          data: {
            socialModule: {
              message: updatedStatusMessage,
            },
          },
        });
      }

      const billingSettlement = await this.settleOpenRouterBilling({
        billingLedger,
        selectedModelId: selectModelForRequest,
        route: requestRoute,
        method: requestMethod,
        authorization: requestAuthorization,
      });
      billingSettled = true;

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
      replyMessageData.metadata = {
        openRouter: {
          billing: {
            ...billingSettlement.summary,
            settlement: billingSettlement.settlement?.settlement || null,
          },
        },
      };

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
        await api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
          {
            id: replyBySubject.id,
            socialModuleProfileId: replyBySocialModuleProfile.id,
            socialModuleChatId: socialModuleChatId,
            socialModuleThreadId,
            data: replyMessageData,
            options: {
              headers: {
                Authorization: "Bearer " + replyByJwt,
              },
            },
          },
        );

      return c.json({
        data: {
          socialModule: {
            message: repliedSocialModuleMessage,
          },
        },
      });
    } catch (error: any) {
      if (!billingSettled && requestAuthorization) {
        try {
          await this.settleOpenRouterBilling({
            billingLedger,
            selectedModelId: selectedModelIdForBilling,
            route: requestRoute,
            method: requestMethod,
            authorization: requestAuthorization,
          });
          billingSettled = true;
        } catch (settlementError) {
          error = new Error(
            `OpenRouter settlement failed after request error: ${this.stringifyError(
              settlementError,
            )}. Original error: ${this.stringifyError(error)}`,
          );
        }
      }

      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  async resolveThreadIdForMessageInChat(props: {
    socialModuleChatId: string;
    socialModuleMessageId: string;
  }): Promise<string> {
    const socialModuleChatsToThreads =
      await this.service.socialModule.chatsToThreads.find({
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
      await this.service.socialModule.threadsToMessages.find({
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
    const validMessageThreadIds = messageThreadIds.filter((threadId) =>
      chatThreadIdsSet.has(threadId),
    );

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

    const socialModuleDefaultThread =
      await this.service.socialModuleChatLifecycleEnsureDefaultThreadForChat({
        socialModuleChatId: props.socialModuleChatId,
      });

    const existingThreadToMessageLinks =
      await this.service.socialModule.threadsToMessages.find({
        params: {
          filters: {
            and: [
              {
                column: "threadId",
                method: "eq",
                value: socialModuleDefaultThread.id,
              },
              {
                column: "messageId",
                method: "eq",
                value: props.socialModuleMessageId,
              },
            ],
          },
          limit: 1,
        },
      });

    if (!existingThreadToMessageLinks?.length) {
      await this.service.socialModule.threadsToMessages.create({
        data: {
          threadId: socialModuleDefaultThread.id,
          messageId: props.socialModuleMessageId,
        },
      });
    }

    return socialModuleDefaultThread.id;
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
    billingLedger: IOpenRouterBillingLedgerEntry[];
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
      const selectorResponse = await this.generateWithBillingLedger({
        billingLedger: props.billingLedger,
        purpose: "model_selection",
        openRouter: props.openRouter,
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
        billingLedger: props.billingLedger,
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
        this.setLatestBillingLedgerFallbackReason({
          billingLedger: props.billingLedger,
          fallbackReason:
            "invalid json or invalid selected_model_id; falling back to the next selector model",
        });
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
    billingLedger: IOpenRouterBillingLedgerEntry[];
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

    const repairResponse = await this.generateWithBillingLedger({
      billingLedger: props.billingLedger,
      purpose: "model_selection_repair",
      openRouter: props.openRouter,
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
    billingLedger: IOpenRouterBillingLedgerEntry[];
    openRouter: OpenRouter;
    requestText: string;
    requiredInputModalitiesList: TInputModality[];
  }): Promise<IRequestClassification> {
    const classifierModels = this.getEnabledCandidatesByClass("CLASSIFIER").map(
      (candidate) => candidate.id,
    );
    const fallbackClassifierModels = this.getEnabledCandidatesByClass("CHAT")
      .map((candidate) => candidate.id)
      .filter((candidateId) => !classifierModels.includes(candidateId));
    const allClassifierModels = [
      ...classifierModels,
      ...fallbackClassifierModels,
    ];

    for (const classifierModel of classifierModels) {
      const classificationResponse = await this.generateWithBillingLedger({
        billingLedger: props.billingLedger,
        purpose: "classification",
        openRouter: props.openRouter,
        model: classifierModel,
        reasoning: false,
        max_tokens: 600,
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
          billingLedger: props.billingLedger,
          openRouter: props.openRouter,
          classifierModel,
          fallbackClassifierModels: classifierModels.filter(
            (m) => m !== classifierModel,
          ),
          requestText: props.requestText,
          requiredInputModalitiesList: props.requiredInputModalitiesList,
          rawClassifierOutput: classificationResponse.text,
        });

      if (!normalizedClassification) {
        console.log(
          "react-by-openrouter/classifier-fallback",
          `model=${classifierModel}: invalid json`,
        );
        this.setLatestBillingLedgerFallbackReason({
          billingLedger: props.billingLedger,
          fallbackReason:
            "invalid classification json; falling back to the next classifier model",
        });
        continue;
      }

      return normalizedClassification;
    }

    for (const classifierModel of fallbackClassifierModels) {
      const classificationResponse = await this.generateWithBillingLedger({
        billingLedger: props.billingLedger,
        purpose: "classification",
        openRouter: props.openRouter,
        model: classifierModel,
        reasoning: false,
        max_tokens: 600,
        temperature: 0,
        context: [
          {
            role: "system",
            content: `Classify user request and return JSON object only:
{
  "language": "ru|en|other",
  "task": "${ALLOWED_TASKS.join(" | ")}",
  "input_modalities": ["text|image|file"],
  "output_modality": "text|image|audio|file",
  "need_web": false,
  "complexity": "low|medium|high",
  "risk_level": "low|medium|high"
}
No markdown. No explanation.`,
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
          `model=${classifierModel}: fallback generation error`,
        );
        continue;
      }

      const normalizedClassification =
        await this.parseAndNormalizeClassification({
          billingLedger: props.billingLedger,
          openRouter: props.openRouter,
          classifierModel,
          fallbackClassifierModels: allClassifierModels.filter(
            (modelId) => modelId !== classifierModel,
          ),
          requestText: props.requestText,
          requiredInputModalitiesList: props.requiredInputModalitiesList,
          rawClassifierOutput: classificationResponse.text,
        });

      if (!normalizedClassification) {
        console.log(
          "react-by-openrouter/classifier-fallback",
          `model=${classifierModel}: fallback invalid json`,
        );
        this.setLatestBillingLedgerFallbackReason({
          billingLedger: props.billingLedger,
          fallbackReason:
            "invalid fallback classification json; falling back to another classifier",
        });
        continue;
      }

      return normalizedClassification;
    }

    const heuristicClassification = this.getHeuristicClassification({
      requestText: props.requestText,
      requiredInputModalitiesList: props.requiredInputModalitiesList,
    });

    console.log("react-by-openrouter/classifier-fallback", {
      reason: "all classifier models failed; using heuristic classification",
      modelsTried: allClassifierModels,
      heuristicClassification,
    });

    return heuristicClassification;
  }

  private getHeuristicClassification(props: {
    requestText: string;
    requiredInputModalitiesList: TInputModality[];
  }): IRequestClassification {
    const normalizedRequestText = props.requestText.toLowerCase();
    const hasImageInput = props.requiredInputModalitiesList.includes("image");
    const hasFileInput = props.requiredInputModalitiesList.includes("file");

    let task: TRequestTask = "qa";

    if (
      /(code|coding|debug|bug|refactor|typescript|javascript|python|код|программ)/i.test(
        normalizedRequestText,
      )
    ) {
      task = "coding";
    } else if (
      /(translate|translation|перевед|перевод|локализац)/i.test(
        normalizedRequestText,
      )
    ) {
      task = "translate";
    } else if (
      /(summarize|summary|кратк|резюм|подведи итог)/i.test(
        normalizedRequestText,
      )
    ) {
      task = "summarize";
    } else if (
      /(extract|извлеки|достань|вытащи|структурируй)/i.test(
        normalizedRequestText,
      )
    ) {
      task = "extract";
    } else if (
      /(image generation|generate image|draw|picture|poster|картин|изображен|нарисуй|сгенерируй)/i.test(
        normalizedRequestText,
      )
    ) {
      task = "image_gen";
    } else if (hasImageInput || hasFileInput) {
      task = "image_understanding";
    }

    const output_modality: TOutputModality =
      task === "image_gen" ? "image" : "text";

    return {
      language: this.normalizeLanguage(props.requestText),
      task,
      input_modalities:
        props.requiredInputModalitiesList.length > 0
          ? props.requiredInputModalitiesList
          : ["text"],
      output_modality,
      need_web: false,
      complexity: "medium",
      risk_level: "medium",
    };
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
    billingLedger: IOpenRouterBillingLedgerEntry[];
    openRouter: OpenRouter;
    classifierModel: string;
    fallbackClassifierModels?: string[];
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

    const repairModelId =
      props.fallbackClassifierModels?.[0] ?? props.classifierModel;

    const repairResponse = await this.generateWithBillingLedger({
      billingLedger: props.billingLedger,
      purpose: "classification_repair",
      openRouter: props.openRouter,
      model: repairModelId,
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
