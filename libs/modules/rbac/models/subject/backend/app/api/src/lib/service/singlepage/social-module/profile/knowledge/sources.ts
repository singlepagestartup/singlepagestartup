import { readKnowledgeUserContext } from "@sps/shared-utils";
import { createHash, randomUUID } from "node:crypto";
import { Service as KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import type { Service as Subject } from "../../../index";
import { criteria } from "../../../ecommerce/customer-work/utils";

interface ISaveSource {
  profileId: string;
  storeId?: string;
  slug?: string;
  title: string;
  content: string;
  orderIndex?: number;
  messageId?: string;
  files?: File[];
}

export class Service {
  constructor(private readonly subject: Subject) {}

  get knowledge() {
    return new KnowledgeService({
      source: this.subject.modules.knowledge.source,
    });
  }

  async create(actorId: string, input: ISaveSource) {
    return this.subject.repository.withSubjectLock(
      { subjectId: actorId, savepoint: true },
      async () => {
        const source = await this.save(input);
        if (input.files?.length) {
          if (source.indexedContentHash) {
            const stored =
              await this.subject.modules.knowledge.source.sourceFiles(
                source.id,
              );
            if (stored.length !== input.files.length) {
              throw new Error(
                "Conflict error. The request key belongs to different files.",
              );
            }
            for (const [index, upload] of input.files.entries()) {
              const bytes = Buffer.from(await upload.arrayBuffer());
              const file =
                await this.subject.modules.knowledge.source.readPrivateMaterial(
                  source.id,
                  stored[index].file.id,
                );
              if (
                file.name !== upload.name ||
                file.digest !== createHash("sha256").update(bytes).digest("hex")
              ) {
                throw new Error(
                  "Conflict error. The request key belongs to different files.",
                );
              }
            }
            return { source };
          }
          return this.edit({
            sourceId: source.id,
            title: input.title,
            content: input.content,
            files: input.files,
          });
        }
        return this.index(source.id);
      },
    );
  }

  async edit(input: {
    sourceId: string;
    title: string;
    content: string;
    expectedContentHash?: string;
    expectedTitle?: string;
    files?: File[];
    removeFileIds?: string[];
  }) {
    const knowledge = this.knowledge;
    return knowledge.source.withTransaction(async (scope) => {
      const [current] = await scope.lock([input.sourceId]);
      if (!current) {
        throw new Error("Not Found error. Knowledge Source is unavailable.");
      }
      if (
        (input.expectedTitle !== undefined &&
          input.expectedTitle !== current.title) ||
        (input.expectedContentHash !== undefined &&
          input.expectedContentHash !== current.contentHash)
      ) {
        throw new Error(
          "Conflict error. Knowledge Source changed. Refresh and retry.",
        );
      }
      const saved = await scope.updateSource({
        sourceId: current.id,
        title: input.title,
        content: readKnowledgeUserContext(input.content),
      });
      if (!saved) {
        throw new Error("Conflict error. Knowledge Source changed.");
      }
      await scope.editMaterials(
        current.id,
        input.files ?? [],
        input.removeFileIds ?? [],
      );
      const indexed = await knowledge.rebuildFiles(current.id, scope);
      if (
        !indexed ||
        !indexed.indexedContentHash ||
        indexed.contentHash !== indexed.indexedContentHash
      ) {
        throw new Error("Knowledge index could not be published.");
      }
      return { source: indexed };
    });
  }

  async save(input: ISaveSource) {
    const { knowledge, social } = this.subject.modules;
    const { profileId, storeId, title, content, orderIndex, messageId } = input;
    const saved = await knowledge.source.upsertSourceBySlug(
      {
        slug: input.slug ?? `profile-knowledge-${randomUUID()}`,
        title,
        content,
        variant: "default",
      },
      true,
    );
    const [source] = await knowledge.source.lock([saved.id]);
    if (!source) {
      throw new Error("Not Found error. Knowledge Source is unavailable");
    }
    if (
      !messageId &&
      (source.title !== title ||
        readKnowledgeUserContext(source.content) !== content)
    ) {
      throw new Error(
        "Conflict error. This request key belongs to another Knowledge Source",
      );
    }
    const profiles = social.profilesToKnowledgeModuleSources;
    const links = await profiles.find({
      params: {
        ...criteria({ knowledgeModuleSourceId: source.id }).params,
        limit: 2,
      },
    });
    if (
      source.variant !== "default" ||
      links.length > 1 ||
      links.some(
        (link) =>
          link.profileId !== profileId ||
          (link.storeId && link.storeId !== storeId) ||
          link.variant !== "default" ||
          link.offerId ||
          link.projectId,
      )
    ) {
      throw new Error(
        "Conflict error. Knowledge Source belongs to another scope",
      );
    }
    if (!links.length) {
      await profiles.create({
        data: {
          variant: "default",
          profileId,
          orderIndex,
          knowledgeModuleSourceId: source.id,
        },
      });
    }
    if (messageId) {
      const relations = social.messagesToKnowledgeModuleSources;
      const data = {
        messageId,
        knowledgeModuleSourceId: source.id,
        kind: "origin" as const,
      };
      const [existing] = await relations.find(criteria(data));
      if (!existing) {
        await relations.create({ data });
      }
    }
    return source;
  }

  async index(sourceId: string) {
    const sources = this.subject.modules.knowledge.source;
    await this.knowledge.indexAuthorizedSource({ sourceId });
    const source = await sources.findById({
      id: sourceId,
    });
    if (!source) {
      throw new Error("Not Found error. Knowledge Source is unavailable");
    }
    if (source.indexedContentHash !== source.contentHash) {
      throw new Error(
        "Conflict error. Knowledge Source changed before its index was published.",
      );
    }
    return { source };
  }
}
