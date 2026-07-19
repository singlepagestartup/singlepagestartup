import { LLM_SERVICE_URL } from "@sps/shared-utils";
import fs from "node:fs";
import path from "node:path";

export const KNOWLEDGE_EMBEDDING_DIMENSIONS = 768;
export const KNOWLEDGE_DEFAULT_TOP_K = 6;
export const KNOWLEDGE_DEFAULT_CONTENT_ROOT = resolveKnowledgeContentRoot();
export const KNOWLEDGE_LLM_EMBEDDING_MODEL = "local/default-embedding";
export const KNOWLEDGE_DEFAULT_OPEN_ROUTER_EMBEDDING_MODEL =
  "qwen/qwen3-embedding-8b";

export type KnowledgeEmbeddingProvider = "llm" | "openrouter";

function resolveKnowledgeContentRoot() {
  if (process.env.KNOWLEDGE_CONTENT_ROOT) {
    return path.resolve(process.env.KNOWLEDGE_CONTENT_ROOT);
  }

  let currentPath = process.cwd();

  while (true) {
    const candidate = path.resolve(
      currentPath,
      "tools/digital-agency/project/content",
    );

    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parentPath = path.dirname(currentPath);

    if (parentPath === currentPath) {
      return path.resolve(
        process.cwd(),
        "tools/digital-agency/project/content",
      );
    }

    currentPath = parentPath;
  }
}

export function getKnowledgeConfiguration() {
  const embeddingProvider = resolveEmbeddingProvider(
    process.env.KNOWLEDGE_EMBEDDING_PROVIDER,
  );
  const embedding =
    embeddingProvider === "openrouter"
      ? {
          provider: embeddingProvider,
          url: "https://openrouter.ai/api/v1",
          model:
            process.env.KNOWLEDGE_OPEN_ROUTER_EMBEDDING_MODEL?.trim() ||
            KNOWLEDGE_DEFAULT_OPEN_ROUTER_EMBEDDING_MODEL,
          apiKey: process.env.OPEN_ROUTER_API_KEY?.trim() || "",
          dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
        }
      : {
          provider: embeddingProvider,
          url: LLM_SERVICE_URL,
          model: KNOWLEDGE_LLM_EMBEDDING_MODEL,
          apiKey: "",
          dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
        };

  return {
    llm: {
      url: LLM_SERVICE_URL,
    },
    embedding,
    indexing: {
      defaultRootPath: KNOWLEDGE_DEFAULT_CONTENT_ROOT,
      defaultLimit: 5,
    },
    search: {
      defaultTopK: KNOWLEDGE_DEFAULT_TOP_K,
    },
  };
}

function resolveEmbeddingProvider(value?: string): KnowledgeEmbeddingProvider {
  const provider = value?.trim().toLowerCase() || "llm";

  if (provider === "llm" || provider === "openrouter") {
    return provider;
  }

  throw new Error(
    `Unsupported KNOWLEDGE_EMBEDDING_PROVIDER=${value}. Expected llm or openrouter.`,
  );
}
