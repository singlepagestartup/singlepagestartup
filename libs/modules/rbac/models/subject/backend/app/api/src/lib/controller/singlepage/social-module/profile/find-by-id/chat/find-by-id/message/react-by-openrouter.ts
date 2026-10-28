import {
  OPEN_ROUTER_ASSISTANT_MODEL,
  AI_CONTEXT_POLICY,
  OPEN_ROUTER_MODEL_ROUTER_CONFIG as MODEL_ROUTER_CONFIG,
  replaceKnowledgeUserContext,
  readKnowledgeUserContext,
  sliceKnowledgeToolText,
  KNOWLEDGE_TOOL_RESULT_MAX_BYTES,
  KNOWLEDGE_TOOL_READ_MAX_CHARS,
  KNOWLEDGE_TOOL_USER_CONTEXT_MAX_BYTES,
  KNOWLEDGE_TOOL_WRITE_TIMEOUT_MS,
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_JWT_SECRET,
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
  RBAC_SECRET_KEY,
  normalizeAiResponseText,
  telegramBotServiceMessages,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  Service,
  type IOpenRouterBillingLedgerEntry,
  type IOpenRouterBillingSummary,
  type IProfileMcpCatalogSession,
  type ISocialProfileAiTool,
  type ISocialProfileAiToolLoopResult,
  type TOpenRouterBillingPurpose,
  type IAiContextHistoryMessage,
} from "@sps/rbac/models/subject/backend/app/api/src/lib/service";
import { api } from "@sps/rbac/models/subject/sdk/server";
import {
  type IRbacAiReactionRequest,
  type TRbacAiReactionReasoning,
  parseRbacAiReactionRequestMetadata,
} from "@sps/rbac/models/subject/sdk/model";
import {
  blobifyFiles,
  assertKnowledgeAttachmentBytes,
  getHttpErrorType,
  getAIChatDocumentForSkill,
  estimateAiContextTokens,
} from "@sps/backend-utils";
import {
  OpenRouter,
  type IOpenRouterGenerateResult,
  type IOpenRouterGenerationSuccess,
  type IOpenRouterMessageContent,
  type IOpenRouterModel,
  type IOpenRouterRequestMessage,
  type IOpenRouterReasoning,
  type IOpenRouterTool,
  type IOpenRouterToolChoice,
} from "@sps/shared-third-parties";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import {
  IModel as ISocialModuleMessage,
  isSocialMessageExcludedFromOpenRouter,
  withSocialMessageSystemMetadata,
} from "@sps/social/models/message/sdk/model";
import {
  getLocalizedProfilePlainText,
  IModel as ISocialModuleProfile,
} from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleSkill } from "@sps/social/models/skill/sdk/model";
import {
  SocialProfileJevService,
  type TJevKnowledgeAction,
} from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/jev";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import {
  Service as DocumentService,
  type IAIChatDocumentContext,
} from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/document";
import { Service as ProfileSkills } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/skills";
import { KnowledgeSearchResult } from "@sps/knowledge/backend/app/api/src/lib/types";

import { fingerprintAiContextMessage } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/context/utils";
import * as jwt from "hono/jwt";
import { createHash } from "node:crypto";
import { basename, extname } from "node:path";

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
type TModelConfigClass = TModelClass;

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
  selectedBy: "jev" | "priority" | "manual" | "single";
}

interface IFinalGenerationResult {
  selectedModelId: string | null;
  generationResult?: IOpenRouterGenerationSuccess;
  fallbackReasons: string[];
}

interface IRequestData {
  shouldReplySocialModuleProfile?: Partial<ISocialModuleProfile> & {
    id?: string;
  };
}

interface IResolvedOpenRouterKnowledgeContext {
  query: string;
  requestedSkillIds: string[];
  requestedKnowledgeSearch: boolean;
  useKnowledgeSearch: boolean;
  knowledgeSourceIds: string[];
  searchSourceIds: string[];
  candidateSources: KnowledgeSearchResult[];
  sources: KnowledgeSearchResult[];
  retrieval: IOpenRouterKnowledgeRetrievalMetadata;
  availableSkills: ISocialModuleSkill[];
  promptSkills: ISocialModuleSkill[];
  skillMessagePrefix: string;
  systemMessages: IOpenRouterRequestMessage[];
}

interface IResolvedOpenRouterMessageContext {
  content: IOpenRouterRequestMessage["content"] | null;
  routingText: string;
}

interface IOpenRouterKnowledgeRetrievalMetadata {
  initialTopK: number;
  neighborWindow: number;
  candidateCount: number;
  rerankTopK: number;
  rerankedSourceIds: string[];
  rerankFallbackReason: string | null;
  rerankReason: string | null;
}

const ALLOWED_OUTPUT_MODALITIES: TOutputModality[] = [
  "text",
  "image",
  "audio",
  "file",
];

const ALLOWED_INPUT_MODALITIES: TInputModality[] = ["text", "image", "file"];
const THREAD_CONTEXT_PAGE_SIZE = 100;
const OPEN_ROUTER_FINAL_TEXT_MAX_TOKENS = 8192;
const OPEN_ROUTER_ROUTING_TEXT_MAX_CHARS = 12_000;
const KNOWLEDGE_INITIAL_TOP_K = 30;
const KNOWLEDGE_NEIGHBOR_WINDOW = 1;
const KNOWLEDGE_RERANK_TOP_K = 12;
const KNOWLEDGE_RERANK_THREAD_CONTEXT_MESSAGES = 8;
const KNOWLEDGE_RERANK_THREAD_CONTEXT_CHARS = 800;
const OPEN_ROUTER_TERMINAL_MESSAGE_WRITTEN_MARKER =
  "open-router-terminal-message-written";

export class Handler {
  service: Service;
  knowledgeService: KnowledgeService;
  statusMessages = telegramBotServiceMessages;

  constructor(service: Service) {
    this.service = service;
    this.knowledgeService = new KnowledgeService();
  }

  protected stringifyError(error: unknown): string {
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

  protected async generateWithBillingLedger(props: {
    billingLedger: IOpenRouterBillingLedgerEntry[];
    purpose: TOpenRouterBillingPurpose;
    openRouter: OpenRouter;
    model: string;
    sessionId?: string;
    context: IOpenRouterRequestMessage[];
    max_tokens?: number;
    reasoning?: IOpenRouterReasoning;
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
    tools?: IOpenRouterTool[];
    toolChoice?: IOpenRouterToolChoice;
    parallelToolCalls?: boolean;
  }): Promise<IOpenRouterGenerateResult> {
    const result = await props.openRouter.generate({
      model: props.model,
      sessionId: props.sessionId,
      context: props.context,
      max_tokens: props.max_tokens,
      reasoning: props.reasoning,
      responseFormat: props.responseFormat,
      temperature: props.temperature,
      stripNonTextOnRetry: props.stripNonTextOnRetry,
      tools: props.tools,
      toolChoice: props.toolChoice,
      parallelToolCalls: props.parallelToolCalls,
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

  protected setLatestBillingLedgerFallbackReason(props: {
    billingLedger: IOpenRouterBillingLedgerEntry[];
    fallbackReason: string;
  }) {
    const latestEntry = props.billingLedger[props.billingLedger.length - 1];

    if (!latestEntry) {
      return;
    }

    latestEntry.fallbackReason = props.fallbackReason;
  }

  protected async settleOpenRouterBilling(props: {
    billingLedger: IOpenRouterBillingLedgerEntry[];
    selectedModelId: string | null;
    route: string;
    method: string;
    authorization?: string;
  }) {
    const summary = this.service.billingOpenRouterSummarize({
      calls: props.billingLedger,
      selectedModelId: props.selectedModelId,
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

  protected async buildOpenRouterReplyMessageData(props: {
    expectedOutputModality: TOutputModality;
    generationResult: Pick<IOpenRouterGenerationSuccess, "text" | "images">;
    selectModelForRequest: string;
    billingSettlement: {
      summary: IOpenRouterBillingSummary;
      settlement: any;
    };
    metadata?: Record<string, unknown>;
  }) {
    const generatedMessageText = normalizeAiResponseText(
      props.generationResult.text,
    );
    let generatedMessageDescription = "";
    const replyMessageData: any = {};

    if (props.expectedOutputModality === "image") {
      const imageUrl = props.generationResult.images?.[0]?.url;

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
        generatedMessageText || "Изображение сгенерировано";
    } else if (props.expectedOutputModality === "text") {
      if (!generatedMessageText) {
        throw new Error("Generated message is empty");
      }

      generatedMessageDescription = generatedMessageText;
    } else {
      throw new Error(
        `output modality is not supported by endpoint: ${props.expectedOutputModality}`,
      );
    }

    replyMessageData.description = `${generatedMessageDescription}\n\n__${props.selectModelForRequest}__`;
    const openRouterMetadata =
      props.metadata?.["openRouter"] &&
      typeof props.metadata["openRouter"] === "object" &&
      !Array.isArray(props.metadata["openRouter"])
        ? (props.metadata["openRouter"] as Record<string, unknown>)
        : {};
    replyMessageData.metadata = {
      ...props.metadata,
      openRouter: {
        ...openRouterMetadata,
        billing: {
          ...props.billingSettlement.summary,
          settlement: props.billingSettlement.settlement?.settlement || null,
        },
      },
    };

    return replyMessageData;
  }

  protected buildNoValidModelResponseMessage(
    _fallbackReasons: string[],
    language = "en",
  ) {
    return language.toLowerCase().startsWith("ru")
      ? "Не удалось получить корректный ответ от модели. Попробуйте повторить запрос или выбрать другую модель."
      : "A valid response could not be received from the model. Please try again or select another model.";
  }

  protected getGenerationFailureReason(props: {
    modelId: string;
    expectedOutputModality: TOutputModality;
    result: IOpenRouterGenerateResult;
  }): string | null {
    if ("error" in props.result) {
      return `model=${props.modelId}: generation error`;
    }

    const validationError = this.getGenerationValidationError({
      expectedOutputModality: props.expectedOutputModality,
      result: props.result,
    });

    if (!validationError) {
      return null;
    }

    return `model=${props.modelId}: ${validationError}`;
  }

  protected async generateFinalOpenRouterReply(props: {
    billingLedger: IOpenRouterBillingLedgerEntry[];
    openRouter: OpenRouter;
    modelSelection: IModelSelectionResult;
    expectedOutputModality: TOutputModality;
    generationContext: IOpenRouterRequestMessage[];
    sessionId?: string;
    reasoning?: IOpenRouterReasoning;
    onModelAttempt?: (modelId: string) => Promise<void>;
  }): Promise<IFinalGenerationResult> {
    const primaryModelId =
      props.modelSelection.selectedModelId ||
      props.modelSelection.orderedCandidateIds[0] ||
      null;

    if (!primaryModelId) {
      return {
        selectedModelId: null,
        fallbackReasons: ["model=null: no model selected"],
      };
    }

    const fallbackReasons: string[] = [];
    const maxTokens =
      props.expectedOutputModality === "text"
        ? OPEN_ROUTER_FINAL_TEXT_MAX_TOKENS
        : undefined;

    await props.onModelAttempt?.(primaryModelId);

    const primaryResult = await this.generateWithBillingLedger({
      billingLedger: props.billingLedger,
      purpose: "generation",
      openRouter: props.openRouter,
      model: primaryModelId,
      context: props.generationContext,
      sessionId: props.sessionId,
      max_tokens: maxTokens,
      reasoning: props.reasoning,
      stripNonTextOnRetry: false,
    });

    const primaryFailureReason = this.getGenerationFailureReason({
      modelId: primaryModelId,
      expectedOutputModality: props.expectedOutputModality,
      result: primaryResult,
    });

    if (!primaryFailureReason) {
      return {
        selectedModelId: primaryModelId,
        generationResult: primaryResult as IOpenRouterGenerationSuccess,
        fallbackReasons,
      };
    }

    fallbackReasons.push(primaryFailureReason);
    this.setLatestBillingLedgerFallbackReason({
      billingLedger: props.billingLedger,
      fallbackReason: primaryFailureReason,
    });
    console.log("react-by-openrouter/fallback", primaryFailureReason);

    const fallbackModelId =
      props.modelSelection.orderedCandidateIds.find((modelId) => {
        return modelId !== primaryModelId;
      }) || primaryModelId;

    await props.onModelAttempt?.(fallbackModelId);

    const fallbackResult = await this.generateWithBillingLedger({
      billingLedger: props.billingLedger,
      purpose: "generation",
      openRouter: props.openRouter,
      model: fallbackModelId,
      context: props.generationContext,
      sessionId: props.sessionId,
      max_tokens: maxTokens,
      reasoning: props.reasoning,
      stripNonTextOnRetry: false,
    });

    const fallbackFailureReason = this.getGenerationFailureReason({
      modelId: fallbackModelId,
      expectedOutputModality: props.expectedOutputModality,
      result: fallbackResult,
    });

    if (!fallbackFailureReason) {
      return {
        selectedModelId: fallbackModelId,
        generationResult: fallbackResult as IOpenRouterGenerationSuccess,
        fallbackReasons,
      };
    }

    fallbackReasons.push(fallbackFailureReason);
    this.setLatestBillingLedgerFallbackReason({
      billingLedger: props.billingLedger,
      fallbackReason: fallbackFailureReason,
    });
    console.log("react-by-openrouter/fallback", fallbackFailureReason);

    return {
      selectedModelId: fallbackModelId,
      fallbackReasons,
    };
  }

  async findThreadMessageIdsInChat(props: {
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
    const startedAt = Date.now();
    const billingLedger: IOpenRouterBillingLedgerEntry[] = [];
    let socialProfileMcpCatalogSession: IProfileMcpCatalogSession | null = null;
    let unavailableMcpServerIds: string[] = [];
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

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let data: IRequestData;
      try {
        data = JSON.parse(body["data"]);
      } catch (error) {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " +
            body["data"],
        );
      }
      await this.assertProfileCanAccessChat({
        subjectId: id,
        socialModuleProfileId,
        socialModuleChatId,
      });
      await this.assertProfileCanAccessMessage({
        socialModuleProfileId,
        socialModuleMessageId,
      });
      await this.assertMessageBelongsToChat({
        socialModuleChatId,
        socialModuleMessageId,
      });

      const [socialModuleProfile, socialModuleChat, socialModuleMessage] =
        await Promise.all([
          this.service.socialModule.profile.findById({
            id: socialModuleProfileId,
          }),
          this.service.socialModule.chat.findById({
            id: socialModuleChatId,
          }),
          this.service.socialModule.message.findById({
            id: socialModuleMessageId,
          }),
        ]);

      if (!socialModuleProfile) {
        throw new Error(
          "Not found error. Requested social-module profile not found",
        );
      }

      if (!socialModuleChat) {
        throw new Error(
          "Not found error. Requested social-module chat not found",
        );
      }

      if (!socialModuleMessage?.description) {
        throw new Error(
          "Not found. Social module message description not found",
        );
      }

      if (isSocialMessageExcludedFromOpenRouter(socialModuleMessage.metadata)) {
        throw new Error(
          "Validation error. System social-module messages cannot trigger OpenRouter generation.",
        );
      }

      const aiReactionRequest = this.resolveAiReactionRequest({
        data,
        socialModuleMessage,
      });
      const replySocialProfileId =
        data.shouldReplySocialModuleProfile?.id?.trim();

      if (!replySocialProfileId) {
        throw new Error(
          "Not found error. Reply social-module profile not found",
        );
      }

      const replyBySocialModuleProfile =
        await this.loadReplyBySocialModuleProfile(replySocialProfileId);
      this.assertReplyProfile(replyBySocialModuleProfile);
      await this.assertReplyProfileConnectedToChat({
        socialModuleProfileId: replyBySocialModuleProfile.id,
        socialModuleChatId,
      });

      const socialModuleThreadId = await this.resolveThreadIdForMessageInChat({
        socialModuleChatId,
        socialModuleMessageId,
      });

      const context: IOpenRouterRequestMessage[] = [];
      const contextHistory: IAiContextHistoryMessage[] = [];
      let contextResetMessageId: string | null = null;
      let currentAttachmentTitles: string[] = [];
      const isAIChat = socialModuleChat.variant === "ai-chat";
      const documentService = new DocumentService(
        this.service.socialModule,
        this.knowledgeService,
      );
      const documentContext = isAIChat
        ? await documentService.load({
            profileId: replyBySocialModuleProfile.id,
            threadId: socialModuleThreadId,
            message: socialModuleMessage,
          })
        : null;
      const documentSkill = documentContext
        ? await new ProfileSkills(this.service.socialModule).forDocument(
            replyBySocialModuleProfile.id,
            documentContext.document.key,
          )
        : undefined;
      const requestedSkillIds = documentSkill
        ? [documentSkill.id]
        : aiReactionRequest.skillIds;
      const requestedKnowledgeSearch =
        isAIChat ||
        aiReactionRequest.useKnowledgeSearch ||
        this.hasKnowledgeControl(socialModuleMessage.description);
      const hasMentionedSkill = Boolean(
        this.getMentionedSkillSlugs(socialModuleMessage.description).length,
      );
      const sanitizedTriggerDescription = this.toOpenRouterUserQuery({
        rawQuery: socialModuleMessage.description,
        requestedKnowledgeSearch,
        hasMentionedSkill,
        requestedSkillIds,
      });
      let routingRequestText = sanitizedTriggerDescription;

      const thisTriggerCreatedAt = socialModuleMessage.createdAt;
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
            socialModuleMessages.sort((a, b) =>
              a.createdAt && b.createdAt
                ? new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime() || a.id.localeCompare(b.id)
                : 0,
            );
            for (const socialModuleMessage of socialModuleMessages) {
              const triggerTime = new Date(
                socialModuleMessage.createdAt || 0,
              ).getTime();
              const requestTime = new Date(thisTriggerCreatedAt || 0).getTime();
              if (
                thisTriggerCreatedAt &&
                socialModuleMessage.createdAt &&
                (triggerTime > requestTime ||
                  (triggerTime === requestTime &&
                    socialModuleMessage.id > socialModuleMessageId))
              )
                break;
              const messageDescription =
                socialModuleMessage.id === socialModuleMessageId
                  ? sanitizedTriggerDescription
                  : socialModuleMessage.description?.trim() || "";

              // Soft context reset marker: keep messages only after the latest /new.
              if (messageDescription.startsWith("/new")) {
                context.length = 0;
                contextHistory.length = 0;
                contextResetMessageId = socialModuleMessage.id;
                continue;
              }

              if (
                isSocialMessageExcludedFromOpenRouter(
                  socialModuleMessage.metadata,
                )
              ) {
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

              // Older stored statuses may still have a decorative emoji prefix.
              const serviceDescription = messageDescription.replace(
                /^[\p{Extended_Pictographic}\p{Emoji_Modifier}\u200D\uFE0F\s]+/u,
                "",
              );
              if (localizedServiceValues.includes(serviceDescription)) {
                continue;
              }

              if (this.isOpenRouterProgressStatusMessage(messageDescription)) {
                continue;
              }

              if (
                !documentContext &&
                this.isOpenRouterLearnContextMessage(messageDescription)
              ) {
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
                      orderBy: {
                        and: [
                          {
                            column: "orderIndex",
                            method: "asc",
                          },
                        ],
                      },
                    },
                  },
                );

              if (socialModuleMessagesToFileStorageModuleFiles?.length) {
                const foundFileStorageFiles =
                  (await this.service.fileStorageModule.file.find({
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
                  })) || [];
                const filesById = new Map(
                  foundFileStorageFiles.map((file) => [file.id, file]),
                );

                fileStorageFiles = socialModuleMessagesToFileStorageModuleFiles
                  .map((relation) => {
                    return filesById.get(
                      relation.fileStorageModuleFileId || "",
                    );
                  })
                  .filter((file): file is IFileStorageModuleFile =>
                    Boolean(file),
                  );
              }
              const resolvedMessageContext =
                await this.resolveOpenRouterMessageContext({
                  presentationOnlyFileIds: isAssistantMessage
                    ? (
                        socialModuleMessage.metadata?.["knowledge"] as
                          | { documentProposalFileIds?: string[] }
                          | undefined
                      )?.documentProposalFileIds
                    : undefined,
                  fileStorageFiles: fileStorageFiles || [],
                  messageDescription,
                });

              if (!resolvedMessageContext.content) {
                continue;
              }

              context.push({
                role: isAssistantMessage ? "assistant" : "user",
                content: resolvedMessageContext.content,
              });
              const presentationIds = new Set(
                isAssistantMessage
                  ? (
                      socialModuleMessage.metadata?.["knowledge"] as
                        | { documentProposalFileIds?: string[] }
                        | undefined
                    )?.documentProposalFileIds || []
                  : [],
              );
              const contextFiles = (fileStorageFiles || []).filter(
                (file) =>
                  !presentationIds.has(file.id) &&
                  !this.isAudioFileStorageFile(file),
              );
              contextHistory.push({
                id: socialModuleMessage.id,
                role: isAssistantMessage ? "assistant" : "user",
                content: resolvedMessageContext.content,
                attachments: contextFiles,
                fingerprint: fingerprintAiContextMessage(
                  socialModuleMessage,
                  contextFiles,
                ),
              });

              if (socialModuleMessage.id === socialModuleMessageId) {
                routingRequestText = resolvedMessageContext.routingText;
                currentAttachmentTitles = (fileStorageFiles || []).map(
                  (file) =>
                    this.toLearnText(file.adminTitle) ||
                    this.toLearnText(file.alt) ||
                    basename(this.toLearnText(file.file).split("?")[0]) ||
                    "attachment",
                );
              }
              if (socialModuleMessage.id === socialModuleMessageId) break;
            }
          }
        }
      }

      const replyByRbacSubject = await this.resolveRbacSubjectForSocialProfile(
        replyBySocialModuleProfile.id,
      );

      const replyByRbacSubjectAuthenticationJwt = await jwt.sign(
        {
          exp:
            Math.floor(Date.now() / 1000) + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS,
          iat: Math.floor(Date.now() / 1000),
          subject: replyByRbacSubject,
        },
        RBAC_JWT_SECRET,
      );

      if (
        !documentContext &&
        this.hasLearnCommand(socialModuleMessage.description)
      ) {
        const learnedMessage = await this.learnFromMessage({
          rbacSubjectAuthenticationJwt: replyByRbacSubjectAuthenticationJwt,
          replyByRbacSubjectId: replyByRbacSubject.id,
          replyProfile: replyBySocialModuleProfile,
          socialModuleChatId,
          socialModuleThreadId,
          socialModuleMessage,
          sourceSocialModuleProfileId: socialModuleProfileId,
        });

        return c.json({
          data: {
            socialModule: {
              message: learnedMessage,
            },
          },
        });
      }

      const aiContext = this.service.socialModuleProfileAiContextCreate({
        chatId: socialModuleChatId,
        threadId: socialModuleThreadId,
        profileId: replyBySocialModuleProfile.id,
        triggerMessageId: socialModuleMessage.id,
        resetMessageId: contextResetMessageId,
        history: contextHistory,
        documentThread: Boolean(documentContext),
      });
      const openRouter = new OpenRouter({ sessionId: aiContext.sessionId });
      const contextSourceIds = await this.findKnowledgeSourceIdsForProfile(
        replyBySocialModuleProfile.id,
      );
      const contextSourceRefs = contextSourceIds.length
        ? (
            await this.knowledgeService.listSources({
              sourceIds: contextSourceIds,
            })
          )
            .map((source) => ({
              id: source.id,
              contentHash: source.contentHash,
            }))
            .sort((a, b) => a.id.localeCompare(b.id))
        : [];

      const statusMessage =
        await api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
          {
            id: replyByRbacSubject.id,
            socialModuleProfileId: replyBySocialModuleProfile.id,
            socialModuleChatId: socialModuleChatId,
            socialModuleThreadId,
            data: {
              description: this.statusMessages.openRouterStarted.ru,
            },
            options: {
              headers: {
                Authorization: "Bearer " + replyByRbacSubjectAuthenticationJwt,
              },
            },
          },
        );

      const preparedContext = await aiContext.prepare({
        openRouter,
        billingLedger,
        sourceRefs: contextSourceRefs,
      });
      context.splice(0, context.length, ...preparedContext.messages);

      await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
        id: replyByRbacSubject.id,
        socialModuleProfileId: replyBySocialModuleProfile.id,
        socialModuleChatId: socialModuleChatId,
        socialModuleMessageId: statusMessage.id,
        data: {
          description: this.statusMessages.openRouterFetchingModels.ru,
        },
        options: {
          headers: {
            Authorization: "Bearer " + replyByRbacSubjectAuthenticationJwt,
          },
        },
      });

      const openRouterModels = await openRouter.getModels();

      let requestClassification: IRequestClassification;
      let selectedModelClass: TModelClass = "CHAT";
      let expectedOutputModality: TOutputModality = "text";
      let modelCandidates: IModelCandidate[] = [];
      let modelSelection: IModelSelectionResult;
      const jev = new SocialProfileJevService({ openRouter, billingLedger });
      const jevRoute = await jev.route({
        requestText: sanitizedTriggerDescription,
        ...(documentContext
          ? {
              knowledgeScope: {
                documentKey: documentContext.document.key,
                sourceCount: documentContext.document.sourceIds.length,
              },
            }
          : {}),
        history: this.toKnowledgeRerankThreadContext(context),
        ...(documentContext?.proposal
          ? {
              documentProposal: {
                id: documentContext.proposal.id,
                status: documentContext.proposal.status,
                title: documentContext.proposal.title,
                shown: Boolean(documentContext.proposal.shownInMessageId),
              },
            }
          : {}),
      });
      const documentResolution = documentContext
        ? await documentService.resolve(
            documentContext,
            jevRoute.documentProposalAction || "none",
            socialModuleMessage.id,
          )
        : null;
      const knowledgeImportContext =
        !documentContext && jevRoute.knowledgeAction === "create"
          ? context.map((message, index) =>
              index === context.length - 1
                ? {
                    ...message,
                    content: [
                      sanitizedTriggerDescription,
                      `Current message attachments: ${JSON.stringify(currentAttachmentTitles)}. These files will be analyzed and saved by profile_knowledge_create.`,
                      "For this new material, use the current attachment names and current user explanations. Use earlier conversation facts only when the current request explicitly refers to them; do not copy a previous Source's title or notes into a new upload.",
                    ].join("\n"),
                  }
                : message,
            )
          : context;
      const requiredInputModalitiesList = this.detectInputModalitiesFromContext(
        knowledgeImportContext,
      );

      if (aiReactionRequest.modelId !== "auto") {
        const manualModel = this.resolveManualOpenRouterModel({
          models: openRouterModels,
          modelId: aiReactionRequest.modelId,
          requiredInputModalitiesList,
        });

        expectedOutputModality =
          this.resolveManualExpectedOutputModality(manualModel);
        requestClassification = this.buildManualRequestClassification({
          requestText: routingRequestText,
          requiredInputModalitiesList,
          expectedOutputModality,
        });
        modelSelection = {
          orderedCandidateIds: [manualModel.id],
          selectedModelId: manualModel.id,
          selectedBy: "manual",
        };
      } else {
        await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
          id: replyByRbacSubject.id,
          socialModuleProfileId: replyBySocialModuleProfile.id,
          socialModuleChatId: socialModuleChatId,
          socialModuleMessageId: statusMessage.id,
          data: {
            description: this.statusMessages.openRouterDetectingLanguage.ru,
          },
          options: {
            headers: {
              Authorization: "Bearer " + replyByRbacSubjectAuthenticationJwt,
            },
          },
        });

        const rawRequestClassification: IRequestClassification = {
          ...this.buildManualRequestClassification({
            requestText: routingRequestText,
            requiredInputModalitiesList,
            expectedOutputModality:
              jevRoute.task === "image_gen" ? "image" : "text",
          }),
          task: jevRoute.task,
        };

        requestClassification = this.adaptClassificationForEndpoint({
          classification: rawRequestClassification,
          requiredInputModalitiesList,
        });

        console.log("react-by-openrouter/classification", {
          raw: rawRequestClassification,
          adapted: requestClassification,
        });

        await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
          id: replyByRbacSubject.id,
          socialModuleProfileId: replyBySocialModuleProfile.id,
          socialModuleChatId: socialModuleChatId,
          socialModuleMessageId: statusMessage.id,
          data: {
            description: this.statusMessages.openRouterSelectingModels.ru,
          },
          options: {
            headers: {
              Authorization: "Bearer " + replyByRbacSubjectAuthenticationJwt,
            },
          },
        });

        selectedModelClass = this.resolveModelClass({
          classification: requestClassification,
          requiredInputModalitiesList,
        });
        expectedOutputModality =
          selectedModelClass === "IMAGE"
            ? "image"
            : requestClassification.output_modality;
        modelCandidates = this.resolveModelCandidates({
          modelClass: selectedModelClass,
          requiredInputModalitiesList,
          expectedOutputModality,
        }).filter((candidate) =>
          openRouterModels.some((model) => model.id === candidate.id),
        );

        if (!modelCandidates.length && selectedModelClass === "IMAGE") {
          const billingSettlement = await this.settleOpenRouterBilling({
            billingLedger,
            selectedModelId: null,
            route: requestRoute,
            method: requestMethod,
            authorization: requestAuthorization,
          });
          billingSettled = true;
          const updatedMessage =
            await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
              id: replyByRbacSubject.id,
              socialModuleProfileId: replyBySocialModuleProfile.id,
              socialModuleChatId,
              socialModuleMessageId: statusMessage.id,
              data: {
                description: requestClassification.language
                  .toLowerCase()
                  .startsWith("ru")
                  ? "Создание изображений сейчас недоступно. Разрешённая GPT 6.1 Sol поддерживает анализ изображений и файлов, а результат возвращает текстом."
                  : "Image generation is currently unavailable. The allowed GPT 6.1 Sol model can analyze images and files, and returns text.",
                metadata: withSocialMessageSystemMetadata({
                  source: "openrouter-unsupported-output",
                  metadata: {
                    openRouter: {
                      blockedReason: "unsupported-output-modality",
                      expectedOutputModality,
                      reasoning: aiReactionRequest.reasoning,
                      billing: {
                        ...billingSettlement.summary,
                        settlement:
                          billingSettlement.settlement?.settlement || null,
                      },
                    },
                  },
                }),
              },
              options: {
                headers: {
                  Authorization:
                    "Bearer " + replyByRbacSubjectAuthenticationJwt,
                },
              },
            });
          return c.json({
            data: { socialModule: { message: updatedMessage } },
          });
        }

        if (!modelCandidates.length) {
          throw new Error(
            `No models configured for model class: ${selectedModelClass}`,
          );
        }

        modelSelection = await this.selectModelCandidatesForRequest({
          billingLedger,
          openRouter,
          requestText: routingRequestText,
          requestClassification,
          selectedModelClass,
          modelCandidates,
          models: openRouterModels,
        });
      }

      console.log("react-by-openrouter/router", {
        configVersion: MODEL_ROUTER_CONFIG.version,
        selectedModelClass,
        modelCandidates: modelCandidates.map((candidate) => candidate.id),
        selection: modelSelection,
      });

      const openRouterReasoning = this.toOpenRouterReasoning(
        aiReactionRequest.reasoning,
      );
      const openRouterKnowledgeContext =
        await this.resolveOpenRouterKnowledgeContext({
          billingLedger,
          openRouter,
          replyProfile: replyBySocialModuleProfile,
          socialModuleMessage,
          sanitizedQuery: routingRequestText,
          requestedKnowledgeSearch,
          knowledgeAction: jevRoute.knowledgeAction,
          requestedSkillIds,
          reasoning: openRouterReasoning,
          selectedModelId:
            modelSelection.selectedModelId ||
            modelSelection.orderedCandidateIds[0] ||
            null,
          threadContext: context,
          isAIChat,
          documentSkill,
          contextMode: aiContext.mode,
          sessionId: aiContext.sessionId,
        });
      const openRouterContext = knowledgeImportContext;
      const generationContext = this.buildGenerationContext({
        context: openRouterContext,
        expectedOutputModality,
        language: requestClassification.language,
        profileSystemMessage: this.toProfileSystemMessage({
          language: requestClassification.language,
          replyProfile: replyBySocialModuleProfile,
        }),
        prependedSystemMessages: [
          ...(openRouterKnowledgeContext.skillMessagePrefix
            ? [
                {
                  role: "system" as const,
                  content: openRouterKnowledgeContext.skillMessagePrefix,
                },
              ]
            : []),
          ...openRouterKnowledgeContext.systemMessages,
          ...preparedContext.systemMessages,
          ...aiContext.draftSystemMessage(),
        ],
      });
      const profileCapabilityTools = this.buildProfileCapabilityTools({
        sessionId: aiContext.sessionId,
        knowledgeFileAction: jevRoute.knowledgeFileAction,
        knowledgeFileScope: {
          id,
          socialModuleProfileId,
          socialModuleChatId,
          targetSocialModuleProfileId: replyBySocialModuleProfile.id,
        },
        availableSkills: openRouterKnowledgeContext.availableSkills,
        knowledgeSourceIds: openRouterKnowledgeContext.knowledgeSourceIds,
        knowledgeAction: jevRoute.knowledgeAction,
        replyProfileId: replyBySocialModuleProfile.id,
        socialModuleMessage,
        ...(documentContext &&
        (!jevRoute.documentProposalAction ||
          jevRoute.documentProposalAction === "none" ||
          jevRoute.documentProposalAction === "revise")
          ? { documentContext }
          : {}),
        disableKnowledgeWrites: Boolean(documentContext),
      });
      const allowedMcpServerIds = Array.isArray(
        replyBySocialModuleProfile.allowedMcpServerIds,
      )
        ? replyBySocialModuleProfile.allowedMcpServerIds
        : [];

      if (
        expectedOutputModality === "text" &&
        allowedMcpServerIds.length &&
        !documentContext
      ) {
        const mcpCatalogResult = await this.openProfileMcpCatalogBestEffort({
          configuredServerIds: allowedMcpServerIds,
          rbacSubjectAuthenticationJwt: replyByRbacSubjectAuthenticationJwt,
          socialModuleProfileId: replyBySocialModuleProfile.id,
        });
        socialProfileMcpCatalogSession = mcpCatalogResult.session;
        unavailableMcpServerIds = mcpCatalogResult.unavailableServerIds;
      }

      const availableTools = [
        ...profileCapabilityTools,
        ...this.buildMcpCapabilityTools(socialProfileMcpCatalogSession),
      ];
      const capabilities = await jev.selectCapabilities({
        requestText: sanitizedTriggerDescription,
        history: this.toKnowledgeRerankThreadContext(context),
        tools: availableTools,
        skills: openRouterKnowledgeContext.availableSkills,
        forceKnowledge:
          requestedKnowledgeSearch || jevRoute.knowledgeAction !== "none",
        explicitSkillIds: openRouterKnowledgeContext.requestedSkillIds,
      });
      const socialProfileTools = [...capabilities.tools, ...aiContext.tools()];
      const requiredCompletionToolName =
        documentContext &&
        jevRoute.knowledgeFileAction !== "detach" &&
        (!documentResolution ||
          documentResolution.status === "needs_revision") &&
        (documentResolution?.status === "needs_revision" ||
          jevRoute.knowledgeAction === "create" ||
          jevRoute.knowledgeAction === "update")
          ? "profile_knowledge_propose"
          : undefined;
      if (capabilities.skills.length) {
        generationContext.splice(2, 0, {
          role: "system",
          content: this.toSkillMessagePrefix(capabilities.skills),
        });
      }
      if (documentContext) {
        generationContext.splice(
          generationContext.findIndex((message) => message.role !== "system"),
          0,
          {
            role: "system",
            content: [
              `Current document: ${documentContext.thread.title}; Source ID: ${documentContext.targetSourceId ?? "not selected or not created"}.`,
              "You may read all linked profile Knowledge. Changes to document TEXT require profile_knowledge_propose, which only records a proposal. The server shows its exact text after your answer. Briefly explain your reasoning; do not duplicate the full proposal or claim it was saved. Do not ask another tool to bypass this confirmation flow.",
              "Use profile_knowledge_files to identify saved attachments and their current contentHash. When the user explicitly asks to remove an attachment, use profile_knowledge_file_detach if exposed. This unlinks only that file from the Source and rebuilds its materials/index; it preserves the original file and chat history. If the target is unclear, ask which file. Report the actual tool result and any processing/indexing failure.",
              "Brainstorm and ask focused questions when the inputs are incomplete. When enough facts are available or the user requests a draft, propose the structured document. Never invent operator facts.",
              documentResolution
                ? `Result of the user's response to the saved proposal: ${JSON.stringify(documentResolution)}. Report this result honestly. An applied result means the exact stored text was saved; do not regenerate it. A conflict requires reading the changed Source and a new proposal.`
                : "",
              documentContext.proposal?.status === "pending" ||
              documentContext.proposal?.status === "needs_revision" ||
              jevRoute.documentProposalAction === "revise"
                ? `Pending proposal (not saved Knowledge): ${JSON.stringify(documentContext.proposal)}`
                : "",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        );
      } else if (
        jevRoute.knowledgeAction === "create" ||
        jevRoute.knowledgeAction === "update" ||
        jevRoute.knowledgeAction === "auto"
      ) {
        generationContext.splice(
          generationContext.findIndex((message) => message.role !== "system"),
          0,
          {
            role: "system",
            content: [
              "Use the profile Knowledge tools to carry out explicit current save/edit requests. The user's direct request already authorizes saving; do not ask for a second confirmation. Ask for clarification only if the material or target Source cannot be identified.",
              "Read existing human notes before editing and preserve unrelated notes. For a new material use profile_knowledge_create. Attached files are analyzed by the Knowledge service.",
              `Linked Source ids: ${JSON.stringify(openRouterKnowledgeContext.knowledgeSourceIds)}`,
            ].join("\n"),
          },
        );
      }
      const onModelAttempt = async (modelCandidateId: string) => {
        await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
          id: replyByRbacSubject.id,
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
              Authorization: "Bearer " + replyByRbacSubjectAuthenticationJwt,
            },
          },
        });
      };

      let selectModelForRequest: string | null = null;
      let generationResult:
        | Pick<IOpenRouterGenerationSuccess, "text" | "images">
        | undefined;
      let socialProfileToolLoopResult: ISocialProfileAiToolLoopResult | null =
        null;
      let contextWindowExceeded = false;
      const contextWindowMessage = requestClassification.language.startsWith(
        "ru",
      )
        ? "Точный документ и необходимые сообщения превышают окно модели. Выберите раздел документа для продолжения."
        : "The exact document and required messages exceed the model context window. Select a document section to continue.";
      let finalGenerationResult: IFinalGenerationResult = {
        selectedModelId: null,
        fallbackReasons: [],
      };

      const contextMetrics = aiContext.measure(
        generationContext,
        socialProfileTools.map((tool) => tool.definition),
        estimateAiContextTokens(
          openRouterKnowledgeContext.systemMessages
            .map((message) => this.getMessageTextContent(message))
            .join("\n"),
        ),
      );
      const modelWindow = openRouterModels.find(
        (model) => model.id === modelSelection.selectedModelId,
      )?.context_length;
      if (
        modelWindow &&
        contextMetrics.inputEstimatedTokens +
          OPEN_ROUTER_FINAL_TEXT_MAX_TOKENS >
          modelWindow
      ) {
        selectModelForRequest = modelSelection.selectedModelId;
        generationResult = {
          text: contextWindowMessage,
        };
        contextMetrics.budgetExceededReason = "model_context_window_exceeded";
      } else if (
        expectedOutputModality === "text" &&
        socialProfileTools.length
      ) {
        let generationCallCount = 0;
        const socialModuleChat = await this.service.socialModule.chat.findById({
          id: socialModuleChatId,
        });
        const executionActionReporter = RBAC_SECRET_KEY
          ? this.service.socialModuleProfileAiExecutionActionReporterCreate({
              chatId: socialModuleChatId,
              threadId: socialModuleThreadId,
              triggerMessageId: socialModuleMessage.id,
              replySocialProfileId: replyBySocialModuleProfile.id,
              secretKey: RBAC_SECRET_KEY,
              ...(socialModuleChat?.variant === "telegram"
                ? {
                    telegramMessage: {
                      rbacSubjectId: replyByRbacSubject.id,
                      authorizationJwt: replyByRbacSubjectAuthenticationJwt,
                      language: requestClassification.language,
                    },
                  }
                : {}),
            })
          : null;
        socialProfileToolLoopResult =
          await this.service.socialModuleProfileAiToolLoopRun({
            context: generationContext,
            language: requestClassification.language,
            modelCandidateIds: modelSelection.orderedCandidateIds,
            tools: socialProfileTools,
            requiredCompletionToolName,
            onEvent: executionActionReporter
              ? (event) => executionActionReporter.handle(event)
              : undefined,
            generate: async (toolGeneration) => {
              generationCallCount += 1;
              await onModelAttempt(toolGeneration.model);

              const iterationMetrics = aiContext.measure(
                toolGeneration.context,
                toolGeneration.tools,
                contextMetrics.knowledgeEstimatedTokens,
              );
              if (
                (openRouterModels.find(
                  (model) => model.id === toolGeneration.model,
                )?.context_length ||
                  modelWindow) &&
                iterationMetrics.inputEstimatedTokens +
                  OPEN_ROUTER_FINAL_TEXT_MAX_TOKENS >
                  (openRouterModels.find(
                    (model) => model.id === toolGeneration.model,
                  )?.context_length || modelWindow)!
              ) {
                contextWindowExceeded = true;
                return {
                  error: { message: "context_window_exceeded" },
                  billing: null,
                };
              }
              const result = await this.generateWithBillingLedger({
                billingLedger,
                purpose:
                  generationCallCount === 1 ? "generation" : "tool_iteration",
                openRouter,
                model: toolGeneration.model,
                context: toolGeneration.context,
                sessionId: aiContext.sessionId,
                max_tokens: OPEN_ROUTER_FINAL_TEXT_MAX_TOKENS,
                reasoning: openRouterReasoning,
                stripNonTextOnRetry: false,
                tools: toolGeneration.tools,
                toolChoice: requiredCompletionToolName ? "required" : "auto",
                parallelToolCalls: false,
              });
              if (
                "error" in result &&
                /context.{0,30}(length|window)|maximum.{0,30}tokens/i.test(
                  this.stringifyError(result.error),
                )
              )
                contextWindowExceeded = true;
              return result;
            },
          });
        selectModelForRequest =
          socialProfileToolLoopResult.selectedModelId ||
          modelSelection.selectedModelId ||
          modelSelection.orderedCandidateIds[0] ||
          null;
        selectedModelIdForBilling = selectModelForRequest;
        generationResult = {
          text: contextWindowExceeded
            ? contextWindowMessage
            : socialProfileToolLoopResult.finalText,
        };
        if (contextWindowExceeded)
          contextMetrics.budgetExceededReason = "model_context_window_exceeded";
      } else {
        finalGenerationResult = await this.generateFinalOpenRouterReply({
          billingLedger,
          openRouter,
          modelSelection,
          expectedOutputModality,
          generationContext,
          sessionId: aiContext.sessionId,
          reasoning: openRouterReasoning,
          onModelAttempt,
        });

        selectModelForRequest = finalGenerationResult.selectedModelId;
        selectedModelIdForBilling = finalGenerationResult.selectedModelId;
        generationResult = finalGenerationResult.generationResult;
      }

      const servedModelId = [...billingLedger]
        .reverse()
        .find(
          (call) =>
            (call.purpose === "generation" ||
              call.purpose === "tool_iteration") &&
            call.status === "success",
        )?.billing?.responseModelId;
      if (servedModelId) {
        selectModelForRequest = servedModelId;
        selectedModelIdForBilling = servedModelId;
      }

      if (!selectModelForRequest || !generationResult) {
        selectedModelIdForBilling =
          finalGenerationResult.selectedModelId ||
          modelSelection.selectedModelId;
        await this.settleOpenRouterBilling({
          billingLedger,
          selectedModelId: selectedModelIdForBilling,
          route: requestRoute,
          method: requestMethod,
          authorization: requestAuthorization,
        });
        billingSettled = true;
        const fallbackMessage = this.buildNoValidModelResponseMessage(
          finalGenerationResult.fallbackReasons,
          requestClassification.language,
        );
        await api.socialModuleProfileFindByIdChatFindByIdMessageUpdate({
          id: replyByRbacSubject.id,
          socialModuleProfileId: replyBySocialModuleProfile.id,
          socialModuleChatId: socialModuleChatId,
          socialModuleMessageId: statusMessage.id,
          data: {
            description: fallbackMessage,
          },
          options: {
            headers: {
              Authorization: "Bearer " + replyByRbacSubjectAuthenticationJwt,
            },
          },
        });

        throw new Error(
          `${fallbackMessage} [${OPEN_ROUTER_TERMINAL_MESSAGE_WRITTEN_MARKER}]`,
        );
      }

      const billingSettlement = await this.settleOpenRouterBilling({
        billingLedger,
        selectedModelId: selectModelForRequest,
        route: requestRoute,
        method: requestMethod,
        authorization: requestAuthorization,
      });
      billingSettled = true;

      const proposalPreview = documentContext
        ? documentService.preview(
            documentContext,
            socialModuleMessage.id,
            requestClassification.language,
          )
        : null;
      if (proposalPreview)
        generationResult.text = [generationResult.text, proposalPreview]
          .filter(Boolean)
          .join("\n\n");
      const workingDraftPreview = aiContext.preview();
      if (workingDraftPreview)
        generationResult.text = [generationResult.text, workingDraftPreview]
          .filter(Boolean)
          .join("\n\n");
      const replyMessageData = await this.buildOpenRouterReplyMessageData({
        expectedOutputModality,
        generationResult,
        selectModelForRequest,
        billingSettlement,
        metadata: {
          identities: {
            requesterRbacSubjectId: id,
            replyRbacSubjectId: replyByRbacSubject.id,
            replySocialProfileId: replyBySocialModuleProfile.id,
          },
          mcp: {
            clientId: socialProfileMcpCatalogSession
              ? "internal-rbac-subject"
              : null,
            allowedServerIds: allowedMcpServerIds,
            connectedServerIds:
              socialProfileMcpCatalogSession?.catalog.connected.map(
                (server) => server.id,
              ) || [],
            staleServerIds: socialProfileMcpCatalogSession?.catalog.stale || [],
            unavailableServerIds: unavailableMcpServerIds,
          },
          knowledge: {
            ...(documentContext
              ? {
                  documentProposalId: documentContext.proposal?.id,
                  documentProposalFileIds: proposalPreview
                    ? documentContext.proposal?.fileIds || []
                    : [],
                  documentResolution,
                }
              : {}),
            action: this.hasLearnCommand(socialModuleMessage.description)
              ? "learn"
              : jevRoute.knowledgeAction === "create" ||
                  jevRoute.knowledgeAction === "update"
                ? jevRoute.knowledgeAction
                : "generate",
            profileId: replyBySocialModuleProfile.id,
            triggerMessageId: socialModuleMessage.id,
            useKnowledgeSearch: openRouterKnowledgeContext.useKnowledgeSearch,
            sourceIds: openRouterKnowledgeContext.searchSourceIds,
            citations: openRouterKnowledgeContext.sources,
            sources: openRouterKnowledgeContext.sources,
            retrieval: openRouterKnowledgeContext.retrieval,
            requestedKnowledgeSearch:
              openRouterKnowledgeContext.requestedKnowledgeSearch,
            requestedSkillIds: openRouterKnowledgeContext.requestedSkillIds,
            availableSkillIds: openRouterKnowledgeContext.availableSkills.map(
              (skill) => skill.id,
            ),
            activatedSkillIds: Array.from(
              new Set([
                ...capabilities.skills.map((skill) => skill.id),
                ...openRouterKnowledgeContext.promptSkills.map(
                  (skill) => skill.id,
                ),
                ...(socialProfileToolLoopResult?.trace.calls || [])
                  .map((call) => call.metadata?.["skillId"])
                  .filter(
                    (skillId): skillId is string => typeof skillId === "string",
                  ),
              ]),
            ),
            skills: [
              ...openRouterKnowledgeContext.promptSkills,
              ...capabilities.skills,
            ].map((skill) => {
              return {
                skillId: skill.id,
                slug: skill.slug,
                title: skill.title,
                mode: "message-prefix-instruction",
              };
            }),
            openRouter: {
              model: aiReactionRequest.modelId,
              reasoning: aiReactionRequest.reasoning,
              selectedModelId: selectModelForRequest,
              selectedBy: modelSelection.selectedBy,
            },
          },
          openRouter: {
            context: contextMetrics,
            sessionId: aiContext.sessionId,
            durationMs: Date.now() - startedAt,
            toolLoop: socialProfileToolLoopResult?.trace || {
              enabled: false,
              stepCount: 1,
              exposedToolNames: [],
              calls: [],
              stopReason: "final_text",
              durationMs: null,
            },
          },
        },
      });

      await api.socialModuleProfileFindByIdChatFindByIdMessageDelete({
        id: replyByRbacSubject.id,
        socialModuleProfileId: replyBySocialModuleProfile.id,
        socialModuleChatId: socialModuleChatId,
        socialModuleMessageId: statusMessage.id,
        options: {
          headers: {
            Authorization: "Bearer " + replyByRbacSubjectAuthenticationJwt,
          },
        },
      });

      const repliedSocialModuleMessage =
        await api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
          {
            id: replyByRbacSubject.id,
            socialModuleProfileId: replyBySocialModuleProfile.id,
            socialModuleChatId: socialModuleChatId,
            socialModuleThreadId,
            data: replyMessageData,
            options: {
              headers: {
                Authorization: "Bearer " + replyByRbacSubjectAuthenticationJwt,
              },
            },
          },
        );
      if (documentContext && proposalPreview)
        await documentService.markShown(
          documentContext,
          socialModuleMessage.id,
          repliedSocialModuleMessage.id,
        );

      for (const sourceId of new Set(
        openRouterKnowledgeContext.sources
          .map((source) => source.sourceId)
          .filter((id): id is string => Boolean(id)),
      )) {
        await this.service.socialModule.messagesToKnowledgeModuleSources.findOrCreate(
          {
            data: {
              messageId: repliedSocialModuleMessage.id,
              knowledgeModuleSourceId: sourceId,
              kind: "citation",
            },
          },
        );
      }
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
    } finally {
      await socialProfileMcpCatalogSession?.close().catch(() => undefined);
    }
  }

  private async loadReplyBySocialModuleProfile(
    replySocialProfileId: string,
  ): Promise<ISocialModuleProfile | undefined> {
    return this.service.socialModule.profile.findById({
      id: replySocialProfileId,
    });
  }

  private resolveAiReactionRequest(props: {
    data: IRequestData;
    socialModuleMessage: ISocialModuleMessage;
  }): IRbacAiReactionRequest {
    const persistedRequest = parseRbacAiReactionRequestMetadata(
      props.socialModuleMessage.metadata,
    );

    if (persistedRequest) {
      return {
        ...persistedRequest,
        reasoning: OPEN_ROUTER_ASSISTANT_MODEL.reasoning.effort,
      };
    }

    return {
      version: 1,
      modelId: "auto",
      reasoning: OPEN_ROUTER_ASSISTANT_MODEL.reasoning.effort,
      skillIds: [],
      useKnowledgeSearch: false,
    };
  }

  private assertReplyProfile(
    replyProfile: ISocialModuleProfile | undefined,
  ): asserts replyProfile is ISocialModuleProfile {
    if (!replyProfile) {
      throw new Error("Not found error. Reply social-module profile not found");
    }

    if (replyProfile.variant !== "artificial-intelligence") {
      throw new Error(
        'Validation error. OpenRouter reactions require reply profile variant="artificial-intelligence".',
      );
    }
  }

  private async assertProfileCanAccessChat(props: {
    subjectId: string;
    socialModuleProfileId: string;
    socialModuleChatId: string;
  }) {
    const relations = await this.service.socialModule.profilesToChats.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.socialModuleProfileId,
            },
            {
              column: "chatId",
              method: "eq",
              value: props.socialModuleChatId,
            },
          ],
        },
        limit: 1,
      },
    });

    if (relations?.length || (await this.isSubjectAdmin(props.subjectId))) {
      return;
    }

    throw new Error(
      "Authorization error. Requested social-module chat does not belong to profile",
    );
  }

  private async assertProfileCanAccessMessage(props: {
    socialModuleProfileId: string;
    socialModuleMessageId: string;
  }) {
    const relations = await this.service.socialModule.profilesToMessages.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.socialModuleProfileId,
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

    if (!relations?.length) {
      throw new Error(
        "Authorization error. Requested social-module message does not belong to profile",
      );
    }
  }

  private async assertMessageBelongsToChat(props: {
    socialModuleChatId: string;
    socialModuleMessageId: string;
  }) {
    const relations = await this.service.socialModule.chatsToMessages.find({
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
              method: "eq",
              value: props.socialModuleMessageId,
            },
          ],
        },
        limit: 1,
      },
    });

    if (!relations?.length) {
      throw new Error(
        "Validation error. Requested social-module message does not belong to chat",
      );
    }
  }

  private async assertReplyProfileConnectedToChat(props: {
    socialModuleProfileId: string;
    socialModuleChatId: string;
  }) {
    const relations = await this.service.socialModule.profilesToChats.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.socialModuleProfileId,
            },
            {
              column: "chatId",
              method: "eq",
              value: props.socialModuleChatId,
            },
          ],
        },
        limit: 1,
      },
    });

    if (!relations?.length) {
      throw new Error(
        "Authorization error. Reply social-module profile is not connected to chat",
      );
    }
  }

  private async isSubjectAdmin(subjectId: string): Promise<boolean> {
    const subjectsToRoles = await this.service.subjectsToRoles.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: subjectId,
            },
          ],
        },
      },
    });
    const roleIds =
      subjectsToRoles
        ?.map((relation) => relation.roleId)
        .filter((roleId): roleId is string => Boolean(roleId)) || [];

    if (!roleIds.length) {
      return false;
    }

    const roles = await this.service.role.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: roleIds,
            },
          ],
        },
      },
    });

    return Boolean(roles?.find((role) => role.slug === "admin"));
  }

  private async resolveRbacSubjectForSocialProfile(
    socialModuleProfileId: string,
  ) {
    const relations = await this.service.subjectsToSocialModuleProfiles.find({
      params: {
        filters: {
          and: [
            {
              column: "socialModuleProfileId",
              method: "eq",
              value: socialModuleProfileId,
            },
          ],
        },
      },
    });

    const replyRelations =
      relations?.filter((relation) => relation.variant !== "assistant") || [];
    if (replyRelations.length !== 1 || !replyRelations[0]?.subjectId) {
      throw new Error(
        "Validation error. Reply social.profile must have exactly one linked rbac.subject.",
      );
    }

    const rbacSubject = await this.service.findById({
      id: replyRelations[0].subjectId,
    });

    if (!rbacSubject) {
      throw new Error("Not found error. rbac.subject not found");
    }

    return rbacSubject;
  }

  private toOpenRouterUserQuery(props: {
    rawQuery: string;
    requestedKnowledgeSearch: boolean;
    hasMentionedSkill: boolean;
    requestedSkillIds: string[];
  }) {
    const rawQuery = this.stripKnowledgeControls(props.rawQuery);

    return props.requestedKnowledgeSearch ||
      props.hasMentionedSkill ||
      props.requestedSkillIds.length
      ? this.stripSkillMentions(rawQuery)
      : this.toLearnText(rawQuery).trim();
  }

  private hasKnowledgeControl(value: string) {
    return /(^|\s)(?:@knowledge|\/knowledge)(?=\s|$)/i.test(value);
  }

  private stripKnowledgeControls(value: string) {
    return value
      .replace(/(^|\s)@knowledge(?=\s|$)/gi, "$1")
      .replace(/(^|\s)\/knowledge(?=\s|$)/gi, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  private hasLearnCommand(value: string) {
    return Boolean(
      this.stripSkillMentions(this.stripKnowledgeControls(value)).match(
        /^\/learn\b/i,
      ),
    );
  }

  private isOpenRouterLearnContextMessage(value: string) {
    const normalizedValue = this.toLearnText(value).trim();

    if (!normalizedValue) {
      return false;
    }

    return (
      this.hasLearnCommand(normalizedValue) ||
      /^Learned \d+ knowledge items?\.$/i.test(normalizedValue)
    );
  }

  private async resolveOpenRouterKnowledgeContext(props: {
    billingLedger: IOpenRouterBillingLedgerEntry[];
    openRouter: OpenRouter;
    replyProfile: ISocialModuleProfile;
    socialModuleMessage: ISocialModuleMessage;
    sanitizedQuery: string;
    requestedKnowledgeSearch: boolean;
    knowledgeAction?: TJevKnowledgeAction;
    requestedSkillIds: string[];
    reasoning?: IOpenRouterReasoning;
    selectedModelId: string | null;
    threadContext: IOpenRouterRequestMessage[];
    isAIChat?: boolean;
    documentSkill?: ISocialModuleSkill;
    contextMode?: "full" | "compact";
    sessionId?: string;
  }): Promise<IResolvedOpenRouterKnowledgeContext> {
    const mentionedSkillSlugs = this.getMentionedSkillSlugs(
      props.socialModuleMessage.description || "",
    );
    const linkedSkills = await this.findSkillsForProfile({
      socialModuleProfileId: props.replyProfile.id,
      requireRequestedSkillsLinked: false,
    });
    const availableSkills = props.isAIChat
      ? linkedSkills.filter(
          (skill) =>
            !getAIChatDocumentForSkill(skill.slug, props.replyProfile.id) ||
            (!props.documentSkill &&
              (props.requestedSkillIds.includes(skill.id) ||
                mentionedSkillSlugs.includes(skill.slug.toLowerCase()))),
        )
      : linkedSkills;
    const promptSkills = props.documentSkill
      ? [props.documentSkill]
      : (
          await this.findPromptSkillsForProfile({
            socialModuleProfileId: props.replyProfile.id,
            skillIds: props.requestedSkillIds,
            skillSlugs: mentionedSkillSlugs,
          })
        ).filter(
          (skill) =>
            !props.isAIChat ||
            availableSkills.some((available) => available.id === skill.id),
        );
    const requestedSkillIds = Array.from(
      new Set([
        ...props.requestedSkillIds,
        ...promptSkills.map((skill) => skill.id),
      ]),
    );
    const query = props.sanitizedQuery.trim();

    if (
      !query &&
      !this.hasLearnCommand(props.socialModuleMessage.description || "")
    ) {
      throw new Error(
        "Validation error. OpenRouter message description is required after removing control mentions.",
      );
    }

    const useKnowledgeSearch =
      props.requestedKnowledgeSearch ||
      props.knowledgeAction === "read" ||
      props.knowledgeAction === "update";
    const knowledgeSourceIds =
      useKnowledgeSearch || props.knowledgeAction === "auto"
        ? await this.findKnowledgeSourceIdsForProfile(props.replyProfile.id)
        : [];
    const searchSourceIds = useKnowledgeSearch ? knowledgeSourceIds : [];
    const candidateSources =
      useKnowledgeSearch && query && searchSourceIds.length > 0
        ? await this.knowledgeService.search({
            query,
            ...(props.sessionId && { sessionId: props.sessionId }),
            topK: KNOWLEDGE_INITIAL_TOP_K,
            neighborWindow: KNOWLEDGE_NEIGHBOR_WINDOW,
            sourceIds: searchSourceIds,
          })
        : [];
    const knowledgeRerankResult = await this.rerankKnowledgeSources({
      billingLedger: props.billingLedger,
      candidateSources,
      openRouter: props.openRouter,
      query,
      rerankTopK: KNOWLEDGE_RERANK_TOP_K,
      reasoning: props.reasoning,
      selectedModelId: props.selectedModelId,
      threadContext: props.threadContext,
    });
    const sources: KnowledgeSearchResult[] = [];
    let knowledgeTokens = 0;
    for (const source of knowledgeRerankResult.sources) {
      const size = estimateAiContextTokens(source.text);
      if (
        props.contextMode === "compact" &&
        knowledgeTokens + size > AI_CONTEXT_POLICY.knowledgeTokens
      )
        continue;
      sources.push(source);
      knowledgeTokens += size;
    }
    const systemMessages: IOpenRouterRequestMessage[] = [
      ...(useKnowledgeSearch
        ? [
            {
              role: "system" as const,
              content: this.toKnowledgeSystemPrompt({
                query,
                sources,
              }),
            },
          ]
        : []),
    ];

    return {
      query,
      requestedSkillIds,
      requestedKnowledgeSearch: props.requestedKnowledgeSearch,
      useKnowledgeSearch,
      knowledgeSourceIds,
      searchSourceIds,
      candidateSources,
      sources,
      retrieval: {
        initialTopK: KNOWLEDGE_INITIAL_TOP_K,
        neighborWindow: KNOWLEDGE_NEIGHBOR_WINDOW,
        candidateCount: candidateSources.length,
        rerankTopK: KNOWLEDGE_RERANK_TOP_K,
        rerankedSourceIds: sources.map((source) => source.id),
        rerankFallbackReason: knowledgeRerankResult.fallbackReason,
        rerankReason: knowledgeRerankResult.reason,
      },
      availableSkills,
      promptSkills,
      skillMessagePrefix: this.toSkillMessagePrefix(promptSkills),
      systemMessages,
    };
  }

  private async rerankKnowledgeSources(props: {
    billingLedger: IOpenRouterBillingLedgerEntry[];
    candidateSources: KnowledgeSearchResult[];
    openRouter: OpenRouter;
    query: string;
    rerankTopK: number;
    reasoning?: IOpenRouterReasoning;
    selectedModelId: string | null;
    threadContext: IOpenRouterRequestMessage[];
  }): Promise<{
    sources: KnowledgeSearchResult[];
    reason: string | null;
    fallbackReason: string | null;
  }> {
    return new SocialProfileJevService({
      openRouter: props.openRouter,
      billingLedger: props.billingLedger,
    }).rerank({
      query: props.query,
      history: this.toKnowledgeRerankThreadContext(props.threadContext),
      sources: props.candidateSources,
      topK: props.rerankTopK,
    });
  }

  private toKnowledgeRerankThreadContext(context: IOpenRouterRequestMessage[]) {
    const lines = context
      .map((message) => {
        const text = this.getMessageTextContent(message).trim();

        if (!text) {
          return null;
        }

        const truncated =
          text.length > KNOWLEDGE_RERANK_THREAD_CONTEXT_CHARS
            ? `${text.slice(0, KNOWLEDGE_RERANK_THREAD_CONTEXT_CHARS)}...`
            : text;

        return `${message.role}: ${truncated}`;
      })
      .filter((line): line is string => Boolean(line))
      .slice(-KNOWLEDGE_RERANK_THREAD_CONTEXT_MESSAGES);

    return lines.length ? lines.join("\n") : "(no prior context)";
  }

  private async findKnowledgeSourceIdsForProfile(
    socialModuleProfileId: string,
  ) {
    const relations =
      await this.service.socialModule.profilesToKnowledgeModuleSources.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: socialModuleProfileId,
              },
            ],
          },
          orderBy: {
            and: [
              {
                column: "orderIndex",
                method: "asc",
              },
              {
                column: "createdAt",
                method: "asc",
              },
            ],
          },
        },
      });

    return (
      relations
        ?.map((relation: { knowledgeModuleSourceId?: string }) => {
          return relation.knowledgeModuleSourceId;
        })
        .filter((sourceId: unknown): sourceId is string => {
          return typeof sourceId === "string" && Boolean(sourceId);
        }) || []
    );
  }

  private async ensureProfileKnowledgeSourceRelation(props: {
    socialModuleProfileId: string;
    knowledgeModuleSourceId: string;
  }) {
    const existing =
      await this.service.socialModule.profilesToKnowledgeModuleSources.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.socialModuleProfileId,
              },
              {
                column: "knowledgeModuleSourceId",
                method: "eq",
                value: props.knowledgeModuleSourceId,
              },
            ],
          },
          limit: 1,
        },
      });

    if (existing?.length) {
      return existing[0];
    }

    return this.service.socialModule.profilesToKnowledgeModuleSources.create({
      data: {
        profileId: props.socialModuleProfileId,
        knowledgeModuleSourceId: props.knowledgeModuleSourceId,
      },
    });
  }

  private async findPromptSkillsForProfile(props: {
    socialModuleProfileId: string;
    skillIds: string[];
    skillSlugs: string[];
  }) {
    if (!props.skillIds.length && !props.skillSlugs.length) {
      return [];
    }

    const skillsById = new Map<string, ISocialModuleSkill>();

    if (props.skillIds.length) {
      const requestedSkills = await this.findSkillsForProfile({
        socialModuleProfileId: props.socialModuleProfileId,
        skillIds: props.skillIds,
        requireRequestedSkillsLinked: true,
      });

      for (const skill of requestedSkills) {
        skillsById.set(skill.id, skill);
      }
    }

    if (props.skillSlugs.length) {
      const slugSet = new Set(props.skillSlugs);
      const linkedSkills = await this.findSkillsForProfile({
        socialModuleProfileId: props.socialModuleProfileId,
        requireRequestedSkillsLinked: false,
      });

      for (const skill of linkedSkills) {
        if (slugSet.has(skill.slug.toLowerCase())) {
          skillsById.set(skill.id, skill);
        }
      }
    }

    return Array.from(skillsById.values());
  }

  private async findSkillsForProfile(props: {
    socialModuleProfileId: string;
    skillIds?: string[];
    requireRequestedSkillsLinked: boolean;
  }) {
    const relations = await this.service.socialModule.profilesToSkills.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.socialModuleProfileId,
            },
          ],
        },
        orderBy: {
          and: [
            {
              column: "orderIndex",
              method: "asc",
            },
            {
              column: "createdAt",
              method: "asc",
            },
          ],
        },
      },
    });
    const linkedSkillIds =
      relations
        ?.map((relation: { skillId?: string }) => relation.skillId)
        .filter((skillId: unknown): skillId is string => {
          return typeof skillId === "string" && Boolean(skillId);
        }) || [];
    const requestedSkillIds = this.normalizeSkillIds(props.skillIds);
    const skillIds = requestedSkillIds.length
      ? requestedSkillIds
      : linkedSkillIds;

    if (!skillIds.length) {
      return [];
    }

    if (props.requireRequestedSkillsLinked && requestedSkillIds.length) {
      const linkedSkillIdSet = new Set(linkedSkillIds);
      const unlinkedSkillIds = requestedSkillIds.filter((skillId) => {
        return !linkedSkillIdSet.has(skillId);
      });

      if (unlinkedSkillIds.length) {
        throw new Error(
          `Authorization error. Selected social skills are not linked to profile ${props.socialModuleProfileId}: ${unlinkedSkillIds.join(", ")}`,
        );
      }
    }

    const skills = await this.service.socialModule.skill.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: skillIds,
            },
          ],
        },
      },
    });
    const skillsById = new Map(
      (skills || []).map((skill: ISocialModuleSkill) => [skill.id, skill]),
    );

    return skillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is ISocialModuleSkill => {
        return Boolean(skill);
      });
  }

  private toSkillMessagePrefix(skills: ISocialModuleSkill[]) {
    if (!skills.length) {
      return "";
    }

    const skillText = skills
      .map((skill) => {
        return [
          `/${skill.slug}${skill.title ? ` (${skill.title})` : ""}`,
          skill.description,
        ].join("\n");
      })
      .join("\n\n---\n\n");

    return [
      "Selected social skills for this message:",
      "Follow these instructions for formatting, tone, and task behavior.",
      "Use the latest user message and thread context as source material when the user asks to transform or edit text.",
      "",
      skillText,
      "",
      "User message:",
    ].join("\n");
  }

  private buildProfileCapabilityTools(props: {
    sessionId?: string;
    availableSkills: ISocialModuleSkill[];
    knowledgeSourceIds: string[];
    knowledgeAction?: TJevKnowledgeAction;
    replyProfileId?: string;
    socialModuleMessage?: ISocialModuleMessage;
    documentContext?: IAIChatDocumentContext;
    disableKnowledgeWrites?: boolean;
    knowledgeFileAction?: "detach";
    knowledgeFileScope?: {
      id: string;
      socialModuleProfileId: string;
      socialModuleChatId: string;
      targetSocialModuleProfileId: string;
    };
  }): ISocialProfileAiTool[] {
    const tools: ISocialProfileAiTool[] = [];
    const canWrite =
      !props.disableKnowledgeWrites &&
      (props.knowledgeAction === "create" ||
        props.knowledgeAction === "update" ||
        props.knowledgeAction === "auto" ||
        props.knowledgeAction === undefined);
    if (
      props.documentContext &&
      props.socialModuleMessage &&
      props.knowledgeFileAction !== "detach"
    )
      tools.push(
        new DocumentService(
          this.service.socialModule,
          this.knowledgeService,
        ).tool(props.documentContext, props.socialModuleMessage),
      );
    if (canWrite && props.replyProfileId && props.socialModuleMessage) {
      const message = props.socialModuleMessage;
      const profileId = props.replyProfileId;
      tools.push({
        source: "knowledge",
        timeoutMs: KNOWLEDGE_TOOL_WRITE_TIMEOUT_MS,
        display: { label: "Create profile Knowledge" },
        definition: {
          type: "function",
          function: {
            name: "profile_knowledge_create",
            description:
              "Save new knowledge in this replying profile when the user explicitly requests it. Include the complete user-provided facts and context. The current message's attachments are analyzed and attached automatically. Use edit for an existing Source instead. Return errors honestly; saved does not always mean indexed.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", minLength: 1 },
                userContext: { type: "string" },
              },
              required: ["title", "userContext"],
              additionalProperties: false,
            },
          },
        },
        validateArguments: (args) => {
          if (
            typeof args["title"] !== "string" ||
            !args["title"].trim() ||
            typeof args["userContext"] !== "string"
          )
            throw new Error("Knowledge title and userContext are required.");
        },
        execute: async (args) => {
          const relations =
            await this.service.socialModule.messagesToFileStorageModuleFiles.find(
              {
                params: {
                  filters: {
                    and: [
                      { column: "messageId", method: "eq", value: message.id },
                    ],
                  },
                  orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
                },
              },
            );
          const saved = await this.knowledgeService.learnContent({
            slug: this.toSlug(`knowledge-${profileId}-${message.id}`),
            title: String(args["title"]).trim(),
            content: String(args["userContext"]),
            fileIds: [
              ...new Set<string>(
                (relations || [])
                  .map((relation) => relation.fileStorageModuleFileId)
                  .filter((id): id is string => Boolean(id)),
              ),
            ],
            onSourceSaved: async (sourceId) => {
              await this.ensureProfileKnowledgeSourceRelation({
                socialModuleProfileId: profileId,
                knowledgeModuleSourceId: sourceId,
              });
              await this.service.socialModule.messagesToKnowledgeModuleSources.findOrCreate(
                {
                  data: {
                    messageId: message.id,
                    knowledgeModuleSourceId: sourceId,
                    kind: "origin",
                    orderIndex: 0,
                  },
                },
              );
            },
          });
          return {
            sourceId: saved.source?.id,
            contentHash: saved.source?.contentHash,
            indexedContentHash: saved.source?.indexedContentHash,
            lastIndexedAt: saved.source?.lastIndexedAt,
            processingError: saved.processingError,
            indexError: saved.indexError,
          };
        },
      });
    }

    if (props.availableSkills.length) {
      const skillsBySlug = new Map(
        props.availableSkills.map((skill) => [skill.slug.toLowerCase(), skill]),
      );
      const definition: IOpenRouterTool = {
        type: "function",
        function: {
          name: "profile_skill_activate",
          description:
            "Activate one skill linked to this social.profile and return its instructions.",
          parameters: {
            type: "object",
            properties: {
              slug: {
                type: "string",
                enum: Array.from(skillsBySlug.keys()),
              },
            },
            required: ["slug"],
            additionalProperties: false,
          },
        },
      };

      tools.push({
        source: "skill",
        display: {
          label: "Activate profile skill",
        },
        definition,
        validateArguments: (args) => {
          const slug = typeof args["slug"] === "string" ? args["slug"] : "";

          if (!skillsBySlug.has(slug.toLowerCase())) {
            throw new Error("Skill is not linked to the social.profile");
          }
        },
        audit: (args) => {
          const skill = skillsBySlug.get(String(args["slug"]).toLowerCase());

          return skill
            ? {
                skillId: skill.id,
                slug: skill.slug,
              }
            : {};
        },
        execute: async (args) => {
          const slug = String(args["slug"]).toLowerCase();
          const skill = skillsBySlug.get(slug);

          if (!skill) {
            throw new Error("Skill is not linked to the social.profile");
          }

          return {
            slug: skill.slug,
            title: skill.title,
            instructions: skill.description,
          };
        },
      });
    }

    if (props.knowledgeSourceIds.length) {
      tools.push({
        source: "knowledge",
        display: {
          label: "Search profile Knowledge",
        },
        definition: {
          type: "function",
          function: {
            name: "profile_knowledge_search",
            description:
              "Search only Knowledge Sources linked to this social.profile. Results contain bounded text excerpts; use profile_knowledge_read with sourceId for complete content.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  minLength: 1,
                },
              },
              required: ["query"],
              additionalProperties: false,
            },
          },
        },
        validateArguments: (args) => {
          if (typeof args["query"] !== "string" || !args["query"].trim()) {
            throw new Error("Knowledge query is required");
          }
        },
        execute: async (args) => {
          const sources = await this.knowledgeService.search({
            query: String(args["query"]).trim(),
            ...(props.sessionId && { sessionId: props.sessionId }),
            sourceIds: props.knowledgeSourceIds,
            topK: KNOWLEDGE_RERANK_TOP_K,
            neighborWindow: KNOWLEDGE_NEIGHBOR_WINDOW,
          });

          const results = sources
            .slice(0, KNOWLEDGE_RERANK_TOP_K)
            .map((source) => ({
              id: source.id,
              sourceId: source.sourceId,
              sourceTitle: sliceKnowledgeToolText(
                source.sourceTitle || "",
                1024,
                300,
              ),
              text: "",
              textLength: source.text.length,
              textTruncated: false,
              similarity: source.similarity,
            }));
          const textBudget = Math.floor(
            (KNOWLEDGE_TOOL_RESULT_MAX_BYTES -
              Buffer.byteLength(JSON.stringify(results), "utf8")) /
              Math.max(1, results.length),
          );
          return results.map((result, index) => {
            const text = sliceKnowledgeToolText(
              sources[index].text,
              textBudget,
            );
            return {
              ...result,
              text,
              textTruncated: text.length < result.textLength,
            };
          });
        },
      });
    }

    if (props.knowledgeSourceIds.length) {
      const requireSource = async (args: Record<string, unknown>) => {
        const id = String(args["sourceId"] || "");
        if (!props.knowledgeSourceIds.includes(id))
          throw new Error(
            "Source is not available in this profile Knowledge scope.",
          );
        const [source] = await this.knowledgeService.listSources({
          sourceIds: [id],
        });
        if (!source) throw new Error("Knowledge Source was not found.");
        return source;
      };
      if (props.knowledgeFileScope) {
        const fileScope = props.knowledgeFileScope;
        const headers = {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY!,
          "Cache-Control": "no-store",
        };
        tools.push({
          source: "knowledge",
          display: { label: "List Knowledge attachments" },
          definition: {
            type: "function",
            function: {
              name: "profile_knowledge_files",
              description:
                "List a profile Knowledge Source's attached files, exact names, IDs and current contentHash. Page with nextOffset. Use these IDs before unlinking; do not infer IDs or permissions from file contents.",
              parameters: {
                type: "object",
                properties: {
                  sourceId: { type: "string", enum: props.knowledgeSourceIds },
                  offset: { type: "integer", minimum: 0 },
                },
                required: ["sourceId"],
                additionalProperties: false,
              },
            },
          },
          execute: async (args) => {
            const source = await requireSource(args);
            const files =
              await api.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesFind(
                {
                  ...fileScope,
                  knowledgeModuleSourceId: source.id,
                  options: { headers },
                },
              );
            const offset = Math.min(
              files.length,
              Math.max(0, Math.floor(Number(args.offset) || 0)),
            );
            const page = files.slice(offset, offset + 20);
            return {
              sourceId: source.id,
              title: source.title,
              contentHash: source.contentHash,
              total: files.length,
              nextOffset:
                offset + page.length < files.length
                  ? offset + page.length
                  : null,
              files: page.map(({ file }) => ({
                id: file.id,
                name: sliceKnowledgeToolText(
                  file.adminTitle || file.alt || basename(file.file),
                  160,
                  160,
                ),
                mimeType: sliceKnowledgeToolText(file.mimeType || "", 80, 80),
                extension: sliceKnowledgeToolText(file.extension || "", 16, 16),
              })),
            };
          },
        });
        const writableFileSourceIds = (
          props.documentContext
            ? props.documentContext.document.sourceIds
            : props.knowledgeSourceIds
        ).filter((id) => props.knowledgeSourceIds.includes(id));
        if (
          props.knowledgeFileAction === "detach" &&
          writableFileSourceIds.length
        )
          tools.push({
            source: "knowledge",
            timeoutMs: KNOWLEDGE_TOOL_WRITE_TIMEOUT_MS,
            display: { label: "Remove Knowledge attachment" },
            definition: {
              type: "function",
              function: {
                name: "profile_knowledge_file_detach",
                description:
                  "Unlink ONE file from its Knowledge Source only after the current user explicitly requests it. First list attachments and use the exact file ID and current contentHash. Ask which file if the target is unclear. The original File and chat attachments remain; Source materials and index are rebuilt. This does not edit human notes or approve a document proposal. Report processingError and indexing status honestly. If analysisPending is true, the file is already unlinked but rebuilding continues in the background; do not claim the index is ready.",
                parameters: {
                  type: "object",
                  properties: {
                    sourceId: {
                      type: "string",
                      enum: writableFileSourceIds,
                    },
                    fileId: { type: "string" },
                    expectedContentHash: { type: "string", minLength: 1 },
                  },
                  required: ["sourceId", "fileId", "expectedContentHash"],
                  additionalProperties: false,
                },
              },
            },
            execute: async (args) => {
              const source = await requireSource(args);
              if (
                props.documentContext &&
                (!props.documentContext.document.sourceIds.includes(
                  source.id,
                ) ||
                  (props.documentContext.targetSourceId !== undefined &&
                    props.documentContext.targetSourceId !== source.id))
              )
                throw new Error(
                  "Select the current document Source before removing an attachment.",
                );
              if (
                typeof args.fileId !== "string" ||
                !args.fileId ||
                args.expectedContentHash !== source.contentHash
              )
                throw new Error(
                  "Read the current Source attachments and contentHash before removing a file.",
                );
              const result =
                await api.socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesUpdate(
                  {
                    ...fileScope,
                    knowledgeModuleSourceId: source.id,
                    data: {
                      removeFileId: args.fileId,
                      expectedContentHash: source.contentHash,
                    },
                    options: { headers },
                  },
                );
              return {
                status: "detached",
                sourceId: source.id,
                removedFileId: args.fileId,
                remainingFiles: result.files.length,
                contentHash: result.source?.contentHash,
                indexed: Boolean(
                  result.source &&
                    result.source.contentHash ===
                      result.source.indexedContentHash,
                ),
                processingError: result.processingError,
                analysisPending: result.analysisPending || false,
              };
            },
          });
      }
      tools.push({
        source: "knowledge",
        display: { label: "Read Knowledge source" },
        definition: {
          type: "function",
          function: {
            name: "profile_knowledge_read",
            description:
              "Read saved Source content in UTF-8 byte-bounded pages. Follow nextOffset with the same section to read more. userContext is a preview; if userContextTruncated, read all pages with section=userContext before editing and preserve all existing notes.",
            parameters: {
              type: "object",
              properties: {
                sourceId: { type: "string", enum: props.knowledgeSourceIds },
                offset: { type: "integer", minimum: 0 },
                limit: {
                  type: "integer",
                  minimum: 1,
                  maximum: KNOWLEDGE_TOOL_READ_MAX_CHARS,
                },
                section: { type: "string", enum: ["content", "userContext"] },
              },
              required: ["sourceId"],
              additionalProperties: false,
            },
          },
        },
        execute: async (args) => {
          const source = await requireSource(args);
          const userContext = readKnowledgeUserContext(source.content);
          const section =
            args["section"] === "userContext" ? "userContext" : "content";
          const content =
            section === "userContext" ? userContext : source.content;
          const offset = Math.min(
            content.length,
            Math.max(0, Math.floor(Number(args["offset"]) || 0)),
          );
          const limit = Math.max(
            1,
            Math.min(
              KNOWLEDGE_TOOL_READ_MAX_CHARS,
              Math.floor(
                Number(args["limit"]) || KNOWLEDGE_TOOL_READ_MAX_CHARS,
              ),
            ),
          );
          const userContextPreview = sliceKnowledgeToolText(
            userContext,
            KNOWLEDGE_TOOL_USER_CONTEXT_MAX_BYTES,
          );
          const result = {
            sourceId: source.id,
            title: sliceKnowledgeToolText(source.title || "", 1024, 300),
            contentHash: source.contentHash,
            section,
            content: "",
            offset,
            contentLength: content.length,
            nextOffset: content.length,
            userContext: userContextPreview,
            userContextTruncated:
              userContextPreview.length < userContext.length,
            userContextLength: userContext.length,
          };
          const page = sliceKnowledgeToolText(
            content.slice(offset),
            KNOWLEDGE_TOOL_RESULT_MAX_BYTES -
              Buffer.byteLength(JSON.stringify(result), "utf8"),
            limit,
          );
          const end = offset + page.length;
          return {
            ...result,
            content: page,
            nextOffset: end < content.length ? end : null,
          };
        },
      });
      if (canWrite)
        tools.push({
          source: "knowledge",
          timeoutMs: KNOWLEDGE_TOOL_WRITE_TIMEOUT_MS,
          display: { label: "Edit Knowledge context" },
          definition: {
            type: "function",
            function: {
              name: "profile_knowledge_edit",
              description:
                "Directly save user context and optional title in a Source when the user explicitly requests or confirms this edit. Read the Source first, pass its contentHash as expectedContentHash, and preserve its other human notes. File-derived descriptions are rebuilt from files. Do not edit when the user is only discussing a possible change.",
              parameters: {
                type: "object",
                properties: {
                  sourceId: { type: "string", enum: props.knowledgeSourceIds },
                  userContext: { type: "string" },
                  expectedContentHash: { type: "string" },
                  title: { type: "string" },
                },
                required: ["sourceId", "userContext", "expectedContentHash"],
                additionalProperties: false,
              },
            },
          },
          execute: async (args) => {
            const source = await requireSource(args);
            if (typeof args["userContext"] !== "string")
              throw new Error("User context is required.");
            if (args["expectedContentHash"] !== source.contentHash)
              throw new Error(
                "Source changed after reading. Read it again before editing.",
              );
            const saved = await this.knowledgeService.updateSource({
              sourceId: source.id,
              content: replaceKnowledgeUserContext(
                source.content,
                args["userContext"],
              ),
              expectedContentHash: source.contentHash,
              ...(typeof args["title"] === "string"
                ? { title: args["title"] }
                : {}),
            });
            return {
              sourceId: saved.source?.id,
              contentHash: saved.source?.contentHash,
              indexedContentHash: saved.source?.indexedContentHash,
              lastIndexedAt: saved.source?.lastIndexedAt,
              indexError: saved.indexError,
            };
          },
        });
    }

    return tools;
  }

  private buildMcpCapabilityTools(
    catalogSession: IProfileMcpCatalogSession | null,
  ): ISocialProfileAiTool[] {
    if (!catalogSession) {
      return [];
    }

    return catalogSession.catalog.connected.flatMap((server) => {
      return server.tools.map((tool) => {
        const exposedName = `mcp__${server.id}__${tool.name}`;

        return {
          source: "mcp" as const,
          display: {
            label: tool.title || tool.name,
            serverId: server.id,
          },
          definition: {
            type: "function" as const,
            function: {
              name: exposedName,
              description:
                tool.description ||
                tool.title ||
                `Call ${tool.name} through the ${server.id} MCP server.`,
              parameters: tool.inputSchema,
            },
          },
          execute: async (args: Record<string, unknown>) => {
            return catalogSession.callTool({
              serverId: server.id,
              name: tool.name,
              arguments: args,
            });
          },
        } satisfies ISocialProfileAiTool;
      });
    });
  }

  private async openProfileMcpCatalogBestEffort(props: {
    configuredServerIds: string[];
    rbacSubjectAuthenticationJwt: string;
    socialModuleProfileId: string;
  }): Promise<{
    session: IProfileMcpCatalogSession | null;
    unavailableServerIds: string[];
  }> {
    try {
      const session = await this.service.socialModuleProfileMcpCatalogOpen({
        configuredServerIds: props.configuredServerIds,
        rbacSubjectAuthenticationJwt: props.rbacSubjectAuthenticationJwt,
      });

      return {
        session,
        unavailableServerIds: [],
      };
    } catch (error) {
      console.warn(
        "react-by-openrouter: profile MCP catalog unavailable; continuing without MCP tools",
        {
          socialModuleProfileId: props.socialModuleProfileId,
          serverIds: props.configuredServerIds,
          error: this.stringifyError(error),
        },
      );

      return {
        session: null,
        unavailableServerIds: [...props.configuredServerIds],
      };
    }
  }

  private attachSkillMessagePrefixToContext(props: {
    context: IOpenRouterRequestMessage[];
    skillMessagePrefix: string;
  }): IOpenRouterRequestMessage[] {
    const skillMessagePrefix = props.skillMessagePrefix.trim();

    if (!skillMessagePrefix) {
      return props.context;
    }

    const nextContext = [...props.context];

    for (let index = nextContext.length - 1; index >= 0; index -= 1) {
      const message = nextContext[index];

      if (message.role !== "user") {
        continue;
      }

      nextContext[index] = {
        ...message,
        content: this.prefixOpenRouterMessageContent({
          content: message.content,
          prefix: skillMessagePrefix,
        }),
      };

      return nextContext;
    }

    return nextContext;
  }

  private prefixOpenRouterMessageContent(props: {
    content: IOpenRouterRequestMessage["content"];
    prefix: string;
  }): IOpenRouterRequestMessage["content"] {
    if (typeof props.content === "string") {
      return this.joinSkillPrefixAndMessage(props.prefix, props.content);
    }

    let prefixedTextPart = false;
    const content = props.content.map((part) => {
      if (part.type !== "text" || prefixedTextPart) {
        return part;
      }

      prefixedTextPart = true;

      return {
        ...part,
        text: this.joinSkillPrefixAndMessage(props.prefix, part.text),
      };
    });

    if (prefixedTextPart) {
      return content;
    }

    return [
      {
        type: "text",
        text: props.prefix,
      },
      ...content,
    ];
  }

  private joinSkillPrefixAndMessage(prefix: string, message: string) {
    return [prefix.trim(), message.trim()].filter(Boolean).join("\n\n");
  }

  private toKnowledgeSystemPrompt(props: {
    query: string;
    sources: KnowledgeSearchResult[];
  }) {
    const fragments = props.sources.length
      ? props.sources
          .map((source, index) => {
            return [
              `Source ${index + 1}: ${source.sourceTitle || "Untitled"}`,
              `Source ID: ${source.sourceId || "unknown"}`,
              `Similarity: ${this.formatKnowledgeSimilarity(source.similarity)}`,
              `Retrieval role: ${source.retrievalRole}`,
              source.text,
            ].join("\n");
          })
          .join("\n\n---\n\n")
      : "The initial search returned no matching knowledge fragments.";

    return [
      "Use the following profile-scoped knowledge fragments for factual grounding.",
      "Answer directly when these fragments contain enough evidence.",
      "If needed facts are missing and profile_knowledge_search is available, call it once with a focused query before concluding that information is unavailable.",
      "Use profile_knowledge_read for relevant pages if search excerpts are insufficient or exact saved wording is needed.",
      "Describe missing information only after that search; distinguish a tool failure from information not found. Never invent facts.",
      "Use conversation history only to resolve follow-ups and source text for edits.",
      `Knowledge query: ${props.query}`,
      "",
      "Knowledge fragments:",
      fragments,
    ].join("\n");
  }

  private formatKnowledgeSimilarity(value: number | null) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return "n/a";
    }

    return value.toFixed(3);
  }

  private async learnFromMessage(props: {
    rbacSubjectAuthenticationJwt: string;
    replyByRbacSubjectId: string;
    replyProfile: ISocialModuleProfile;
    socialModuleChatId: string;
    socialModuleThreadId: string;
    socialModuleMessage: ISocialModuleMessage;
    sourceSocialModuleProfileId: string;
  }) {
    const relations =
      await this.service.socialModule.messagesToFileStorageModuleFiles.find({
        params: {
          filters: {
            and: [
              {
                column: "messageId",
                method: "eq",
                value: props.socialModuleMessage.id,
              },
            ],
          },
          orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
        },
      });
    const fileIds = [
      ...new Set(
        (relations || [])
          .map((relation) => relation.fileStorageModuleFileId)
          .filter(Boolean),
      ),
    ] as string[];
    const userContext = this.stripLearnPrefix(
      props.socialModuleMessage.description || "",
    );
    if (!userContext && !fileIds.length)
      throw new Error("Validation error. /learn requires text or attachments.");
    const entry = await this.knowledgeService.learnContent({
      slug: this.toSlug(
        `knowledge-${props.replyProfile.id}-${props.socialModuleMessage.id}`,
      ),
      title: this.toTitle(userContext) || "Материалы из чата",
      content: userContext,
      fileIds,
      onSourceSaved: async (sourceId) => {
        await this.ensureProfileKnowledgeSourceRelation({
          socialModuleProfileId: props.replyProfile.id,
          knowledgeModuleSourceId: sourceId,
        });
        await this.service.socialModule.messagesToKnowledgeModuleSources.findOrCreate(
          {
            data: {
              messageId: props.socialModuleMessage.id,
              knowledgeModuleSourceId: sourceId,
              kind: "origin",
              orderIndex: 0,
            },
          },
        );
      },
    });
    const content = entry.processingError
      ? `Материал сохранён с вложениями. Анализ не завершён: ${entry.processingError}`
      : entry.indexError
        ? `Материал сохранён. Индексация не завершена: ${entry.indexError}`
        : "Материал сохранён и проиндексирован.";
    return api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
      {
        id: props.replyByRbacSubjectId,
        socialModuleProfileId: props.replyProfile.id,
        socialModuleChatId: props.socialModuleChatId,
        socialModuleThreadId: props.socialModuleThreadId,
        data: {
          description: content,
          interaction: { role: "assistant", content },
          metadata: {
            knowledge: {
              action: "learn",
              index: entry.index,
              processingError: entry.processingError,
              indexError: entry.indexError,
            },
          },
        },
        options: {
          headers: {
            Authorization: "Bearer " + props.rbacSubjectAuthenticationJwt,
          },
        },
      },
    );
  }

  private resolveManualOpenRouterModel(props: {
    models: IOpenRouterModel[];
    modelId: string;
    requiredInputModalitiesList: TInputModality[];
    expectedOutputModality?: TOutputModality;
  }) {
    const allowed = Object.values(MODEL_ROUTER_CONFIG.classes)
      .flat()
      .some((candidate) => candidate.enabled && candidate.id === props.modelId);
    if (!allowed)
      throw new Error(
        `Validation error. OpenRouter model ${props.modelId} is not in the local allowed model catalogue.`,
      );
    const model = props.models.find((item) => item.id === props.modelId);

    if (!model) {
      throw new Error(
        `Validation error. OpenRouter model ${props.modelId} is not available.`,
      );
    }

    const inputModalities = this.getOpenRouterModelModalities(
      model.architecture?.input_modalities,
    );
    const outputModalities = this.getOpenRouterModelModalities(
      model.architecture?.output_modalities,
    );
    const expectedOutputModality =
      props.expectedOutputModality ||
      this.resolvePreferredOpenRouterOutputModality(outputModalities);
    const missingInputModalities = props.requiredInputModalitiesList.filter(
      (modality) => {
        return !inputModalities.includes(modality);
      },
    );

    if (missingInputModalities.length) {
      throw new Error(
        `Validation error. OpenRouter model ${model.id} does not support required input modalities: ${missingInputModalities.join(", ")}`,
      );
    }

    if (!outputModalities.includes(expectedOutputModality)) {
      throw new Error(
        `Validation error. OpenRouter model ${model.id} does not support expected output modality: ${expectedOutputModality}`,
      );
    }

    return model;
  }

  private resolvePreferredOpenRouterOutputModality(
    outputModalities: string[],
  ): TOutputModality {
    const allowedOutputModalities = outputModalities.filter(
      (modality): modality is TOutputModality => {
        return ALLOWED_OUTPUT_MODALITIES.includes(modality as TOutputModality);
      },
    );

    for (const preferredOutputModality of [
      "text",
      "image",
      "audio",
      "file",
    ] satisfies TOutputModality[]) {
      if (allowedOutputModalities.includes(preferredOutputModality)) {
        return preferredOutputModality;
      }
    }

    return "text";
  }

  private resolveManualExpectedOutputModality(
    model: IOpenRouterModel,
  ): TOutputModality {
    return this.resolvePreferredOpenRouterOutputModality(
      this.getOpenRouterModelModalities(model.architecture?.output_modalities),
    );
  }

  private buildManualRequestClassification(props: {
    expectedOutputModality: TOutputModality;
    requestText: string;
    requiredInputModalitiesList: TInputModality[];
  }): IRequestClassification {
    return {
      language: this.normalizeLanguage(props.requestText),
      task: "qa",
      input_modalities: props.requiredInputModalitiesList.length
        ? props.requiredInputModalitiesList
        : ["text"],
      output_modality: props.expectedOutputModality,
      need_web: false,
      complexity: "medium",
      risk_level: "low",
    };
  }

  private toOpenRouterReasoning(
    reasoning: TRbacAiReactionReasoning,
  ): IOpenRouterReasoning | undefined {
    if (reasoning === "auto") {
      return undefined;
    }

    return {
      effort: reasoning,
      exclude: true,
    };
  }

  private getOpenRouterModelModalities(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        return typeof item === "string" ? item.toLowerCase().trim() : "";
      })
      .filter((item): item is string => Boolean(item));
  }

  private getMentionedSkillSlugs(value: string) {
    return Array.from(
      new Set(
        Array.from(value.matchAll(/(^|\s)\/([a-zA-Z0-9._-]+)(?=\s|$)/g))
          .map((match) => match[2].toLowerCase())
          .filter((slug) => !this.isReservedSlashCommandSlug(slug)),
      ),
    );
  }

  private stripLearnPrefix(value: string) {
    return this.stripSkillMentions(this.stripKnowledgeControls(value))
      .replace(/^\/learn\b/i, "")
      .trim();
  }

  private stripSkillMentions(value: string) {
    return this.toLearnText(value)
      .replace(/(^|\s)@[a-zA-Z0-9._-]+(?=\s|$)/g, " ")
      .replace(/(^|\s)\/([a-zA-Z0-9._-]+)(?=\s|$)/g, (_, prefix, slug) => {
        return this.isReservedSlashCommandSlug(slug)
          ? `${prefix}/${slug}`
          : prefix || " ";
      })
      .replace(/\s+/g, " ")
      .trim();
  }

  private isReservedSlashCommandSlug(value: string) {
    return ["knowledge", "learn", "new"].includes(value.toLowerCase());
  }

  private normalizeSkillIds(value?: string[]) {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(
        value
          .map((skillId) => {
            return typeof skillId === "string" ? skillId.trim() : "";
          })
          .filter((skillId): skillId is string => Boolean(skillId)),
      ),
    );
  }

  protected isTextFileStorageFile(file: IFileStorageModuleFile) {
    const filePath = this.toLearnText(file.file);
    const extension = (
      this.toLearnText(file.extension) ||
      extname(filePath.split("?")[0]).replace(".", "")
    ).toLowerCase();
    const mimeType = this.toLearnText(file.mimeType).toLowerCase();

    return (
      mimeType.startsWith("text/") ||
      [
        "csv",
        "json",
        "jsonl",
        "log",
        "markdown",
        "md",
        "srt",
        "txt",
        "vtt",
        "xml",
        "yaml",
        "yml",
      ].includes(extension)
    );
  }

  private toTitle(value: string) {
    return this.toLearnText(value).replace(/\s+/g, " ").trim().slice(0, 120);
  }

  private toSlug(value: string) {
    return this.toLearnText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180);
  }

  private sha256(value: string) {
    return createHash("sha256").update(value, "utf8").digest("hex");
  }

  private toLearnText(value: unknown) {
    if (typeof value === "string") {
      return value;
    }

    if (value === null || value === undefined) {
      return "";
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return String(value);
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

  protected async resolveOpenRouterMessageContext(props: {
    fileStorageFiles: IFileStorageModuleFile[];
    messageDescription: string;
    presentationOnlyFileIds?: string[];
  }): Promise<IResolvedOpenRouterMessageContext> {
    const messageText = props.messageDescription.trim();
    const contentTextParts = [messageText].filter(Boolean);
    const routingTextParts = [messageText].filter(Boolean);
    const mediaParts: IOpenRouterMessageContent[] = [];
    const presentationOnlyIds = new Set(
      Array.isArray(props.presentationOnlyFileIds)
        ? props.presentationOnlyFileIds.filter((id) => typeof id === "string")
        : [],
    );

    for (const fileStorageFile of props.fileStorageFiles) {
      if (presentationOnlyIds.has(fileStorageFile.id)) continue;
      if (this.isAudioFileStorageFile(fileStorageFile)) continue;
      let attachmentBytes: Buffer;
      try {
        assertKnowledgeAttachmentBytes({
          bytes: new Uint8Array(),
          name: fileStorageFile.extension
            ? "file." + fileStorageFile.extension
            : fileStorageFile.file,
          mimeType: fileStorageFile.mimeType || undefined,
        });
        attachmentBytes =
          await this.service.fileStorageModule.file.readBytes(fileStorageFile);
        assertKnowledgeAttachmentBytes({
          bytes: attachmentBytes,
          name: fileStorageFile.file,
          mimeType: fileStorageFile.mimeType || undefined,
        });
      } catch (error) {
        // Historical unsupported attachments remain stored, but never enter model input.
        routingTextParts.push(
          "Unsupported attachment excluded: " +
            (fileStorageFile.adminTitle || "file"),
        );
        continue;
      }
      const source = this.toLearnText(fileStorageFile.file);
      const fileName =
        this.toLearnText(fileStorageFile.adminTitle) ||
        basename(source.split("?")[0]) ||
        "attachment";
      const fileUrl = /^https?:\/\//i.test(source)
        ? source
        : `${NEXT_PUBLIC_API_SERVICE_URL}/public${source}`;

      if (this.isTextFileStorageFile(fileStorageFile)) {
        const attachmentText = attachmentBytes.toString("utf8").trim();

        if (attachmentText) {
          routingTextParts.push(
            [`Text attachment (${fileName}):`, attachmentText].join("\n"),
          );
        }
      }

      if (fileStorageFile.mimeType?.includes("image")) {
        routingTextParts.push(`Attached image: ${fileName}`);
        mediaParts.push({ type: "text", text: `Attached image: ${fileName}` });
        mediaParts.push({
          type: "image_url",
          image_url: {
            url: fileUrl,
          },
        });
        continue;
      }

      if (!this.isTextFileStorageFile(fileStorageFile)) {
        routingTextParts.push(`Attached file: ${fileName}`);
      }
      mediaParts.push({ type: "text", text: `Attached file: ${fileName}` });
      mediaParts.push({
        type: "file_url",
        file_url: {
          url: fileUrl,
        },
      });
    }

    const contentText = contentTextParts.join("\n\n").trim();
    const routingText = routingTextParts.join("\n\n").trim();
    const content: IOpenRouterRequestMessage["content"] | null =
      mediaParts.length > 0
        ? [
            ...(contentText
              ? [
                  {
                    type: "text" as const,
                    text: contentText,
                  },
                ]
              : []),
            ...mediaParts,
          ]
        : contentText || null;

    return {
      content,
      routingText: routingText.slice(0, OPEN_ROUTER_ROUTING_TEXT_MAX_CHARS),
    };
  }

  protected detectInputModalitiesFromContext(
    context: IOpenRouterRequestMessage[],
  ): TInputModality[] {
    const latestMessage = context[context.length - 1];

    if (!latestMessage) {
      return ["text"];
    }

    const modalities = new Set<TInputModality>();

    for (const message of context) {
      if (typeof message.content === "string") {
        modalities.add("text");
      } else {
        for (const part of message.content) {
          if (part.type === "text") {
            modalities.add("text");
          } else if (part.type === "image_url") {
            modalities.add("image");
          } else if (part.type === "file" || part.type === "file_url") {
            modalities.add("file");
          }
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

  private toProfileSystemMessage(props: {
    language: string;
    replyProfile: ISocialModuleProfile;
  }): IOpenRouterRequestMessage {
    const profileTitle =
      getLocalizedProfilePlainText(props.replyProfile.title, props.language) ||
      props.replyProfile.adminTitle ||
      props.replyProfile.slug;
    const profileSubtitle = getLocalizedProfilePlainText(
      props.replyProfile.subtitle,
      props.language,
    );
    const profileDescription = getLocalizedProfilePlainText(
      props.replyProfile.description,
      props.language,
    );

    return {
      role: "system",
      content: [
        "You are replying as a SinglePageStartup social profile specialist.",
        `Profile slug: ${props.replyProfile.slug}.`,
        `Profile title: ${profileTitle}.`,
        profileSubtitle ? `Profile subtitle: ${profileSubtitle}.` : "",
        profileDescription
          ? ["Profile description and expertise:", profileDescription].join(
              "\n",
            )
          : "",
        "Use the profile description as persona, expertise, and communication boundary.",
        "Use the available read/search tools to obtain missing facts when the supplied context is insufficient. The supplied excerpts may cover only part of the information available to you.",
        "Linked social skills are available capabilities. Activate only skills relevant to the assigned task and follow their instructions precisely.",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  protected buildGenerationContext(props: {
    context: IOpenRouterRequestMessage[];
    expectedOutputModality: TOutputModality;
    language: string;
    profileSystemMessage?: IOpenRouterRequestMessage;
    prependedSystemMessages?: IOpenRouterRequestMessage[];
  }): IOpenRouterRequestMessage[] {
    if (props.expectedOutputModality === "image") {
      const prompt = this.buildImageGenerationPrompt({
        context: props.context,
      });
      const imageParts = this.collectImageContextParts(props.context);

      return [
        {
          role: "system",
          content: [
            "Create the requested image.",
            `Use ${props.language} for any visible text only if text is explicitly requested.`,
            "Resolve pronouns and ellipses from the conversation context before generating.",
            "Do not reinterpret a pronoun as a person when the previous context points to an object, place, concept, or file.",
            "Return image output.",
          ].join(" "),
        },
        ...(props.profileSystemMessage ? [props.profileSystemMessage] : []),
        ...(props.prependedSystemMessages || []),
        {
          role: "user",
          content: imageParts.length
            ? [
                {
                  type: "text",
                  text: prompt,
                },
                ...imageParts,
              ]
            : prompt,
        },
      ];
    }

    return [
      {
        role: "system",
        content: [
          "Answer in the language requested by the current user; otherwise use the language of their latest message.",
          "Use portable Markdown only.",
          "Do not add emoji or decorative pictograms to replies, headings, lists, or status text.",
          "Do not use LaTeX delimiters or commands.",
          "Write formulas with plain text and Unicode mathematical symbols so the same answer is readable in web chat and Telegram.",
        ].join(" "),
      },
      ...(props.profileSystemMessage ? [props.profileSystemMessage] : []),
      ...(props.prependedSystemMessages || []),
      ...props.context,
    ];
  }

  protected buildImageGenerationPrompt(props: {
    context: IOpenRouterRequestMessage[];
  }) {
    const conversation = props.context
      .map((message) => {
        const text = this.getMessageTextContent(message);

        if (!text) {
          return;
        }

        return `${message.role}: ${text}`;
      })
      .filter((line): line is string => Boolean(line))
      .slice(-8);

    return [
      "Conversation context:",
      conversation.length ? conversation.join("\n") : "(no prior context)",
      "",
      "Image task:",
      "Generate the image requested by the latest user message.",
      "The prompt is conversational, so resolve references such as it, this, her, him, them, ее, его, это, эта, этот from the prior messages.",
      "If the latest message asks for a photo of a previously discussed object or place, generate that object or place, not a portrait of an unrelated person.",
    ].join("\n");
  }

  protected collectImageContextParts(context: IOpenRouterRequestMessage[]) {
    return context.flatMap((message) => {
      if (typeof message.content === "string") {
        return [];
      }

      return message.content
        .filter((part) => part.type === "image_url")
        .map((part) => {
          return {
            type: "image_url" as const,
            image_url: part.image_url,
          };
        });
    });
  }

  protected getMessageTextContent(message: IOpenRouterRequestMessage) {
    if (typeof message.content === "string") {
      return message.content.trim();
    }

    return message.content
      .filter((part) => part.type === "text")
      .map((part) => part.text.trim())
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  protected isAudioFileStorageFile(file: IFileStorageModuleFile) {
    const mimeType = file.mimeType || "";
    const extension =
      file.extension ||
      file.file.split("?")[0].split(".").pop()?.toLowerCase() ||
      "";
    const audioExtensions = [
      "aac",
      "flac",
      "m4a",
      "mp3",
      "oga",
      "ogg",
      "opus",
      "wav",
      "webm",
    ];

    return Boolean(
      mimeType.startsWith("audio/") ||
        (mimeType === "video/webm" &&
          !(file as IFileStorageModuleFile & { width?: unknown }).width &&
          !(file as IFileStorageModuleFile & { height?: unknown }).height) ||
        audioExtensions.includes(extension.toLowerCase()),
    );
  }

  protected isOpenRouterProgressStatusMessage(
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

      if (
        messageDescription
          .replace(
            /^[\p{Extended_Pictographic}\p{Emoji_Modifier}\u200D\uFE0F\s]+/u,
            "",
          )
          .startsWith(prefix)
      ) {
        if (!suffix || messageDescription.includes(suffix)) {
          return true;
        }
      }
    }

    return false;
  }

  protected getEnabledCandidatesByClass(
    modelClass: TModelConfigClass,
  ): IModelCandidate[] {
    return [...MODEL_ROUTER_CONFIG.classes[modelClass]]
      .filter((candidate) => candidate.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  protected resolveModelCandidates(props: {
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

    return filteredCandidates;
  }

  protected async selectModelCandidatesForRequest(props: {
    modelCandidates: IModelCandidate[];
    selectedModelClass: TModelClass;
    requestText: string;
    openRouter: OpenRouter;
    billingLedger: IOpenRouterBillingLedgerEntry[];
    models?: IOpenRouterModel[];
    [key: string]: unknown;
  }): Promise<IModelSelectionResult> {
    const fallbackIds = props.modelCandidates
      .slice()
      .sort((a, b) => b.priority - a.priority)
      .map((candidate) => candidate.id);
    const chosen = await new SocialProfileJevService(props).selectModel({
      requestText: props.requestText,
      modelClass: props.selectedModelClass,
      candidates: props.modelCandidates.map((candidate) => ({
        id: candidate.id,
        strengths: candidate.strengths,
        pricing: props.models?.find((model) => model.id === candidate.id)
          ?.pricing,
      })),
    });
    const selectedModelId = chosen || fallbackIds[0] || null;
    return {
      orderedCandidateIds: selectedModelId
        ? [
            selectedModelId,
            ...fallbackIds.filter((id) => id !== selectedModelId),
          ]
        : [],
      selectedModelId,
      selectedBy:
        props.modelCandidates.length === 1
          ? "single"
          : chosen
            ? "jev"
            : "priority",
    };
  }

  protected resolveModelClass(props: {
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

  protected getGenerationValidationError(props: {
    expectedOutputModality: TOutputModality;
    result: { text: string; images?: { url?: string; b64_json?: string }[] };
  }): string | null {
    if (props.expectedOutputModality === "image") {
      if (!props.result.images?.length) {
        return "expected image output, but model returned no images";
      }

      if (!props.result.images.some((image) => image.url)) {
        return "expected image output, but model returned no image URL";
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

  protected adaptClassificationForEndpoint(props: {
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

  protected normalizeLanguage(value: unknown): string {
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
}
