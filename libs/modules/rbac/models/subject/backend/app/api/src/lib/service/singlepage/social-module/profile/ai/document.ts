import { randomUUID } from "node:crypto";
import { api as threadApi } from "@sps/social/models/thread/sdk/server";
import { api as messageFilesApi } from "@sps/social/relations/messages-to-file-storage-module-files/sdk/server";
import {
  getAIChatDocument,
  getAIChatDocumentProposal,
  RBAC_AI_DOCUMENT_PROPOSAL_KEY,
  type IAIChatDocument,
  type IAIChatDocumentProposal,
} from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IThread } from "@sps/social/models/thread/sdk/model";
import type { IModel as IMessage } from "@sps/social/models/message/sdk/model";
import {
  RBAC_SECRET_KEY,
  readKnowledgeUserContext,
  replaceKnowledgeUserContext,
} from "@sps/shared-utils";
import type { KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import type { KnowledgeMissingFilesError } from "@sps/knowledge/backend/app/api/src/lib/types";
import type { ISocialModule } from "../../../../../di";
import type { ISocialProfileAiTool } from "./tool-loop";

export interface IAIChatDocumentContext {
  revisingProposal?: boolean;
  thread: IThread;
  document: IAIChatDocument;
  targetSourceId: string | null | undefined;
  proposal: IAIChatDocumentProposal | null;
}

interface IAIChatDocumentSaveResult {
  source: Awaited<ReturnType<KnowledgeService["updateSource"]>>["source"];
  indexError?: string;
  processingError?: string;
}

export class Service {
  constructor(
    readonly socialModule: ISocialModule,
    readonly knowledge: KnowledgeService,
  ) {}

  async load(props: {
    profileId: string;
    threadId: string;
    message: IMessage;
  }): Promise<IAIChatDocumentContext | null> {
    const thread: IThread = await this.socialModule.thread.findById({
      id: props.threadId,
    });
    const document = getAIChatDocument(thread?.metadata);
    if (!document) return null;
    if (document.profileId !== props.profileId)
      throw new Error(
        "Authorization error. Document belongs to another replying profile.",
      );
    const links = await this.socialModule.profilesToKnowledgeModuleSources.find(
      {
        params: {
          filters: {
            and: [
              { column: "profileId", method: "eq", value: props.profileId },
            ],
          },
        },
      },
    );
    const allowed = new Set(
      links.map(
        (link: { knowledgeModuleSourceId: string }) =>
          link.knowledgeModuleSourceId,
      ),
    );
    if (document.sourceIds.some((id) => !allowed.has(id)))
      throw new Error(
        "Authorization error. Document Source is outside profile Knowledge.",
      );
    const selected = props.message.metadata?.["aiChatDocumentSourceId"];
    if (
      selected !== undefined &&
      (typeof selected !== "string" || !document.sourceIds.includes(selected))
    )
      throw new Error(
        "Authorization error. Selected Source does not belong to this document.",
      );
    return {
      thread,
      document,
      targetSourceId:
        typeof selected === "string"
          ? selected
          : document.sourceIds.length === 1
            ? document.sourceIds[0]
            : document.sourceIds.length === 0
              ? null
              : undefined,
      proposal: getAIChatDocumentProposal(thread.metadata),
    };
  }

  private async save(
    context: IAIChatDocumentContext,
    proposal: IAIChatDocumentProposal,
  ) {
    if (!RBAC_SECRET_KEY)
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    const thread = await threadApi.updateMetadataNamespace({
      id: context.thread.id,
      namespace: RBAC_AI_DOCUMENT_PROPOSAL_KEY,
      expectedValue: context.proposal,
      value: proposal,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });
    if (!thread)
      throw new Error(
        "Document proposal changed during this request. Review the latest proposal.",
      );
    context.thread = thread;
    context.document = getAIChatDocument(thread.metadata)!;
    context.proposal = proposal;
  }

  tool(
    context: IAIChatDocumentContext,
    message: IMessage,
  ): ISocialProfileAiTool {
    return {
      source: "knowledge",
      completeAfterSuccess: true,
      display: { label: "Propose document Knowledge update" },
      definition: {
        type: "function",
        function: {
          name: "profile_knowledge_propose",
          description:
            "Propose the complete new human notes for the current document Source. This never saves Knowledge. Read all existing userContext pages first, preserve unrelated notes, and provide the read contentHash. The exact proposed text will be shown to the user and saved only after a later confirmation. For a document without a Source, propose its first Source. Do not use this tool for brainstorming unless a concrete document draft is ready.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", minLength: 1 },
              userContext: { type: "string", minLength: 1 },
              expectedContentHash: { type: "string" },
            },
            required: [
              "title",
              "userContext",
              ...(context.targetSourceId ? ["expectedContentHash"] : []),
            ],
            additionalProperties: false,
          },
        },
      },
      execute: async (args) => {
        if (
          context.proposal?.status === "pending" &&
          context.proposal.confirmationMessageId
        )
          throw new Error(
            "Document confirmation is being applied. Retry confirmation before proposing another edit.",
          );
        if (context.targetSourceId === undefined)
          throw new Error(
            "Select one Knowledge section before proposing a change to this document.",
          );
        if (
          typeof args["title"] !== "string" ||
          !args["title"].trim() ||
          typeof args["userContext"] !== "string" ||
          !args["userContext"].trim()
        )
          throw new Error("Proposal title and userContext are required.");
        let expectedContentHash: string | null = null;
        if (context.targetSourceId) {
          const [source] = await this.knowledge.listSources({
            sourceIds: [context.targetSourceId],
          });
          if (!source || args["expectedContentHash"] !== source.contentHash)
            throw new Error(
              "Source changed or was not read. Read all existing notes again before proposing an edit.",
            );
          expectedContentHash = source.contentHash;
        }
        const links =
          await this.socialModule.messagesToFileStorageModuleFiles.find({
            params: {
              filters: {
                and: [{ column: "messageId", method: "eq", value: message.id }],
              },
              orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
            },
          });
        const proposal: IAIChatDocumentProposal = {
          version: 1,
          id: randomUUID(),
          status: "pending",
          sourceId: context.targetSourceId,
          expectedContentHash,
          title: args["title"].trim(),
          userContext: args["userContext"],
          fileIds: [
            ...new Set([
              ...((context.revisingProposal ||
                context.proposal?.status === "pending" ||
                context.proposal?.status === "needs_revision") &&
              context.proposal?.sourceId === context.targetSourceId
                ? context.proposal?.fileIds || []
                : []),
              ...links.map(
                (link: { fileStorageModuleFileId: string }) =>
                  link.fileStorageModuleFileId,
              ),
            ]),
          ],
          triggerMessageId: message.id,
        };
        await this.save(context, proposal);
        return {
          proposalId: proposal.id,
          status: "pending_confirmation",
          sourceId: proposal.sourceId,
        };
      },
    };
  }

  preview(
    context: IAIChatDocumentContext,
    messageId: string,
    language: string,
  ): string | null {
    const proposal = context.proposal;
    if (
      !proposal ||
      proposal.status !== "pending" ||
      proposal.triggerMessageId !== messageId
    )
      return null;
    const russian = language.toLowerCase().startsWith("ru");
    return [
      russian
        ? `Предлагаю сохранить в «${proposal.title}» следующий текст:`
        : `Proposed text for “${proposal.title}”:`,
      proposal.userContext,
      russian
        ? "Подтвердите эту правку ответом в чате или напишите, что изменить. Знания пока не сохранены."
        : "Confirm this edit in chat or describe the changes you need. Knowledge has not been saved yet.",
    ].join("\n\n");
  }

  async markShown(
    context: IAIChatDocumentContext,
    triggerId: string,
    replyId: string,
  ) {
    const proposal = context.proposal;
    if (
      proposal?.status === "pending" &&
      !proposal.confirmationMessageId &&
      proposal.triggerMessageId === triggerId
    ) {
      if (!RBAC_SECRET_KEY)
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      await this.save(context, {
        ...proposal,
        shownInMessageId: replyId,
      });
      for (const [orderIndex, fileId] of proposal.fileIds.entries()) {
        await messageFilesApi.findOrCreate({
          data: {
            messageId: replyId,
            fileStorageModuleFileId: fileId,
            orderIndex,
          },
          options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
        });
      }
    }
  }

  async resolve(
    context: IAIChatDocumentContext,
    action: "confirm" | "reject" | "revise" | "none",
    messageId: string,
  ): Promise<Record<string, unknown> | null> {
    const fresh: IThread = await this.socialModule.thread.findById({
      id: context.thread.id,
    });
    const proposal = getAIChatDocumentProposal(fresh.metadata);
    if (!proposal || !["confirm", "reject", "revise"].includes(action))
      return null;
    if (proposal.id !== context.proposal?.id)
      return {
        status: "conflict",
        reason:
          "The pending proposal changed. Confirm the new shown proposal separately.",
      };
    context.thread = fresh;
    context.document = getAIChatDocument(fresh.metadata)!;
    context.proposal = proposal;
    if (proposal.status === "applied")
      return {
        proposalId: proposal.id,
        status: "already_applied",
        sourceId: proposal.sourceId,
      };
    if (proposal.status === "rejected")
      return { proposalId: proposal.id, status: "rejected" };
    if (proposal.confirmationMessageId && action !== "confirm")
      return {
        proposalId: proposal.id,
        status: "applying",
        sourceId: proposal.sourceId,
      };
    if (action === "reject" || action === "revise") {
      context.revisingProposal =
        action === "revise" &&
        ["pending", "needs_revision"].includes(proposal.status);
      if (["pending", "needs_revision"].includes(proposal.status))
        await this.save(context, {
          ...proposal,
          status: action === "revise" ? "needs_revision" : "rejected",
        });
      return {
        proposalId: proposal.id,
        status: action === "revise" ? "needs_revision" : "rejected",
      };
    }
    if (proposal.status !== "pending" || !proposal.shownInMessageId)
      return {
        status: "not_confirmable",
        reason: "No shown pending proposal is available.",
      };
    if (
      proposal.sourceId &&
      !context.document.sourceIds.includes(proposal.sourceId)
    )
      throw new Error(
        "Authorization error. Proposal Source no longer belongs to this document.",
      );
    const author = await this.socialModule.profilesToMessages.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: context.document.profileId,
            },
            {
              column: "messageId",
              method: "eq",
              value: proposal.shownInMessageId,
            },
          ],
        },
      },
    });
    if (!author.length)
      throw new Error(
        "Authorization error. Proposal was not shown by this assistant.",
      );
    let saved: IAIChatDocumentSaveResult | undefined;
    let existingSource:
      | Awaited<ReturnType<KnowledgeService["listSources"]>>[number]
      | undefined;
    if (proposal.sourceId) {
      const [source] = await this.knowledge.listSources({
        sourceIds: [proposal.sourceId],
      });
      if (!source || source.contentHash !== proposal.expectedContentHash) {
        if (
          source &&
          proposal.confirmationMessageId &&
          (await this.matchesSavedProposal(source, proposal))
        )
          saved = {
            source,
            ...(source.indexedContentHash !== source.contentHash
              ? {
                  indexError: "Knowledge is saved; indexing has not completed.",
                }
              : {}),
          };
        else {
          if (proposal.confirmationMessageId)
            return this.requireRevision(
              context,
              proposal,
              "Knowledge changed during confirmation. Read the current Source and prepare a revised proposal.",
            );
          else await this.save(context, { ...proposal, status: "rejected" });
          return {
            status: "conflict",
            reason:
              "Knowledge changed after the proposal. Read the current Source before retrying confirmation.",
          };
        }
      }
      existingSource = source;
    } else if (context.document.sourceIds.length) {
      const sources = await this.knowledge.listSources({
        sourceIds: context.document.sourceIds,
      });
      const deterministicSource =
        sources.length === 1 &&
        sources[0].slug === `ai-chat-document-${context.thread.id}`;
      if (
        proposal.confirmationMessageId &&
        deterministicSource &&
        (sources[0].title !== proposal.title ||
          readKnowledgeUserContext(sources[0].content) !==
            proposal.userContext.trim())
      )
        return this.requireRevision(
          context,
          proposal,
          "The initial Source was saved and then changed. Read its current notes and Files and prepare a revised proposal; previously started attachment processing may still finish.",
        );
      if (
        !proposal.confirmationMessageId ||
        !deterministicSource ||
        sources[0].title !== proposal.title ||
        readKnowledgeUserContext(sources[0].content) !==
          proposal.userContext.trim()
      )
        return {
          status: "conflict",
          reason:
            "A Source was added after this proposal. Read it before retrying confirmation.",
        };
    }
    // Persist the claim before any Knowledge write. It survives process failure;
    // a later confirm retries the conditional/idempotent save, while rejection
    // and revision cannot cancel a write with an unknown commit outcome.
    if (!proposal.confirmationMessageId) {
      try {
        await this.save(context, {
          ...proposal,
          confirmationMessageId: messageId,
        });
      } catch (error) {
        const current = await this.socialModule.thread.findById({
          id: context.thread.id,
        });
        const competing = getAIChatDocumentProposal(current?.metadata);
        if (competing?.id !== proposal.id || !competing.confirmationMessageId)
          throw error;
        context.thread = current;
        context.proposal = competing;
        return this.resolve(context, "confirm", messageId);
      }
    }
    const claimed = context.proposal!;
    try {
      if (!saved && existingSource) {
        saved = await this.knowledge.updateSource({
          sourceId: existingSource.id,
          title: proposal.title,
          content: replaceKnowledgeUserContext(
            existingSource.content,
            proposal.userContext,
          ),
          expectedContentHash: proposal.expectedContentHash!,
          fileIds: proposal.fileIds,
        });
      } else if (!saved) {
        saved = await this.knowledge.learnContent({
          slug: `ai-chat-document-${context.thread.id}`,
          title: proposal.title,
          content: proposal.userContext,
          fileIds: proposal.fileIds,
          onSourceSaved: async (sourceId) => {
            await this.ensureRelation({
              service: this.socialModule.profilesToKnowledgeModuleSources,
              data: {
                profileId: context.document.profileId,
                knowledgeModuleSourceId: sourceId,
              },
              identity: ["profileId", "knowledgeModuleSourceId"],
            });
            await this.ensureRelation({
              service: this.socialModule.messagesToKnowledgeModuleSources,
              data: {
                messageId: proposal.triggerMessageId,
                knowledgeModuleSourceId: sourceId,
                kind: "origin",
                orderIndex: 0,
              },
              identity: ["messageId", "knowledgeModuleSourceId", "kind"],
            });
            await this.attach(context, sourceId);
          },
        });
      }
    } catch (error) {
      const missingFiles =
        error instanceof Error &&
        (error as Partial<KnowledgeMissingFilesError>).code ===
          "KNOWLEDGE_FILES_NOT_FOUND";
      if (missingFiles)
        return this.requireRevision(
          context,
          claimed,
          "A proposed File no longer exists. Knowledge may already contain saved notes; read the current Source and prepare a revised proposal with available Files.",
          (error as KnowledgeMissingFilesError).fileIds,
        );
      if (!proposal.sourceId) throw error;
      const [source] = await this.knowledge.listSources({
        sourceIds: [proposal.sourceId],
      });
      if (!source || !(await this.matchesSavedProposal(source, proposal))) {
        if (!source || source.contentHash !== proposal.expectedContentHash)
          return this.requireRevision(
            context,
            claimed,
            "Knowledge changed during confirmation. Read the current Source and prepare a revised proposal.",
          );
        throw error;
      }
      saved = {
        source,
        ...(source.indexedContentHash !== source.contentHash
          ? { indexError: "Knowledge is saved; indexing has not completed." }
          : {}),
      };
    }
    if (!saved?.source) throw new Error("Knowledge was not saved.");
    const processingError =
      "processingError" in saved ? saved.processingError : undefined;
    try {
      await this.save(context, {
        ...claimed,
        status: "applied",
        sourceId: saved.source.id,
        ...(saved.indexError ? { indexError: saved.indexError } : {}),
        ...(processingError ? { processingError } : {}),
      });
    } catch (error) {
      const current = await this.socialModule.thread.findById({
        id: context.thread.id,
      });
      const applied = getAIChatDocumentProposal(current?.metadata);
      if (applied?.id !== proposal.id || applied.status !== "applied")
        throw error;
    }
    return {
      proposalId: proposal.id,
      status: "applied",
      sourceId: saved.source.id,
      indexError: saved.indexError,
      processingError,
      contentHash: saved.source.contentHash,
    };
  }

  private async requireRevision(
    context: IAIChatDocumentContext,
    proposal: IAIChatDocumentProposal,
    reason: string,
    missingFileIds: string[] = [],
  ): Promise<Record<string, unknown>> {
    try {
      await this.save(context, {
        ...proposal,
        status: "needs_revision",
        confirmationMessageId: undefined,
        fileIds: proposal.fileIds.filter((id) => !missingFileIds.includes(id)),
      });
    } catch (error) {
      const thread = await this.socialModule.thread.findById({
        id: context.thread.id,
      });
      const current = getAIChatDocumentProposal(thread?.metadata);
      if (current?.id === proposal.id && current.status === "applied")
        return {
          proposalId: current.id,
          status: "already_applied",
          sourceId: current.sourceId,
        };
      if (current?.id !== proposal.id || current.status !== "needs_revision")
        throw error;
      context.thread = thread;
      context.proposal = current;
    }
    return {
      proposalId: proposal.id,
      status: "conflict",
      reason,
      ...(missingFileIds.length ? { missingFileIds } : {}),
      ...(proposal.sourceId === null && context.document.sourceIds.length
        ? { partialSave: true, sourceId: context.document.sourceIds[0] }
        : {}),
    };
  }

  private async matchesSavedProposal(
    source: { id: string; title: string; content: string },
    proposal: IAIChatDocumentProposal,
  ) {
    if (
      source.title !== proposal.title ||
      readKnowledgeUserContext(source.content) !== proposal.userContext.trim()
    )
      return false;
    if (!proposal.fileIds.length) return true;
    const files = await this.knowledge.sourceFiles(source.id);
    const ids = new Set(files.map(({ file }) => file.id));
    return proposal.fileIds.every((id) => ids.has(id));
  }

  private async ensureRelation(props: {
    service: {
      findOrCreate: (props: { data: any }) => Promise<unknown>;
      find: (props: any) => Promise<unknown[]>;
    };
    data: Record<string, string | number>;
    identity: string[];
  }) {
    try {
      await props.service.findOrCreate({ data: props.data });
    } catch (error) {
      const existing = await props.service.find({
        params: {
          filters: {
            and: props.identity.map((column) => ({
              column,
              method: "eq",
              value: props.data[column],
            })),
          },
          limit: 2,
        },
      });
      if (existing.length !== 1) throw error;
    }
  }

  private async attach(context: IAIChatDocumentContext, sourceId: string) {
    const current: IThread = await this.socialModule.thread.findById({
      id: context.thread.id,
    });
    const document = getAIChatDocument(current.metadata);
    if (
      !document ||
      document.profileId !== context.document.profileId ||
      document.key !== context.document.key
    )
      throw new Error(
        "Document changed during confirmation. Read the current document before retrying.",
      );
    if (document.sourceIds.includes(sourceId)) {
      context.thread = current;
      context.document = document;
      return;
    }
    const thread = await threadApi.updateMetadataNamespace({
      id: current.id,
      namespace: "aiChatDocument",
      expectedValue: current.metadata.aiChatDocument,
      value: {
        ...document,
        sourceIds: [...new Set([...document.sourceIds, sourceId])],
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY!,
          "Cache-Control": "no-store",
        },
      },
    });
    if (!thread) {
      const latest = await this.socialModule.thread.findById({
        id: current.id,
      });
      const linked = getAIChatDocument(latest?.metadata);
      if (
        linked?.profileId === document.profileId &&
        linked.key === document.key &&
        linked.sourceIds.includes(sourceId)
      ) {
        context.thread = latest;
        context.document = linked;
        return;
      }
      throw new Error(
        "Document Source links changed during this request. Retry with the current document.",
      );
    }
    context.thread = thread;
    context.document = getAIChatDocument(thread.metadata)!;
  }
}
