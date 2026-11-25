import {
  getKnowledgeConfiguration,
  knowledgeEmbeddingIndexKey,
  KNOWLEDGE_SCOPED_MIN_SIMILARITY,
  type IKnowledgeEmbeddingIdentity,
} from "../../configuration";
import {
  createKnowledgeEmbeddingClient,
  IKnowledgeEmbeddingClient,
} from "../../embedding";
import { LlmChatClient } from "../../generation";
import { KnowledgeIndexer } from "../../indexer";
import { LlmModelClient } from "../../models";
import type { Service as SourceService } from "@sps/knowledge/models/source/backend/app/api/src/lib/service";
import { createService as createSource } from "@sps/knowledge/models/source/backend/app/api/src/lib/bootstrap";
import type { IAppAssembly } from "@sps/shared-backend-api";
import {
  DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG,
  KnowledgeGenerationModelSlug,
  KnowledgeModelTask,
} from "@sps/knowledge/sdk/model";
import { KnowledgeSearchResult } from "../../types";
import { Service as MaterialService } from "../materials";

export interface IKnowledgePersona {
  title?: string | null;
  description?: unknown;
}

interface IKnowledgeSearchOptions {
  query: string;
  sessionId?: string;
  topK?: number;
  neighborWindow?: number;
  finalTopK?: number;
  minSimilarity?: number;
}

export interface IAuthorizedKnowledgeSearch extends IKnowledgeSearchOptions {
  sourceIds: string[];
  personalSourceIds?: string[];
  embedQuery?: (
    query: string,
    config: IKnowledgeEmbeddingIdentity,
  ) => Promise<number[] | undefined>;
}

export class Service {
  readonly source: SourceService;
  private embeddingClient: IKnowledgeEmbeddingClient;
  private embeddingIdentity: IKnowledgeEmbeddingIdentity;
  private embeddingIndex?: string;
  private generationClient: LlmChatClient;
  private modelClient: LlmModelClient;

  constructor(props?: {
    source?: SourceService;
    assembly?: IAppAssembly;
    embeddingClient?: IKnowledgeEmbeddingClient;
    generationClient?: LlmChatClient;
    modelClient?: LlmModelClient;
  }) {
    const config = getKnowledgeConfiguration();
    const { provider, model, dimensions } = config.embedding;
    this.embeddingIdentity = { provider, model, dimensions };
    this.embeddingIndex = knowledgeEmbeddingIndexKey(this.embeddingIdentity);
    this.source = props?.source ?? createSource(props?.assembly);
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
  }

  async status() {
    const config = getKnowledgeConfiguration();
    const counts = await this.source.getStatus();

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

    const sources = await this.source.findSourcesByIds(sourceIds);
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

  async sourceFiles(sourceId: string) {
    return this.source.sourceFiles(sourceId);
  }

  async updateSource(props: {
    sourceId: string;
    title?: string;
    content: string;
    description?: string | null;
    expectedContentHash?: string;
    fileIds?: string[];
  }) {
    return this.source.withTransaction(async (source) => {
      const updated = await source.updateSourceWithAttachments(props);
      if (!updated) {
        throw new Error(
          "Conflict error. Knowledge Source changed. Refresh and retry.",
        );
      }
      if (updated.attachmentsChanged) {
        await this.rebuildFiles(props.sourceId, source);
      } else {
        await this.indexAuthorizedSource({ sourceId: props.sourceId }, source);
      }
      const saved = await source.findSourceById(props.sourceId);
      return { source: saved! };
    });
  }

  async deleteSource(sourceId: string) {
    const source = await this.source.findSourceById(sourceId);

    if (!source) {
      throw new Error(
        `Not Found error. Knowledge source ${sourceId} was not found.`,
      );
    }

    return this.source.deleteSourceWithDerivedData(sourceId);
  }

  async updateStoredFile(props: {
    id: string;
    data: NonNullable<Parameters<SourceService["mutateStoredFile"]>[0]["data"]>;
  }) {
    if (
      !props.data ||
      typeof props.data !== "object" ||
      Array.isArray(props.data)
    )
      throw new Error("Validation error. File data must be an object.");
    return this.mutateStoredFile({ action: "update", ...props });
  }

  async deleteStoredFile(props: { id: string }) {
    const relation = await this.mutateStoredFile({
      action: "delete",
      ...props,
    });

    return relation!;
  }

  private async mutateStoredFile(
    props: Parameters<SourceService["mutateStoredFile"]>[0],
  ) {
    const result = await this.source.mutateStoredFile(props);
    return result.file;
  }

  search(props: IKnowledgeSearchOptions & { sourceIds?: string[] }) {
    return this.searchWithScope(props);
  }

  searchAuthorizedSources(props: IAuthorizedKnowledgeSearch) {
    if (!Array.isArray(props.sourceIds)) {
      throw new Error(
        "Validation error. Authorized knowledge source IDs are required.",
      );
    }
    const { embedQuery, personalSourceIds } = props;
    return this.searchWithScope(props, { embedQuery, personalSourceIds });
  }

  indexAuthorizedSource(
    { sourceId }: { sourceId: string },
    source = this.source,
  ) {
    return this.indexer(source).index({
      authorizedSourceIds: this.normalizeSourceIds([sourceId]),
    });
  }

  private async searchWithScope(
    props: IKnowledgeSearchOptions & { sourceIds?: string[] },
    authorized?: Pick<
      IAuthorizedKnowledgeSearch,
      "embedQuery" | "personalSourceIds"
    >,
  ) {
    const sourceIds = Array.isArray(props.sourceIds)
      ? this.normalizeSourceIds(props.sourceIds)
      : undefined;
    if (sourceIds?.length === 0) {
      return [];
    }
    const query = props.query?.trim();

    if (!query) {
      throw new Error("Validation error. Knowledge search query is required.");
    }

    if (authorized && sourceIds) {
      const available = await this.source.hasEmbeddingIndex(
        sourceIds,
        this.embeddingIndex,
        true,
      );
      if (!available) {
        return [];
      }
    }

    const config = getKnowledgeConfiguration();
    let embedding;
    if (authorized?.embedQuery) {
      embedding = await authorized.embedQuery(query, {
        ...this.embeddingIdentity,
      });
      if (!embedding) {
        return [];
      }
      this.embeddingClient.validateEmbedding(embedding);
    } else if (props.sessionId) {
      embedding = await this.embeddingClient.embed(query, {
        sessionId: props.sessionId,
      });
    } else {
      embedding = await this.embeddingClient.embed(query);
    }
    const topK = Math.min(
      Math.max(Number(props.topK || config.search.defaultTopK), 1),
      50,
    );
    const neighborWindow = Math.min(
      Math.max(Math.floor(Number(props.neighborWindow || 0)), 0),
      5,
    );
    const finalTopK = props.finalTopK
      ? Math.min(Math.max(Number(props.finalTopK), 1), 50)
      : null;

    const indexScope = {
      ...(authorized && { includeCustomerMemory: true }),
      ...(this.embeddingIndex && { embeddingIndex: this.embeddingIndex }),
    };
    const retrieve = async (ids: string[] | undefined) => {
      const seedChunks = await this.source.searchChunks({
        embedding,
        topK,
        minSimilarity:
          props.minSimilarity ??
          (authorized ? KNOWLEDGE_SCOPED_MIN_SIMILARITY : undefined),
        sourceIds: ids,
        ...indexScope,
      });
      if (!neighborWindow) {
        return this.dedupeSearchResults(seedChunks);
      }
      const neighborChunks = await this.source.findNeighborChunks({
        window: neighborWindow,
        ...indexScope,
        seeds: seedChunks
          .filter((chunk) => Boolean(chunk.sourceId))
          .map((chunk) => ({
            sourceId: chunk.sourceId as string,
            ...(chunk.sourceVersion && { sourceVersion: chunk.sourceVersion }),
            chunkIndex: chunk.chunkIndex,
            distance: chunk.distance,
            similarity: chunk.similarity,
          })),
      });
      return this.dedupeSearchResults([...seedChunks, ...neighborChunks]);
    };

    if (sourceIds && authorized?.personalSourceIds?.length) {
      const personal = new Set(
        this.normalizeSourceIds(authorized.personalSourceIds),
      );
      const staffIds = sourceIds.filter((id) => !personal.has(id));
      const personalIds = sourceIds.filter((id) => personal.has(id));
      if (staffIds.length && personalIds.length) {
        const [staffResults, personalResults] = await Promise.all([
          retrieve(staffIds),
          retrieve(personalIds),
        ]);
        const limit = finalTopK ?? topK;
        const personalReserve = Math.min(
          Math.floor(limit / 2),
          personalResults.length,
        );
        const staff = staffResults.slice(0, limit - personalReserve);
        return [...staff, ...personalResults.slice(0, limit - staff.length)];
      }
    }
    const results = await retrieve(sourceIds);

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
    let contexts;
    if (props.useKnowledgeSearch === false) {
      contexts = [];
    } else {
      contexts = await this.search({
        query: props.query,
        topK: props.topK,
        minSimilarity: props.minSimilarity,
        sourceIds: props.sourceIds,
      });
    }
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
    if (!props?.dryRun) {
      await this.assertEmbeddingModelDimensions();
    }
    return this.indexer().index({
      rootPath: props?.rootPath,
      limit: props?.limit,
      dryRun: props?.dryRun,
      clear: props?.clear,
      sourceId: props?.sourceId,
      force: props?.force,
    });
  }

  async reindexSource(id: string) {
    await this.assertEmbeddingModelDimensions();
    const source = await this.source.findSourceById(id);

    if (!source) {
      throw new Error(`Not Found error. Knowledge source ${id} was not found.`);
    }

    return this.indexer().index({ sourceId: id, force: true });
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
    if (!slug)
      throw new Error("Validation error. Knowledge learn slug is required.");
    if (!props.content.trim() && !props.fileIds?.length)
      throw new Error(
        "Validation error. Knowledge learn content or files are required.",
      );
    if (props.fileIds?.length)
      await this.source.validateAttachments(props.fileIds);
    return this.source.withTransaction(async (scope) => {
      const source = await scope.upsertSourceBySlug(
        {
          slug,
          title: props.title.trim() || "Knowledge",
          content: props.content,
          description: props.description,
        },
        true,
      );
      await props.onSourceSaved?.(source.id);
      if (props.fileIds?.length) {
        await scope.attachFiles(source.id, props.fileIds);
        await new MaterialService({ source: scope }).rebuild(source.id);
      }
      const index = await this.indexAuthorizedSource(
        { sourceId: source.id },
        scope,
      );
      const saved = await scope.findSourceById(source.id);
      return { source: saved!, index };
    });
  }

  async rebuildFiles(sourceId: string, source = this.source) {
    return source.withTransaction(async (scope) => {
      const analyzed = await new MaterialService({ source: scope }).rebuild(
        sourceId,
      );
      if (!analyzed) {
        throw new Error("Not Found error. Knowledge Source is unavailable.");
      }
      await this.indexAuthorizedSource({ sourceId }, scope);
      return scope.findSourceById(sourceId);
    });
  }

  private async assertEmbeddingModelDimensions() {
    const embedding = this.embeddingIdentity;
    if (embedding.provider !== "llm") {
      return;
    }

    const model = await this.modelClient.get(embedding.model);

    if (model.dimensions !== embedding.dimensions) {
      throw new Error(
        `Knowledge embedding model ${model.id} must have ${embedding.dimensions} dimensions; got ${model.dimensions || "unknown"}.`,
      );
    }
  }

  private indexer(source = this.source) {
    return new KnowledgeIndexer({
      source,
      embeddingClient: this.embeddingClient,
      embeddingIndex: this.embeddingIndex,
    });
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
