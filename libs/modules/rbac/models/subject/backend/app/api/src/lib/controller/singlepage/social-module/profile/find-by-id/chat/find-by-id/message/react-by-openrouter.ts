import {
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
} from "@sps/rbac/models/subject/backend/app/api/src/lib/service";
import { api } from "@sps/rbac/models/subject/sdk/server";
import {
  type IRbacAiReactionRequest,
  type TRbacAiReactionReasoning,
  parseRbacAiReactionRequestMetadata,
} from "@sps/rbac/models/subject/sdk/model";
import { blobifyFiles, getHttpErrorType } from "@sps/backend-utils";
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
import { IModel as ISocialModuleMessage } from "@sps/social/models/message/sdk/model";
import {
  getLocalizedProfilePlainText,
  IModel as ISocialModuleProfile,
} from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleSkill } from "@sps/social/models/skill/sdk/model";
import { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import { KnowledgeSearchResult } from "@sps/knowledge/backend/app/api/src/lib/types";
import * as jwt from "hono/jwt";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, extname, join, normalize } from "node:path";

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
  selectedBy: "llm" | "priority" | "manual";
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

interface ILearnContentItem {
  content: string;
  title: string;
  fileId?: string | null;
  fileName?: string | null;
  filePath?: string | null;
}

interface IResolvedOpenRouterKnowledgeContext {
  query: string;
  requestedSkillIds: string[];
  requestedKnowledgeSearch: boolean;
  useKnowledgeSearch: boolean;
  knowledgeDocumentIds: string[];
  searchDocumentIds: string[];
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

const MODEL_ROUTER_CONFIG = {
  version: "2026-07-15",
  classes: {
    CLASSIFIER: [
      {
        id: "openai/gpt-5.6-luna",
        enabled: true,
        priority: 100,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["classification", "routing", "structured_outputs"],
      },
      {
        id: "minimax/minimax-m3",
        enabled: true,
        priority: 90,
        input_modalities: ["text", "image"],
        output_modalities: ["text"],
        strengths: ["classification", "routing", "cost_efficiency"],
      },
      {
        id: "google/gemini-3.1-flash-lite",
        enabled: true,
        priority: 80,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: [
          "classification",
          "routing",
          "multimodal",
          "cost_efficiency",
        ],
      },
    ],
    CHAT: [
      {
        id: "openai/gpt-5.6-terra",
        enabled: true,
        priority: 100,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["general_chat", "reasoning", "professional_work"],
      },
      {
        id: "minimax/minimax-m3",
        enabled: true,
        priority: 95,
        input_modalities: ["text", "image"],
        output_modalities: ["text"],
        strengths: [
          "general_chat",
          "reasoning",
          "agentic_workflows",
          "cost_efficiency",
        ],
      },
      {
        id: "anthropic/claude-sonnet-5",
        enabled: true,
        priority: 90,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["deep_reasoning", "long_form", "professional_work"],
      },
      {
        id: "google/gemini-3.5-flash",
        enabled: true,
        priority: 88,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: [
          "general_chat",
          "agentic_workflows",
          "reasoning",
          "multimodal",
        ],
      },
      {
        id: "google/gemini-3.1-flash-lite",
        enabled: true,
        priority: 85,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["speed", "general_chat", "multimodal", "cost_efficiency"],
      },
      {
        id: "openai/gpt-5.6-luna",
        enabled: true,
        priority: 80,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["speed", "high_volume", "concise_answers"],
      },
      {
        id: "minimax/minimax-m2.7",
        enabled: true,
        priority: 75,
        input_modalities: ["text"],
        output_modalities: ["text"],
        strengths: [
          "professional_work",
          "office_tasks",
          "coding",
          "cost_efficiency",
        ],
      },
    ],
    CODER: [
      {
        id: "openai/gpt-5.6-sol",
        enabled: true,
        priority: 100,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["coding", "debugging", "architecture", "deep_reasoning"],
        best_for: ["code_generation", "bug_fixing", "architecture_help"],
      },
      {
        id: "minimax/minimax-m2.7",
        enabled: true,
        priority: 95,
        input_modalities: ["text"],
        output_modalities: ["text"],
        strengths: ["coding", "debugging", "refactoring", "tooling"],
        best_for: ["real_world_engineering", "code_generation", "code_review"],
      },
      {
        id: "moonshotai/kimi-k2.7-code",
        enabled: true,
        priority: 90,
        input_modalities: ["text", "image"],
        output_modalities: ["text"],
        strengths: ["coding", "agentic_workflows", "large_codebases"],
        best_for: ["project_delivery", "code_generation", "debugging"],
      },
      {
        id: "google/gemini-3.5-flash",
        enabled: true,
        priority: 88,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["coding", "agentic_workflows", "multimodal"],
        best_for: ["code_generation", "debugging", "project_delivery"],
      },
      {
        id: "anthropic/claude-sonnet-5",
        enabled: true,
        priority: 85,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["reasoning", "code_explanations", "architecture"],
      },
    ],
    VISION: [
      {
        id: "openai/gpt-5.6-terra",
        enabled: true,
        priority: 100,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["image_understanding", "ocr", "analysis"],
      },
      {
        id: "minimax/minimax-m3",
        enabled: true,
        priority: 95,
        input_modalities: ["text", "image"],
        output_modalities: ["text"],
        strengths: ["image_understanding", "reasoning", "cost_efficiency"],
      },
      {
        id: "google/gemini-3.5-flash",
        enabled: true,
        priority: 92,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["vision", "reasoning", "ocr", "multimodal"],
      },
      {
        id: "google/gemini-3.1-flash-lite",
        enabled: true,
        priority: 90,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["vision", "speed", "ocr", "cost_efficiency"],
      },
      {
        id: "anthropic/claude-sonnet-5",
        enabled: true,
        priority: 85,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["text"],
        strengths: ["image_understanding", "deep_reasoning", "long_context"],
      },
    ],
    IMAGE: [
      {
        id: "google/gemini-3.1-flash-image",
        enabled: true,
        priority: 100,
        input_modalities: ["text", "image"],
        output_modalities: ["image", "text"],
        strengths: [
          "quality_cost_balance",
          "text_on_image",
          "image_editing",
          "low_latency",
        ],
        best_for: ["general_image_generation", "marketing_visuals", "editing"],
      },
      {
        id: "google/gemini-3.1-flash-lite-image",
        enabled: true,
        priority: 95,
        input_modalities: ["text", "image"],
        output_modalities: ["image", "text"],
        strengths: ["cost_efficiency", "ultra_low_latency", "image_editing"],
        best_for: ["high_volume", "drafts", "rapid_iterations"],
      },
      {
        id: "openai/gpt-5.4-image-2",
        enabled: true,
        priority: 90,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["image", "text"],
        strengths: ["creative_generation", "art_direction", "image_editing"],
        best_for: ["high_fidelity", "creative_concepts", "ad_creatives"],
      },
      {
        id: "google/gemini-3-pro-image",
        enabled: true,
        priority: 80,
        input_modalities: ["text", "image"],
        output_modalities: ["image", "text"],
        strengths: ["complex_composition", "reasoning", "text_on_image"],
        best_for: ["complex_briefs", "professional_visuals"],
      },
      {
        id: "openai/gpt-5-image-mini",
        enabled: true,
        priority: 70,
        input_modalities: ["text", "image", "file"],
        output_modalities: ["image", "text"],
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
const OPEN_ROUTER_FINAL_TEXT_MAX_TOKENS = 8192;
const OPEN_ROUTER_ROUTING_TEXT_MAX_CHARS = 12_000;
const KNOWLEDGE_INITIAL_TOP_K = 30;
const KNOWLEDGE_NEIGHBOR_WINDOW = 1;
const KNOWLEDGE_RERANK_TOP_K = 12;
const KNOWLEDGE_RERANK_THREAD_CONTEXT_MESSAGES = 8;
const KNOWLEDGE_RERANK_THREAD_CONTEXT_CHARS = 800;
const OPEN_ROUTER_TERMINAL_MESSAGE_WRITTEN_MARKER =
  "open-router-terminal-message-written";

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

const KNOWLEDGE_RERANK_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "knowledge_rerank",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["selected_chunk_ids", "reason"],
      properties: {
        selected_chunk_ids: {
          type: "array",
          items: {
            type: "string",
          },
        },
        reason: {
          type: "string",
        },
      },
    },
  },
};

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
    const billingLedger: IOpenRouterBillingLedgerEntry[] = [];
    let socialProfileMcpCatalogSession: IProfileMcpCatalogSession | null = null;
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
      const requestedSkillIds = aiReactionRequest.skillIds;
      const requestedKnowledgeSearch = this.hasKnowledgeControl(
        socialModuleMessage.description,
      );
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
                socialModuleMessage.id === socialModuleMessageId
                  ? sanitizedTriggerDescription
                  : socialModuleMessage.description?.trim() || "";

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

              if (this.isOpenRouterLearnContextMessage(messageDescription)) {
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

              if (socialModuleMessage.id === socialModuleMessageId) {
                routingRequestText = resolvedMessageContext.routingText;
              }
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

      if (this.hasLearnCommand(socialModuleMessage.description)) {
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

      const openRouter = new OpenRouter();

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

      const requiredInputModalitiesList =
        this.detectInputModalitiesFromContext(context);
      let requestClassification: IRequestClassification;
      let selectedModelClass: TModelClass = "CHAT";
      let expectedOutputModality: TOutputModality = "text";
      let modelCandidates: IModelCandidate[] = [];
      let modelSelection: IModelSelectionResult;

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

        const rawRequestClassification = await this.classifyRequest({
          billingLedger,
          openRouter,
          requestText: routingRequestText,
          requiredInputModalitiesList,
        });

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
        });

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
          requestedSkillIds,
          reasoning: openRouterReasoning,
          selectedModelId:
            modelSelection.selectedModelId ||
            modelSelection.orderedCandidateIds[0] ||
            null,
          threadContext: context,
        });
      const openRouterContext = this.attachSkillMessagePrefixToContext({
        context,
        skillMessagePrefix: openRouterKnowledgeContext.skillMessagePrefix,
      });
      const generationContext = this.buildGenerationContext({
        context: openRouterContext,
        expectedOutputModality,
        language: requestClassification.language,
        profileSystemMessage: this.toProfileSystemMessage({
          language: requestClassification.language,
          replyProfile: replyBySocialModuleProfile,
        }),
        prependedSystemMessages: openRouterKnowledgeContext.systemMessages,
      });
      const profileCapabilityTools = this.buildProfileCapabilityTools({
        availableSkills: openRouterKnowledgeContext.availableSkills,
        knowledgeDocumentIds: openRouterKnowledgeContext.knowledgeDocumentIds,
      });
      const allowedMcpServerIds = Array.isArray(
        replyBySocialModuleProfile.allowedMcpServerIds,
      )
        ? replyBySocialModuleProfile.allowedMcpServerIds
        : [];

      if (expectedOutputModality === "text" && allowedMcpServerIds.length) {
        socialProfileMcpCatalogSession =
          await this.service.socialModuleProfileMcpCatalogOpen({
            configuredServerIds: allowedMcpServerIds,
            rbacSubjectAuthenticationJwt: replyByRbacSubjectAuthenticationJwt,
          });
      }

      const socialProfileTools = [
        ...profileCapabilityTools,
        ...this.buildMcpCapabilityTools(socialProfileMcpCatalogSession),
      ];
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
      let finalGenerationResult: IFinalGenerationResult = {
        selectedModelId: null,
        fallbackReasons: [],
      };

      if (expectedOutputModality === "text" && socialProfileTools.length) {
        let generationCallCount = 0;
        const executionActionReporter = RBAC_SECRET_KEY
          ? this.service.socialModuleProfileAiExecutionActionReporterCreate({
              chatId: socialModuleChatId,
              threadId: socialModuleThreadId,
              triggerMessageId: socialModuleMessage.id,
              replySocialProfileId: replyBySocialModuleProfile.id,
              secretKey: RBAC_SECRET_KEY,
            })
          : null;
        socialProfileToolLoopResult =
          await this.service.socialModuleProfileAiToolLoopRun({
            context: generationContext,
            language: requestClassification.language,
            modelCandidateIds: modelSelection.orderedCandidateIds,
            tools: socialProfileTools,
            onEvent: executionActionReporter
              ? (event) => executionActionReporter.handle(event)
              : undefined,
            generate: async (toolGeneration) => {
              generationCallCount += 1;
              await onModelAttempt(toolGeneration.model);

              return this.generateWithBillingLedger({
                billingLedger,
                purpose:
                  generationCallCount === 1 ? "generation" : "tool_iteration",
                openRouter,
                model: toolGeneration.model,
                context: toolGeneration.context,
                max_tokens: OPEN_ROUTER_FINAL_TEXT_MAX_TOKENS,
                reasoning: openRouterReasoning,
                stripNonTextOnRetry: false,
                tools: toolGeneration.tools,
                toolChoice: "auto",
                parallelToolCalls: false,
              });
            },
          });
        selectModelForRequest =
          socialProfileToolLoopResult.selectedModelId ||
          modelSelection.selectedModelId ||
          modelSelection.orderedCandidateIds[0] ||
          null;
        selectedModelIdForBilling = selectModelForRequest;
        generationResult = {
          text: socialProfileToolLoopResult.finalText,
        };
      } else {
        finalGenerationResult = await this.generateFinalOpenRouterReply({
          billingLedger,
          openRouter,
          modelSelection,
          expectedOutputModality,
          generationContext,
          reasoning: openRouterReasoning,
          onModelAttempt,
        });

        selectModelForRequest = finalGenerationResult.selectedModelId;
        selectedModelIdForBilling = finalGenerationResult.selectedModelId;
        generationResult = finalGenerationResult.generationResult;
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
          },
          knowledge: {
            action: this.hasLearnCommand(socialModuleMessage.description)
              ? "learn"
              : "generate",
            profileId: replyBySocialModuleProfile.id,
            triggerMessageId: socialModuleMessage.id,
            useKnowledgeSearch: openRouterKnowledgeContext.useKnowledgeSearch,
            documentIds: openRouterKnowledgeContext.searchDocumentIds,
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
            skills: openRouterKnowledgeContext.promptSkills.map((skill) => {
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
      return persistedRequest;
    }

    return {
      version: 1,
      modelId: "auto",
      reasoning: "auto",
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

    if (relations?.length !== 1 || !relations[0]?.subjectId) {
      throw new Error(
        "Validation error. Reply social.profile must have exactly one linked rbac.subject.",
      );
    }

    const rbacSubject = await this.service.findById({
      id: relations[0].subjectId,
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
    requestedSkillIds: string[];
    reasoning?: IOpenRouterReasoning;
    selectedModelId: string | null;
    threadContext: IOpenRouterRequestMessage[];
  }): Promise<IResolvedOpenRouterKnowledgeContext> {
    const mentionedSkillSlugs = this.getMentionedSkillSlugs(
      props.socialModuleMessage.description || "",
    );
    const availableSkills = await this.findSkillsForProfile({
      socialModuleProfileId: props.replyProfile.id,
      requireRequestedSkillsLinked: false,
    });
    const promptSkills = await this.findPromptSkillsForProfile({
      socialModuleProfileId: props.replyProfile.id,
      skillIds: props.requestedSkillIds,
      skillSlugs: mentionedSkillSlugs,
    });
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

    const useKnowledgeSearch = props.requestedKnowledgeSearch;
    const knowledgeDocumentIds = useKnowledgeSearch
      ? await this.findKnowledgeDocumentIdsForProfile(props.replyProfile.id)
      : [];
    const searchDocumentIds = useKnowledgeSearch ? knowledgeDocumentIds : [];
    const candidateSources =
      useKnowledgeSearch && query
        ? await this.knowledgeService.search({
            query,
            topK: KNOWLEDGE_INITIAL_TOP_K,
            neighborWindow: KNOWLEDGE_NEIGHBOR_WINDOW,
            documentIds: searchDocumentIds,
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
    const sources = knowledgeRerankResult.sources;
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
      knowledgeDocumentIds,
      searchDocumentIds,
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
    const fallbackSources = props.candidateSources.slice(0, props.rerankTopK);

    if (!props.candidateSources.length) {
      return {
        sources: [],
        reason: null,
        fallbackReason: null,
      };
    }

    if (!props.selectedModelId) {
      return {
        sources: fallbackSources,
        reason: null,
        fallbackReason: "no selected model id for knowledge rerank",
      };
    }

    const rerankResponse = await this.generateWithBillingLedger({
      billingLedger: props.billingLedger,
      purpose: "knowledge_rerank",
      openRouter: props.openRouter,
      model: props.selectedModelId,
      max_tokens: 800,
      reasoning: props.reasoning,
      responseFormat: KNOWLEDGE_RERANK_RESPONSE_FORMAT,
      temperature: 0,
      context: this.buildKnowledgeRerankContext({
        candidateSources: props.candidateSources,
        query: props.query,
        rerankTopK: props.rerankTopK,
        threadContext: props.threadContext,
      }),
    });

    if ("error" in rerankResponse) {
      return {
        sources: fallbackSources,
        reason: null,
        fallbackReason: "knowledge rerank generation error",
      };
    }

    const parsed = this.tryParseJsonObject(rerankResponse.text);
    const rawSelectedChunkIds = parsed?.selected_chunk_ids;

    if (!Array.isArray(rawSelectedChunkIds)) {
      return {
        sources: fallbackSources,
        reason: null,
        fallbackReason: "knowledge rerank returned invalid selected_chunk_ids",
      };
    }

    const rerankReason =
      typeof parsed?.reason === "string" ? parsed.reason : null;

    if (!rawSelectedChunkIds.length) {
      return {
        sources: [],
        reason: rerankReason,
        fallbackReason: null,
      };
    }

    const selectedChunkIds = rawSelectedChunkIds
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
    const sourcesById = new Map(
      props.candidateSources.map((source) => [source.id, source]),
    );
    const selectedSources = Array.from(new Set(selectedChunkIds))
      .map((chunkId) => sourcesById.get(chunkId))
      .filter((source): source is KnowledgeSearchResult => Boolean(source))
      .slice(0, props.rerankTopK);

    if (!selectedSources.length) {
      return {
        sources: fallbackSources,
        reason: null,
        fallbackReason: "knowledge rerank returned no valid selected_chunk_ids",
      };
    }

    return {
      sources: selectedSources,
      reason: rerankReason,
      fallbackReason: null,
    };
  }

  private buildKnowledgeRerankContext(props: {
    candidateSources: KnowledgeSearchResult[];
    query: string;
    rerankTopK: number;
    threadContext: IOpenRouterRequestMessage[];
  }): IOpenRouterRequestMessage[] {
    return [
      {
        role: "system",
        content: [
          "You are reranking profile-scoped RAG chunks before answer generation.",
          "Select only chunks that directly help answer the user query.",
          "Prefer chunks that preserve the source meaning and avoid misleading partial context.",
          `Return at most ${props.rerankTopK} chunk ids.`,
          "Return STRICT JSON only.",
        ].join(" "),
      },
      {
        role: "user",
        content: `User query:\n${props.query}`,
      },
      {
        role: "user",
        content: [
          "Recent thread context:",
          this.toKnowledgeRerankThreadContext(props.threadContext),
        ].join("\n"),
      },
      {
        role: "user",
        content: `Candidate chunks JSON:\n${JSON.stringify(
          props.candidateSources.map((source, index) => {
            return {
              order: index + 1,
              id: source.id,
              retrievalRole: source.retrievalRole,
              sourceId: source.sourceId,
              sourceTitle: source.sourceTitle,
              sourceOriginalPath: source.sourceOriginalPath,
              chunkIndex: source.chunkIndex,
              similarity: source.similarity,
              text: source.text,
            };
          }),
        )}`,
      },
    ];
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

  private async findKnowledgeDocumentIdsForProfile(
    socialModuleProfileId: string,
  ) {
    const relations =
      await this.service.socialModule.profilesToKnowledgeModuleDocuments.find({
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
        ?.map((relation: { knowledgeModuleDocumentId?: string }) => {
          return relation.knowledgeModuleDocumentId;
        })
        .filter((documentId: unknown): documentId is string => {
          return typeof documentId === "string" && Boolean(documentId);
        }) || []
    );
  }

  private async ensureProfileKnowledgeDocumentRelation(props: {
    socialModuleProfileId: string;
    knowledgeModuleDocumentId: string;
  }) {
    const existing =
      await this.service.socialModule.profilesToKnowledgeModuleDocuments.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.socialModuleProfileId,
              },
              {
                column: "knowledgeModuleDocumentId",
                method: "eq",
                value: props.knowledgeModuleDocumentId,
              },
            ],
          },
          limit: 1,
        },
      });

    if (existing?.length) {
      return existing[0];
    }

    return this.service.socialModule.profilesToKnowledgeModuleDocuments.create({
      data: {
        profileId: props.socialModuleProfileId,
        knowledgeModuleDocumentId: props.knowledgeModuleDocumentId,
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
    availableSkills: ISocialModuleSkill[];
    knowledgeDocumentIds: string[];
  }): ISocialProfileAiTool[] {
    const tools: ISocialProfileAiTool[] = [];

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

    if (props.knowledgeDocumentIds.length) {
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
              "Search only Knowledge documents linked to this social.profile.",
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
            documentIds: props.knowledgeDocumentIds,
            topK: KNOWLEDGE_RERANK_TOP_K,
            neighborWindow: KNOWLEDGE_NEIGHBOR_WINDOW,
          });

          return sources.map((source) => ({
            id: source.id,
            sourceId: source.sourceId,
            sourceTitle: source.sourceTitle,
            text: source.text,
            similarity: source.similarity,
          }));
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
              `Path: ${source.sourceOriginalPath || "unknown"}`,
              `Similarity: ${this.formatKnowledgeSimilarity(source.similarity)}`,
              `Retrieval role: ${source.retrievalRole}`,
              source.text,
            ].join("\n");
          })
          .join("\n\n---\n\n")
      : "No indexed knowledge fragments matched the query.";

    return [
      "Use the following profile-scoped knowledge fragments for factual grounding.",
      "If the fragments do not support a claim, say that the indexed sources do not contain it.",
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
    const contentItems = await this.collectLearnContentItems({
      socialModuleMessage: props.socialModuleMessage,
    });

    if (!contentItems.length) {
      throw new Error(
        "Validation error. /learn requires message text or .txt/.md/.markdown attachments.",
      );
    }

    const learned: Awaited<ReturnType<KnowledgeService["learnContent"]>>[] = [];

    for (const [index, item] of contentItems.entries()) {
      const content = this.toLearnText(item.content).trim();

      if (!content) {
        continue;
      }

      const contentHash = this.sha256(content);
      const slug = this.toSlug(
        [
          "knowledge",
          props.replyProfile.id,
          props.socialModuleMessage.id,
          item.fileId || "message",
          contentHash.slice(0, 16),
        ].join("-"),
      );
      const entry = await this.knowledgeService.learnContent({
        slug,
        title: this.toLearnText(item.title),
        content,
        summary: "Content learned from social chat message",
        metadata: {
          sourceKind: "chat-message",
          sourceSystem: "social-chat-learn",
          assistantSocialModuleProfileId: props.replyProfile.id,
          socialModuleChatId: props.socialModuleChatId,
          socialModuleThreadId: props.socialModuleThreadId,
          socialModuleMessageId: props.socialModuleMessage.id,
          fileId: item.fileId || null,
          fileName: this.toLearnText(item.fileName) || null,
          filePath: this.toLearnText(item.filePath) || null,
          contentHash,
          sourceSocialModuleProfileId: props.sourceSocialModuleProfileId,
          triggerMessageId: props.socialModuleMessage.id,
          learnItemIndex: index,
        },
      });

      learned.push(entry);
      await this.ensureProfileKnowledgeDocumentRelation({
        socialModuleProfileId: props.replyProfile.id,
        knowledgeModuleDocumentId: entry.document.id,
      });
    }

    const content =
      learned.length === 1
        ? "Learned 1 knowledge item."
        : `Learned ${learned.length} knowledge items.`;

    return api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
      {
        id: props.replyByRbacSubjectId,
        socialModuleProfileId: props.replyProfile.id,
        socialModuleChatId: props.socialModuleChatId,
        socialModuleThreadId: props.socialModuleThreadId,
        data: {
          description: content,
          interaction: {
            role: "assistant",
            content,
          },
          metadata: {
            knowledge: {
              action: "learn",
              profileId: props.replyProfile.id,
              triggerMessageId: props.socialModuleMessage.id,
              documents: learned.map((entry) => {
                return {
                  id: entry.document.id,
                  slug: entry.document.slug,
                  title: entry.document.title,
                };
              }),
              indexes: learned.map((entry) => entry.index),
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

  private async collectLearnContentItems(props: {
    socialModuleMessage: ISocialModuleMessage;
  }): Promise<ILearnContentItem[]> {
    const items: ILearnContentItem[] = [];
    const strippedMessage = this.stripLearnPrefix(
      props.socialModuleMessage.description || "",
    );

    if (strippedMessage) {
      items.push({
        content: this.toLearnText(strippedMessage),
        title: this.toTitle(strippedMessage),
      });
    }

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
          orderBy: {
            and: [
              {
                column: "orderIndex",
                method: "asc",
              },
            ],
          },
        },
      });
    const fileIds =
      relations
        ?.map((relation) => relation.fileStorageModuleFileId)
        .filter((fileId): fileId is string => Boolean(fileId)) || [];

    if (!fileIds.length) {
      return items;
    }

    const files = await this.service.fileStorageModule.file.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: fileIds,
            },
          ],
        },
      },
    });

    for (const file of files || []) {
      if (!this.isSupportedLearnAttachment(file)) {
        continue;
      }

      const content = this.toLearnText(
        await this.readFileStorageModuleFile(file),
      );
      const filePath = this.toLearnText(file.file);
      const fileName =
        this.toLearnText(file.adminTitle) || basename(filePath) || "Attachment";

      if (!content.trim()) {
        continue;
      }

      items.push({
        content,
        title: fileName,
        fileId: file.id,
        fileName,
        filePath,
      });
    }

    return items;
  }

  private resolveManualOpenRouterModel(props: {
    models: IOpenRouterModel[];
    modelId: string;
    requiredInputModalitiesList: TInputModality[];
    expectedOutputModality?: TOutputModality;
  }) {
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

  private isSupportedLearnAttachment(file: IFileStorageModuleFile) {
    const filePath = this.toLearnText(file.file);
    const extension = (
      this.toLearnText(file.extension) ||
      extname(filePath.split("?")[0]).replace(".", "")
    ).toLowerCase();

    return ["txt", "md", "markdown"].includes(extension);
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

  private async readFileStorageModuleFile(file: IFileStorageModuleFile) {
    const source = this.toLearnText(file.file);

    if (!source) {
      throw new Error("Validation error. File-storage path is required");
    }

    if (/^https?:\/\//i.test(source)) {
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(
          `Knowledge attachment download failed with status ${response.status}`,
        );
      }

      return response.text();
    }

    const relativePath = normalize(source.replace(/^\/+/, ""));

    if (!relativePath || relativePath.startsWith("..")) {
      throw new Error("Validation error. Invalid file-storage path");
    }

    const candidates = [
      join(process.cwd(), "public", relativePath),
      join(process.cwd(), "apps/api/public", relativePath),
    ];
    let lastError: unknown;

    for (const candidate of candidates) {
      try {
        return await readFile(candidate, "utf8");
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `Text attachment could not be read from file-storage: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
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
  }): Promise<IResolvedOpenRouterMessageContext> {
    const messageText = props.messageDescription.trim();
    const contentTextParts = [messageText].filter(Boolean);
    const routingTextParts = [messageText].filter(Boolean);
    const mediaParts: IOpenRouterMessageContent[] = [];

    for (const fileStorageFile of props.fileStorageFiles) {
      if (this.isAudioFileStorageFile(fileStorageFile)) {
        continue;
      }

      const source = this.toLearnText(fileStorageFile.file);
      const fileName = basename(source.split("?")[0]) || "attachment";
      const fileUrl = /^https?:\/\//i.test(source)
        ? source
        : `${NEXT_PUBLIC_API_SERVICE_URL}/public${source}`;

      if (this.isTextFileStorageFile(fileStorageFile)) {
        const attachmentText = (
          await this.readFileStorageModuleFile(fileStorageFile)
        ).trim();

        if (attachmentText) {
          routingTextParts.push(
            [`Text attachment (${fileName}):`, attachmentText].join("\n"),
          );
        }
      }

      if (fileStorageFile.mimeType?.includes("image")) {
        contentTextParts.push(`Attached image: ${fileName}`);
        routingTextParts.push(`Attached image: ${fileName}`);
        mediaParts.push({
          type: "image_url",
          image_url: {
            url: fileUrl,
          },
        });
        continue;
      }

      contentTextParts.push(`Attached file: ${fileName}`);
      if (!this.isTextFileStorageFile(fileStorageFile)) {
        routingTextParts.push(`Attached file: ${fileName}`);
      }
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
          `Answer in ${props.language} language.`,
          "Use portable Markdown only.",
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

      if (messageDescription.startsWith(prefix)) {
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

    if (filteredCandidates.length) {
      return filteredCandidates;
    }

    return enabledCandidates;
  }

  protected buildModelSelectionResponseFormat(candidateIds: string[]) {
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

  protected async selectModelCandidatesForRequest(props: {
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

  protected async parseAndNormalizeModelSelection(props: {
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

  protected async classifyRequest(props: {
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

  protected getHeuristicClassification(props: {
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

  protected async parseAndNormalizeClassification(props: {
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

  protected normalizeClassificationPayload(props: {
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

  protected tryParseJsonObject(value: string): Record<string, unknown> | null {
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
