import { z } from "zod";
import Decimal from "decimal.js";
import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS } from "@sps/shared-utils";

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
  actions?: Array<{ id: string; instruction: string }>;
  cartOffers?: Array<{ offerId: string; prices: { currencyId: string }[] }>;
  artifact?: "pdf";
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
    : { max_completion_tokens: request.maxOutputTokens };
  const body = {
    model: request.model,
    messages: request.messages,
    stream: false,
    ...control,
    ...(request.capability === "decision" ||
    request.actions?.length ||
    request.artifact ||
    request.cartOffers?.length
      ? { response_format: { type: "json_object" } }
      : {}),
  };
  const response = await network(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
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
  const requestId = z
    .object({ id: z.string().min(1).max(300) })
    .safeParse(payload).data?.id;
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
    const replySchema = z.object({
      reply: z.string(),
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
    } else {
      text = "";
    }
  }
  return {
    providerRequestId: id,
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
