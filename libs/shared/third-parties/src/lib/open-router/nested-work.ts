import Decimal from "decimal.js";
import { z } from "zod";
import {
  ProviderOutcomeUnknown,
  ProviderRejected,
  type ICompletedWork,
} from "./work-request";

interface IBoundRequest {
  provider: "openrouter" | "openai";
  model: string;
  maxOutputTokens: number;
  inputUsdPerMillion: string;
  outputUsdPerMillion: string;
}

export interface IEmbeddingWork extends IBoundRequest {
  capability: "embedding";
  inputs: string[];
  dimensions: number;
}

export interface IVisionWork extends IBoundRequest {
  capability: "vision";
  prompt: string;
  image: Uint8Array;
}

export interface ITranscriptionWork extends IBoundRequest {
  capability: "transcription";
  audio: Uint8Array;
  seconds: number;
}

export type TNestedWorkRequest =
  IEmbeddingWork | IVisionWork | ITranscriptionWork;
export interface INestedWorkResult extends ICompletedWork {
  embeddings?: { dimensions: number; values: number[][] };
}

const money = Decimal.clone({ precision: 56 });
const textModels = new Set([
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
]);
const embeddingModels = new Set([
  "text-embedding-3-small",
  "text-embedding-3-large",
]);
const count = z.number().int().nonnegative();
const cost = z.number().finite().nonnegative().optional();
const completion = z.object({
  id: z.string().trim().min(1).max(300),
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable() }) }))
    .min(1),
  usage: z.object({ prompt_tokens: count, completion_tokens: count, cost }),
});
const vectors = z.object({
  id: z.string().trim().min(1).max(300).optional(),
  data: z.array(
    z.object({ index: count, embedding: z.array(z.number().finite()) }),
  ),
  usage: z.object({ prompt_tokens: count, cost }),
});
const transcript = z.object({
  text: z.string(),
  usage: z.object({
    type: z.literal("tokens"),
    input_tokens: count,
    output_tokens: count,
  }),
});

export function supportsNestedWork(
  provider: IBoundRequest["provider"],
  model: string,
  capability: "decision" | "compression" | TNestedWorkRequest["capability"],
) {
  if (capability === "transcription") {
    return provider === "openai" && model === "gpt-transcribe";
  }
  if (provider === "openrouter" && !model.startsWith("openai/")) {
    return false;
  }
  const nativeModel =
    provider === "openrouter" ? model.slice("openai/".length) : model;
  return capability === "embedding"
    ? embeddingModels.has(nativeModel)
    : textModels.has(nativeModel);
}

function price(input: number, output: number, request: IBoundRequest) {
  return new money(request.inputUsdPerMillion)
    .times(input)
    .plus(new money(request.outputUsdPerMillion).times(output))
    .div(1_000_000);
}

export function estimateNestedWork(request: TNestedWorkRequest) {
  if (
    !supportsNestedWork(request.provider, request.model, request.capability)
  ) {
    throw new Error(
      "Validation error. The provider model does not support this operation",
    );
  }
  switch (request.capability) {
    case "embedding": {
      if (
        request.dimensions !== 768 ||
        !request.inputs.length ||
        request.inputs.length > 12 ||
        request.inputs.some(
          (text) => !text.trim() || Buffer.byteLength(text) > 6000,
        )
      ) {
        throw new Error(
          "Validation error. Invalid embedding dimensions or input size",
        );
      }
      const input = request.inputs.reduce(
        (total, text) => total + 64 + Buffer.byteLength(text),
        128,
      );
      return { input, usd: price(input, 0, request) };
    }
    case "vision": {
      if (!request.image.length || request.image.length > 512 * 1024) {
        throw new Error("Validation error. Invalid prepared vision image");
      }
      // One normalized 512px image and low detail, with a conservative token ceiling for supported models.
      const input = 2048 + Buffer.byteLength(request.prompt);
      return { input, usd: price(input, request.maxOutputTokens, request) };
    }
    case "transcription": {
      if (
        !request.audio.length ||
        request.seconds <= 0 ||
        request.seconds > 20 ||
        request.maxOutputTokens < 1024
      ) {
        throw new Error(
          "Validation error. Paid transcription needs a bounded WAV clip and output allowance",
        );
      }
      // The synchronous transcription endpoint exposes no output limit. Keep
      // clips short and reserve the full supported ceiling for that input.
      const input = 512 + Math.ceil(request.seconds * 100);
      return { input, usd: price(input, 1024, request) };
    }
  }
}

export async function sendNestedWork(
  request: TNestedWorkRequest,
  secret: string,
  network: typeof fetch = fetch,
): Promise<INestedWorkResult> {
  estimateNestedWork(request);
  const router = request.provider === "openrouter";
  const base = router
    ? "https://openrouter.ai/api/v1"
    : "https://api.openai.com/v1";
  const provider = {
    allow_fallbacks: false,
    require_parameters: true,
    max_price: {
      prompt: Number(request.inputUsdPerMillion),
      completion: Number(request.outputUsdPerMillion),
    },
  };
  const headers = new Headers({ Authorization: `Bearer ${secret}` });
  let body: BodyInit;
  let route: string;
  switch (request.capability) {
    case "embedding":
      route = "/embeddings";
      body = JSON.stringify({
        model: request.model,
        input: request.inputs,
        dimensions: request.dimensions,
        encoding_format: "float",
        ...(router ? { provider } : {}),
      });
      break;
    case "vision":
      route = "/chat/completions";
      body = JSON.stringify({
        model: request.model,
        stream: false,
        ...(router
          ? { provider, max_tokens: request.maxOutputTokens }
          : { max_completion_tokens: request.maxOutputTokens }),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: request.prompt },
              {
                type: "image_url",
                image_url: {
                  detail: "low",
                  url: `data:image/jpeg;base64,${Buffer.from(request.image).toString("base64")}`,
                },
              },
            ],
          },
        ],
      });
      break;
    case "transcription": {
      route = "/audio/transcriptions";
      const form = new FormData();
      form.set("model", request.model);
      form.set("response_format", "json");
      form.set(
        "file",
        new Blob([Uint8Array.from(request.audio)], { type: "audio/wav" }),
        "clip.wav",
      );
      body = form;
      break;
    }
  }
  if (typeof body === "string") {
    headers.set("Content-Type", "application/json");
  }
  const response = await network(base + route, {
    method: "POST",
    headers,
    body,
    redirect: "error",
    signal: AbortSignal.timeout(90_000),
  });
  if ([400, 401, 402, 403, 404, 413, 422, 429].includes(response.status)) {
    throw new ProviderRejected("Provider declined the operation");
  }
  const payload: unknown = await response.json().catch(() => null);
  const bodyId = z
    .object({ id: z.string().trim().min(1).max(300) })
    .safeParse(payload).data?.id;
  const id = bodyId ?? response.headers.get("x-request-id") ?? undefined;
  if (!response.ok || !id) {
    throw new ProviderOutcomeUnknown(id);
  }
  const result = (
    inputTokens: number,
    outputTokens: number,
    providerCost: number | undefined,
    text: string,
  ): ICompletedWork => {
    if (router && providerCost === undefined) {
      throw new ProviderOutcomeUnknown(id);
    }
    return {
      providerRequestId: id,
      text,
      usage: {
        inputTokens,
        outputTokens,
        usd:
          providerCost === undefined
            ? price(inputTokens, outputTokens, request).toFixed()
            : new money(providerCost).toFixed(),
        basis: providerCost === undefined ? "rate-card" : "provider",
      },
    };
  };
  switch (request.capability) {
    case "embedding": {
      const decoded = vectors.safeParse(payload);
      if (!decoded.success) {
        throw new ProviderOutcomeUnknown(id);
      }
      const { data, usage } = decoded.data;
      const paid = result(usage.prompt_tokens, 0, usage.cost, "");
      const ordered = data.sort((a, b) => a.index - b.index);
      if (
        ordered.length !== request.inputs.length ||
        ordered.some(
          ({ index, embedding }, offset) =>
            index !== offset ||
            embedding.length !== request.dimensions ||
            !embedding.some(Boolean),
        )
      ) {
        return paid;
      }
      return {
        ...paid,
        embeddings: {
          dimensions: request.dimensions,
          values: ordered.map(({ embedding }) => embedding),
        },
      };
    }
    case "vision": {
      const decoded = completion.safeParse(payload);
      if (!decoded.success) {
        throw new ProviderOutcomeUnknown(id);
      }
      const { usage, choices } = decoded.data;
      return result(
        usage.prompt_tokens,
        usage.completion_tokens,
        usage.cost,
        choices[0].message.content?.slice(0, 4000) ?? "",
      );
    }
    case "transcription": {
      const decoded = transcript.safeParse(payload);
      if (!decoded.success) {
        throw new ProviderOutcomeUnknown(id);
      }
      const { text, usage } = decoded.data;
      return result(
        usage.input_tokens,
        usage.output_tokens,
        undefined,
        text.slice(0, 4000),
      );
    }
  }
}
