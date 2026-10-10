import {
  createKnowledgeEmbeddingClient,
  IKnowledgeEmbeddingClient,
} from "../embedding";
import { KnowledgeRepository } from "../repository";
import { KnowledgeIndexResult } from "../types";
import {
  discoverContentFiles,
  readKnowledgeSourceFile,
} from "./content-discovery";
import { chunkText } from "./chunker";
export { hashContent } from "../service/utils";

export interface KnowledgeIndexerProps {
  repository?: KnowledgeRepository;
  embeddingClient?: IKnowledgeEmbeddingClient;
}

export class KnowledgeIndexer {
  private repository: KnowledgeRepository;
  private embeddingClient: IKnowledgeEmbeddingClient;

  constructor(props?: KnowledgeIndexerProps) {
    this.repository = props?.repository || new KnowledgeRepository();
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
    if (props?.clear && !props.dryRun) await this.repository.clearDerivedData();
    if (props?.rootPath && !props.sourceId) {
      for (const filePath of await discoverContentFiles({
        rootPath: props.rootPath,
        limit: props.limit,
      })) {
        const input = await readKnowledgeSourceFile({
          rootPath: props.rootPath,
          filePath,
        });
        if (props.dryRun) {
          result.sources.push({
            sourceId: "",
            title: input.title,
            chunks: chunkText({ text: input.content }).length,
            status: "dry_run",
          });
        } else {
          const source = await this.repository.upsertSourceBySlug(input);
          if (source)
            await this.repository.ensureFileForSource({
              sourceId: source.id,
              filePath,
            });
        }
      }
    }
    for (const source of await this.repository.listSourcesForIndex({
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
      const published = await this.repository.publishChunks(
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
