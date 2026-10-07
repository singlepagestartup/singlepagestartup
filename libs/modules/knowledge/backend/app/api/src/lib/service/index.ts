import { getKnowledgeConfiguration } from "../configuration";
import {
  createKnowledgeEmbeddingClient,
  IKnowledgeEmbeddingClient,
} from "../embedding";
import { LlmChatClient } from "../generation";
import { KnowledgeIndexer } from "../indexer";
import { LlmModelClient } from "../models";
import { KnowledgeRepository } from "../repository";
import {
  DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG,
  KnowledgeGenerationModelSlug,
  KnowledgeModelTask,
} from "@sps/knowledge/sdk/model";
import { KnowledgeSearchResult } from "../types";
import { MaterialService } from "./materials";

export interface IKnowledgePersona {
  title?: string | null;
  description?: unknown;
}

export class KnowledgeService {
  private repository: KnowledgeRepository;
  private embeddingClient: IKnowledgeEmbeddingClient;
  private generationClient: LlmChatClient;
  private modelClient: LlmModelClient;
  private materialService: MaterialService;

  constructor(props?: {
    repository?: KnowledgeRepository;
    embeddingClient?: IKnowledgeEmbeddingClient;
    generationClient?: LlmChatClient;
    modelClient?: LlmModelClient;
  }) {
    const config = getKnowledgeConfiguration();
    this.repository = props?.repository || new KnowledgeRepository();
    this.embeddingClient =
      props?.embeddingClient || createKnowledgeEmbeddingClient();
    this.generationClient =
      props?.generationClient ||
      new LlmChatClient({
        baseUrl: config.llm.url,
      });
    this.modelClient =
      props?.modelClient ||
      new LlmModelClient({
        baseUrl: config.llm.url,
      });
    this.materialService = new MaterialService({ repository: this.repository });
  }

  async status() {
    const config = getKnowledgeConfiguration();
    const counts = await this.repository.getStatus();

    return {
      ...counts,
      llmUrl: config.llm.url,
      embeddingProvider: config.embedding.provider,
      embeddingUrl: config.embedding.url,
      embeddingModel: config.embedding.model,
      embeddingDimensions: config.embedding.dimensions,
    };
  }

  async models(props?: { task?: KnowledgeModelTask }) {
    return this.modelClient.list(props);
  }

  async getModel(modelId: string) {
    return this.modelClient.get(modelId);
  }

  async listSources(props: { sourceIds: string[] }) {
    const sourceIds = this.normalizeSourceIds(props.sourceIds);

    if (!sourceIds.length) {
      return [];
    }

    const sources = await this.repository.findSourcesByIds(sourceIds);
    const sourcesById = new Map(
      sources.map((source) => {
        return [source.id, source];
      }),
    );

    return sourceIds
      .map((sourceId) => sourcesById.get(sourceId))
      .filter((source): source is NonNullable<typeof source> => {
        return Boolean(source);
      });
  }

  async updateSource(props: {
    sourceId: string;
    title?: string;
    content: string;
    description?: string | null;
    expectedContentHash?: string;
  }) {
    const source = await this.repository.updateSource(props);
    if (!source)
      throw new Error(`Knowledge Source ${props.sourceId} was not found.`);
    let indexError: string | undefined;
    if (source.indexedContentHash !== source.contentHash) {
      try {
        await this.index({ sourceId: source.id });
      } catch (error) {
        indexError = error instanceof Error ? error.message : String(error);
        console.error("Knowledge indexing failed", source.id, indexError);
      }
    }
    return {
      source: await this.repository.findSourceById(source.id),
      indexError,
    };
  }

  async deleteSource(sourceId: string) {
    const source = await this.repository.findSourceById(sourceId);

    if (!source) {
      throw new Error(`Knowledge source ${sourceId} was not found.`);
    }

    return this.repository.deleteSourceWithDerivedData(sourceId);
  }

  async search(props: {
    query: string;
    topK?: number;
    neighborWindow?: number;
    finalTopK?: number;
    minSimilarity?: number;
    sourceIds?: string[];
  }) {
    const query = props.query?.trim();

    if (!query) {
      throw new Error("Knowledge search query is required.");
    }

    const sourceIds = Array.isArray(props.sourceIds)
      ? this.normalizeSourceIds(props.sourceIds)
      : undefined;

    if (Array.isArray(props.sourceIds) && !sourceIds?.length) {
      return [];
    }

    const config = getKnowledgeConfiguration();
    const embedding = await this.embeddingClient.embed(query);
    const topK = Math.min(
      Math.max(Number(props.topK || config.search.defaultTopK), 1),
      50,
    );
    const neighborWindow = Math.min(
      Math.max(Math.floor(Number(props.neighborWindow || 0)), 0),
      5,
    );
    const seedChunks = await this.repository.searchChunks({
      embedding,
      topK,
      minSimilarity: props.minSimilarity,
      sourceIds,
    });

    const neighborChunks = neighborWindow
      ? await this.repository.findNeighborChunks({
          window: neighborWindow,
          seeds: seedChunks
            .filter((chunk) => Boolean(chunk.sourceId))
            .map((chunk) => {
              return {
                sourceId: chunk.sourceId as string,
                chunkIndex: chunk.chunkIndex,
                distance: chunk.distance,
                similarity: chunk.similarity,
              };
            }),
        })
      : [];
    const results = this.dedupeSearchResults([
      ...seedChunks,
      ...neighborChunks,
    ]);
    const finalTopK = props.finalTopK
      ? Math.min(Math.max(Number(props.finalTopK), 1), 50)
      : null;

    return finalTopK ? results.slice(0, finalTopK) : results;
  }

  async generate(props: {
    query: string;
    topK?: number;
    minSimilarity?: number;
    generationModelSlug?: KnowledgeGenerationModelSlug;
    sourceIds?: string[];
    persona?: IKnowledgePersona;
    skillInstructions?: {
      id: string;
      slug: string;
      title?: string | null;
      instructions: string;
    }[];
    chatHistory?: {
      role: "user" | "assistant";
      content: string;
    }[];
    useKnowledgeSearch?: boolean;
  }) {
    const generationModelSlug =
      props.generationModelSlug || DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG;
    const selectedModel = await this.modelClient.get(generationModelSlug);
    const contexts =
      props.useKnowledgeSearch === false
        ? []
        : await this.search({
            query: props.query,
            topK: props.topK,
            minSimilarity: props.minSimilarity,
            sourceIds: props.sourceIds,
          });
    const generation = await this.generationClient.generate({
      query: props.query,
      contexts,
      model: generationModelSlug,
      persona: props.persona,
      skillInstructions: props.skillInstructions,
      chatHistory: props.chatHistory,
    });

    return {
      answer: generation.answer,
      sources: contexts,
      generationModelSlug: generation.model || generationModelSlug,
      generationProvider: generation.provider || selectedModel.provider,
      generationModel: generation.providerModel || selectedModel.providerModel,
      usage: generation.usage,
    };
  }

  async index(props?: {
    rootPath?: string;
    limit?: number;
    dryRun?: boolean;
    clear?: boolean;
    sourceId?: string;
    force?: boolean;
  }) {
    if (!props?.dryRun) await this.assertEmbeddingModelDimensions();
    const indexer = new KnowledgeIndexer({
      repository: this.repository,
      embeddingClient: this.embeddingClient,
    });

    return indexer.index(props);
  }

  async reindexSource(id: string) {
    await this.assertEmbeddingModelDimensions();
    const source = await this.repository.findSourceById(id);

    if (!source) {
      throw new Error(`Knowledge source ${id} was not found.`);
    }

    const indexer = new KnowledgeIndexer({
      repository: this.repository,
      embeddingClient: this.embeddingClient,
    });

    return indexer.index({ sourceId: id, force: true });
  }

  async learnContent(props: {
    slug: string;
    title: string;
    content: string;
    description?: string | null;
    fileIds?: string[];
    onSourceSaved?: (sourceId: string) => Promise<void>;
  }) {
    const slug = props.slug.trim();
    if (!slug) throw new Error("Knowledge learn slug is required.");
    if (!props.content.trim() && !props.fileIds?.length)
      throw new Error("Knowledge learn content or files are required.");
    const source = await this.repository.upsertSourceBySlug(
      {
        slug,
        title: props.title.trim() || "Knowledge",
        content: props.content,
        description: props.description,
      },
      true,
    );
    if (!source) throw new Error("Knowledge Source could not be saved.");
    await props.onSourceSaved?.(source.id);
    let processingError: string | undefined;
    if (props.fileIds?.length) {
      await this.repository.attachFiles(source.id, props.fileIds);
      try {
        await this.rebuildFiles(source.id);
      } catch (error) {
        processingError =
          error instanceof Error ? error.message : String(error);
      }
    }
    let index: Awaited<ReturnType<KnowledgeService["index"]>> | undefined;
    let indexError: string | undefined;
    try {
      if (!processingError) index = await this.index({ sourceId: source.id });
    } catch (error) {
      indexError = error instanceof Error ? error.message : String(error);
      console.error("Knowledge indexing failed", source.id, indexError);
    }
    return {
      source: await this.repository.findSourceById(source.id),
      index,
      indexError,
      processingError,
    };
  }

  async rebuildFiles(sourceId: string) {
    // File analysis is implemented by the common Source service operation.
    const source = await this.materialService.rebuild(sourceId);
    if (!source) return;
    try {
      await this.index({ sourceId });
    } catch (error) {
      console.error(
        "Knowledge material saved; indexing failed",
        sourceId,
        error,
      );
    }
    return source;
  }

  private async assertEmbeddingModelDimensions() {
    const config = getKnowledgeConfiguration();

    if (config.embedding.provider === "openrouter") {
      return;
    }

    const model = await this.modelClient.get(config.embedding.model);

    if (model.dimensions !== config.embedding.dimensions) {
      throw new Error(
        `Knowledge embedding model ${model.id} must have ${config.embedding.dimensions} dimensions; got ${model.dimensions || "unknown"}.`,
      );
    }
  }

  private normalizeSourceIds(sourceIds: string[]) {
    return Array.from(
      new Set(
        sourceIds
          .map((sourceId) => this.toText(sourceId).trim())
          .filter((sourceId) => Boolean(sourceId)),
      ),
    );
  }

  private dedupeSearchResults(results: KnowledgeSearchResult[]) {
    const seen = new Set<string>();

    return results.filter((result) => {
      if (seen.has(result.id)) {
        return false;
      }

      seen.add(result.id);
      return true;
    });
  }

  private toTitle(value: string) {
    return this.toText(value).replace(/\s+/g, " ").trim().slice(0, 120);
  }

  private toText(value: unknown) {
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
}
