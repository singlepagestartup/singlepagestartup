import {
  KNOWLEDGE_OPEN_AI_EMBEDDING_MODEL,
  LLM_SERVICE_URL,
} from "@sps/shared-utils";
import fs from "node:fs";
import path from "node:path";

export const KNOWLEDGE_EMBEDDING_DIMENSIONS = 768;
export const KNOWLEDGE_DEFAULT_TOP_K = 6;
export const KNOWLEDGE_SCOPED_MIN_SIMILARITY = 0.25;
export const KNOWLEDGE_DEFAULT_CONTENT_ROOT = resolveKnowledgeContentRoot();
export const KNOWLEDGE_LLM_EMBEDDING_MODEL = "local/default-embedding";
export { KNOWLEDGE_OPEN_AI_EMBEDDING_MODEL };
export const KNOWLEDGE_OPEN_AI_ANALYSIS_MODEL = "gpt-4.1";
export const KNOWLEDGE_DEFAULT_OPEN_ROUTER_EMBEDDING_MODEL =
  "qwen/qwen3-embedding-8b";

// Only single-file demuxers. Keys are formats detected from the stored bytes.
export const knowledgeMediaDemuxers = new Map<string, string>([
  ["image/png", "png_pipe"],
  ["image/apng", "apng"],
  ["image/jpeg", "jpeg_pipe"],
  ["image/gif", "gif"],
  ["image/webp", "webp_pipe"],
  ["image/bmp", "bmp_pipe"],
  ["image/tiff", "tiff_pipe"],
  ["image/avif", "mov"],
  ["image/heic", "mov"],
  ["image/heif", "mov"],
  ["audio/mpeg", "mp3"],
  ["audio/aac", "aac"],
  ["audio/wav", "wav"],
  ["audio/flac", "flac"],
  ["audio/aiff", "aiff"],
  ["audio/amr", "amr"],
  ["audio/ogg", "ogg"],
  ["audio/ogg; codecs=opus", "ogg"],
  ["audio/mp4", "mov"],
  ["audio/x-m4a", "mov"],
  ["video/mp4", "mov"],
  ["video/x-m4v", "mov"],
  ["video/quicktime", "mov"],
  ["video/3gpp", "mov"],
  ["video/3gpp2", "mov"],
  ["video/webm", "matroska"],
  ["video/matroska", "matroska"],
  ["video/vnd.avi", "avi"],
  ["video/ogg", "ogg"],
  ["video/mpeg", "mpeg"],
  ["video/MP1S", "mpeg"],
  ["video/MP2P", "mpeg"],
  ["video/mp2t", "mpegts"],
]);
export const KNOWLEDGE_MAX_VIDEO_FRAMES = 120;
export const KNOWLEDGE_MAX_MEDIA_SECONDS = 3600;

export type KnowledgeEmbeddingProvider = "llm" | "openrouter" | "openai";

export interface IKnowledgeEmbeddingIdentity {
  provider: KnowledgeEmbeddingProvider;
  model: string;
  dimensions: number;
}

export function knowledgeEmbeddingIndexKey(
  embedding: IKnowledgeEmbeddingIdentity,
) {
  if (embedding.provider === "openai") {
    return `${embedding.provider}:${embedding.model}:${embedding.dimensions}:v1`;
  }
  return undefined;
}

function resolveKnowledgeContentRoot() {
  if (process.env.KNOWLEDGE_CONTENT_ROOT) {
    return path.resolve(process.env.KNOWLEDGE_CONTENT_ROOT);
  }

  let currentPath = process.cwd();

  while (true) {
    const candidate = path.resolve(
      currentPath,
      "apps/studio/workspace/singlepage/knowledge",
    );

    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parentPath = path.dirname(currentPath);

    if (parentPath === currentPath) {
      return path.resolve(
        process.cwd(),
        "apps/studio/workspace/singlepage/knowledge",
      );
    }

    currentPath = parentPath;
  }
}

export function getKnowledgeConfiguration() {
  return {
    llm: {
      url: LLM_SERVICE_URL,
    },
    embedding: embeddingConfiguration(process.env.KNOWLEDGE_EMBEDDING_PROVIDER),
    indexing: {
      defaultRootPath: KNOWLEDGE_DEFAULT_CONTENT_ROOT,
      defaultLimit: 5,
    },
    search: {
      defaultTopK: KNOWLEDGE_DEFAULT_TOP_K,
    },
  };
}

function embeddingConfiguration(value?: string): IKnowledgeEmbeddingIdentity & {
  url: string;
  apiKey: string;
} {
  const dimensions = KNOWLEDGE_EMBEDDING_DIMENSIONS;
  switch (value?.trim().toLowerCase() || "openai") {
    case "openai":
      return {
        provider: "openai",
        url: "https://api.openai.com/v1",
        model: KNOWLEDGE_OPEN_AI_EMBEDDING_MODEL,
        apiKey: process.env.OPEN_AI_API_KEY?.trim() || "",
        dimensions,
      };
    case "openrouter":
      return {
        provider: "openrouter",
        url: "https://openrouter.ai/api/v1",
        model:
          process.env.KNOWLEDGE_OPEN_ROUTER_EMBEDDING_MODEL?.trim() ||
          KNOWLEDGE_DEFAULT_OPEN_ROUTER_EMBEDDING_MODEL,
        apiKey: process.env.OPEN_ROUTER_API_KEY?.trim() || "",
        dimensions,
      };
    case "llm":
      return {
        provider: "llm",
        url: LLM_SERVICE_URL,
        model: KNOWLEDGE_LLM_EMBEDDING_MODEL,
        apiKey: "",
        dimensions,
      };
    default:
      throw new Error(
        "Unsupported KNOWLEDGE_EMBEDDING_PROVIDER. Expected llm, openrouter or openai.",
      );
  }
}
