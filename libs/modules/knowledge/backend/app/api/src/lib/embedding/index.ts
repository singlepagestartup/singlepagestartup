import {
  getKnowledgeConfiguration,
  KNOWLEDGE_EMBEDDING_DIMENSIONS,
} from "../configuration";
import { createLlmGatewayNetworkError } from "../llm-gateway-error";

export interface IKnowledgeEmbeddingClient {
  embed(input: string): Promise<number[]>;
  embedMany(inputs: string[]): Promise<number[][]>;
  validateEmbedding(
    embedding: unknown,
    index?: number,
  ): asserts embedding is number[];
}

export interface LlmEmbeddingClientProps {
  baseUrl: string;
  model: string;
  dimensions?: number;
  fetcher?: typeof fetch;
}

export interface OpenRouterEmbeddingClientProps
  extends LlmEmbeddingClientProps {
  apiKey: string;
}

interface OpenAiCompatibleEmbeddingClientProps extends LlmEmbeddingClientProps {
  headers?: Record<string, string>;
  requestBody?: Record<string, unknown>;
  requestName: string;
  providerName: string;
  failureHint: string;
  endpointPath?: string;
  createNetworkError: (error: unknown) => Error;
}

class OpenAiCompatibleEmbeddingClient implements IKnowledgeEmbeddingClient {
  private baseUrl: string;
  private model: string;
  private dimensions: number;
  private fetcher: typeof fetch;
  private headers: Record<string, string>;
  private requestBody: Record<string, unknown>;
  private requestName: string;
  private providerName: string;
  private failureHint: string;
  private endpointPath: string;
  private createNetworkError: (error: unknown) => Error;

  constructor(props: OpenAiCompatibleEmbeddingClientProps) {
    this.baseUrl = props.baseUrl.replace(/\/+$/, "");
    this.model = props.model;
    this.dimensions = props.dimensions || KNOWLEDGE_EMBEDDING_DIMENSIONS;
    this.fetcher = props.fetcher || fetch;
    this.headers = props.headers || {};
    this.requestBody = props.requestBody || {};
    this.requestName = props.requestName;
    this.providerName = props.providerName;
    this.failureHint = props.failureHint;
    this.endpointPath = props.endpointPath || "/v1/embeddings";
    this.createNetworkError = props.createNetworkError;
  }

  async embed(input: string): Promise<number[]> {
    const [embedding] = await this.embedMany([input]);
    return embedding;
  }

  async embedMany(inputs: string[]): Promise<number[][]> {
    if (!inputs.length) {
      return [];
    }

    let res: Response;

    try {
      res = await this.fetcher(`${this.baseUrl}${this.endpointPath}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...this.headers,
        },
        body: JSON.stringify({
          model: this.model,
          input: inputs,
          ...this.requestBody,
        }),
      });
    } catch (error) {
      throw this.createNetworkError(error);
    }

    if (!res.ok) {
      const body = await res.text();
      const details = body ? ` Response: ${body.slice(0, 500)}` : "";

      throw new Error(
        `${this.requestName} failed with status ${res.status}.${details} ${this.failureHint}`,
      );
    }

    const json = (await res.json()) as {
      data?: {
        embedding?: number[];
        index?: number;
      }[];
    };

    const embeddings = Array.isArray(json.data)
      ? json.data
          .slice()
          .sort((a, b) => {
            return (a.index || 0) - (b.index || 0);
          })
          .map((item) => item.embedding || [])
      : [];

    if (embeddings.length !== inputs.length) {
      throw new Error(
        `${this.providerName} returned ${embeddings.length} embeddings for ${inputs.length} inputs.`,
      );
    }

    embeddings.forEach((embedding, index) => {
      this.validateEmbedding(embedding, index);
    });

    return embeddings;
  }

  validateEmbedding(
    embedding: unknown,
    index = 0,
  ): asserts embedding is number[] {
    if (!Array.isArray(embedding)) {
      throw new Error(`Embedding ${index} is not an array.`);
    }

    if (embedding.length !== this.dimensions) {
      throw new Error(
        `Embedding ${index} has ${embedding.length} dimensions; expected ${this.dimensions}.`,
      );
    }

    const invalidIndex = embedding.findIndex((value) => {
      return typeof value !== "number" || !Number.isFinite(value);
    });

    if (invalidIndex !== -1) {
      throw new Error(`Embedding ${index} contains a non-numeric value.`);
    }
  }
}

export class LlmEmbeddingClient extends OpenAiCompatibleEmbeddingClient {
  constructor(props: LlmEmbeddingClientProps) {
    const baseUrl = props.baseUrl.replace(/\/+$/, "");

    super({
      ...props,
      baseUrl,
      requestName: "LLM embedding request",
      providerName: "LLM gateway",
      failureHint: `Ensure apps/llm is running and model ${props.model} is available.`,
      createNetworkError: (error) => {
        return createLlmGatewayNetworkError({
          operation: "LLM embedding request",
          baseUrl,
          model: props.model,
          error,
        });
      },
    });
  }
}

export class OpenRouterEmbeddingClient extends OpenAiCompatibleEmbeddingClient {
  constructor(props: OpenRouterEmbeddingClientProps) {
    const baseUrl = props.baseUrl.replace(/\/+$/, "");
    const apiKey = props.apiKey.trim();

    if (!apiKey) {
      throw new Error(
        "Configuration error. OPEN_ROUTER_API_KEY is required when KNOWLEDGE_EMBEDDING_PROVIDER=openrouter.",
      );
    }

    super({
      ...props,
      baseUrl,
      headers: {
        authorization: `Bearer ${apiKey}`,
        "x-title": "SinglePageStartup Knowledge",
      },
      requestBody: {
        dimensions: props.dimensions || KNOWLEDGE_EMBEDDING_DIMENSIONS,
        encoding_format: "float",
      },
      requestName: "OpenRouter embedding request",
      providerName: "OpenRouter",
      endpointPath: "/embeddings",
      failureHint: `Check OPEN_ROUTER_API_KEY and model ${props.model}.`,
      createNetworkError: (error) => {
        const message = error instanceof Error ? error.message : String(error);

        return new Error(
          `OpenRouter embedding request could not connect to OpenRouter at ${baseUrl} for model ${props.model}: ${message}`,
          { cause: error },
        );
      },
    });
  }
}

export function createKnowledgeEmbeddingClient(): IKnowledgeEmbeddingClient {
  const config = getKnowledgeConfiguration().embedding;

  if (config.provider === "openrouter") {
    return new OpenRouterEmbeddingClient({
      baseUrl: config.url,
      model: config.model,
      dimensions: config.dimensions,
      apiKey: config.apiKey,
    });
  }

  return new LlmEmbeddingClient({
    baseUrl: config.url,
    model: config.model,
    dimensions: config.dimensions,
  });
}
