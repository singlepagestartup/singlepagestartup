import { getKnowledgeConfiguration } from "../configuration";
import { LlmEmbeddingClient } from "../embedding";
import { KnowledgeRepository } from "../repository";
import { KnowledgeDocumentIndexInput, KnowledgeIndexResult } from "../types";
import {
  discoverContentFiles,
  readKnowledgeSourceFile,
} from "./content-discovery";
import { chunkText } from "./chunker";
import { createHash } from "node:crypto";

export interface KnowledgeIndexerProps {
  repository?: KnowledgeRepository;
  embeddingClient?: LlmEmbeddingClient;
}

export class KnowledgeIndexer {
  private repository: KnowledgeRepository;
  private embeddingClient: LlmEmbeddingClient;

  constructor(props?: KnowledgeIndexerProps) {
    const config = getKnowledgeConfiguration();
    this.repository = props?.repository || new KnowledgeRepository();
    this.embeddingClient =
      props?.embeddingClient ||
      new LlmEmbeddingClient({
        baseUrl: config.llm.url,
        model: config.llm.embeddingModel,
        dimensions: config.llm.dimensions,
      });
  }

  async index(props?: {
    rootPath?: string;
    limit?: number;
    dryRun?: boolean;
    clear?: boolean;
    documentId?: string;
  }): Promise<KnowledgeIndexResult> {
    const config = getKnowledgeConfiguration();
    const rootPath = props?.rootPath || config.indexing.defaultRootPath;
    const limit = props?.limit ?? config.indexing.defaultLimit;
    const dryRun = Boolean(props?.dryRun);
    const result: KnowledgeIndexResult = {
      indexed: 0,
      skipped: 0,
      dryRun,
      sources: [],
    };

    if (props?.clear && !dryRun) {
      await this.repository.clearDerivedData();
    }

    if (!props?.documentId && !dryRun) {
      const files = await discoverContentFiles({ rootPath, limit });

      for (const filePath of files) {
        const sourceInput = await readKnowledgeSourceFile({
          rootPath,
          filePath,
        });
        await this.repository.upsertDocumentFromSourceInput(sourceInput);
      }
    }

    const documents = await this.repository.listDocumentsForIndex({
      limit: props?.documentId ? undefined : limit,
      documentId: props?.documentId,
    });

    for (const document of documents) {
      await this.indexDocument({ document, dryRun, result });
    }

    return result;
  }

  private async indexDocument(props: {
    document: KnowledgeDocumentIndexInput;
    dryRun: boolean;
    result: KnowledgeIndexResult;
  }) {
    const document = {
      ...props.document,
      title: normalizeIndexText(props.document.title),
      slug: normalizeIndexText(props.document.slug),
      description: normalizeIndexText(props.document.description),
      status: normalizeIndexText(props.document.status),
      metadata: toRecord(props.document.metadata),
    };
    const content = document.description.trim();
    const originalPath = this.repository.getDocumentOriginalPath(document.id);
    const contentHash = hashContent(content);
    const chunks = chunkText({ text: content });

    if (!content) {
      props.result.skipped += 1;
      props.result.sources.push({
        title: document.title,
        originalPath,
        chunks: 0,
        status: "skipped",
      });
      return;
    }

    const existing =
      await this.repository.findSourceByOriginalPath(originalPath);
    const alreadyIndexed =
      existing?.contentHash === contentHash
        ? await this.repository.hasSourceChunks(existing.id)
        : false;

    if (alreadyIndexed && props.document.contentHash === contentHash) {
      if (document.status !== "indexed") {
        await this.repository.updateDocumentIndexMetadata({
          documentId: document.id,
          contentHash,
        });
      }

      props.result.skipped += 1;
      props.result.sources.push({
        title: document.title,
        originalPath,
        chunks: 0,
        status: "skipped",
      });
      return;
    }

    if (props.dryRun) {
      props.result.sources.push({
        title: document.title,
        originalPath,
        chunks: chunks.length,
        status: "dry_run",
      });
      return;
    }

    const embeddings = await this.embeddingClient.embedMany(
      chunks.map((chunk) => chunk.text),
    );
    const source = await this.repository.upsertSourceForDocument({
      document,
      contentHash,
    });
    const importedFilePath = document.metadata.importedFilePath;

    if (typeof importedFilePath === "string" && importedFilePath) {
      await this.repository.ensureFileForSource({
        sourceId: source.id,
        filePath: importedFilePath,
      });
    }

    await this.repository.deleteChunksBySourceId(source.id);
    await this.repository.insertChunksForSource(
      source.id,
      chunks.map((chunk, index) => {
        return {
          text: chunk.text,
          embedding: embeddings[index],
          chunkIndex: chunk.chunkIndex,
          tokenEstimate: chunk.tokenEstimate,
          contentHash: chunk.contentHash,
          metadata: {
            ...chunk.metadata,
            documentId: document.id,
            documentSlug: document.slug,
          },
        };
      }),
    );
    await this.repository.updateDocumentIndexMetadata({
      documentId: document.id,
      contentHash,
    });

    props.result.indexed += 1;
    props.result.sources.push({
      title: document.title,
      originalPath,
      chunks: chunks.length,
      status: "indexed",
    });
  }
}

export function hashContent(content: unknown) {
  return createHash("sha256").update(normalizeIndexText(content)).digest("hex");
}

export function normalizeIndexText(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
