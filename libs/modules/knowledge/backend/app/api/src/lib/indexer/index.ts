import {
  createKnowledgeEmbeddingClient,
  IKnowledgeEmbeddingClient,
} from "../embedding";
import type { Service as SourceService } from "@sps/knowledge/models/source/backend/app/api/src/lib/service";
import { createKnowledgeServices } from "../composition";
import { KnowledgeIndexResult } from "../types";
import {
  discoverContentFiles,
  readKnowledgeSourceFile,
} from "./content-discovery";
import { chunkText } from "./chunker";
export { hashContent } from "../service/utils";

export interface KnowledgeIndexerProps {
  source?: SourceService;
  embeddingClient?: IKnowledgeEmbeddingClient;
}

export class KnowledgeIndexer {
  private source: SourceService;
  private embeddingClient: IKnowledgeEmbeddingClient;

  constructor(props?: KnowledgeIndexerProps) {
    this.source = props?.source || createKnowledgeServices().source;
    this.embeddingClient =
      props?.embeddingClient || createKnowledgeEmbeddingClient();
  }

  async index(props?: {
    rootPath?: string;
    limit?: number;
    dryRun?: boolean;
    clear?: boolean;
    sourceId?: string;
    force?: boolean;
  }): Promise<KnowledgeIndexResult> {
    const result: KnowledgeIndexResult = {
      indexed: 0,
      skipped: 0,
      dryRun: Boolean(props?.dryRun),
      sources: [],
    };
    const imports: {
      filePath: string;
      input: Awaited<ReturnType<typeof readKnowledgeSourceFile>>;
    }[] = [];
    if (props?.rootPath && !props.sourceId) {
      for (const filePath of await discoverContentFiles({
        rootPath: props.rootPath,
        limit: props.limit,
      })) {
        const input = await readKnowledgeSourceFile({
          rootPath: props.rootPath,
          filePath,
        });
        imports.push({ filePath, input });
      }
    }
    // Validate every import before clearing an index or saving the first Source.
    if (props?.clear && !props.dryRun) await this.source.clearDerivedData();
    for (const { filePath, input } of imports) {
      if (props?.dryRun) {
        result.sources.push({
          sourceId: "",
          title: input.title,
          chunks: chunkText({ text: input.content }).length,
          status: "dry_run",
        });
      } else {
        const source = await this.source.upsertSourceBySlug(input);
        if (source)
          await this.source.ensureFileForSource({
            sourceId: source.id,
            filePath,
          });
      }
    }
    for (const source of await this.source.listSourcesForIndex({
      sourceId: props?.sourceId,
      limit: props?.limit,
    })) {
      const chunks = chunkText({ text: source.content });
      const item = {
        sourceId: source.id,
        title: source.title,
        chunks: chunks.length,
        status: "skipped" as "indexed" | "skipped" | "dry_run",
      };
      if (props?.dryRun) {
        item.status = "dry_run";
        result.sources.push(item);
        continue;
      }
      if (!props?.force && source.indexedContentHash === source.contentHash) {
        result.skipped++;
        result.sources.push(item);
        continue;
      }
      const embeddings = await this.embeddingClient.embedMany(
        chunks.map((chunk) => chunk.text),
      );
      if (embeddings.length !== chunks.length)
        throw new Error(
          "Knowledge embedding count does not match chunk count.",
        );
      embeddings.forEach((vector, index) =>
        this.embeddingClient.validateEmbedding(vector, index),
      );
      const published = await this.source.publishChunks(
        source.id,
        source.contentHash,
        chunks.map((chunk, index) => ({
          ...chunk,
          embedding: embeddings[index],
        })),
      );
      if (published) {
        result.indexed++;
        item.status = "indexed";
      } else result.skipped++;
      result.sources.push(item);
    }
    return result;
  }
}

export function normalizeIndexText(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}
