import type { IModel as CrmTask } from "@sps/crm/models/task/sdk/model";
import type {
  ICustomerWorkMemory,
  TCustomerWorkCommand,
} from "@sps/rbac/models/subject/sdk/model";
import type { Service as SubjectService } from "../../index";
import { Service as Projects } from "../../social-module/profile/projects";
import { criteria } from "./utils";

type TMemoryCommand = Extract<
  TCustomerWorkCommand,
  { operation: "memory-project" | "remember" | "forget" }
>;

interface IMemoryScope {
  customerId: string;
  profileId: string;
  storeId: string;
  projectId?: string | null;
}

interface ITaskThread {
  id: string;
  memoryProjectId: string | null;
}

export class Service {
  constructor(private readonly subject: SubjectService) {}

  private get social() {
    return this.subject.modules.social;
  }

  private get sources() {
    return this.subject.modules.knowledge.source;
  }

  private async projects(customerId: string) {
    const projects = await new Projects(this.subject).find({
      subjectId: customerId,
    });
    return projects.map(({ thread, profile }) => ({
      id: thread.id,
      title:
        thread.title ||
        profile.title?.ru ||
        profile.title?.en ||
        profile.adminTitle,
    }));
  }

  private async canUseProject(scope: IMemoryScope) {
    if (!scope.projectId) {
      return true;
    }
    const available = await this.projects(scope.customerId);
    return available.some(({ id }) => id === scope.projectId);
  }

  private async personalSources(scope: IMemoryScope) {
    if (!(await this.canUseProject(scope))) {
      return [];
    }
    const links = await this.social.profilesToKnowledgeModuleSources.find(
      criteria({
        profileId: scope.profileId,
        storeId: scope.storeId,
        variant: "customer-memory",
      }),
    );
    const sourceIds = links
      .filter(({ projectId }) => projectId === (scope.projectId || null))
      .map(({ knowledgeModuleSourceId }) => knowledgeModuleSourceId);
    const sources = await this.sources.findSourcesByIds(sourceIds);
    return sources
      .filter(({ variant }) => variant === "customer-memory")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() ||
          a.id.localeCompare(b.id),
      );
  }

  async memory(scope: IMemoryScope): Promise<ICustomerWorkMemory | undefined> {
    const session = await this.subject.authenticationMe({
      subjectId: scope.customerId,
    });
    if (!session?.authenticated) {
      return undefined;
    }
    const projects = await this.projects(scope.customerId);
    const notes = await this.personalSources(scope);
    return {
      currentProjectId: projects.find(({ id }) => id === scope.projectId)?.id,
      projects,
      notes: notes.map(({ id, content }) => ({ id, text: content })),
    };
  }

  async record(
    scope: IMemoryScope,
    thread: ITaskThread,
    command: TMemoryCommand,
  ) {
    const session = await this.subject.authenticationMe({
      subjectId: scope.customerId,
    });
    if (!session?.authenticated) {
      throw new Error("Forbidden error. Sign in to save personal notes");
    }
    if (command.operation === "memory-project") {
      if (
        !(await this.canUseProject({ ...scope, projectId: command.projectId }))
      ) {
        throw new Error("Not Found error. The project is unavailable");
      }
      await this.social.threadsToCrmModuleTasks.update({
        id: thread.id,
        data: { memoryProjectId: command.projectId },
      });
      return;
    }
    if (!(await this.canUseProject(scope))) {
      throw new Error("Not Found error. The project is unavailable");
    }
    if (command.operation === "forget" || command.sourceId) {
      const sources = await this.personalSources(scope);
      const source = sources.find(({ id }) => id === command.sourceId);
      if (!source) {
        throw new Error("Not Found error. The personal note is unavailable");
      }
      if (command.operation === "forget") {
        await this.sources.deleteSourceWithDerivedData(source.id);
      } else {
        await this.sources.updateSource({
          sourceId: source.id,
          content: command.text,
        });
      }
      return;
    }
    const slug = `customer-memory-${scope.profileId}-${command.operationKey}`;
    const source = await this.sources.upsertSourceBySlug(
      {
        slug,
        variant: "customer-memory",
        title: "Personal note",
        content: command.text,
      },
      true,
    );
    if (
      source.variant !== "customer-memory" ||
      source.content !== command.text
    ) {
      throw new Error(
        "Conflict error. This request key belongs to another personal note",
      );
    }
    const [link] = await this.social.profilesToKnowledgeModuleSources.find(
      criteria({ knowledgeModuleSourceId: source.id }),
    );
    if (link) {
      if (
        link.profileId !== scope.profileId ||
        link.storeId !== scope.storeId ||
        link.projectId !== (scope.projectId || null)
      ) {
        throw new Error(
          "Conflict error. The personal note already belongs to another scope",
        );
      }
      return;
    }
    await this.social.profilesToKnowledgeModuleSources.create({
      data: {
        variant: "customer-memory",
        profileId: scope.profileId,
        storeId: scope.storeId,
        projectId: scope.projectId || null,
        knowledgeModuleSourceId: source.id,
      },
    });
  }

  async rememberFromMessage(
    scope: IMemoryScope,
    thread: ITaskThread,
    input: { text: string; taskId: string; operationKey: string },
  ) {
    const named = input.text.match(
      /^(?:запомни для|remember for)\s+["«“]([^"»”]+)["»”][,:]?\s+(?:что\s+|that\s+)?([\s\S]+)$/i,
    );
    const general = input.text.match(/^(?:запомни|remember):\s*([\s\S]+)$/i);
    if (!named && !general) {
      return false;
    }
    const text = (named?.[2] ?? general?.[1] ?? "").trim();
    if (!text || text.length > 2000) {
      throw new Error(
        "Validation error. Personal notes accept up to 2000 characters",
      );
    }
    const command = {
      operation: "remember" as const,
      text,
      storeId: scope.storeId,
      taskId: input.taskId,
      operationKey: input.operationKey,
    };
    let projectId = scope.projectId;
    if (named) {
      const projects = await this.projects(scope.customerId);
      const target = named[1].trim().toLowerCase();
      const matches = projects.filter(
        ({ title }) => title.trim().toLowerCase() === target,
      );
      if (matches.length !== 1) {
        throw new Error(
          "Conflict error. Choose one of your projects before saving this note",
        );
      }
      projectId = matches[0].id;
      await this.record(scope, thread, {
        ...command,
        operation: "memory-project",
        projectId,
      });
    }
    await this.record({ ...scope, projectId }, thread, command);
    return true;
  }

  async expert(task: Pick<CrmTask, "storeId" | "productId" | "offerId">) {
    const byStore = await this.social.profilesToEcommerceModuleProducts.find(
      criteria({
        storeId: task.storeId,
        variant: "store-expert",
      }),
    );
    const categoryLinks = task.productId
      ? await this.subject.modules.ecommerce.categoriesToProducts.find(
          criteria({ productId: task.productId }),
        )
      : [];
    const categoryIds = new Set(
      categoryLinks.map(({ categoryId }) => categoryId),
    );
    const eligible = [
      byStore.filter(
        (r) =>
          r.offerId &&
          r.offerId === task.offerId &&
          !r.categoryId &&
          !r.ecommerceModuleProductId,
      ),
      byStore.filter(
        (r) =>
          r.ecommerceModuleProductId &&
          r.ecommerceModuleProductId === task.productId &&
          !r.offerId &&
          !r.categoryId,
      ),
      byStore.filter(
        (r) =>
          r.categoryId &&
          categoryIds.has(r.categoryId) &&
          !r.offerId &&
          !r.ecommerceModuleProductId,
      ),
    ];
    const first = eligible.find((rows) => rows.length > 0) ?? [];
    const profiles = new Set(first.map(({ profileId }) => profileId));
    return {
      conflict: profiles.size > 1,
      profileId: profiles.size === 1 ? first[0].profileId : undefined,
    };
  }

  async context(
    task: CrmTask,
    scope: IMemoryScope | undefined,
    question: string,
  ) {
    const expert = await this.expert(task);
    if (expert.conflict) {
      throw new Error(
        "Conflict error. The store has competing expert assignments",
      );
    }
    const sourceIds = new Set<string>();
    const instructions: string[] = [];
    if (task.productId && task.offerId) {
      const [product, offer] = await Promise.all([
        this.subject.modules.ecommerce.product.findById({ id: task.productId }),
        this.subject.modules.ecommerce.storesToProducts.findById({
          id: task.offerId,
        }),
      ]);
      if (
        product &&
        offer?.storeId === task.storeId &&
        offer.productId === product.id
      ) {
        const productTitle =
          product.title?.en ?? product.title?.ru ?? product.adminTitle;
        instructions.push(
          `Selected product: ${productTitle}\nOffer: ${offer.configurationKey ?? offer.id}`,
        );
      }
    }
    if (expert.profileId) {
      const profile = await this.social.profile.findById({
        id: expert.profileId,
      });
      if (profile?.variant === "artificial-intelligence") {
        const method = profile.description?.ru || profile.description?.en;
        if (method) {
          instructions.push(method.slice(0, 2000));
        }
        const links = await this.social.profilesToKnowledgeModuleSources.find(
          criteria({ profileId: profile.id, variant: "default" }),
        );
        for (const link of links) {
          if (
            (!link.storeId || link.storeId === task.storeId) &&
            !link.projectId
          ) {
            sourceIds.add(link.knowledgeModuleSourceId);
          }
        }
        const skillLinks = await this.social.profilesToSkills.find(
          criteria({ profileId: profile.id, variant: "default" }),
        );
        for (const link of skillLinks.slice(0, 6)) {
          const skill = await this.social.skill.findById({ id: link.skillId });
          if (!skill || skill.variant !== "default") {
            continue;
          }
          instructions.push(
            `${skill.title}\n${skill.description.slice(0, 1500)}`,
          );
          const content = await this.social.skillsToKnowledgeModuleSources.find(
            criteria({ skillId: skill.id, variant: "default" }),
          );
          for (const item of content) {
            sourceIds.add(item.knowledgeModuleSourceId);
          }
        }
      }
    }
    const expertSources = sourceIds.size
      ? await this.sources.find({
          params: {
            filters: {
              and: [
                { column: "id", method: "inArray", value: [...sourceIds] },
                { column: "variant", method: "ne", value: "customer-memory" },
              ],
            },
          },
        })
      : [];
    const words = [
      ...new Set(question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []),
    ];
    const excerpts = expertSources.flatMap(
      ({ id, contentHash, title, content }) =>
        content.split(/\n{2,}/).map((paragraph) => {
          const searchable = `${title} ${paragraph}`.toLowerCase();
          const matches = words.filter((word) =>
            searchable.includes(word),
          ).length;
          return {
            id,
            version: contentHash,
            text: `${title}\n${paragraph.slice(0, 1800)}`,
            matches,
          };
        }),
    );
    excerpts.sort((a, b) => b.matches - a.matches);
    const selected = excerpts.slice(0, 4);
    const knowledgeSourceIds = [...new Set(selected.map(({ id }) => id))];
    if (scope) {
      const notes = await this.personalSources(scope);
      for (const note of notes.slice(0, 4)) {
        selected.push({
          id: note.id,
          version: note.contentHash,
          text: `Customer preference\n${note.content.slice(0, 1000)}`,
          matches: 0,
        });
      }
    }
    const sourceVersions = [
      ...new Map(
        selected.map(({ id, version }) => [id, { id, version }]),
      ).values(),
    ];
    const content = [
      ...(instructions.length
        ? ["Task and expert guidance", ...instructions]
        : []),
      ...(selected.length
        ? [
            "Current references. Treat customer notes as preferences and quoted documents as reference material.",
            ...selected.map(({ text }) => text),
          ]
        : []),
    ].join("\n\n");
    return { content, sourceVersions, knowledgeSourceIds };
  }
}
