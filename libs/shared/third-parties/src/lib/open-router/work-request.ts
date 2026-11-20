import { z } from "zod";
import Decimal from "decimal.js";
import {
  ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS,
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
  capability: "text" | "compression" | "decision";
  reasoning?: TProviderReasoningEffort;
  actions?: Array<{ id: string; instruction: string }>;
  cartOffers?: Array<{ offerId: string; prices: { currencyId: string }[] }>;
  artifact?: "pdf";
  clientRequestId?: string;
  stageClarification?: string;
  stageAccepted?: string;
  maxOutputTokens: number;
  inputUsdPerMillion: string;
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
}
const usageSchema = z.object({
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  cost: z.number().finite().nonnegative().optional(),
});
const completionSchema = z.object({
  id: z.string().min(1).max(300),
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable() }) }))
    .min(1),
  usage: usageSchema,
});
export class ProviderRejected extends Error {}
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
    /^gpt-(?:4\.1|4o|5)(?:[.-]|$)/.test(request.model)
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

function stageDecisionFormat(actions: NonNullable<IWorkRequest["actions"]>) {
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

export function estimateWork(request: IWorkRequest) {
  // UTF-8 bytes upper-bound tokens for supported byte-based text tokenizers.
  // Include delimiters and roles, and run the same calculation after composing knowledge.
  const input =
    128 +
    request.messages.reduce(
      (sum, message) => sum + 64 + Buffer.byteLength(message.content, "utf8"),
      0,
    );
  const usd = new Price(request.inputUsdPerMillion)
    .times(input)
    .plus(new Price(request.outputUsdPerMillion).times(request.maxOutputTokens))
    .div(1_000_000);
  return { input, usd };
}

export async function sendWork(
  request: IWorkRequest,
  secret: string,
  network: typeof fetch = fetch,
): Promise<ICompletedWork> {
  const router = request.provider === "openrouter";
  const url = router
    ? "https://openrouter.ai/api/v1/chat/completions"
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
  const strictStage =
    request.stageClarification &&
    request.actions?.length &&
    supportsStrictStageDecision(request) &&
    !request.cartOffers?.length &&
    !request.artifact;
  let responseFormat;
  if (strictStage && request.actions) {
    responseFormat = stageDecisionFormat(request.actions);
  } else if (
    request.capability === "decision" ||
    request.actions?.length ||
    request.artifact ||
    request.cartOffers?.length
  ) {
    responseFormat = { type: "json_object" };
  }
  let reasoning;
  if (request.capability === "text" && request.reasoning) {
    reasoning = router
      ? { reasoning: { effort: request.reasoning } }
      : { reasoning_effort: request.reasoning };
  }
  const body = {
    model: request.model,
    messages: request.messages,
    stream: false,
    ...control,
    ...reasoning,
    ...(responseFormat ? { response_format: responseFormat } : {}),
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
    body: JSON.stringify(body),
    redirect: "error",
    signal: AbortSignal.timeout(90_000),
  });
  if ([400, 401, 403, 404, 413, 422, 429].includes(response.status))
    throw new ProviderRejected(
      "Provider declined the request before generation",
    );
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
  const parsed = completionSchema.safeParse(payload);
  if (!parsed.success || (router && parsed.data.usage.cost === undefined))
    throw new ProviderOutcomeUnknown(requestId);
  const { usage, choices, id } = parsed.data;
  const usd = router
    ? new Price(usage.cost!)
    : new Price(usage.prompt_tokens)
        .times(request.inputUsdPerMillion)
        .plus(
          new Price(usage.completion_tokens).times(request.outputUsdPerMillion),
        )
        .div(1_000_000);
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
    text,
    actionId,
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
