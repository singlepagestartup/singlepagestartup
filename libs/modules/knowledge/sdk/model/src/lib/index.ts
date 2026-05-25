import {
  API_SERVICE_URL,
  NEXT_PUBLIC_API_SERVICE_URL,
  NextRequestOptions,
  REVALIDATE,
} from "@sps/shared-utils";

export const serverHost = API_SERVICE_URL;
export const clientHost = NEXT_PUBLIC_API_SERVICE_URL;
export const route = "/api/knowledge";
export const options = {
  next: {
    revalidate: REVALIDATE,
  },
} as NextRequestOptions;

export type KnowledgeModelProvider =
  | "ollama"
  | "anthropic"
  | "openai"
  | "huggingface";

export type KnowledgeModelTask = "chat" | "embedding" | "audio";

export interface KnowledgeModelOption {
  id: string;
  label: string;
  provider: KnowledgeModelProvider;
  providerModel: string;
  task: KnowledgeModelTask;
  local: boolean;
  dimensions?: number;
}

export type KnowledgeGenerationModelSlug = string;

export const DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG =
  "openai/gpt-5-5" as const;

export interface IKnowledgeGenerationUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  promptEvalCount?: number;
  evalCount?: number;
}

export interface IKnowledgeSourceReference {
  id: string;
  text: string;
  chunkIndex: number;
  sourceTitle: string | null;
  sourceOriginalPath: string | null;
  sourceType: string | null;
  distance: number;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface IKnowledgeSearchResponse {
  data: IKnowledgeSourceReference[];
}

export interface IKnowledgeGenerateResponse {
  data: {
    answer: string;
    sources: IKnowledgeSourceReference[];
    generationModelSlug: string;
    generationProvider: KnowledgeModelProvider;
    generationModel: string;
    usage?: IKnowledgeGenerationUsage;
  };
}

export interface IKnowledgeChatMessageResponse {
  data: {
    threadId: string;
    userMessageId: string;
    assistantMessageId: string;
    editSuggestionId?: string;
    answer: string;
    sources: IKnowledgeSourceReference[];
    generationModelSlug: string;
    generationProvider: KnowledgeModelProvider;
    generationModel: string;
    usage?: IKnowledgeGenerationUsage;
  };
}

export interface IKnowledgeModelsResponse {
  data: KnowledgeModelOption[];
}

export interface IKnowledgeIndexResponse {
  data: {
    indexed: number;
    skipped: number;
    dryRun: boolean;
    sources: {
      title: string;
      originalPath: string;
      chunks: number;
      status: "indexed" | "skipped" | "dry_run";
    }[];
  };
}
