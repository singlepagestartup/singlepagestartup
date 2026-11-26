import { replaceKnowledgeUserContext } from "@sps/shared-utils";
import type { Service as Subject } from "../../../index";
import { criteria } from "../../../ecommerce/customer-work/utils";
import { Service as ProfileSources } from "./sources";

interface IPersonalSource {
  id: string;
  slug: string;
  variant: string;
}

export class Service {
  constructor(private readonly subject: Subject) {}

  private async assertOwner(actorId: string, profileId: string) {
    const [profile, owners] = await Promise.all([
      this.subject.modules.social.profile.findById({ id: profileId }),
      this.subject.module.subjectsToSocialModuleProfiles.find(
        criteria({ socialModuleProfileId: profileId }),
      ),
    ]);
    if (
      !profile ||
      !["default", "telegram"].includes(profile.variant) ||
      owners.length !== 1 ||
      owners[0].variant !== "default" ||
      owners[0].subjectId !== actorId
    ) {
      throw new Error("Not Found error. The personal profile is unavailable");
    }
  }

  async editable(profileId: string, sources: IPersonalSource[]) {
    const ids = sources.map(({ id }) => id);
    const allowed = new Set<string>();
    if (!ids.length) {
      return allowed;
    }
    const filter = {
      params: {
        filters: {
          and: [
            {
              column: "knowledgeModuleSourceId",
              method: "inArray" as const,
              value: ids,
            },
          ],
        },
      },
    };
    const social = this.subject.modules.social;
    const [profiles, skills, messages] = await Promise.all([
      social.profilesToKnowledgeModuleSources.find(filter),
      social.skillsToKnowledgeModuleSources.find(filter),
      social.messagesToKnowledgeModuleSources.find({
        params: {
          filters: {
            and: [
              ...filter.params.filters.and,
              { column: "kind", method: "eq", value: "origin" },
            ],
          },
        },
      }),
    ]);
    const shared = new Set(
      [...skills, ...messages].map((link) => link.knowledgeModuleSourceId),
    );
    const owned = new Map<string, (typeof profiles)[number]>();
    for (const link of profiles) {
      const id = link.knowledgeModuleSourceId;
      if (link.profileId !== profileId || owned.has(id)) {
        shared.add(id);
      }
      owned.set(id, link);
    }
    for (const source of sources) {
      const link = owned.get(source.id);
      if (
        !link ||
        shared.has(source.id) ||
        link.offerId ||
        (link.projectId && !link.storeId)
      ) {
        continue;
      }
      const memory =
        source.variant === "customer-memory" &&
        link.variant === "customer-memory";
      const ownDocument =
        source.variant === "default" &&
        link.variant === "default" &&
        !link.storeId &&
        source.slug.startsWith(`profile-knowledge-${profileId}-`);
      if (memory || ownDocument) {
        allowed.add(source.id);
      }
    }
    return allowed;
  }

  private async indexed(actorId: string, profileId: string, sourceId: string) {
    const saved = await new ProfileSources(this.subject).index(sourceId);
    await this.assertOwner(actorId, profileId);
    const editable = await this.editable(profileId, [saved.source]);
    if (!editable.has(sourceId)) {
      throw new Error("Not Found error. The personal note is unavailable");
    }
    return saved;
  }

  async create(
    actorId: string,
    profileId: string,
    data: {
      title: string;
      content: string;
      operationKey: string;
      orderIndex?: number;
    },
  ) {
    const { social, knowledge } = this.subject.modules;
    return this.subject.repository.withSubjectLock(
      { subjectId: actorId, savepoint: true },
      async () => {
        await this.assertOwner(actorId, profileId);
        const source = await knowledge.source.upsertSourceBySlug(
          {
            slug: `personal-profile-${profileId}-${data.operationKey}`,
            title: data.title,
            content: data.content,
            variant: "customer-memory",
          },
          true,
        );
        await knowledge.source.lock([source.id]);
        if (
          source.variant !== "customer-memory" ||
          source.title !== data.title ||
          source.content !== data.content
        ) {
          throw new Error(
            "Conflict error. This request key was used for another personal note",
          );
        }
        const links = await social.profilesToKnowledgeModuleSources.find(
          criteria({ knowledgeModuleSourceId: source.id }),
        );
        if (links.some((link) => link.storeId || link.projectId)) {
          throw new Error(
            "Conflict error. The personal note belongs to another scope",
          );
        }
        if (!links.length) {
          await social.profilesToKnowledgeModuleSources.create({
            data: {
              profileId,
              knowledgeModuleSourceId: source.id,
              variant: "customer-memory",
              orderIndex: data.orderIndex,
            },
          });
        }
        if (!(await this.editable(profileId, [source])).has(source.id)) {
          throw new Error(
            "Conflict error. The personal note belongs to another scope",
          );
        }
        return this.indexed(actorId, profileId, source.id);
      },
    );
  }

  async update(
    actorId: string,
    profileId: string,
    id: string,
    data: {
      title: string;
      content: string;
      expectedContentHash: string;
      expectedTitle: string;
    },
  ) {
    const sources = this.subject.modules.knowledge.source;
    const unavailable = "Not Found error. The personal note is unavailable";
    const conflict =
      "Conflict error. The personal note changed. Refresh and retry.";
    return this.subject.repository.withSubjectLock(
      { subjectId: actorId, savepoint: true },
      async () => {
        await this.assertOwner(actorId, profileId);
        const [source] = await sources.lock([id]);
        if (!source || !(await this.editable(profileId, [source])).has(id)) {
          throw new Error(unavailable);
        }
        if (source.title !== data.expectedTitle) {
          throw new Error(conflict);
        }
        const changed = await sources.updateSource({
          sourceId: id,
          title: data.title,
          content: replaceKnowledgeUserContext(source.content, data.content),
          expectedContentHash: data.expectedContentHash,
        });
        if (!changed) {
          throw new Error(conflict);
        }
        return this.indexed(actorId, profileId, id);
      },
    );
  }
}
