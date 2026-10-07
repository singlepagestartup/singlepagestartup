import { Table } from "@sps/knowledge/models/source/backend/repository/database";

export interface KnowledgeSourceInput {
  slug: string;
  title: string;
  content: string;
  description?: string | null;
}

export type KnowledgeSourceIndexInput = typeof Table.$inferSelect;

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
  distance: number | null;
  similarity: number | null;
  retrievalRole: "seed" | "neighbor";
  metadata: Record<string, unknown>;
}

export interface KnowledgeIndexResult {
  indexed: number;
  skipped: number;
  dryRun: boolean;
  sources: {
    sourceId: string;
    title: string;
    chunks: number;
    status: "indexed" | "skipped" | "dry_run";
  }[];
}
