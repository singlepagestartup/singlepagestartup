import Decimal from "decimal.js";
import { z } from "zod";
import {
  ProviderOutcomeUnknown,
  ProviderRejected,
  type ICompletedWork,
  type IWorkMessage,
} from "./work-request";

const routes = {
  openai: {
    model: "gpt-image-2.5-flare-2026-09-08",
    url: "https://api.openai.com/v1/images/generations",
    minimumInputRate: 8,
    minimumOutputRate: 30,
  },
  openrouter: {
    model: "openai/gpt-image-2.5-flare",
    url: "https://openrouter.ai/api/v1/images",
    minimumInputRate: 8,
    minimumOutputRate: 40,
  },
};

const imageSize = 1024;
// Reserve a conservative envelope for one low-quality 1024px generation. The
// Images API meters actual tokens but does not accept a max-output-tokens field.
const imageOutputCeiling = 16_384;
const responseByteLimit = 8 * 1024 * 1024;
const Price = Decimal.clone({ precision: 56 });
const pngHeader = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
const reportedId = z.string().regex(/^[\w.:-]{1,300}$/);
const tokenCount = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const routerUsage = z.object({
  prompt_tokens: tokenCount,
  completion_tokens: tokenCount,
  cost: z.number().finite().nonnegative(),
});
const openAiUsage = z.object({
  input_tokens: tokenCount,
  output_tokens: tokenCount,
  input_tokens_details: z.object({
    image_tokens: tokenCount,
    text_tokens: tokenCount,
  }),
});
const imageResponse = z.object({
  id: z.unknown().optional(),
  usage: z.unknown().optional(),
  data: z.unknown().optional(),
});
const pngData = z
  .array(
    z.object({
      b64_json: z.string(),
      media_type: z.literal("image/png").optional(),
    }),
  )
  .length(1);

export interface IImageWorkRequest {
  capability: "image";
  provider: keyof typeof routes;
  model: string;
  messages: IWorkMessage[];
  coverBackground?: { width: number; height: number; description: string };
  maxOutputTokens: number;
  inputUsdPerMillion: string;
  outputUsdPerMillion: string;
}

interface ICompletedImageWork {
  result: ICompletedWork;
  bytes?: Uint8Array;
}

function promptOf(request: IImageWorkRequest) {
  const background = request.coverBackground;
  if (background) {
    const { width, height, description } = background;
    return [
      `Create only the background for a marketplace cover whose final canvas is ${width}×${height} pixels.`,
      `The buyer's background direction is: ${description}`,
      "Use a cohesive background with space in the center and near the bottom. Keep the design suitable for a center crop. The original product photo and caption will be added separately. Leave out products, people, typography, logos, watermarks and frames.",
    ].join("\n");
  }
  return request.messages
    .map(({ role, content }) => `${role}: ${content}`)
    .join("\n\n");
}

export function estimateImageWork(request: IImageWorkRequest) {
  const route = routes[request.provider];
  if (request.model !== route.model) {
    throw new Error(
      "Permission error. This model does not support metered image work",
    );
  }

  const inputRate = new Price(request.inputUsdPerMillion);
  const outputRate = new Price(request.outputUsdPerMillion);
  if (
    request.maxOutputTokens < imageOutputCeiling ||
    inputRate.lt(route.minimumInputRate) ||
    outputRate.lt(route.minimumOutputRate)
  ) {
    throw new Error(
      "Payment required. Image rate or output ceilings are too low",
    );
  }

  const background = request.coverBackground;
  if (
    background &&
    (!Number.isSafeInteger(background.width) ||
      !Number.isSafeInteger(background.height) ||
      background.width < 320 ||
      background.height < 320 ||
      background.width > 4096 ||
      background.height > 4096 ||
      !background.description.trim() ||
      background.description.length > 800)
  ) {
    throw new Error(
      "Validation error. The cover background dimensions or description are unsupported",
    );
  }

  const prompt = promptOf(request);
  if (!prompt.trim() || Buffer.byteLength(prompt, "utf8") > 32_000) {
    throw new Error(
      "Permission error. The image prompt exceeds the supported input",
    );
  }

  const input = Buffer.byteLength(prompt, "utf8") + 128;
  const usd = inputRate
    .times(input)
    .plus(outputRate.times(imageOutputCeiling))
    .div(1_000_000);
  return { input, usd };
}

async function parseResponse(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) {
    return null;
  }
  try {
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    let chunk = await reader.read();
    while (!chunk.done) {
      bytes += chunk.value.byteLength;
      if (bytes > responseByteLimit) {
        await reader.cancel();
        return null;
      }
      chunks.push(chunk.value);
      chunk = await reader.read();
    }
    return JSON.parse(Buffer.concat(chunks, bytes).toString("utf8"));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function unpackPng(data: unknown) {
  const images = pngData.safeParse(data);
  if (!images.success) {
    return;
  }
  const encoded = images.data[0].b64_json;
  if (encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    return;
  }
  const bytes = Buffer.from(encoded, "base64");
  if (
    bytes.length < 33 ||
    !bytes.subarray(0, pngHeader.length).equals(pngHeader) ||
    bytes.readUInt32BE(16) !== imageSize ||
    bytes.readUInt32BE(20) !== imageSize
  ) {
    return;
  }
  return bytes;
}

function openRouterUsage(raw: unknown, id: string): ICompletedWork["usage"] {
  const usage = routerUsage.safeParse(raw);
  if (!usage.success) {
    throw new ProviderOutcomeUnknown(id);
  }
  return {
    inputTokens: usage.data.prompt_tokens,
    outputTokens: usage.data.completion_tokens,
    usd: new Price(usage.data.cost).toFixed(),
    basis: "provider",
  };
}

function directOpenAiUsage(raw: unknown, id: string): ICompletedWork["usage"] {
  const usage = openAiUsage.safeParse(raw);
  if (!usage.success) {
    throw new ProviderOutcomeUnknown(id);
  }
  const { input_tokens, output_tokens, input_tokens_details } = usage.data;
  const { image_tokens, text_tokens } = input_tokens_details;
  if (image_tokens + text_tokens !== input_tokens) {
    throw new ProviderOutcomeUnknown(id);
  }

  // Direct non-streaming Images requests have no cache discount. Bill actual
  // usage at the snapshot's published $5/$8/$30 text/image/output rates.
  const usd = new Price(text_tokens)
    .times(5)
    .plus(new Price(image_tokens).times(8))
    .plus(new Price(output_tokens).times(30))
    .div(1_000_000);
  return {
    inputTokens: input_tokens,
    outputTokens: output_tokens,
    usd: usd.toFixed(),
    basis: "rate-card",
  };
}

export async function sendImageWork(
  request: IImageWorkRequest,
  secret: string,
  attemptId: string,
  network: typeof fetch = fetch,
): Promise<ICompletedImageWork> {
  estimateImageWork(request);
  const route = routes[request.provider];
  const router = request.provider === "openrouter";
  const body = {
    model: route.model,
    prompt: promptOf(request),
    n: 1,
    size: `${imageSize}x${imageSize}`,
    quality: "low",
    output_format: "png",
    stream: false,
    ...(router
      ? {
          response_format: "b64_json",
          provider: { only: ["openai"], allow_fallbacks: false },
        }
      : {}),
  };
  const response = await network(route.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      "X-Client-Request-Id": attemptId,
    },
    body: JSON.stringify(body),
    redirect: "error",
    signal: AbortSignal.timeout(90_000),
  });
  if ([400, 401, 403, 404, 413, 422, 429].includes(response.status)) {
    await response.body?.cancel();
    throw new ProviderRejected("Image provider declined the request");
  }

  const payload = imageResponse.safeParse(await parseResponse(response));
  const candidate =
    response.headers.get("x-generation-id") ??
    response.headers.get("x-request-id") ??
    (payload.success ? payload.data.id : undefined);
  const providerRequestId = reportedId.safeParse(candidate).data;
  if (!response.ok || !payload.success || !providerRequestId) {
    throw new ProviderOutcomeUnknown(providerRequestId);
  }
  const usage = router
    ? openRouterUsage(payload.data.usage, providerRequestId)
    : directOpenAiUsage(payload.data.usage, providerRequestId);
  return {
    result: { providerRequestId, usage, text: "" },
    bytes: unpackPng(payload.data.data),
  };
}
