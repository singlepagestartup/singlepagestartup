import {
  KnowledgeModelOption,
  KnowledgeModelTask,
} from "@sps/knowledge/sdk/model";
import { createLlmGatewayNetworkError } from "../llm-gateway-error";

export interface LlmModelClientProps {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export class LlmModelClient {
  private baseUrl: string;
  private fetcher: typeof fetch;

  constructor(props: LlmModelClientProps) {
    this.baseUrl = props.baseUrl.replace(/\/+$/, "");
    this.fetcher = props.fetcher || fetch;
  }

  async list(props?: { task?: KnowledgeModelTask }) {
    const params = props?.task ? `?task=${encodeURIComponent(props.task)}` : "";
    let res: Response;

    try {
      res = await this.fetcher(`${this.baseUrl}/v1/models${params}`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      });
    } catch (error) {
      throw createLlmGatewayNetworkError({
        operation: "LLM models request",
        baseUrl: this.baseUrl,
        error,
      });
    }

    if (!res.ok) {
      const body = await res.text();
      const details = body ? ` Response: ${body.slice(0, 500)}` : "";

      throw new Error(
        `LLM models request failed with status ${res.status}.${details} Ensure apps/llm is running.`,
      );
    }

    const json = (await res.json()) as {
      data?: unknown[];
    };

    return (json.data || []).map(normalizeModelOption);
  }

  async get(modelId: string) {
    let res: Response;

    try {
      res = await this.fetcher(`${this.baseUrl}/v1/models/${modelId}`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      });
    } catch (error) {
      throw createLlmGatewayNetworkError({
        operation: "LLM model metadata request",
        baseUrl: this.baseUrl,
        model: modelId,
        error,
      });
    }

    if (!res.ok) {
      const body = await res.text();
      const details = body ? ` Response: ${body.slice(0, 500)}` : "";

      throw new Error(
        `LLM model metadata request failed with status ${res.status}.${details} Ensure apps/llm is running.`,
      );
    }

    return normalizeModelOption(await res.json());
  }
}

function normalizeModelOption(raw: unknown): KnowledgeModelOption {
  const value = raw as Record<string, any>;

  return {
    id: String(value.id || ""),
    label: String(value.label || value.id || ""),
    provider: value.provider,
    providerModel: String(value.provider_model || value.providerModel || ""),
    task: value.task,
    local: Boolean(value.local),
    dimensions:
      typeof value.dimensions === "number" ? value.dimensions : undefined,
  };
}
