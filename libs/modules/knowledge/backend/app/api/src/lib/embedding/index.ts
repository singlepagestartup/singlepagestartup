import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from "../configuration";

export interface LlmEmbeddingClientProps {
  baseUrl: string;
  model: string;
  dimensions?: number;
  fetcher?: typeof fetch;
}

export class LlmEmbeddingClient {
  private baseUrl: string;
  private model: string;
  private dimensions: number;
  private fetcher: typeof fetch;

  constructor(props: LlmEmbeddingClientProps) {
    this.baseUrl = props.baseUrl.replace(/\/+$/, "");
    this.model = props.model;
    this.dimensions = props.dimensions || KNOWLEDGE_EMBEDDING_DIMENSIONS;
    this.fetcher = props.fetcher || fetch;
  }

  async embed(input: string): Promise<number[]> {
    const [embedding] = await this.embedMany([input]);
    return embedding;
  }

  async embedMany(inputs: string[]): Promise<number[][]> {
    if (!inputs.length) {
      return [];
    }

    const res = await this.fetcher(`${this.baseUrl}/v1/embeddings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: inputs,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      const details = body ? ` Response: ${body.slice(0, 500)}` : "";

      throw new Error(
        `LLM embedding request failed with status ${res.status}.${details} Ensure apps/llm is running and model ${this.model} is available.`,
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
        `LLM gateway returned ${embeddings.length} embeddings for ${inputs.length} inputs.`,
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
      return typeof value !== "number" || Number.isNaN(value);
    });

    if (invalidIndex !== -1) {
      throw new Error(`Embedding ${index} contains a non-numeric value.`);
    }
  }
}
