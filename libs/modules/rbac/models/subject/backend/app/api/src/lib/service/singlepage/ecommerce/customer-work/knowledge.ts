import type { IModel as CrmTask } from "@sps/crm/models/task/sdk/model";
import type { IFunnelStage } from "@sps/crm/models/funnel/sdk/model";
import type {
  ICustomerWorkMemory,
  TCustomerWorkCommand,
} from "@sps/rbac/models/subject/sdk/model";
import { EXPERT_ORDER_SPECIFICATION_LIMIT } from "@sps/shared-utils";
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

interface IReferenceScope {
  senderProfileId?: string;
  agentProfileId?: string;
  stage?: Pick<
    IFunnelStage,
    "name" | "output" | "defaultAssigneeSubjectId" | "skillIds"
  >;
  memory?: IMemoryScope;
}

interface ITaskThread {
  id: string;
  memoryProjectId: string | null;
}

export class StageSkillsUnavailable extends Error {
  readonly reply: string;

  constructor(russian: boolean) {
    super("Conflict error. Stage skills are unavailable to the assigned agent");
    this.reply = russian
      ? "Навыки для этого этапа сейчас недоступны. Обратитесь к сотруднику магазина, чтобы продолжить."
      : "The skills for this stage are unavailable. Contact the store team to continue.";
  }
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
    const currentProjectId = projects.find(
      ({ id }) => id === scope.projectId,
    )?.id;
    const notes =
      !scope.projectId || currentProjectId
        ? await this.personalSources(scope)
        : [];
    return {
      currentProjectId,
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

  expert(task: Pick<CrmTask, "storeId" | "productId" | "offerId">) {
    const { storeId, productId, offerId } = task;
    return this.social.profilesToEcommerceModuleProducts.resolveStoreExpert({
      storeId,
      productId,
      offerId,
    });
  }

  private async specificationIds(task: CrmTask, profileId: string) {
    if (!task.offerId) {
      return [];
    }
    const links = await this.social.profilesToKnowledgeModuleSources.find({
      params: {
        ...criteria({
          profileId,
          storeId: task.storeId,
          offerId: task.offerId,
          variant: "product-specification",
        }).params,
        limit: EXPERT_ORDER_SPECIFICATION_LIMIT,
        orderBy: {
          and: [
            { column: "orderIndex", method: "asc" },
            { column: "id", method: "asc" },
          ],
        },
      },
    });
    return links.map(({ knowledgeModuleSourceId }) => knowledgeModuleSourceId);
  }

  private async profileSourceIds(
    task: CrmTask,
    profileId: string,
    projectId?: string | null,
  ) {
    const links = await this.social.profilesToKnowledgeModuleSources.find(
      criteria({ profileId, variant: "default" }),
    );
    return links
      .filter(
        (link) =>
          (!link.storeId || link.storeId === task.storeId) &&
          (!link.offerId || link.offerId === task.offerId) &&
          (!link.projectId || link.projectId === projectId),
      )
      .map(({ knowledgeModuleSourceId }) => knowledgeModuleSourceId);
  }

  async archive(task: CrmTask) {
    const expert = await this.expert(task);
    if (!expert.profileId || !task.offerId) {
      return [];
    }
    const [profile, offer] = await Promise.all([
      this.social.profile.findById({ id: expert.profileId }),
      this.subject.modules.ecommerce.storesToProducts.findById({
        id: task.offerId,
      }),
    ]);
    if (
      profile?.variant !== "artificial-intelligence" ||
      offer?.storeId !== task.storeId ||
      offer.productId !== task.productId
    ) {
      return [];
    }
    const ids = await this.specificationIds(task, expert.profileId);
    return this.sources.specificationSnapshots(ids);
  }

  private async selectedStageSkills(
    task: CrmTask,
    scope: IReferenceScope,
    question: string,
  ) {
    const { stage, agentProfileId } = scope;
    if (!stage?.skillIds?.length) {
      return [];
    }
    const russian = /\p{Script=Cyrillic}/u.test(`${stage.name} ${question}`);
    if (
      !agentProfileId ||
      task.assigneeKind !== "ai" ||
      task.assigneeId !== stage.defaultAssigneeSubjectId
    ) {
      throw new StageSkillsUnavailable(russian);
    }
    const skills = await this.social.profilesToSkills.linkedSkills(
      agentProfileId,
      stage.skillIds,
    );
    if (skills.length !== stage.skillIds.length) {
      throw new StageSkillsUnavailable(russian);
    }
    return skills;
  }

  async context(task: CrmTask, scope: IReferenceScope, question: string) {
    const expert = await this.expert(task);
    if (expert.conflict) {
      throw new Error(
        "Conflict error. The store has competing expert assignments",
      );
    }
    const sourceIds = new Set<string>();
    const instructions: string[] = [];
    const memory =
      scope.memory &&
      scope.memory.customerId === task.customerId &&
      scope.memory.storeId === task.storeId &&
      (await this.canUseProject(scope.memory))
        ? scope.memory
        : undefined;
    const profileIds = new Set([scope.senderProfileId, scope.agentProfileId]);
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
        const specifications = await this.specificationIds(task, profile.id);
        for (const id of specifications) {
          sourceIds.add(id);
        }
      }
    }
    const skills = await this.selectedStageSkills(task, scope, question);
    const agentSourceIds = new Set<string>();
    for (const profileId of profileIds) {
      if (!profileId) {
        continue;
      }
      const ids = await this.profileSourceIds(
        task,
        profileId,
        memory?.projectId,
      );
      for (const id of ids) {
        if (profileId === scope.agentProfileId) {
          agentSourceIds.add(id);
        } else {
          sourceIds.add(id);
        }
      }
    }
    if (agentSourceIds.size) {
      const skillLinks = await this.social.skillsToKnowledgeModuleSources.find({
        params: {
          filters: {
            and: [
              { column: "variant", method: "eq", value: "default" },
              {
                column: "knowledgeModuleSourceId",
                method: "inArray",
                value: [...agentSourceIds],
              },
            ],
          },
        },
      });
      const linkedSkillIds = new Set(skills.map(({ id }) => id));
      for (const { skillId, knowledgeModuleSourceId: id } of skillLinks) {
        agentSourceIds.delete(id);
        if (scope.stage?.output !== "image" && linkedSkillIds.has(skillId)) {
          sourceIds.add(id);
        }
      }
    }
    for (const id of agentSourceIds) {
      sourceIds.add(id);
    }
    const referenceSources = sourceIds.size
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
    const skillTitles = skills.length
      ? skills.map(({ title }) => title)
      : undefined;
    const skillGuidance = skills.length
      ? skills
          .map(({ title, description }) => `${title}\n${description}`)
          .join("\n\n")
      : undefined;
    const words = [
      ...new Set(question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []),
    ];
    const excerpts = referenceSources.flatMap(
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
    if (memory) {
      const notes = await this.personalSources(memory);
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
    return {
      content,
      sourceVersions,
      knowledgeSourceIds,
      skillGuidance,
      skillTitles,
    };
  }
}
