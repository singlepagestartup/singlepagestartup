import { OPEN_ROUTER_API_KEY } from "@sps/shared-utils";
import type {
  IOpenRouterBilling,
  IOpenRouterGeneratedImage,
  IOpenRouterGenerateResult,
  IOpenRouterGenerationError,
  IOpenRouterGenerationSuccess,
  IOpenRouterModel,
  IOpenRouterUsage,
} from "./interface";

export type IOpenRouterMessageContent =
  | { type: "text"; text: string }
  | {
      type: "image_url";
      image_url: { url: string; detail?: "auto" | "low" | "high" };
    }
  | {
      type: "file";
      file: {
        url?: string;
        file_data?: string;
        filename?: string;
        mime_type?: string;
      };
    }
  | { type: "file_url"; file_url: { url: string } };

export type IOpenRouterRequestMessage = {
  role: "user" | "assistant" | "system";
  content: string | IOpenRouterMessageContent[];
};

export type IOpenRouterResponseFormat =
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

const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedModels:
  | {
      expiresAt: number;
      models: IOpenRouterModel[];
    }
  | undefined;

export class Service {
  baseURL: string;
  apiKey: string;

  constructor() {
    if (!OPEN_ROUTER_API_KEY) {
      throw new Error("Configuration error. OPEN_ROUTER_API_KEY is not set");
    }

    this.baseURL = "https://openrouter.ai/api/v1";
    this.apiKey = OPEN_ROUTER_API_KEY;
  }

  private stringifyError(error: unknown) {
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

  private async fetchAsDataUrl(props: {
    url: string;
    fallbackMimeType: string;
  }): Promise<{ dataUrl: string; mimeType: string; filename?: string }> {
    const response = await fetch(props.url);

    if (!response.ok) {
      throw new Error(`OpenRouter file fetch failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType =
      response.headers.get("content-type") || props.fallbackMimeType;
    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const filename = (() => {
      try {
        const parsed = new URL(props.url);
        const last = parsed.pathname.split("/").pop();
        return last || undefined;
      } catch (error) {
        return undefined;
      }
    })();

    return { dataUrl, mimeType, filename };
  }

  private async normalizeMessages(
    messages: IOpenRouterRequestMessage[],
  ): Promise<IOpenRouterRequestMessage[]> {
    return Promise.all(
      messages.map(async (message) => {
        if (typeof message.content === "string") {
          return message;
        }

        const normalizedContent = await Promise.all(
          message.content.map(async (part) => {
            if (part.type === "text") {
              return part;
            }

            if (part.type === "image_url") {
              const url = part.image_url.url;
              return {
                type: "image_url" as const,
                image_url: {
                  url,
                  ...(part.image_url.detail && {
                    detail: part.image_url.detail,
                  }),
                },
              };
            }

            if (part.type === "file_url") {
              const { dataUrl, mimeType, filename } = await this.fetchAsDataUrl(
                {
                  url: part.file_url.url,
                  fallbackMimeType: "application/octet-stream",
                },
              );

              return {
                type: "file" as const,
                file: {
                  file_data: dataUrl,
                  mime_type: mimeType,
                  filename: filename || "file",
                },
              };
            }

            if (part.type === "file") {
              if (part.file.file_data) {
                return part;
              }

              if (!part.file.url) {
                return part;
              }

              const { dataUrl, mimeType, filename } = await this.fetchAsDataUrl(
                {
                  url: part.file.url,
                  fallbackMimeType:
                    part.file.mime_type || "application/octet-stream",
                },
              );

              return {
                type: "file" as const,
                file: {
                  file_data: dataUrl,
                  mime_type: part.file.mime_type || mimeType,
                  filename: part.file.filename || filename || "file",
                },
              };
            }

            return part;
          }),
        );

        return {
          ...message,
          content: normalizedContent,
        };
      }),
    );
  }

  private stripNonTextContent(
    messages: IOpenRouterRequestMessage[],
  ): IOpenRouterRequestMessage[] {
    return messages.map((message) => {
      if (typeof message.content === "string") {
        return message;
      }

      const textParts = message.content.filter((part) => part.type === "text");

      if (!textParts.length) {
        return {
          ...message,
          content: "",
        };
      }

      return {
        ...message,
        content: textParts,
      };
    });
  }

  private async requestCompletion(props: {
    model: string;
    messages: IOpenRouterRequestMessage[];
    max_tokens?: number;
    reasoning?: boolean;
    response_format?: IOpenRouterResponseFormat;
    temperature?: number;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: props.model,
          messages: props.messages,
          stream: false,
          max_tokens: props.max_tokens,
          ...(props.reasoning && { reasoning: {} }),
          ...(props.response_format && {
            response_format: props.response_format,
          }),
          ...(typeof props.temperature === "number" && {
            temperature: props.temperature,
          }),
        }),
      });

      return response.json();
    } catch (error) {
      return {
        error: {
          message: `OpenRouter request failed: ${this.stringifyError(error)}`,
        },
      };
    }
  }

  private parseMessage(message: any): {
    text: string;
    images?: IOpenRouterGeneratedImage[];
  } {
    let text = "";
    let images: { url?: string; b64_json?: string }[] | undefined;

    if (message.images && Array.isArray(message.images)) {
      images = message.images.map((img: any) => {
        if (img.image_url?.url) {
          return { url: img.image_url.url };
        }
        return { url: img.url, b64_json: img.b64_json };
      });
    }

    if (!images && message.attachments && Array.isArray(message.attachments)) {
      images = message.attachments
        .filter((att: any) => att.type === "image")
        .map((att: any) => ({ url: att.url, b64_json: att.b64_json }));
    }

    if (Array.isArray(message.content)) {
      const textParts = message.content
        .filter((part: any) => part?.type === "text")
        .map((part: any) => part.text || "");
      text = textParts.join("");

      const contentImages = message.content
        .filter((part: any) => part?.type === "image_url")
        .map((part: any) => ({ url: part.image_url?.url }))
        .filter((img: any) => img.url);

      if (contentImages.length) {
        images = (images || []).concat(contentImages);
      }
    } else {
      text = message.content || "";
    }

    return { text, images };
  }

  private toFiniteNumber(value: unknown): number | null {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private normalizeUsage(usage: any): IOpenRouterUsage | null {
    if (!usage || typeof usage !== "object") {
      return null;
    }

    const promptTokens = this.toFiniteNumber(usage.prompt_tokens) ?? 0;
    const completionTokens = this.toFiniteNumber(usage.completion_tokens) ?? 0;
    const totalTokens =
      this.toFiniteNumber(usage.total_tokens) ??
      promptTokens + completionTokens;

    return {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      ...(this.toFiniteNumber(usage.cost) !== null && {
        cost: this.toFiniteNumber(usage.cost) as number,
      }),
      ...(usage.cost_details &&
        typeof usage.cost_details === "object" && {
          cost_details: {
            ...(this.toFiniteNumber(
              usage.cost_details.upstream_inference_cost,
            ) !== null && {
              upstream_inference_cost: this.toFiniteNumber(
                usage.cost_details.upstream_inference_cost,
              ) as number,
            }),
          },
        }),
      ...(usage.prompt_tokens_details &&
        typeof usage.prompt_tokens_details === "object" && {
          prompt_tokens_details: {
            ...(this.toFiniteNumber(
              usage.prompt_tokens_details.cached_tokens,
            ) !== null && {
              cached_tokens: this.toFiniteNumber(
                usage.prompt_tokens_details.cached_tokens,
              ) as number,
            }),
            ...(this.toFiniteNumber(
              usage.prompt_tokens_details.cache_write_tokens,
            ) !== null && {
              cache_write_tokens: this.toFiniteNumber(
                usage.prompt_tokens_details.cache_write_tokens,
              ) as number,
            }),
            ...(this.toFiniteNumber(
              usage.prompt_tokens_details.audio_tokens,
            ) !== null && {
              audio_tokens: this.toFiniteNumber(
                usage.prompt_tokens_details.audio_tokens,
              ) as number,
            }),
          },
        }),
      ...(usage.completion_tokens_details &&
        typeof usage.completion_tokens_details === "object" && {
          completion_tokens_details: {
            ...(this.toFiniteNumber(
              usage.completion_tokens_details.reasoning_tokens,
            ) !== null && {
              reasoning_tokens: this.toFiniteNumber(
                usage.completion_tokens_details.reasoning_tokens,
              ) as number,
            }),
            ...(this.toFiniteNumber(
              usage.completion_tokens_details.audio_tokens,
            ) !== null && {
              audio_tokens: this.toFiniteNumber(
                usage.completion_tokens_details.audio_tokens,
              ) as number,
            }),
          },
        }),
    };
  }

  private countInputImages(messages: IOpenRouterRequestMessage[]): number {
    return messages.reduce((count, message) => {
      if (typeof message.content === "string") {
        return count;
      }

      return (
        count +
        message.content.filter((part) => part.type === "image_url").length
      );
    }, 0);
  }

  private async buildBilling(props: {
    data: any;
    requestModelId: string;
    messages: IOpenRouterRequestMessage[];
    images?: IOpenRouterGeneratedImage[];
  }): Promise<IOpenRouterBilling> {
    const usage = this.normalizeUsage(props.data?.usage);
    const models = await this.getModels();
    const model =
      models.find((item) => item.id === props.requestModelId) ||
      models.find((item) => item.canonical_slug === props.requestModelId) ||
      null;
    const pricing = model?.pricing || null;
    const billablePromptTokens = Math.max(
      (usage?.prompt_tokens || 0) -
        (usage?.prompt_tokens_details?.cached_tokens || 0) -
        (usage?.prompt_tokens_details?.cache_write_tokens || 0),
      0,
    );
    const completionTokens = usage?.completion_tokens || 0;
    const reasoningTokens =
      usage?.completion_tokens_details?.reasoning_tokens || 0;
    const cachedTokens = usage?.prompt_tokens_details?.cached_tokens || 0;
    const cacheWriteTokens =
      usage?.prompt_tokens_details?.cache_write_tokens || 0;
    const inputImageCount = this.countInputImages(props.messages);
    const outputImageCount = props.images?.length || 0;
    const promptUsd =
      billablePromptTokens * (this.toFiniteNumber(pricing?.prompt) || 0);
    const completionUsd =
      completionTokens * (this.toFiniteNumber(pricing?.completion) || 0);
    const reasoningUsd =
      reasoningTokens * (this.toFiniteNumber(pricing?.internal_reasoning) || 0);
    const cacheReadUsd =
      cachedTokens * (this.toFiniteNumber(pricing?.input_cache_read) || 0);
    const cacheWriteUsd =
      cacheWriteTokens * (this.toFiniteNumber(pricing?.input_cache_write) || 0);
    const requestUsd = this.toFiniteNumber(pricing?.request) || 0;
    let imageUsd = inputImageCount * (this.toFiniteNumber(pricing?.image) || 0);
    const webSearchUsd = 0;
    let totalUsd =
      promptUsd +
      completionUsd +
      requestUsd +
      imageUsd +
      webSearchUsd +
      reasoningUsd +
      cacheReadUsd +
      cacheWriteUsd;
    const usageCostCredits = usage?.cost ?? null;
    const upstreamInferenceCostCredits =
      usage?.cost_details?.upstream_inference_cost ?? null;
    const providerReportedTotalUsd =
      upstreamInferenceCostCredits ?? usageCostCredits ?? 0;

    if (totalUsd <= 0 && providerReportedTotalUsd > 0) {
      if (outputImageCount > 0) {
        imageUsd = providerReportedTotalUsd;
      }

      totalUsd = providerReportedTotalUsd;
    }

    return {
      requestModelId: props.requestModelId,
      responseModelId:
        typeof props.data?.model === "string"
          ? props.data.model
          : props.requestModelId,
      usage,
      pricing,
      usageCostCredits,
      upstreamInferenceCostCredits,
      breakdown: {
        promptUsd,
        completionUsd,
        requestUsd,
        imageUsd,
        webSearchUsd,
        reasoningUsd,
        cacheReadUsd,
        cacheWriteUsd,
        totalUsd,
        inputImageCount,
        outputImageCount,
      },
      totalUsd,
    };
  }

  private async buildSuccessResult(props: {
    data: any;
    requestModelId: string;
    messages: IOpenRouterRequestMessage[];
  }): Promise<IOpenRouterGenerationSuccess> {
    const message = props.data?.choices?.[0]?.message;
    const parsedMessage = this.parseMessage(message || {});
    const billing = await this.buildBilling({
      data: props.data,
      requestModelId: props.requestModelId,
      messages: props.messages,
      images: parsedMessage.images,
    });

    return {
      ...parsedMessage,
      billing,
    };
  }

  private async buildErrorResult(props: {
    data: any;
    requestModelId: string;
    messages: IOpenRouterRequestMessage[];
  }): Promise<IOpenRouterGenerationError> {
    const billing = props.data?.usage
      ? await this.buildBilling({
          data: props.data,
          requestModelId: props.requestModelId,
          messages: props.messages,
        })
      : null;

    return {
      error: props.data?.error || props.data,
      billing,
    };
  }

  async generate(props: {
    context: IOpenRouterRequestMessage[];
    model: string;
    fallbackModels?: string[];
    max_tokens?: number;
    reasoning?: boolean;
    responseFormat?: IOpenRouterResponseFormat;
    temperature?: number;
    stripNonTextOnRetry?: boolean;
  }): Promise<IOpenRouterGenerateResult> {
    const hasNonTextContent = props.context.some(
      (message) => typeof message.content !== "string",
    );
    const shouldStripNonTextOnRetry = props.stripNonTextOnRetry ?? true;

    const normalizedMessages = await this.normalizeMessages(props.context);
    const data = await this.requestCompletion({
      model: props.model,
      messages: normalizedMessages,
      max_tokens: props.max_tokens,
      reasoning: props.reasoning,
      response_format: props.responseFormat,
      temperature: props.temperature,
    });

    if (data.error) {
      console.error(
        "❌ OpenRouter Error:",
        JSON.stringify(data.error, null, 2),
      );
      if (hasNonTextContent && shouldStripNonTextOnRetry) {
        console.error(
          "↩️ OpenRouter Retry: stripping non-text content and retrying once.",
        );

        const strippedMessages = await this.normalizeMessages(
          this.stripNonTextContent(props.context),
        );

        const retryData = await this.requestCompletion({
          model: props.model,
          messages: strippedMessages,
          max_tokens: props.max_tokens,
          reasoning: props.reasoning,
          response_format: props.responseFormat,
          temperature: props.temperature,
        });

        if (retryData.error) {
          console.error(
            "❌ OpenRouter Retry Error:",
            JSON.stringify(retryData.error, null, 2),
          );
          return this.buildErrorResult({
            data: retryData,
            requestModelId: props.model,
            messages: strippedMessages,
          });
        }

        return this.buildSuccessResult({
          data: retryData,
          requestModelId: props.model,
          messages: strippedMessages,
        });
      }

      return this.buildErrorResult({
        data,
        requestModelId: props.model,
        messages: normalizedMessages,
      });
    }

    return this.buildSuccessResult({
      data,
      requestModelId: props.model,
      messages: normalizedMessages,
    });
  }

  async getModels(): Promise<IOpenRouterModel[]> {
    if (cachedModels && cachedModels.expiresAt > Date.now()) {
      return cachedModels.models;
    }

    let models: IOpenRouterModel[] = [];

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();
      models = Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.warn("OpenRouter models fetch failed", {
        error: this.stringifyError(error),
      });

      return cachedModels?.models || [];
    }

    cachedModels = {
      expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
      models,
    };

    return models;
  }
}
