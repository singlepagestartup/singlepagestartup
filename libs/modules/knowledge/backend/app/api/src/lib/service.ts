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

  async search(props: {
    query: string;
    topK?: number;
    minSimilarity?: number;
    profileId?: string;
  }) {
    const query = props.query?.trim();

    if (!query) {
      throw new Error("Knowledge search query is required.");
    }

    const config = getKnowledgeConfiguration();
    const embedding = await this.embeddingClient.embed(query);
    const documents = props.profileId
      ? await this.repository.findDocumentsByProfileId(props.profileId)
      : undefined;

    if (props.profileId && !documents?.length) {
      return [];
    }

    return this.repository.searchChunks({
      embedding,
      topK: Math.min(
        Math.max(Number(props.topK || config.search.defaultTopK), 1),
        20,
      ),
      minSimilarity: props.minSimilarity,
      documentIds: documents?.map((document) => document.id),
    });
  }

  async generate(props: {
    query: string;
    topK?: number;
    minSimilarity?: number;
    generationModelSlug?: KnowledgeGenerationModelSlug;
    profileId?: string;
  }) {
    const generationModelSlug =
      props.generationModelSlug || DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG;
    const selectedModel = await this.modelClient.get(generationModelSlug);
    const contexts = await this.search(props);
    const profile = props.profileId
      ? await this.repository.findProfileById(props.profileId)
      : undefined;
    const generation = await this.generationClient.generate({
      query: props.query,
      contexts,
      model: generationModelSlug,
      profile: profile
        ? {
            title: profile.adminTitle,
            description: profile.description,
          }
        : undefined,
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

  async chatMessage(props: {
    profileId: string;
    threadId?: string;
    message: string;
    modelSlug?: KnowledgeGenerationModelSlug;
    topK?: number;
    minSimilarity?: number;
    editSuggestion?: {
      title: string;
      operation?: "create" | "update";
      targetDocumentId?: string | null;
      proposedDescription: string;
      rationale?: string;
    };
  }) {
    const message = props.message?.trim();

    if (!props.profileId) {
      throw new Error("profileId is required for Knowledge chat.");
    }

    if (!message) {
      throw new Error("Knowledge chat message is required.");
    }

    const documents = await this.repository.findDocumentsByProfileId(
      props.profileId,
    );

    if (!documents.length) {
      throw new Error(
        "Selected profile has no linked knowledge documents. Link documents through profiles-to-knowledge-module-documents before chatting.",
      );
    }

    const profile = await this.repository.findProfileById(props.profileId);

    if (!profile) {
      throw new Error(`Profile ${props.profileId} was not found.`);
    }

    const threadId =
      props.threadId ||
      (
        await this.repository.createKnowledgeThread({
          profileId: props.profileId,
          message,
        })
      ).thread.id;

    const userMessage = await this.repository.createThreadMessage({
      profileId: props.profileId,
      threadId,
      role: "user",
      content: message,
      metadata: {
        knowledge: {
          profileId: props.profileId,
          documentIds: documents.map((document) => document.id),
        },
      },
    });

    const history = await this.repository.listThreadMessages(threadId);
    const generationModelSlug =
      props.modelSlug || DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG;
    const selectedModel = await this.modelClient.get(generationModelSlug);
    const contexts = await this.search({
      query: message,
      topK: props.topK,
      minSimilarity: props.minSimilarity,
      profileId: props.profileId,
    });
    const generation = await this.generationClient.generate({
      query: message,
      contexts,
      model: generationModelSlug,
      profile: {
        title: profile.adminTitle,
        description: profile.description,
      },
      chatHistory: history.map((entry) => {
        return {
          role: entry.role,
          content: entry.content,
        };
      }),
    });
    const assistantMessage = await this.repository.createThreadMessage({
      profileId: props.profileId,
      threadId,
      role: "assistant",
      content: generation.answer,
      metadata: {
        knowledge: {
          profileId: props.profileId,
          documentIds: documents.map((document) => document.id),
          citations: contexts,
          generationModelSlug: generation.model || generationModelSlug,
          generationProvider: generation.provider || selectedModel.provider,
          generationModel:
            generation.providerModel || selectedModel.providerModel,
          usage: generation.usage,
        },
      },
    });
    const editSuggestion = props.editSuggestion?.proposedDescription?.trim()
      ? await this.repository.createEditSuggestion({
          title: props.editSuggestion.title,
          operation: props.editSuggestion.operation || "update",
          targetDocumentId: props.editSuggestion.targetDocumentId || null,
          proposedDescription: props.editSuggestion.proposedDescription,
          rationale: props.editSuggestion.rationale || "",
          metadata: {
            profileId: props.profileId,
            threadId,
            userMessageId: userMessage.id,
            assistantMessageId: assistantMessage.id,
            source: "knowledge-chat",
          },
        })
      : undefined;

    return {
      threadId,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      editSuggestionId: editSuggestion?.id,
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

  async ingestTranscript(props: {
    profileId: string;
    chatId: string;
    threadId: string;
    skillId: string;
    skillSlug?: string | null;
    title?: string | null;
    transcript: string;
    metadata?: Record<string, unknown>;
  }) {
    const transcript = this.toText(props.transcript).trim();

    if (!transcript) {
      throw new Error("Transcript is required.");
    }

    try {
      await this.assertEmbeddingModelDimensions();
    } catch (error) {
      throw new Error(
        `Knowledge transcript embedding model check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    let document: Awaited<
      ReturnType<KnowledgeRepository["upsertTranscriptDocumentForProfile"]>
    >;

    try {
      document = await this.repository.upsertTranscriptDocumentForProfile({
        ...props,
        transcript,
      });
    } catch (error) {
      throw new Error(
        `Knowledge transcript document upsert failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    let index: Awaited<ReturnType<KnowledgeService["index"]>>;

    try {
      index = await this.index({ documentId: document.id });
    } catch (error) {
      throw new Error(
        `Knowledge transcript document indexing failed documentId=${document.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      document,
      index,
    };
  }

  async learnFromChatMessage(props: {
    profileId: string;
    chatId: string;
    threadId: string;
    messageId: string;
    fileId?: string | null;
    fileName?: string | null;
    filePath?: string | null;
    title?: string | null;
    content: string;
    metadata?: Record<string, unknown>;
  }) {
    const content = this.toText(props.content).trim();

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

    let document: Awaited<
      ReturnType<KnowledgeRepository["upsertChatLearnDocumentForProfile"]>
    >;

    try {
      document = await this.repository.upsertChatLearnDocumentForProfile({
        ...props,
        content,
      });
    } catch (error) {
      throw new Error(
        `Knowledge learn document upsert failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

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
