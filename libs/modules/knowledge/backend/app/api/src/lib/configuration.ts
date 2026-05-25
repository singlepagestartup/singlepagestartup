import { LLM_SERVICE_URL } from "@sps/shared-utils";
import fs from "node:fs";
import path from "node:path";

export const KNOWLEDGE_EMBEDDING_DIMENSIONS = 768;
export const KNOWLEDGE_DEFAULT_TOP_K = 6;
export const KNOWLEDGE_DEFAULT_CONTENT_ROOT = resolveKnowledgeContentRoot();

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
  return {
    llm: {
      url: LLM_SERVICE_URL,
      embeddingModel:
        process.env.KNOWLEDGE_EMBEDDING_MODEL || "nomic/nomic-embed-text",
      dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
    },
    indexing: {
      defaultRootPath: KNOWLEDGE_DEFAULT_CONTENT_ROOT,
      defaultLimit: 5,
    },
    search: {
      defaultTopK: KNOWLEDGE_DEFAULT_TOP_K,
    },
  };
}
