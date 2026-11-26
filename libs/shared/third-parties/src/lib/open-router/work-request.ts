import { z } from "zod";
import Decimal from "decimal.js";
import type {
  IOpenRouterRequestMessage,
  IOpenRouterResponseFormat,
} from "./index";
import {
  readWorkResponse,
  workResponsesBody,
  workResponsesInput,
  type TWorkResponseState,
} from "../open-ai/work-responses";
import type { IOpenRouterTool, IOpenRouterToolCall } from "./interface";
import {
  ProviderRejected,
  WorkInputFileRejected,
  rejectedWorkFile,
  workInputFiles,
  workInputPart,
  workFileInputTokens,
  type TWorkInputFile,
  type IWorkInputFile,
} from "./work-input-files";
export { ProviderRejected, WorkInputFileRejected, type IWorkInputFile };
import {
  ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS,
  OPEN_AI_STAGE_TEXT_DEFAULT,
  OPEN_AI_WORK_MODELS,
  type TProviderReasoningEffort,
} from "@sps/shared-utils";

export interface IWorkMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
export interface IWorkCartSelection {
  offerId: string;
  currencyId: string;
  quantity: number;
}
export interface IWorkRequest {
  provider: "openrouter" | "openai";
  model: string;
  messages: IWorkMessage[];
  tools?: IOpenRouterTool[];
  toolHistory?: IOpenRouterRequestMessage[];
  responseStates?: Record<string, TWorkResponseState>;
  /** One normalized JPEG for the latest user question. */
  replyImage?: Uint8Array;
  inputFiles?: IWorkInputFile[];
  capability: "text" | "compression" | "decision";
  reasoning?: TProviderReasoningEffort;
  actions?: Array<{ id: string; instruction: string }>;
  cartOffers?: Array<{ offerId: string; prices: { currencyId: string }[] }>;
  artifact?: "pdf";
  clientRequestId?: string;
  stageClarification?: string;
  stageAccepted?: string;
  maxOutputTokens: number;
  maxInputTokens?: number;
  maxCostUsd?: string;
  inputUsdPerMillion: string;
  inputAudioUsdPerMillion?: string;
  cachedInputUsdPerMillion?: string;
  cacheWriteUsdPerMillion?: string;
  outputUsdPerMillion: string;
}
export interface ICompletedWork {
  providerRequestId: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    usd: string;
    basis: "provider" | "rate-card";
  };
  text: string;
  actionId?: string;
  cartSelection?: IWorkCartSelection;
  artifactText?: string;
  toolCalls?: IOpenRouterToolCall[];
  responseState?: TWorkResponseState;
}
const usageSchema = z.object({
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  prompt_tokens_details: z
    .object({
      cached_tokens: z.number().int().nonnegative().optional(),
      cache_write_tokens: z.number().int().nonnegative().optional(),
      audio_tokens: z.number().int().nonnegative().optional(),
    })
    .nullish(),
  cost: z.number().finite().nonnegative().optional(),
});
const completionSchema = z.object({
  id: z.string().min(1).max(300),
  choices: z
    .array(
      z.object({
        message: z
          .object({
            content: z.string().nullish(),
            tool_calls: z
              .array(
                z.object({
                  id: z.string().min(1).max(150),
                  type: z.literal("function"),
                  function: z.object({
                    name: z.string().min(1).max(128),
                    arguments: z.string(),
                  }),
                }),
              )
              .optional(),
          })
          .refine(
            (message) =>
              message.content !== undefined ||
              Boolean(message.tool_calls?.length),
          ),
      }),
    )
    .min(1),
  usage: usageSchema,
});
export class ProviderOutcomeUnknown extends Error {
  constructor(readonly requestId?: string) {
    super("Provider outcome requires reconciliation");
  }
}
const Price = Decimal.clone({ precision: 56 });

export function supportsStrictStageDecision(
  request: Pick<IWorkRequest, "provider" | "model">,
) {
  return (
    request.provider === "openai" &&
    (request.model === OPEN_AI_STAGE_TEXT_DEFAULT.modelId ||
      /^gpt-(?:4\.1|4o|5)(?:[.-]|$)/.test(request.model))
  );
}

const stageDecision = z
  .object({
    decision: z.discriminatedUnion("kind", [
      z
        .object({
          kind: z.literal("advance"),
          actionId: z.string(),
          reply: z.string(),
        })
        .strict(),
      z
        .object({
          kind: z.literal("clarify"),
          clarification: z.string().trim().max(4000),
        })
        .strict(),
    ]),
  })
  .strict();

function stageDecisionFormat(
  actions: NonNullable<IWorkRequest["actions"]>,
): IOpenRouterResponseFormat {
  return {
    type: "json_schema",
    json_schema: {
      name: "crm_stage_decision",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["decision"],
        properties: {
          decision: {
            anyOf: [
              {
                type: "object",
                additionalProperties: false,
                required: ["kind", "actionId", "reply"],
                properties: {
                  kind: { type: "string", enum: ["advance"] },
                  actionId: {
                    type: "string",
                    enum: actions.map(({ id }) => id),
                  },
                  reply: { type: "string" },
                },
              },
              {
                type: "object",
                additionalProperties: false,
                required: ["kind", "clarification"],
                properties: {
                  kind: { type: "string", enum: ["clarify"] },
                  clarification: { type: "string" },
                },
              },
            ],
          },
        },
      },
    },
  };
}

export function supportsWorkReplyImage(
  request: Pick<IWorkRequest, "provider" | "model">,
) {
  return OPEN_AI_WORK_MODELS.text.some(
    (model) =>
      request.model ===
      (request.provider === "openrouter" ? `openai/${model}` : model),
  );
}

function replyImageInputTokens(request: IWorkRequest) {
  if (!request.replyImage) {
    return 0;
  }
  if (
    request.capability !== "text" ||
    !supportsWorkReplyImage(request) ||
    !request.replyImage.byteLength ||
    request.replyImage.byteLength > 512 * 1024 ||
    request.messages.at(-1)?.role !== "user"
  ) {
    throw new Error("Validation error. Invalid text reply image");
  }
  // The same conservative ceiling used for normalized 512px low-detail vision work.
  return 4096;
}

function estimatedUsd(request: IWorkRequest, input: number, hasAudio: boolean) {
  return Price.max(
    request.inputUsdPerMillion,
    request.cachedInputUsdPerMillion ?? "0",
    request.cacheWriteUsdPerMillion ?? "0",
    hasAudio ? (request.inputAudioUsdPerMillion ?? "0") : "0",
  )
    .times(input)
    .plus(new Price(request.outputUsdPerMillion).times(request.maxOutputTokens))
    .div(1_000_000);
}

function workResponseFormat(
  request: IWorkRequest,
): IOpenRouterResponseFormat | undefined {
  const strictStage =
    request.stageClarification &&
    request.actions?.length &&
    supportsStrictStageDecision(request) &&
    !request.cartOffers?.length &&
    !request.artifact;
  if (strictStage && request.actions) {
    return stageDecisionFormat(request.actions);
  }
  if (
    request.capability === "decision" ||
    request.actions?.length ||
    request.artifact ||
    request.cartOffers?.length
  ) {
    return { type: "json_object" };
  }
  return undefined;
}

function workMessages(request: IWorkRequest, files: TWorkInputFile[]) {
  let messages: IOpenRouterRequestMessage[] = request.messages;
  if (request.replyImage && !files.length) {
    replyImageInputTokens(request);
    const last = request.messages.at(-1)!;
    messages = [
      ...request.messages.slice(0, -1),
      {
        role: last.role,
        content: [
          { type: "text", text: last.content },
          {
            type: "image_url",
            image_url: {
              detail: "low",
              url: `data:image/jpeg;base64,${Buffer.from(request.replyImage).toString("base64")}`,
            },
          },
        ],
      },
    ];
  }
  if (files.length) {
    const lastUser = request.messages
      .map(({ role }) => role)
      .lastIndexOf("user");
    const message: IOpenRouterRequestMessage = {
      role: "user",
      content: [
        { type: "text", text: request.messages[lastUser]?.content ?? "" },
        ...files.map((file) => workInputPart(file, request.provider)),
      ],
    };
    messages = [...messages];
    if (lastUser >= 0) {
      messages[lastUser] = message;
    } else {
      messages.push(message);
    }
  }
  return messages;
}

export function estimateWork(request: IWorkRequest) {
  // UTF-8 bytes upper-bound tokens for supported byte-based text tokenizers.
  // Include delimiters and roles, and run the same calculation after composing knowledge.
  let input =
    128 +
    replyImageInputTokens(request) +
    (request.responseStates
      ? Buffer.byteLength(JSON.stringify(request.responseStates))
      : 0) +
    (request.tools?.length
      ? Buffer.byteLength(JSON.stringify(request.tools))
      : 0) +
    (request.toolHistory?.length
      ? Buffer.byteLength(JSON.stringify(request.toolHistory))
      : 0) +
    request.messages.reduce(
      (sum, message) => sum + 64 + Buffer.byteLength(message.content, "utf8"),
      0,
    );
  let reserveInputLimit = false;
  const files = workInputFiles(request);
  for (const file of files) {
    input += Buffer.byteLength(file.name) + 64;
    const tokens = workFileInputTokens(request, file);
    if (tokens !== undefined) {
      input += tokens;
    } else {
      // A compressed document, recording or model-specific image encoding has
      // no reliable token count from the length of its transport bytes.
      if (!request.maxInputTokens || request.maxCostUsd === undefined) {
        throw new WorkInputFileRejected(request.model, file.name);
      }
      reserveInputLimit = true;
    }
  }
  if (reserveInputLimit) {
    input = Math.max(input, request.maxInputTokens!);
  }
  let usd = estimatedUsd(
    request,
    input,
    files.some(({ kind }) => kind === "audio"),
  );
  if (reserveInputLimit) {
    usd = Price.max(usd, request.maxCostUsd!);
  }
  return { input, usd };
}

export async function estimateWorkWithFiles(
  request: IWorkRequest,
  secret: string,
  network: (url: string, init: RequestInit) => Promise<Response> = fetch,
) {
  const files = workInputFiles(request);
  const needsCounting =
    request.provider === "openai" &&
    files.some(
      (file) =>
        file.kind !== "audio" &&
        workFileInputTokens(request, file) === undefined,
    );
  if (!needsCounting) {
    return estimateWork(request);
  }
  const body = workResponsesInput(
    request,
    workResponseFormat(request),
    workMessages(request, files),
  );
  const response = await network(
    "https://api.openai.com/v1/responses/input_tokens",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if ([400, 404, 413, 415, 422].includes(response.status)) {
      const rejected = rejectedWorkFile(
        request.model,
        files,
        response.status,
        payload,
      );
      if (rejected) {
        throw rejected;
      }
    }
    throw new Error("Provider input token count unavailable before generation");
  }
  const count = z
    .object({
      object: z.literal("response.input_tokens"),
      input_tokens: z.number().int().positive(),
    })
    .safeParse(payload);
  if (!count.success) {
    throw new Error("Provider input token count unavailable before generation");
  }
  return {
    input: count.data.input_tokens,
    usd: estimatedUsd(
      request,
      count.data.input_tokens,
      files.some(({ kind }) => kind === "audio"),
    ),
  };
}

export async function sendWork(
  request: IWorkRequest,
  secret: string,
  network: (
    input: Parameters<typeof fetch>[0],
    init?: RequestInit,
  ) => Promise<Response> = fetch,
): Promise<ICompletedWork> {
  const router = request.provider === "openrouter";
  const files = workInputFiles(request);
  const responses =
    !router &&
    Boolean(
      request.tools?.length ||
      request.toolHistory?.length ||
      files.some(({ kind }) => kind !== "audio"),
    );
  const url = router
    ? "https://openrouter.ai/api/v1/chat/completions"
    : responses
      ? "https://api.openai.com/v1/responses"
      : "https://api.openai.com/v1/chat/completions";
  const control = router
    ? {
        max_tokens: request.maxOutputTokens,
        provider: {
          allow_fallbacks: false,
          require_parameters: true,
          max_price: {
            prompt: Number(request.inputUsdPerMillion),
            completion: Number(request.outputUsdPerMillion),
          },
        },
      }
    : {
        max_completion_tokens: request.maxOutputTokens,
        service_tier: "default",
        store: false,
      };
  const responseFormat = workResponseFormat(request);
  const strictStage = responseFormat?.type === "json_schema";
  let reasoning;
  if (request.capability === "text" && request.reasoning) {
    reasoning = router
      ? { reasoning: { effort: request.reasoning } }
      : { reasoning_effort: request.reasoning };
  }
  const messages = workMessages(request, files);
  const body = {
    model: request.model,
    messages: request.toolHistory?.length
      ? [...messages, ...request.toolHistory]
      : messages,
    stream: false,
    ...control,
    ...reasoning,
    ...(router &&
      files.some(({ kind }) => kind === "file") && {
        plugins: [{ id: "file-parser", pdf: { engine: "native" } }],
      }),
    ...(request.tools?.length
      ? {
          tools: request.tools,
          tool_choice: "auto",
          parallel_tool_calls: false,
        }
      : responseFormat && { response_format: responseFormat }),
  };
  const response = await network(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(request.clientRequestId
        ? { "X-Client-Request-Id": request.clientRequestId }
        : {}),
    },
    body: JSON.stringify(
      responses ? workResponsesBody(request, responseFormat, messages) : body,
    ),
    redirect: "error",
    signal: AbortSignal.timeout(90_000),
  });
  if ([400, 404, 413, 415, 422].includes(response.status) && files.length) {
    const payload = await response.json().catch(() => null);
    const unsupported = rejectedWorkFile(
      request.model,
      files,
      response.status,
      payload,
    );
    if (unsupported) {
      throw unsupported;
    }
  }
  if ([400, 401, 403, 404, 413, 415, 422, 429].includes(response.status)) {
    throw new ProviderRejected(
      "Provider declined the request before generation",
    );
  }
  const payload = await response.json().catch(() => null);
  const completionId = z
    .object({ id: z.string().min(1).max(300) })
    .safeParse(payload).data?.id;
  const requestId = router
    ? completionId
    : (z
        .string()
        .regex(/^[\w.:-]{1,300}$/)
        .safeParse(response.headers.get("x-request-id")).data ?? completionId);
  if (!response.ok) throw new ProviderOutcomeUnknown(requestId);
  const native = responses ? readWorkResponse(payload) : undefined;
  const parsed = completionSchema.safeParse(
    responses ? native?.completion : payload,
  );
  if (!parsed.success || (router && parsed.data.usage.cost === undefined))
    throw new ProviderOutcomeUnknown(requestId);
  const { usage, choices, id } = parsed.data;
  let usd: Decimal;
  if (router) {
    usd = new Price(usage.cost!);
  } else {
    const cached = usage.prompt_tokens_details?.cached_tokens ?? 0;
    const written = usage.prompt_tokens_details?.cache_write_tokens ?? 0;
    const audio = usage.prompt_tokens_details?.audio_tokens ?? 0;
    if (
      (audio && !request.inputAudioUsdPerMillion) ||
      (audio && (cached || written)) ||
      (files.some(({ kind }) => kind === "audio") &&
        usage.prompt_tokens_details?.audio_tokens === undefined)
    ) {
      throw new ProviderOutcomeUnknown(requestId);
    }
    const uncached = usage.prompt_tokens - cached - written - audio;
    if (uncached < 0) throw new ProviderOutcomeUnknown(requestId);
    usd = new Price(uncached)
      .times(request.inputUsdPerMillion)
      .plus(new Price(audio).times(request.inputAudioUsdPerMillion ?? "0"))
      .plus(
        new Price(cached).times(
          request.cachedInputUsdPerMillion ?? request.inputUsdPerMillion,
        ),
      )
      .plus(
        new Price(written).times(
          request.cacheWriteUsdPerMillion ?? request.inputUsdPerMillion,
        ),
      )
      .plus(
        new Price(usage.completion_tokens).times(request.outputUsdPerMillion),
      )
      .div(1_000_000);
  }
  let text = choices[0].message.content ?? "";
  let actionId: string | undefined;
  let cartSelection: IWorkCartSelection | undefined;
  let artifactText: string | undefined;
  if (
    request.actions?.length ||
    request.artifact ||
    request.cartOffers?.length
  ) {
    // The model may suggest only a stage action backed by model-result evidence.
    // An invalid suggestion never grants permission or changes the task.
    let candidate: unknown;
    try {
      candidate = JSON.parse(text);
    } catch {
      candidate = null;
    }
    if (strictStage) {
      const parsedDecision = stageDecision.safeParse(candidate);
      const decision = parsedDecision.data?.decision;
      if (decision?.kind === "advance") {
        candidate = { actionId: decision.actionId, reply: decision.reply };
      } else {
        candidate = {
          reply: "",
          clarification: decision?.clarification,
        };
      }
    }
    const replySchema = z.object({
      reply: z.string(),
      clarification: z.string().trim().max(4000).nullish(),
      actionId: z.string().nullable().optional(),
      cartSelection: z.unknown().optional(),
    });
    const pdfSchema = replySchema.extend({
      artifactText: z
        .string()
        .trim()
        .min(10)
        .max(250_000)
        .nullable()
        .optional(),
    });
    const answer = (request.artifact ? pdfSchema : replySchema).safeParse(
      candidate,
    );
    if (answer.success) {
      text = answer.data.reply;
      if (request.cartOffers?.length && answer.data.cartSelection != null) {
        const selection = z
          .object({
            offerId: z.uuid(),
            currencyId: z.uuid(),
            quantity: z
              .number()
              .int()
              .min(ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS.min)
              .max(ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS.max),
          })
          .strict()
          .safeParse(answer.data.cartSelection);
        if (
          selection.success &&
          request.cartOffers.some(
            (offer) =>
              offer.offerId === selection.data.offerId &&
              offer.prices.some(
                (price) => price.currencyId === selection.data.currencyId,
              ),
          )
        )
          cartSelection = selection.data;
      } else {
        actionId = request.actions?.find(
          (action) => action.id === answer.data.actionId,
        )?.id;
      }
      if (
        request.artifact &&
        "artifactText" in answer.data &&
        typeof answer.data.artifactText === "string"
      ) {
        artifactText = answer.data.artifactText;
      }
      if (
        request.stageClarification &&
        !actionId &&
        !cartSelection &&
        !artifactText
      ) {
        text = answer.data.clarification || request.stageClarification;
      }
      if (actionId && !text.trim() && request.stageAccepted) {
        text = request.stageAccepted;
      }
    } else {
      text = "";
    }
  }
  return {
    providerRequestId: requestId ?? id,
    ...(native?.state && { responseState: native.state }),
    text,
    actionId,
    ...(request.tools?.length &&
      choices[0].message.tool_calls?.length && {
        toolCalls: choices[0].message.tool_calls,
      }),
    ...(cartSelection ? { cartSelection } : {}),
    ...(artifactText ? { artifactText } : {}),
    usage: {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      usd: usd.toFixed(),
      basis: router ? "provider" : "rate-card",
    },
  };
}

// The generation endpoint returns usage and cost. It does not return the original answer.
export async function readWorkUsage(
  id: string,
  secret: string,
  network: typeof fetch = fetch,
) {
  const url = new URL("https://openrouter.ai/api/v1/generation");
  url.searchParams.set("id", id);
  const response = await network(url, {
    headers: { Authorization: `Bearer ${secret}` },
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return null;
  const data = z
    .object({
      data: z.object({
        id: z.string(),
        total_cost: z.number().finite().nonnegative(),
        native_tokens_prompt: z.number().int().nonnegative(),
        native_tokens_completion: z.number().int().nonnegative(),
      }),
    })
    .safeParse(await response.json());
  if (!data.success || data.data.data.id !== id) return null;
  const usage = data.data.data;
  return {
    inputTokens: usage.native_tokens_prompt,
    outputTokens: usage.native_tokens_completion,
    usd: new Price(usage.total_cost).toFixed(),
    basis: "provider" as const,
  };
}
