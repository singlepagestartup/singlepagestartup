import { getKnowledgeConfiguration } from "./configuration";
import { LlmEmbeddingClient } from "./embedding";
import { LlmChatClient } from "./generation";
import { KnowledgeIndexer } from "./indexer";
import { LlmModelClient } from "./models";
import { KnowledgeRepository } from "./repository";
import {
  DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG,
  KnowledgeGenerationModelSlug,
  KnowledgeModelTask,
} from "@sps/knowledge/sdk/model";

export interface IKnowledgePersona {
  title?: string | null;
  description?: unknown;
}

export class KnowledgeService {
  private repository: KnowledgeRepository;
  private embeddingClient: LlmEmbeddingClient;
  private generationClient: LlmChatClient;
  private modelClient: LlmModelClient;

  constructor(props?: {
    repository?: KnowledgeRepository;
    embeddingClient?: LlmEmbeddingClient;
    generationClient?: LlmChatClient;
    modelClient?: LlmModelClient;
  }) {
    const config = getKnowledgeConfiguration();
    this.repository = props?.repository || new KnowledgeRepository();
    this.embeddingClient =
      props?.embeddingClient ||
      new LlmEmbeddingClient({
        baseUrl: config.llm.url,
        model: config.llm.embeddingModel,
        dimensions: config.llm.dimensions,
      });
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
    const counts = await this.repository.getStatus();

    return {
      ...counts,
      llmUrl: config.llm.url,
      embeddingModel: config.llm.embeddingModel,
      embeddingDimensions: config.llm.dimensions,
    };
  }

  async models(props?: { task?: KnowledgeModelTask }) {
    return this.modelClient.list(props);
  }

  async listDocuments(props: { documentIds: string[] }) {
    const documentIds = this.normalizeDocumentIds(props.documentIds);

    if (!documentIds.length) {
      return [];
    }

    const documents = await this.repository.findDocumentsByIds(documentIds);
    const documentsById = new Map(
      documents.map((document) => {
        return [document.id, document];
      }),
    );

    return documentIds
      .map((documentId) => documentsById.get(documentId))
      .filter((document): document is NonNullable<typeof document> => {
        return Boolean(document);
      });
  }

  async updateDocument(props: {
    documentId: string;
    title: string;
    description: string;
  }) {
    const document = await this.repository.findDocumentById(props.documentId);

    if (!document) {
      throw new Error(`Knowledge document ${props.documentId} was not found.`);
    }

    return this.repository.updateDocumentDescription({
      documentId: props.documentId,
      title: props.title,
      description: props.description,
    });
  }

  async search(props: {
    query: string;
    topK?: number;
    minSimilarity?: number;
    documentIds?: string[];
  }) {
    const query = props.query?.trim();

    if (!query) {
      throw new Error("Knowledge search query is required.");
    }

    const documentIds = Array.isArray(props.documentIds)
      ? this.normalizeDocumentIds(props.documentIds)
      : undefined;

    if (Array.isArray(props.documentIds) && !documentIds?.length) {
      return [];
    }

    const config = getKnowledgeConfiguration();
    const embedding = await this.embeddingClient.embed(query);

    return this.repository.searchChunks({
      embedding,
      topK: Math.min(
        Math.max(Number(props.topK || config.search.defaultTopK), 1),
        20,
      ),
      minSimilarity: props.minSimilarity,
      documentIds,
    });
  }

  async generate(props: {
    query: string;
    topK?: number;
    minSimilarity?: number;
    generationModelSlug?: KnowledgeGenerationModelSlug;
    documentIds?: string[];
    persona?: IKnowledgePersona;
  }) {
    const generationModelSlug =
      props.generationModelSlug || DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG;
    const selectedModel = await this.modelClient.get(generationModelSlug);
    const contexts = await this.search({
      query: props.query,
      topK: props.topK,
      minSimilarity: props.minSimilarity,
      documentIds: props.documentIds,
    });
    const generation = await this.generationClient.generate({
      query: props.query,
      contexts,
      model: generationModelSlug,
      persona: props.persona,
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
    documentId?: string;
  }) {
    await this.assertEmbeddingModelDimensions();
    const indexer = new KnowledgeIndexer({
      repository: this.repository,
      embeddingClient: this.embeddingClient,
    });

    return indexer.index(props);
  }

  async reindexDocument(id: string) {
    await this.assertEmbeddingModelDimensions();
    const document = await this.repository.findDocumentById(id);

    if (!document) {
      throw new Error(`Knowledge document ${id} was not found.`);
    }

    const indexer = new KnowledgeIndexer({
      repository: this.repository,
      embeddingClient: this.embeddingClient,
    });

    return indexer.index({ documentId: id });
  }

  async learnContent(props: {
    slug: string;
    title: string;
    content: string;
    summary?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const slug = this.toText(props.slug).trim();
    const content = this.toText(props.content).trim();
    const title =
      this.toText(props.title).trim() || this.toTitle(content) || "Knowledge";

    if (!slug) {
      throw new Error("Knowledge learn slug is required.");
    }

    if (!content) {
      throw new Error("Knowledge learn content is required.");
    }

    try {
      await this.assertEmbeddingModelDimensions();
    } catch (error) {
      throw new Error(
        `Knowledge learn embedding model check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const document = await this.repository.upsertDocumentBySlug({
      slug,
      title,
      description: content,
      summary: props.summary || null,
      status: "imported",
      metadata: props.metadata || {},
    });

    let index: Awaited<ReturnType<KnowledgeService["index"]>>;

    try {
      index = await this.index({ documentId: document.id });
    } catch (error) {
      throw new Error(
        `Knowledge learn document indexing failed documentId=${document.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      document,
      index,
    };
  }

  async approveEditSuggestion(id: string) {
    const suggestion = await this.repository.findEditSuggestionById(id);

    if (!suggestion) {
      throw new Error(`Knowledge edit suggestion ${id} was not found.`);
    }

    if (suggestion.status === "approved") {
      throw new Error(`Knowledge edit suggestion ${id} is already approved.`);
    }

    const document =
      suggestion.operation === "create"
        ? await this.repository.createDocumentFromSuggestion({
            title: suggestion.title,
            description: suggestion.proposedDescription,
            metadata: {
              createdFromEditSuggestionId: suggestion.id,
            },
          })
        : suggestion.targetDocumentId
          ? await this.repository.updateDocumentDescription({
              documentId: suggestion.targetDocumentId,
              title: suggestion.title,
              description: suggestion.proposedDescription,
            })
          : null;

    if (!document) {
      throw new Error(
        `Knowledge edit suggestion ${id} does not reference a target document.`,
      );
    }

    await this.repository.updateEditSuggestionStatus({
      id,
      status: "approved",
      metadata: {
        ...(suggestion.metadata || {}),
        appliedDocumentId: document.id,
        appliedAt: new Date().toISOString(),
      },
    });

    const index = await this.index({ documentId: document.id });

    return { document, index };
  }

  async rejectEditSuggestion(id: string) {
    const suggestion = await this.repository.findEditSuggestionById(id);

    if (!suggestion) {
      throw new Error(`Knowledge edit suggestion ${id} was not found.`);
    }

    return this.repository.updateEditSuggestionStatus({
      id,
      status: "rejected",
      metadata: {
        ...(suggestion.metadata || {}),
        rejectedAt: new Date().toISOString(),
      },
    });
  }

  private async assertEmbeddingModelDimensions() {
    const config = getKnowledgeConfiguration();
    const model = await this.modelClient.get(config.llm.embeddingModel);

    if (model.dimensions !== config.llm.dimensions) {
      throw new Error(
        `Knowledge embedding model ${model.id} must have ${config.llm.dimensions} dimensions; got ${model.dimensions || "unknown"}.`,
      );
    }
  }

  private normalizeDocumentIds(documentIds: string[]) {
    return Array.from(
      new Set(
        documentIds
          .map((documentId) => this.toText(documentId).trim())
          .filter((documentId) => Boolean(documentId)),
      ),
    );
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
