import {
  createKnowledgeEmbeddingClient,
  IKnowledgeEmbeddingClient,
} from "../embedding";
import type { Service as SourceService } from "@sps/knowledge/models/source/backend/app/api/src/lib/service";
import { createService as createSource } from "@sps/knowledge/models/source/backend/app/api/src/lib/bootstrap";
import { KnowledgeIndexResult } from "../types";
import {
  getKnowledgeConfiguration,
  knowledgeEmbeddingIndexKey,
} from "../configuration";
import {
  discoverContentFiles,
  readKnowledgeSourceFile,
} from "./content-discovery";
import { chunkText } from "./chunker";
export { hashContent } from "../service/utils";

export interface KnowledgeIndexerProps {
  source?: SourceService;
  embeddingClient?: IKnowledgeEmbeddingClient;
  embeddingIndex?: string;
}

export class KnowledgeIndexer {
  private static readonly pending = new Map<string, Promise<number[][]>>();
  private source: SourceService;
  private embeddingClient: IKnowledgeEmbeddingClient;
  private embeddingIndex?: string;
  private embeddingKey: string;

  constructor(props?: KnowledgeIndexerProps) {
    this.source = props?.source ?? createSource();
    this.embeddingClient =
      props?.embeddingClient || createKnowledgeEmbeddingClient();
    const identity = getKnowledgeConfiguration().embedding;
    this.embeddingIndex =
      props?.embeddingIndex ?? knowledgeEmbeddingIndexKey(identity);
    this.embeddingKey = JSON.stringify([
      identity.provider,
      identity.model,
      identity.dimensions,
      this.embeddingIndex,
    ]);
  }

  async index(props?: {
    rootPath?: string;
    limit?: number;
    dryRun?: boolean;
    clear?: boolean;
    sourceId?: string;
    authorizedSourceIds?: string[];
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
    if (props?.clear && !props.dryRun) {
      await this.source.clearDerivedData();
    }
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
        if (source) {
          await this.source.ensureFileForSource({
            sourceId: source.id,
            filePath,
          });
        }
      }
    }
    let processed = 0;
    const maximum = props?.limit ?? Infinity;
    const collect = async (
      sources: Awaited<ReturnType<SourceService["listSourcesForIndex"]>>,
    ) => {
      for (const source of sources) {
        if (processed >= maximum) {
          break;
        }
        const chunks = chunkText({ text: source.content });
        const item = {
          sourceId: source.id,
          title: source.title,
          chunks: chunks.length,
          status: "skipped" as "indexed" | "skipped" | "dry_run",
        };
        if (props?.dryRun) {
          processed++;
          item.status = "dry_run";
          result.sources.push(item);
          continue;
        }
        if (
          !props?.force &&
          source.indexedContentHash === source.contentHash &&
          (!chunks.length ||
            (await this.source.hasEmbeddingIndex(
              [source.id],
              this.embeddingIndex,
              Boolean(props?.authorizedSourceIds),
            )))
        ) {
          result.skipped++;
          result.sources.push(item);
          continue;
        }
        processed++;
        const published = await this.publish(
          source.id,
          source.contentHash,
          chunks,
        );
        if (published) {
          result.indexed++;
          item.status = "indexed";
        } else if (
          props?.sourceId ||
          props?.authorizedSourceIds?.length === 1
        ) {
          throw new Error(
            "Conflict error. Knowledge Source changed before its index could be published.",
          );
        } else {
          result.skipped++;
        }
        result.sources.push(item);
      }
    };
    if (props?.authorizedSourceIds) {
      const sources = await this.source.findSourcesByIds(
        props.authorizedSourceIds,
      );
      if (props.authorizedSourceIds.length === 1 && !sources.length) {
        throw new Error("Not Found error. Knowledge Source is unavailable.");
      }
      await collect(sources);
    } else if (props?.sourceId) {
      const sources = await this.source.listSourcesForIndex({
        sourceId: props.sourceId,
        limit: 1,
      });
      await collect(sources);
    } else {
      const pageSize = 50;
      let afterId: string | undefined;
      while (processed < maximum) {
        const sources = await this.source.listSourcesForIndex({
          afterId,
          limit: pageSize,
        });
        await collect(sources);
        const lastId = sources.at(-1)?.id;
        if (sources.length < pageSize || !lastId || lastId === afterId) {
          break;
        }
        afterId = lastId;
      }
    }
    return result;
  }

  private async publish(
    sourceId: string,
    contentHash: string,
    chunks: ReturnType<typeof chunkText>,
  ) {
    const vectors = await this.computeEmbeddings(sourceId, contentHash, chunks);
    return this.source.publishChunks(
      sourceId,
      contentHash,
      chunks.map((chunk, index) => ({
        ...chunk,
        embedding: vectors[index],
        metadata: this.embeddingIndex
          ? { ...chunk.metadata, embeddingIndex: this.embeddingIndex }
          : chunk.metadata,
      })),
    );
  }

  private async computeEmbeddings(
    sourceId: string,
    contentHash: string,
    chunks: ReturnType<typeof chunkText>,
  ) {
    const key = JSON.stringify([sourceId, contentHash, this.embeddingKey]);
    const existing = KnowledgeIndexer.pending.get(key);
    if (existing) {
      return existing;
    }
    const operation = this.embedChunks(chunks);
    KnowledgeIndexer.pending.set(key, operation);
    try {
      return await operation;
    } finally {
      KnowledgeIndexer.pending.delete(key);
    }
  }

  private async embedChunks(chunks: ReturnType<typeof chunkText>) {
    try {
      const embeddings = await this.embeddingClient.embedMany(
        chunks.map((chunk) => chunk.text),
      );
      if (embeddings.length !== chunks.length) {
        throw new Error(
          "Knowledge embedding count does not match chunk count.",
        );
      }
      for (const [index, embedding] of embeddings.entries()) {
        this.embeddingClient.validateEmbedding(embedding, index);
      }
      return embeddings;
    } catch (cause) {
      throw Object.assign(
        new Error("Knowledge Source indexing is temporarily unavailable.", {
          cause,
        }),
        { status: 503 },
      );
    }
  }
}

export function normalizeIndexText(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}
