export interface KnowledgeSourceInput {
  title: string;
  type: string;
  content: string;
  description?: string | null;
  originalPath: string;
  contentHash: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeChunkInput {
  text: string;
  embedding: number[];
  chunkIndex: number;
  tokenEstimate: number;
  contentHash: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeSearchResult {
  id: string;
  text: string;
  chunkIndex: number;
  sourceId: string | null;
  sourceTitle: string | null;
  sourceOriginalPath: string | null;
  sourceType: string | null;
  distance: number | null;
  similarity: number | null;
  retrievalRole: "seed" | "neighbor";
  metadata: Record<string, unknown>;
}

export interface KnowledgeDocumentIndexInput {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  summary?: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  contentHash: string;
  lastIndexedAt?: Date | null;
}

export interface KnowledgeIndexResult {
  indexed: number;
  skipped: number;
  dryRun: boolean;
  sources: {
    title: string;
    originalPath: string;
    chunks: number;
    status: "indexed" | "skipped" | "dry_run";
  }[];
}
