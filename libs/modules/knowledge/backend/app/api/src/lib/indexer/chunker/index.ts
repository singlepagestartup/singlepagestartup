import { createHash } from "node:crypto";

export interface ChunkTextProps {
  text: string;
  chunkTokens?: number;
  overlapTokens?: number;
}

export interface TextChunk {
  text: string;
  chunkIndex: number;
  tokenEstimate: number;
  contentHash: string;
  metadata: {
    startToken: number;
    endToken: number;
  };
}

const DEFAULT_CHUNK_WORDS = 180;
const DEFAULT_OVERLAP_WORDS = 30;

export function estimateTokens(text: string) {
  return Math.max(
    1,
    Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.3),
  );
}

export function chunkText(props: ChunkTextProps): TextChunk[] {
  const chunkTokens = props.chunkTokens || DEFAULT_CHUNK_WORDS;
  const overlapTokens = props.overlapTokens || DEFAULT_OVERLAP_WORDS;
  const normalized = props.text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [];
  }

  const words = normalized.split(/\s+/);

  if (words.length <= chunkTokens) {
    return [
      {
        text: normalized,
        chunkIndex: 0,
        tokenEstimate: estimateTokens(normalized),
        contentHash: hashText(normalized),
        metadata: {
          startToken: 0,
          endToken: estimateTokens(normalized),
        },
      },
    ];
  }

  const chunks: TextChunk[] = [];
  const step = Math.max(1, chunkTokens - overlapTokens);

  for (let start = 0; start < words.length; start += step) {
    const end = Math.min(words.length, start + chunkTokens);
    const text = words.slice(start, end).join(" ");
    const tokenEstimate = estimateTokens(text);

    chunks.push({
      text,
      chunkIndex: chunks.length,
      tokenEstimate,
      contentHash: hashText(text),
      metadata: {
        startToken: Math.ceil(start * 1.3),
        endToken: Math.ceil(start * 1.3) + tokenEstimate,
      },
    });

    if (end >= words.length) {
      break;
    }
  }

  return chunks;
}

export function hashText(text: string) {
  return createHash("sha256").update(text).digest("hex");
}
