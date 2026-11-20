import {
  isStoreEmployeeTraining,
  type IModel as ITask,
} from "@sps/crm/models/task/sdk/model";
import type { IFunnelStage } from "@sps/crm/models/funnel/sdk/model";
import type {
  ICrmWorkspaceOptions,
  ICrmWorkspaceOffer,
  ICrmWorkspaceParticipant,
  ICrmWorkspaceFunnelQuery,
  ICrmWorkspacePublicationQuery,
  ICrmWorkspaceTaskDetail,
  ICrmWorkspaceTaskDetailQuery,
  ICrmWorkspaceTaskQuery,
  TCrmWorkspaceCommand,
} from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import { isStoreTest } from "@sps/rbac/models/subject/sdk/model/src/lib/customer-work";
import { getEligibleRetailOffers } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { Service as Subject } from "../../index";
import { criteria } from "../../ecommerce/customer-work/utils";
import { Service as Employees } from "./employees";

const managerVariants = new Set([
  "owner",
  "crm-manager",
  "crm-manager-finance",
]);
const workerVariants = new Set([...managerVariants, "crm-worker", "crm-agent"]);

export class Service {
  constructor(readonly subject: Subject) {}

  get employees() {
    return new Employees(this.subject);
  }

  private async grants(input: { subjectId?: string; storeId?: string }) {
    const and: {
      column: "subjectId" | "ecommerceModuleStoreId";
      method: "eq";
      value: string;
    }[] = [];
    if (input.subjectId) {
      and.push({ column: "subjectId", method: "eq", value: input.subjectId });
    }
    if (input.storeId) {
      and.push({
        column: "ecommerceModuleStoreId",
        method: "eq",
        value: input.storeId,
      });
    }

    return this.subject.module.subjectsToEcommerceModuleStores.find({
      params: { filters: { and } },
    });
  }

  async assertFulfillmentStaff(actorId: string, storeId: string) {
    const grants = await this.grants({ subjectId: actorId, storeId });
    if (
      !grants.some(
        ({ variant }) =>
          variant === "crm-worker" || managerVariants.has(variant),
      )
    ) {
      throw new Error(
        "Permission error. Store staff access required to record fulfillment",
      );
    }
  }

  private async access(actorId: string, storeId: string) {
    const [grants, admin] = await Promise.all([
      this.grants({ subjectId: actorId, storeId }),
      this.subject.isAdmin(actorId),
    ]);
    if (!admin && !grants.some((grant) => managerVariants.has(grant.variant))) {
      throw new Error("Permission error. Store CRM access is required");
    }
    return {
      canManageEmployees:
        admin || grants.some(({ variant }) => variant === "owner"),
      canReadCosts:
        admin ||
        grants.some(
          (grant) =>
            grant.variant === "owner" ||
            grant.variant === "crm-manager-finance",
        ),
    };
  }

  async stores(actorId: string) {
    const [grants, admin] = await Promise.all([
      this.grants({ subjectId: actorId }),
      this.subject.isAdmin(actorId),
    ]);
    const storeIds = [
      ...new Set(
        grants
          .filter((grant) => managerVariants.has(grant.variant))
          .map((grant) => grant.ecommerceModuleStoreId),
      ),
    ];
    if (!admin && !storeIds.length) {
      return [];
    }

    const storeService = this.subject.modules.ecommerce.store;
    const stores = admin
      ? await storeService.find({ params: { limit: 100 } })
      : (
          await Promise.all(storeIds.map((id) => storeService.findById({ id })))
        ).filter((store) => Boolean(store));
    return stores.flatMap((store) => {
      if (!store) {
        return [];
      }
      const storeGrants = grants.filter(
        ({ ecommerceModuleStoreId }) => ecommerceModuleStoreId === store.id,
      );
      const owner = storeGrants.some(({ variant }) => variant === "owner");
      return [
        {
          id: store.id,
          title: store.title?.ru || store.title?.en || store.adminTitle,
          slug: store.slug,
          canTest: owner,
          canManageCatalog: owner || admin,
          canManageEmployees: owner || admin,
          canReadCosts:
            owner ||
            admin ||
            storeGrants.some(
              ({ variant }) => variant === "crm-manager-finance",
            ),
        },
      ];
    });
  }

  private async skillsForAssignee(profileId?: string) {
    if (!profileId) {
      return [];
    }
    const skills =
      await this.subject.modules.social.profilesToSkills.linkedSkills(
        profileId,
      );
    return skills.map(({ id, title }) => ({ id, title }));
  }

  private async storeSkills(storeId: string, assigneeIds: Set<string>) {
    const grants = await this.grants({ storeId });
    const eligible = new Set(
      grants
        .filter(
          ({ variant, subjectId }) =>
            variant === "crm-agent" && assigneeIds.has(subjectId),
        )
        .map(({ subjectId }) => subjectId),
    );
    const skills = await Promise.all(
      [...eligible].map(async (id) => {
        const agent = await this.storeAgent(storeId, id);
        const skills = await this.skillsForAssignee(agent?.profileId);
        return [id, skills] as const;
      }),
    );
    return Object.fromEntries(skills);
  }

  private async validateStageSkills(
    storeId: string,
    definition: {
      stages: Pick<
        IFunnelStage,
        "archived" | "defaultAssigneeSubjectId" | "skillIds"
      >[];
    },
    available?: ICrmWorkspaceOptions["skillsByAssignee"],
  ) {
    const stages = definition.stages.filter(
      ({ archived, skillIds }) => !archived && skillIds?.length,
    );
    if (!stages.length) {
      return;
    }
    const assigneeIds = new Set(
      stages.flatMap(({ defaultAssigneeSubjectId }) =>
        defaultAssigneeSubjectId ? [defaultAssigneeSubjectId] : [],
      ),
    );
    const skillsByAssignee =
      available ?? (await this.storeSkills(storeId, assigneeIds));
    for (const stage of stages) {
      const available =
        skillsByAssignee[stage.defaultAssigneeSubjectId ?? ""] ?? [];
      const ids = new Set(available.map(({ id }) => id));
      if (stage.skillIds?.some((id) => !ids.has(id))) {
        throw new Error(
          "Validation error. Stage skills must be linked to the assigned store agent",
        );
      }
    }
  }

  async options(
    actorId: string,
    storeId: string,
  ): Promise<ICrmWorkspaceOptions> {
    const { canManageEmployees } = await this.access(actorId, storeId);
    const [grants, currencies, offers] = await Promise.all([
      this.grants({ storeId }),
      this.subject.modules.billing.currency.find({ params: { limit: 100 } }),
      this.offers(storeId),
    ]);
    const workers = new Map<string, string>();
    for (const grant of grants) {
      if (
        workerVariants.has(grant.variant) &&
        (!workers.has(grant.subjectId) || grant.variant === "crm-agent")
      ) {
        workers.set(grant.subjectId, grant.variant);
      }
    }
    const candidates = await Promise.all(
      [...workers].map(async ([id, variant]) => {
        if (variant === "crm-agent") {
          return this.storeAgent(storeId, id);
        }
        const person = await this.subject.findById({ id });
        return {
          id,
          name: person?.slug || id,
          kind: "human" as const,
        };
      }),
    );
    const ownerIds = new Set(
      grants
        .filter((grant) => grant.variant === "owner")
        .map((grant) => grant.subjectId),
    );
    const people = candidates.filter((candidate) => candidate !== undefined);
    const agents = people.filter((person) => person.kind === "ai");
    const [skills, employees] = await Promise.all([
      Promise.all(
        agents.map(
          async ({ id, profileId }) =>
            [id, await this.skillsForAssignee(profileId)] as const,
        ),
      ),
      canManageEmployees
        ? this.employees.list(
            storeId,
            agents.map(({ id }) => id),
          )
        : [],
    ]);
    const participants = people.map(({ id, name, kind }) => ({
      id,
      name,
      kind,
    }));
    return {
      participants,
      canManageEmployees,
      employees,
      offers,
      payers: participants.filter((person) => ownerIds.has(person.id)),
      skillsByAssignee: Object.fromEntries(skills),
      currencies: currencies.map((currency) => ({
        id: currency.id,
        title: currency.title,
        units: currency.minorUnitDigits,
      })),
    };
  }

  private async offers(storeId: string): Promise<ICrmWorkspaceOffer[]> {
    const ecommerce = this.subject.modules.ecommerce;
    const offers = await ecommerce.storesToProducts.find(
      criteria({ storeId, variant: "default" }),
    );
    const products = await Promise.all(
      [...new Set(offers.map(({ productId }) => productId))].map((id) =>
        ecommerce.product.findById({ id }),
      ),
    );
    const result: ICrmWorkspaceOffer[] = [];
    for (const product of products) {
      if (!product || product.variant !== "default") {
        continue;
      }
      const eligible = getEligibleRetailOffers({ offers, product, storeId });
      for (const offer of eligible) {
        result.push({
          id: offer.id,
          productId: product.id,
          title: product.title?.ru ?? product.title?.en ?? product.adminTitle,
          kind: product.kind === "service" ? "service" : "physical",
          requiresResultAcceptance:
            product.type === "one_off" &&
            offer.settings.requiresResultAcceptance === true,
        });
      }
    }
    return result;
  }

  private async storeAgent(storeId: string, subjectId: string) {
    const grants = await this.grants({ subjectId });
    if (
      !grants.some(
        (grant) =>
          grant.variant === "crm-agent" &&
          grant.ecommerceModuleStoreId === storeId,
      ) ||
      grants.some(({ variant }) => variant === "assistant")
    ) {
      return undefined;
    }
    const agent = await this.subject.findById({ id: subjectId });
    if (agent?.variant !== "agent") {
      return undefined;
    }
    const profile = await this.employees.agentProfile(subjectId);
    const name = profile ? this.employees.name(profile) : agent.slug;
    return { id: subjectId, name, kind: "ai" as const, profileId: profile?.id };
  }

  private async taskAssistant(task: ITask, stage?: IFunnelStage) {
    if (stage?.defaultAssigneeSubjectId) {
      const configured = await this.storeAgent(
        task.storeId,
        stage.defaultAssigneeSubjectId,
      );
      if (configured) {
        const { id, name, kind } = configured;
        return { id, name, kind };
      }
    }
    const [previous] = await this.subject.modules.crm.taskEvent.find({
      params: {
        ...criteria({ taskId: task.id, kind: "assigned" }).params,
        limit: 1,
        orderBy: { and: [{ column: "revision", method: "desc" }] },
      },
    });
    const previousAssignee = previous?.detail.assigneeId;
    if (previousAssignee) {
      const agent = await this.storeAgent(task.storeId, previousAssignee);
      if (agent) {
        const { id, name, kind } = agent;
        return { id, name, kind };
      }
    }
    return this.customerAssistant(task);
  }

  private async customerAssistant(
    task: ITask,
  ): Promise<ICrmWorkspaceParticipant | undefined> {
    const [grant] =
      await this.subject.module.subjectsToEcommerceModuleStores.find(
        criteria({
          ecommerceModuleStoreId: task.storeId,
          customerSubjectId: task.customerId,
          variant: "assistant",
        }),
      );
    if (!grant) {
      return undefined;
    }
    const assistant = await this.subject.findById({ id: grant.subjectId });
    if (assistant?.variant === "agent") {
      return { id: assistant.id, name: "Личный ассистент", kind: "ai" };
    }
    return undefined;
  }

  async funnels(actorId: string, input: ICrmWorkspaceFunnelQuery) {
    await this.access(actorId, input.storeId);
    return this.subject.modules.crm.funnel.list(input);
  }

  async publications(actorId: string, input: ICrmWorkspacePublicationQuery) {
    await this.access(actorId, input.storeId);
    return this.subject.modules.crm.funnel.listPublications(input);
  }

  private async taskRows(tasks: ITask[]) {
    const subjectIds = new Set<string>();
    const aiAssignees = new Map<string, string>();
    const productIds = new Set<string>();
    for (const task of tasks) {
      subjectIds.add(task.customerId);
      if (task.assigneeId) {
        subjectIds.add(task.assigneeId);
        if (task.assigneeKind === "ai") {
          aiAssignees.set(task.assigneeId, task.storeId);
        }
      }
      if (task.productId) {
        productIds.add(task.productId);
      }
    }

    const [people, products] = await Promise.all([
      Promise.all(
        [...subjectIds].map(async (id) => {
          const storeId = aiAssignees.get(id);
          if (storeId) {
            const worker = await this.storeAgent(storeId, id);
            return [id, worker?.name ?? "Личный ассистент"] as const;
          }
          const person = await this.subject.findById({ id });
          return [id, person?.slug] as const;
        }),
      ),
      Promise.all(
        [...productIds].map(async (id) => {
          const product = await this.subject.modules.ecommerce.product.findById(
            { id },
          );
          return [
            id,
            product?.title?.ru || product?.title?.en || product?.adminTitle,
          ] as const;
        }),
      ),
    ]);
    const names = new Map(people);
    const productTitles = new Map(products);

    return tasks.map((task) => ({
      ...task,
      label:
        (task.productId && productTitles.get(task.productId)) ||
        `Задача ${task.id.slice(0, 8)}`,
      customerName: names.get(task.customerId) || task.customerId,
      assigneeName: task.assigneeId ? names.get(task.assigneeId) : undefined,
      test: isStoreTest(task.openingKey),
    }));
  }

  async tasks(actorId: string, input: ICrmWorkspaceTaskQuery) {
    await this.access(actorId, input.storeId);
    const page = await this.subject.modules.crm.task.list(input);
    const items = await this.taskRows(page.items);
    return { items, nextCursor: page.nextCursor };
  }

  async detail(actorId: string, input: ICrmWorkspaceTaskDetailQuery) {
    const { canReadCosts } = await this.access(actorId, input.storeId);
    const tasks = this.subject.modules.crm.task;
    const task = await tasks.get(input);
    this.assertWorkspaceTask(task);
    const [publication, history, threadLinks] = await Promise.all([
      tasks.getPublication(input),
      tasks.history(input),
      this.subject.modules.social.threadsToCrmModuleTasks.find({
        params: {
          limit: 1,
          filters: {
            and: [
              { column: "crmModuleTaskId", method: "eq", value: input.taskId },
            ],
          },
        },
      }),
    ]);
    const [shown] = await this.taskRows([task]);
    let order: ICrmWorkspaceTaskDetail["order"];
    if (task.orderId) {
      const entity = await this.subject.modules.ecommerce.order.findById({
        id: task.orderId,
      });
      if (entity) {
        order = { id: entity.id, status: entity.status, paymentStatus: null };
        const work =
          await this.subject.modules.ecommerce.order.work.findByOrder(
            entity.id,
          );
        if (
          work?.kind === "physical-order" &&
          work.storeId === task.storeId &&
          work.taskId === task.id &&
          work.customerId === task.customerId
        ) {
          order.fulfillment = {
            state: work.state,
            trackingNumber: work.fulfillment.find(
              (event) => event.stage === "in-transit",
            )?.trackingNumber,
            canFulfill:
              task.assigneeId === actorId &&
              task.assigneeKind === "human" &&
              Boolean(work.paid),
          };
        }
      }
    }
    const link = threadLinks[0];
    const threadEntity = link
      ? await this.subject.modules.social.thread.findById({ id: link.threadId })
      : undefined;
    const [chatLink] =
      threadEntity &&
      isStoreTest(task.openingKey) &&
      task.customerId === actorId
        ? await this.subject.modules.social.chatsToThreads.find(
            criteria({ threadId: threadEntity.id }),
          )
        : [];
    const thread = threadEntity
      ? {
          id: threadEntity.id,
          title: threadEntity.title || "Обсуждение задачи",
          chatId: chatLink?.chatId,
        }
      : undefined;
    const stage = publication.definition.stages.find(
      ({ id }) => id === task.stageId,
    );
    const assistant = thread
      ? await this.taskAssistant(task, stage)
      : undefined;
    let costs:
      | {
          id: string;
          title: string;
          status: string;
          amount: string;
          transfer?: string;
        }[]
      | undefined;
    if (canReadCosts) {
      const receipts =
        await this.subject.module.subjectsToWalletOperations.find({
          params: {
            limit: 100,
            filters: {
              and: [
                { column: "storeId", method: "eq", value: input.storeId },
                { column: "taskId", method: "eq", value: input.taskId },
              ],
            },
          },
        });
      const currencies = new Map(
        await Promise.all(
          [...new Set(receipts.map((receipt) => receipt.currencyId))].map(
            async (id) => {
              const currency =
                await this.subject.modules.billing.currency.findById({ id });
              return [id, currency?.symbol || currency?.title || id] as const;
            },
          ),
        ),
      );
      const states = {
        held: "Зарезервировано",
        released: "Возвращено",
        settled: "Рассчитано",
        posted: "Проведено",
      };
      costs = receipts.map((receipt) => ({
        id: receipt.id,
        title: receipt.kind === "transfer" ? "Перевод" : "Резерв средств",
        status: states[receipt.state],
        amount: `${receipt.amount} ${currencies.get(receipt.currencyId)}`,
        transfer:
          receipt.kind === "transfer"
            ? `${receipt.senderId} → ${receipt.recipientId}`
            : undefined,
      }));
    }
    return {
      task: shown,
      publication,
      history,
      order,
      thread,
      assistant,
      costs,
    };
  }

  private assertWorkspaceTask(task: ITask) {
    if (isStoreEmployeeTraining(task.openingKey)) {
      throw new Error("Not Found error. CRM task is unavailable");
    }
  }

  async execute(actorId: string, command: TCrmWorkspaceCommand) {
    const crm = this.subject.modules.crm;
    switch (command.kind) {
      case "create-employee": {
        const data = await this.employees.create(actorId, command.employee);
        return { kind: command.kind, data };
      }
      case "open-employee-chat": {
        const data = await this.employees.open(actorId, command.employee);
        return { kind: command.kind, data };
      }
      case "start-test":
      case "refresh-test": {
        await this.subject.ecommerceCatalog.assertOwner(
          actorId,
          "store",
          command.test.storeId,
          false,
        );
        if (command.kind === "start-test") {
          const data = await this.subject.customerWork.startStoreTest(
            actorId,
            command.test,
          );
          return { kind: command.kind, data };
        }
        const data = await this.subject.customerWork.refreshStoreTest(
          actorId,
          command.test,
        );
        return { kind: command.kind, data };
      }
      case "fulfill": {
        const data = await this.subject.orderWork.fulfill(
          actorId,
          command.fulfillment,
        );
        return { kind: command.kind, data };
      }
      case "save": {
        const draft = command.draft;
        const options = await this.options(actorId, draft.storeId);
        for (const stage of draft.definition.stages) {
          if (
            stage.defaultAssigneeSubjectId &&
            !options.participants.some(
              (person) => person.id === stage.defaultAssigneeSubjectId,
            )
          ) {
            throw new Error(
              "Validation error. The assignee must be linked to this store",
            );
          }
          if (
            stage.payerSubjectId &&
            !options.payers.some((person) => person.id === stage.payerSubjectId)
          ) {
            throw new Error(
              "Validation error. The payer must be a store owner",
            );
          }
        }
        await this.validateStageSkills(
          draft.storeId,
          draft.definition,
          options.skillsByAssignee,
        );
        if (
          draft.definition.workFunding &&
          !options.currencies.some(
            (currency) =>
              currency.id === draft.definition.workFunding?.currencyId,
          )
        ) {
          throw new Error(
            "Validation error. Choose a configured work currency",
          );
        }
        const current = draft.funnelId
          ? await crm.funnel.get(draft.storeId, draft.funnelId)
          : undefined;
        const { productIds, ...fields } = draft;
        const data = await crm.funnel.saveDraft({
          ...fields,
          bindings: {
            ...current?.bindings,
            productIds: productIds ?? current?.bindings.productIds ?? [],
          },
        });
        return { kind: command.kind, data };
      }
      case "publish": {
        await this.access(actorId, command.publication.storeId);
        const data = await crm.funnel.publish(
          { ...command.publication, actorId },
          (definition) =>
            this.validateStageSkills(command.publication.storeId, definition),
        );
        return { kind: command.kind, data };
      }
      case "transition": {
        const { reason, evidence, ...input } = command.transition;
        await this.access(actorId, input.storeId);
        const task = await crm.task.withTask(input, async (current) => {
          this.assertWorkspaceTask(current);
          const publication = await crm.task.getPublication(input);
          if (current.revision === input.expectedRevision) {
            if (current.expectedEvent && current.expectedEvent !== "message") {
              throw new Error(
                "Forbidden error. This stage requires evidence from the owning domain",
              );
            }
            const stage = publication.definition.stages.find(
              (candidate) => candidate.id === current.stageId,
            );
            if (stage?.evidenceInstruction && !evidence) {
              throw new Error("Validation error. Stage evidence is required");
            }
          }
          const transitioned = await crm.task.transition({
            ...input,
            actorId,
            actorKind: "manager",
            evidence: {
              kind: "manual",
              reason: [reason, evidence].filter(Boolean).join("\n"),
            },
          });
          if (transitioned.stageId === current.stageId) {
            return transitioned;
          }
          const nextStage = publication.definition.stages.find(
            ({ id }) => id === transitioned.stageId,
          );
          return nextStage
            ? this.subject.customerWork.assignStageAgent(
                transitioned,
                nextStage,
              )
            : transitioned;
        });
        const [data] = await this.taskRows([task]);
        return { kind: command.kind, data };
      }
      case "assign": {
        const assignment = command.assignment;
        const options = await this.options(actorId, assignment.storeId);
        const task = await crm.task.withTask(assignment, async (current) => {
          this.assertWorkspaceTask(current);
          let participant = options.participants.find(
            (person) => person.id === assignment.assigneeId,
          );
          if (!participant) {
            const [threadLink] =
              await this.subject.modules.social.threadsToCrmModuleTasks.find(
                criteria({ crmModuleTaskId: current.id }),
              );
            if (threadLink) {
              const assistant = await this.customerAssistant(current);
              if (assistant?.id === assignment.assigneeId) {
                participant = assistant;
              }
            }
          }
          if (!participant) {
            throw new Error(
              "Permission error. The assignee must be linked to this store",
            );
          }
          const assigneeKind = participant.kind;
          if (isStoreTest(current.openingKey) && assigneeKind !== "ai") {
            throw new Error("Conflict error. Store tests use an agent");
          }
          const assigned = await crm.task.assign({
            ...assignment,
            actorId,
            assigneeKind,
          });
          await this.subject.customerWork.ensureAssignedAgentInThread(assigned);
          return assigned;
        });
        const [data] = await this.taskRows([task]);
        return { kind: command.kind, data };
      }
    }
  }
}
