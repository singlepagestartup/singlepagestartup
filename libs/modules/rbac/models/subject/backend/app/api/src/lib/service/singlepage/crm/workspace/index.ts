import type { IModel as ITask } from "@sps/crm/models/task/sdk/model";
import type {
  ICrmWorkspaceFunnelQuery,
  ICrmWorkspacePublicationQuery,
  ICrmWorkspaceTaskDetail,
  ICrmWorkspaceTaskDetailQuery,
  ICrmWorkspaceTaskQuery,
  TCrmWorkspaceCommand,
} from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import type { Service as Subject } from "../../index";

const managerVariants = new Set([
  "owner",
  "crm-manager",
  "crm-manager-finance",
]);
const workerVariants = new Set([...managerVariants, "crm-worker", "crm-agent"]);

export class Service {
  constructor(readonly subject: Subject) {}

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
    return stores.map((store) => ({
      id: store!.id,
      title: store!.title?.ru || store!.title?.en || store!.adminTitle,
      slug: store!.slug,
      canReadCosts:
        admin ||
        grants.some(
          (grant) =>
            grant.ecommerceModuleStoreId === store!.id &&
            ["owner", "crm-manager-finance"].includes(grant.variant),
        ),
    }));
  }

  async options(actorId: string, storeId: string) {
    await this.access(actorId, storeId);
    const [grants, currencies] = await Promise.all([
      this.grants({ storeId }),
      this.subject.modules.billing.currency.find({ params: { limit: 100 } }),
    ]);
    const workers = new Map<string, string>();
    for (const grant of grants) {
      if (workerVariants.has(grant.variant)) {
        workers.set(grant.subjectId, grant.variant);
      }
    }
    const people = await Promise.all(
      [...workers].map(async ([id, variant]) => {
        const person = await this.subject.findById({ id });
        return {
          id,
          name: person?.slug || id,
          kind: variant === "crm-agent" ? ("ai" as const) : ("human" as const),
        };
      }),
    );
    const ownerIds = new Set(
      grants
        .filter((grant) => grant.variant === "owner")
        .map((grant) => grant.subjectId),
    );
    return {
      participants: people,
      payers: people.filter((person) => ownerIds.has(person.id)),
      currencies: currencies.map((currency) => ({
        id: currency.id,
        title: currency.title,
        units: currency.minorUnitDigits,
      })),
    };
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
    const productIds = new Set<string>();
    for (const task of tasks) {
      subjectIds.add(task.customerId);
      if (task.assigneeId) {
        subjectIds.add(task.assigneeId);
      }
      if (task.productId) {
        productIds.add(task.productId);
      }
    }

    const [people, products] = await Promise.all([
      Promise.all(
        [...subjectIds].map(async (id) => {
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
    const [task, publication, history, threadLinks] = await Promise.all([
      tasks.get(input),
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
    const thread = threadEntity
      ? {
          id: threadEntity.id,
          title: threadEntity.title || "Обсуждение задачи",
        }
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
    return { task: shown, publication, history, order, thread, costs };
  }

  async execute(actorId: string, command: TCrmWorkspaceCommand) {
    const crm = this.subject.modules.crm;
    switch (command.kind) {
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
        const data = await crm.funnel.saveDraft({
          ...draft,
          bindings: current?.bindings,
        });
        return { kind: command.kind, data };
      }
      case "publish": {
        await this.access(actorId, command.publication.storeId);
        const data = await crm.funnel.publish({
          ...command.publication,
          actorId,
        });
        return { kind: command.kind, data };
      }
      case "transition": {
        const { reason, evidence, ...input } = command.transition;
        await this.access(actorId, input.storeId);
        const current = await crm.task.get(input);
        if (current.revision === input.expectedRevision) {
          if (current.expectedEvent && current.expectedEvent !== "message") {
            throw new Error(
              "Forbidden error. This stage requires evidence from the owning domain",
            );
          }
          const publication = await crm.task.getPublication(input);
          const stage = publication.definition.stages.find(
            (candidate) => candidate.id === current.stageId,
          );
          if (stage?.evidenceInstruction && !evidence) {
            throw new Error("Validation error. Stage evidence is required");
          }
        }
        const task = await crm.task.transition({
          ...input,
          actorId,
          actorKind: "manager",
          evidence: {
            kind: "manual",
            reason: [reason, evidence].filter(Boolean).join("\n"),
          },
        });
        const [data] = await this.taskRows([task]);
        return { kind: command.kind, data };
      }
      case "assign": {
        const assignment = command.assignment;
        const options = await this.options(actorId, assignment.storeId);
        const participant = options.participants.find(
          (person) => person.id === assignment.assigneeId,
        );
        if (!participant) {
          throw new Error(
            "Permission error. The assignee must be linked to this store",
          );
        }
        const task = await crm.task.assign({
          ...assignment,
          actorId,
          assigneeKind: participant.kind,
        });
        const [data] = await this.taskRows([task]);
        return { kind: command.kind, data };
      }
    }
  }
}
