import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { createModules } from "@sps/crm/backend/app/api/src/lib/modules";
import { Table } from "@sps/crm/models/task/backend/repository/database";
import {
  customerPaysForWork,
  employeeTrainingStageFunding,
  stageWorkFunding,
  stageCompletionCondition,
  type TActorKind,
  type IFunnelDefinition,
} from "@sps/crm/models/funnel/sdk/model";
import type {
  ITaskEventDetail,
  TTaskEventKind,
} from "@sps/crm/relations/tasks-to-stages/sdk/model";
import {
  applyTimerSchema,
  assignTaskSchema,
  attachTaskFunnelSchema,
  attachTaskOrderSchema,
  attachTaskOfferSchema,
  closeTaskSchema,
  customerTaskActivitySchema,
  getTaskWorkSchema,
  isStoreEmployeeTraining,
  listDueTasksSchema,
  listTasksSchema,
  openTaskSchema,
  recordTaskEvidenceSchema,
  resumeCustomerWorkSchema,
  taskHistorySchema,
  taskScopeSchema,
  transferTaskCustomerSchema,
  transitionTaskSchema,
  type IApplyTimer,
  type IModel,
  type ITaskParticipantStore,
  type IAssignTask,
  type IAttachTaskFunnel,
  type IAttachTaskOrder,
  type IAttachTaskOffer,
  type ICloseTask,
  type IGetTaskWork,
  type IListDueTasks,
  type IListTasks,
  type IOpenTask,
  type IRecordTaskEvidence,
  type IResumeCustomerWork,
  type ITaskHistory,
  type ITaskScope,
  type ITransferTaskCustomer,
  type ITransitionTask,
  type TCustomerTaskActivity,
} from "@sps/crm/models/task/sdk/model";
import { createModule } from "../module";
import type { Repository } from "../../repository";
import {
  assertAssignment,
  assertEvidence,
  assertOpen,
  clearWaiting,
  closeTask,
  enterStage,
  getStage,
  nextTimer,
  operationDigest,
  trainEmployeeStage,
} from "./utils";

type TTask = { [K in keyof IModel]: IModel[K] };
type TRawTask = typeof Table.$inferSelect;
type TTaskPatch = Partial<TTask>;

interface IMoveUnstartedTask extends ITaskScope {
  fromId: string;
  toId: string;
  offerId: string;
}

interface ICommand extends ITaskScope {
  expectedRevision: number;
  actorId: string;
  operationKey: string;
  causeId?: string;
}

interface IAudit {
  operationKey: string;
  operationDigest: string;
  actorId?: string;
  actorKind?: TActorKind;
  causeId?: string;
}

interface IAction {
  patch: TTaskPatch;
  detail: ITaskEventDetail;
  actorKind?: TActorKind;
}

@injectable()
@injectFromBase()
export class Service extends CRUDService<TTask> {
  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  private owner() {
    return this.repository as Repository;
  }

  private participantStore?: ITaskParticipantStore;

  private onOrderTaskCompleted?: (task: TTask) => Promise<void>;

  configureOrderCompletion(complete: (task: TTask) => Promise<void>) {
    this.onOrderTaskCompleted = complete;
  }

  configureParticipants(store: ITaskParticipantStore) {
    this.participantStore = store;
    return this;
  }

  private get participants() {
    if (!this.participantStore) {
      throw new Error(
        "Configuration error. CRM task participants require the owning subject service",
      );
    }
    return this.participantStore;
  }

  private async project(rows: TRawTask[]): Promise<TTask[]> {
    if (!rows.length) {
      return [];
    }
    const ids = rows.map((row) => row.id);
    const [scopes, participants, commerce] = await Promise.all([
      this.module.funnel.taskScopes({ taskIds: ids, primaryOnly: true }),
      this.participants.getForTasks(ids),
      this.owner().commerce(ids),
    ]);
    const scopesById = new Map(scopes.map((scope) => [scope.taskId, scope]));
    const primaryById = new Map<string, ITaskEventDetail>();
    for (const entry of commerce.selectionHistory) {
      const primary = primaryById.get(entry.taskId) ?? {};
      primary.publicationId ??= entry.detail.publicationId;
      primary.offerId ??= entry.detail.offerId;
      primary.productId ??= entry.detail.productId;
      primary.orderId ??= entry.detail.orderId;
      primaryById.set(entry.taskId, primary);
    }
    return rows.map((row) => {
      const participant = participants.get(row.id);
      const scope = scopesById.get(row.id);
      if (!participant || !scope) {
        throw new Error(
          `Consistency error. Task ${row.id} has no funnel or customer`,
        );
      }
      const offers = commerce.offers.filter((offer) => offer.taskId === row.id);
      const orders = commerce.orders.filter((order) => order.taskId === row.id);
      const opening = primaryById.get(row.id);
      return {
        ...row,
        ...participant,
        storeId: scope.storeId,
        funnelId: scope.funnelId,
        publicationId: opening?.publicationId ?? scope.funnelId,
        offerId: opening?.offerId ?? offers[0]?.offerId ?? null,
        productId: opening?.productId ?? offers[0]?.productId ?? null,
        orderId: opening?.orderId ?? orders[0]?.orderId ?? null,
        offerIds: offers.map((o) => o.offerId),
        orderIds: orders.map((o) => o.orderId),
      };
    });
  }

  private async linkedTaskIds(
    column: string,
    value: string,
  ): Promise<string[] | undefined> {
    if (column === "customerId" || column === "assigneeId") {
      return this.participants.listTaskIds({ [column]: value });
    }
    if (column === "storeId" || column === "funnelId") {
      const scopes = await this.module.funnel.taskScopes({
        [column]: value,
        primaryOnly: column === "storeId",
      });
      return scopes.map((s) => s.taskId);
    }
    if (
      column === "orderId" ||
      column === "offerId" ||
      column === "productId"
    ) {
      const rows = await this.owner().byCommerce(column, [value]);
      return rows.map((row) => row.taskId);
    }
    return undefined;
  }

  private async query(props?: Parameters<CRUDService<TTask>["find"]>[0]) {
    const filters = props?.params?.filters?.and ?? [];
    const and: typeof filters = [];
    for (const filter of filters) {
      if (
        ![
          "storeId",
          "funnelId",
          "customerId",
          "assigneeId",
          "offerId",
          "productId",
          "orderId",
        ].includes(filter.column)
      ) {
        and.push(filter);
        continue;
      }
      if (filter.method !== "eq" && filter.method !== "inArray") {
        throw new Error(
          `Validation error. Unsupported relation filter ${filter.column}.${filter.method}`,
        );
      }
      const values = Array.isArray(filter.value)
        ? filter.value
        : [filter.value];
      const ids = new Set<string>();
      for (const value of values) {
        const linked = await this.linkedTaskIds(filter.column, String(value));
        for (const id of linked ?? []) {
          ids.add(id);
        }
      }
      and.push({ column: "id", method: "inArray", value: [...ids] });
    }
    return { ...props, params: { ...props?.params, filters: { and } } };
  }

  override async find(props?: Parameters<CRUDService<TTask>["find"]>[0]) {
    const query = await this.query(props);
    const rows = await super.find(query);
    return this.project(rows);
  }

  override async count(props?: Parameters<CRUDService<TTask>["count"]>[0]) {
    const query = await this.query(props);
    return super.count(query);
  }

  override async findById(input: { id: string }) {
    const row = await super.findById(input);
    const [task] = await this.project(row ? [row] : []);
    return task ?? null;
  }

  private async revise(id: string, patch: TTaskPatch) {
    const { customerId, assigneeId, ...fields } = patch;
    if (customerId !== undefined) {
      await this.participants.setCustomer(id, customerId);
    }
    if (assigneeId !== undefined) {
      await this.participants.setAssignee(id, assigneeId);
    }
    const row = await this.owner().revise(id, fields);
    const [task] = await this.project([row]);
    return task;
  }

  private async requireTask(scope: ITaskScope, lock = false) {
    const owner = this.owner();
    const found = await this.findById({ id: scope.taskId });
    let task = found?.storeId === scope.storeId ? found : null;
    if (task && lock) {
      await this.module.funnel.lock(task.storeId, task.funnelId, "share");
      const locked = await owner.scoped(scope, true);
      const [current] = await this.project(locked ? [locked] : []);
      task = current;
    }
    if (!task) {
      throw new Error("Not Found error. Task does not exist in this store");
    }
    return task;
  }

  async get(input: ITaskScope) {
    return this.requireTask(taskScopeSchema.parse(input));
  }

  async attachFunnel(input: IAttachTaskFunnel) {
    const data = attachTaskFunnelSchema.parse(input);
    return this.withTask(data, (task) =>
      this.module.funnel.linkTask(data.funnelId, task.id),
    );
  }

  async withTask<T>(input: ITaskScope, operation: (task: TTask) => Promise<T>) {
    const scope = taskScopeSchema.parse(input);
    return this.owner().transaction(async () => {
      const task = await this.requireTask(scope, true);
      return operation(task);
    });
  }

  async moveUnstartedTask(
    input: IMoveUnstartedTask,
    checkExternalActivity: (orderId: string) => Promise<void>,
  ) {
    return this.withTask(input, async (task) => {
      if (task.funnelId === input.toId && task.offerId === input.offerId) {
        return;
      }
      const [source, destination, history] = await Promise.all([
        this.module.funnel.current(input.storeId, input.fromId),
        this.module.funnel.current(input.storeId, input.toId),
        this.module.tasksToStages.page(task.id, { limit: 3 }),
      ]);
      const stage = source.definition.stages.find(
        ({ id }) => id === task.stageId,
      );
      const nextStage = destination.definition.stages.find(
        ({ id }) => id === task.stageId,
      );
      const stages = (definition: IFunnelDefinition) =>
        definition.stages
          .filter(({ archived }) => !archived)
          .map(({ id }) => id);
      const [assigned, opened] = history.items;
      if (
        task.funnelId !== source.id ||
        task.publicationId !== source.id ||
        task.offerId !== input.offerId ||
        task.offerIds.length !== 1 ||
        !task.orderId ||
        task.status !== "active" ||
        task.assigneeKind !== "ai" ||
        !task.assigneeId ||
        task.stageId !== source.definition.initialStageId ||
        task.stageId !== destination.definition.initialStageId ||
        task.assigneeId !== stage?.defaultAssigneeSubjectId ||
        task.assigneeId !== nextStage?.defaultAssigneeSubjectId ||
        source.kind !== destination.kind ||
        !destination.bindings.offerIds.includes(input.offerId) ||
        !isDeepStrictEqual(
          stages(source.definition),
          stages(destination.definition),
        ) ||
        history.items.length !== 2 ||
        assigned?.kind !== "assigned" ||
        assigned.pending ||
        assigned.revision !== task.revision ||
        opened?.kind !== "opened" ||
        opened.pending
      ) {
        throw new Error(
          "Conflict error. The task is no longer eligible to move",
        );
      }
      await checkExternalActivity(task.orderId);
      // Keep the original opening event and its publication ID for replay.
      await this.module.funnel.replaceTaskPrimaryFunnel({
        taskId: task.id,
        fromId: source.id,
        toId: destination.id,
        revision: task.revision + 1,
        assignmentRevision: task.assignmentRevision + 1,
      });
    });
  }

  private async funnel(task: TTask) {
    return this.module.funnel.current(task.storeId, task.funnelId);
  }

  async getFunnel(input: ITaskScope) {
    const task = await this.get(input);
    const funnel = await this.funnel(task);
    const retained = await this.module.tasksToStages.retainedStages(
      task.id,
      funnel.definition.stages.map((stage) => stage.id),
      task.status === "closed",
    );
    if (!retained.length) {
      return funnel;
    }
    return {
      ...funnel,
      definition: {
        ...funnel.definition,
        stages: [...funnel.definition.stages, ...retained],
      },
    };
  }

  async getWork(input: IGetTaskWork) {
    return this.readWork(input);
  }

  async withWork<T>(
    input: IGetTaskWork,
    operation: (work: Awaited<ReturnType<Service["getWork"]>>) => Promise<T>,
  ) {
    return this.owner().transaction(async () => {
      const work = await this.readWork(input, true);
      return operation(work);
    });
  }

  private async readWork(input: IGetTaskWork, lock = false) {
    const data = getTaskWorkSchema.parse(input);
    const task = await this.requireTask(data, lock);
    if (task.status !== "active") {
      const entry =
        task.status === "waiting" && data.eventId
          ? await this.module.tasksToStages.findById({ id: data.eventId })
          : undefined;
      if (
        !entry?.pending ||
        !["stage-entry", "customer-message", "staff-message"].includes(
          entry.kind,
        ) ||
        entry.taskId !== task.id ||
        entry.detail.stageId !== task.stageId ||
        entry.assignmentRevision !== task.assignmentRevision ||
        (task.deadlineAt && task.deadlineAt <= new Date())
      ) {
        throw new Error("Conflict error. The task is not accepting work");
      }
    }
    if (
      data.expectedRevision !== undefined &&
      task.revision !== data.expectedRevision
    ) {
      throw new Error("Conflict error. The task revision has changed");
    }

    assertAssignment(
      task,
      data.assigneeId,
      data.expectedAssignmentRevision,
      new Date(),
    );
    const funnel = await this.funnel(task);
    const employeeTraining = isStoreEmployeeTraining(task.openingKey);
    const stageStates = await this.module.tasksToStages.stageStates(task.id);
    let stage;
    if (employeeTraining) {
      const budgetStage = employeeTrainingStageFunding(
        funnel.definition,
        task.customerId,
      );
      stage = {
        ...trainEmployeeStage(task.stageId),
        workFunding: budgetStage?.workFunding,
      };
    } else {
      const current = Object.keys(stageStates).find(
        (key) => stageStates[key] === "current",
      );
      if (!current || current !== task.stageId) {
        throw new Error(
          "Conflict error. Task stage has changed. Reload the task",
        );
      }
      stage = getStage(funnel.definition, current);
    }
    return {
      task,
      stage,
      stageStates,
      progression: employeeTraining ? undefined : funnel.definition.progression,
      funding: stageWorkFunding(funnel.definition, stage),
      taskFunding: funnel.definition.workFunding,
      maintenanceSourceId: employeeTraining
        ? undefined
        : funnel.definition.maintenanceSourceId,
    };
  }

  async list(input: IListTasks, allowedTaskIds?: ReadonlySet<string>) {
    const data = listTasksSchema.parse(input);
    const scopes = await this.module.funnel.taskScopes({
      storeId: data.storeId,
      funnelId: data.funnelId,
      primaryOnly: !data.funnelId,
    });
    let ids = scopes.map((scope) => scope.taskId);
    if (allowedTaskIds) {
      ids = ids.filter((id) => allowedTaskIds.has(id));
    }
    for (const column of ["customerId", "assigneeId", "orderId"] as const) {
      const value = data[column];
      if (value) {
        const matched = new Set(await this.linkedTaskIds(column, value));
        ids = ids.filter((id) => matched.has(id));
      }
    }
    let searchIds: string[] = [];
    if (data.search) {
      const needle = data.search.toLowerCase();
      const [people, commerce] = await Promise.all([
        this.participants.getForTasks(ids),
        this.owner().commerce(ids),
      ]);
      searchIds = [...people]
        .filter(([, person]) => person.customerId.includes(needle))
        .map(([id]) => id);
      searchIds.push(
        ...commerce.orders
          .filter((order) => order.orderId.includes(needle))
          .map((order) => order.taskId),
      );
    }
    const page = await this.owner().list(data, new Date(), ids, searchIds);
    const items = await this.project(page.items);
    return { ...page, items };
  }

  async history(input: ITaskHistory) {
    const data = taskHistorySchema.parse(input);
    const task = await this.requireTask(data);
    return this.module.tasksToStages.page(task.id, data);
  }

  async listDue(input: IListDueTasks) {
    const { storeId, limit = 50 } = listDueTasksSchema.parse(input);
    const scopes = await this.module.funnel.taskScopes({
      storeId,
      primaryOnly: true,
    });
    const rows = await this.owner().due(
      scopes.map((s) => s.taskId),
      limit,
      new Date(),
    );
    return this.project(rows);
  }

  async listDueForWorker(input: { limit?: number } = {}) {
    const { limit = 50 } = listDueTasksSchema
      .omit({ storeId: true })
      .parse(input);
    const rows = await this.owner().dueForWorker(limit, new Date());
    return this.project(rows);
  }

  private async validateOrder(
    storeId: string,
    orderId: string,
    selection: {
      productId?: string | null;
      offerId?: string | null;
      offerIds?: string[];
    },
  ) {
    await this.owner().lockOrder(storeId, orderId);
    const ecommerce = this.modules.ecommerce;
    const [relation] = await ecommerce.storesToOrders.find({
      params: {
        limit: 1,
        filters: {
          and: [
            { column: "orderId", method: "eq", value: orderId },
            { column: "storeId", method: "eq", value: storeId },
          ],
        },
      },
    });
    if (!relation) {
      throw new Error("Not Found error. Order does not exist in this store");
    }

    if (selection.offerIds?.length) {
      const [line] = await ecommerce.ordersToProducts.find({
        params: {
          limit: 1,
          filters: {
            and: [
              { column: "orderId", method: "eq", value: orderId },
              {
                column: "offerId",
                method: "inArray",
                value: selection.offerIds,
              },
            ],
          },
        },
      });
      if (!line) {
        throw new Error("Conflict error. Order does not contain a task offer");
      }
    }
    if (selection.productId || selection.offerId) {
      const filters = [
        { column: "orderId", method: "eq" as const, value: orderId },
      ];
      if (selection.productId) {
        filters.push({
          column: "productId",
          method: "eq",
          value: selection.productId,
        });
      }
      if (selection.offerId) {
        filters.push({
          column: "offerId",
          method: "eq",
          value: selection.offerId,
        });
      }
      const [line] = await ecommerce.ordersToProducts.find({
        params: { limit: 1, filters: { and: filters } },
      });
      if (!line) {
        throw new Error(
          "Conflict error. Order does not contain the task's product and offer",
        );
      }
    }
  }

  private async append(
    task: TTask,
    kind: TTaskEventKind,
    audit: IAudit,
    detail: ITaskEventDetail,
  ) {
    const states = this.module.tasksToStages;
    if (
      (kind === "transitioned" || kind === "deadline-reached") &&
      detail.previousStageId
    ) {
      const previousState =
        task.status === "closed" && task.outcome !== "completed"
          ? "closed"
          : "completed";
      await states.setStageState(task, detail.previousStageId, previousState);
      if (task.status !== "closed") {
        await states.setStageState(task, task.stageId, "current");
      }
    } else if (kind === "closed" || kind === "deadline-reached") {
      const terminal = task.outcome === "completed" ? "completed" : "closed";
      await states.setStageState(task, task.stageId, terminal);
    }
    const stage = await states.stageForTask(task.id, task.stageId);
    const event = await states.append({
      taskId: task.id,
      stageId: stage.id,
      status: task.status,
      comment:
        detail.reason ??
        (detail.evidence?.kind === "manual" ? detail.evidence.reason : null),
      revision: task.revision,
      assignmentRevision: task.assignmentRevision,
      kind,
      ...audit,
      detail,
    });
    return event;
  }

  async open(input: IOpenTask) {
    if (isStoreEmployeeTraining(input.operationKey?.trim())) {
      throw new Error("Validation error. This opening key is reserved");
    }
    return this.openConversation(input, false);
  }

  async openEmployeeTraining(
    input: Omit<IOpenTask, "productId" | "offerId" | "orderId" | "formId">,
  ) {
    if (
      !isStoreEmployeeTraining(input.operationKey) ||
      input.actorId !== input.customerId
    ) {
      throw new Error("Validation error. Invalid employee training task");
    }
    return this.openConversation(input, true);
  }

  private async openConversation(input: IOpenTask, employeeTraining: boolean) {
    const data = openTaskSchema.parse(input);
    const { expectedFunnelRevision, ...opening } = data;
    const digest = operationDigest("opened", opening);
    const owner = this.owner();
    return owner.transaction(async () => {
      await owner.lockOpening(data.storeId, data.operationKey);
      const [previous] = await this.find({
        params: {
          limit: 1,
          filters: {
            and: [
              { column: "storeId", method: "eq", value: data.storeId },
              { column: "openingKey", method: "eq", value: data.operationKey },
            ],
          },
        },
      });
      if (previous) {
        if (
          previous.openingDigest !== digest &&
          !(await this.matchesLegacyOpening(previous, opening))
        ) {
          throw new Error(
            "Conflict error. Opening key already belongs to another request",
          );
        }
        return previous;
      }

      await this.module.funnel.lock(data.storeId, data.funnelId, "share");
      const funnel = await this.module.funnel.current(
        data.storeId,
        data.funnelId,
      );
      if (
        expectedFunnelRevision !== undefined &&
        expectedFunnelRevision !== funnel.revision
      ) {
        throw new Error(
          "Conflict error. Reload the funnel before opening a task",
        );
      }
      let selection: Awaited<
        ReturnType<typeof this.module.funnel.resolveSelection>
      > = {
        productId: undefined,
        offerId: undefined,
      };
      if (employeeTraining) {
        if (
          data.productId ||
          data.offerId ||
          data.orderId ||
          data.formId ||
          (funnel.definition.workFunding?.payer !== "store-owner" &&
            !employeeTrainingStageFunding(
              funnel.definition,
              data.customerId,
            )) ||
          funnel.definition.maintenanceSourceId
        ) {
          throw new Error(
            "Validation error. Employee training requires a store budget",
          );
        }
      } else {
        selection = await this.module.funnel.resolveSelection(data);
        this.module.funnel.assertApplicable(funnel.bindings, {
          ...selection,
          formId: data.formId,
          storeId: data.storeId,
        });
        if (data.orderId) {
          await this.validateOrder(data.storeId, data.orderId, selection);
        }
      }
      const stage = getStage(
        funnel.definition,
        funnel.definition.initialStageId,
      );
      const id = randomUUID();
      const row = await owner.open({
        id,
        ...enterStage(
          id,
          employeeTraining ? trainEmployeeStage(stage.id) : stage,
          1,
          0,
          new Date(),
        ),
        openingDigest: digest,
        openingKey: data.operationKey,
      });
      await this.module.funnel.linkTask(funnel.id, row.id);
      await this.participants.setCustomer(row.id, data.customerId);
      if (selection.offerId) {
        await this.module.tasksToEcommerceModuleStoresToProducts.create({
          data: { taskId: row.id, offerId: selection.offerId },
        });
      }
      if (data.orderId) {
        await this.module.tasksToEcommerceModuleOrders.create({
          data: { taskId: row.id, orderId: data.orderId },
        });
      }
      const [task] = await this.project([row]);
      const activeStages = employeeTraining
        ? [stage]
        : funnel.definition.stages.filter((entry) => !entry.archived);
      const stageKeys = activeStages.map((entry) => entry.id);
      await this.module.tasksToStages.addStages(task, funnel.id, stageKeys);
      await this.append(
        task,
        "opened",
        {
          actorId: data.actorId,
          causeId: data.causeId,
          operationKey: data.operationKey,
          operationDigest: digest,
        },
        {
          publicationId: funnel.id,
          productId: selection.productId,
          offerId: selection.offerId,
          stageId: stage.id,
          orderId: data.orderId,
          formId: data.formId,
        },
      );
      return task;
    });
  }

  private async matchesLegacyOpening(
    task: TTask,
    opening: Omit<IOpenTask, "expectedFunnelRevision">,
  ) {
    if (task.publicationId === task.funnelId) {
      return false;
    }

    const original = await this.module.tasksToStages.byOperation(
      task.id,
      task.openingKey,
    );
    const expectedPublicationId = original?.detail.publicationId;
    if (!expectedPublicationId) {
      return false;
    }
    // Match the property order used by the former opening schema.
    const { customerId, productId, offerId, orderId, formId, ...scope } =
      opening;
    const legacy = {
      ...scope,
      expectedPublicationId,
      customerId,
      productId,
      offerId,
      orderId,
      formId,
    };
    return operationDigest("opened", legacy) === task.openingDigest;
  }

  private async change(
    data: ICommand,
    kind: TTaskEventKind,
    action: (task: TTask, now: Date) => Promise<IAction>,
    options?: { allowClosed?: boolean },
  ) {
    const digest = operationDigest(kind, data);
    const owner = this.owner();
    return owner.transaction(async () => {
      const task = await this.requireTask(data, true);
      const previous = await this.module.tasksToStages.byOperation(
        task.id,
        data.operationKey,
      );
      if (previous) {
        if (previous.operationDigest !== digest) {
          throw new Error(
            "Conflict error. Task operation key already belongs to another request",
          );
        }
        return task;
      }
      if (task.revision !== data.expectedRevision) {
        throw new Error("Conflict error. Reload the task before changing it");
      }

      if (!options?.allowClosed) {
        assertOpen(task);
      }
      const now = new Date();
      const { patch, detail, actorKind } = await action(task, now);
      const revised = await this.revise(task.id, {
        ...patch,
        revision: task.revision + 1,
        updatedAt: now,
      });
      await this.append(
        revised,
        kind,
        {
          actorId: data.actorId,
          actorKind,
          causeId: data.causeId,
          operationKey: data.operationKey,
          operationDigest: digest,
        },
        { stageId: revised.stageId, ...detail },
      );
      if (revised.orderId && patch.outcome === "completed") {
        await this.onOrderTaskCompleted?.(revised);
      }
      return revised;
    });
  }

  async assign(
    input: IAssignTask,
    actorKind: "manager" | "system" = "manager",
    assignmentMode?: "stage",
  ) {
    const data = assignTaskSchema.parse(input);
    return this.change(data, "assigned", async (task, now) => {
      const assignmentRevision = task.assignmentRevision + 1;
      const assignmentExpiresAt = data.assignmentExpiresAt
        ? new Date(data.assignmentExpiresAt)
        : null;
      if (assignmentExpiresAt && assignmentExpiresAt <= now) {
        throw new Error(
          "Validation error. Assignment expiry must be in the future",
        );
      }

      const patch: TTaskPatch = {
        assigneeId: data.assigneeId,
        assigneeKind: data.assigneeKind,
        assignmentRevision,
        assignmentExpiresAt,
      };
      if (task.waitingSince && task.waitingRevision && task.timer) {
        const funnel = await this.funnel(task);
        const stage = getStage(funnel.definition, task.stageId);
        if (stage.waiting) {
          const remindersSent =
            task.timer.kind === "reminder"
              ? task.timer.number - 1
              : (stage.waiting?.reminderSeconds.length ?? 0);
          Object.assign(
            patch,
            nextTimer(
              task.id,
              stage,
              task.waitingSince,
              task.waitingRevision,
              assignmentRevision,
              remindersSent,
              now,
            ),
          );
        } else {
          Object.assign(patch, clearWaiting(), { status: "active" });
        }
      }

      return {
        patch,
        detail: {
          assigneeId: data.assigneeId,
          assignmentRevision,
          assignmentMode,
        },
        actorKind,
      };
    });
  }

  private async nextStage(
    task: TTask,
    definition: IFunnelDefinition,
    requested?: string,
  ) {
    const progress = this.module.tasksToStages;
    const states = await progress.stageStates(task.id);
    if (states[task.stageId] !== "current") {
      throw new Error(
        "Conflict error. The selected stage is no longer current",
      );
    }
    const stages = definition.stages.filter((entry) => !entry.archived);
    if (definition.progression === "linear") {
      return stages.find(
        (entry) =>
          states[entry.id] === "pending" || states[entry.id] === "required",
      )?.id;
    }
    const index = stages.findIndex((entry) => entry.id === requested);
    const candidates =
      index < 0 || (requested && states[requested] === "completed")
        ? stages
        : stages.slice(0, index + 1);
    const prerequisite = candidates.find(
      (entry) => states[entry.id] === "required",
    );
    if (
      prerequisite &&
      requested &&
      states[requested] === "pending" &&
      prerequisite.id !== requested
    ) {
      // Preserve the destination of the accepted action while an inserted stage runs.
      await progress.setStageState(task, requested, "required");
    }
    return prerequisite?.id ?? requested;
  }

  async transition(input: ITransitionTask) {
    const data = transitionTaskSchema.parse(input);
    return this.change(data, "transitioned", async (task, now) => {
      if (task.deadlineAt && task.deadlineAt <= now) {
        throw new Error("Conflict error. The task deadline has passed");
      }
      assertEvidence(
        task,
        data.actorId,
        data.actorKind,
        data.expectedAssignmentRevision,
        data.evidence,
        now,
      );
      if (
        task.status === "waiting" &&
        task.expectedEvent !== data.evidence.kind &&
        data.evidence.kind !== "manual"
      ) {
        throw new Error(
          "Conflict error. The task is waiting for a different event",
        );
      }

      const funnel = await this.funnel(task);
      const stage = getStage(funnel.definition, task.stageId);
      const action = stage.actions.find((entry) => entry.id === data.actionId);
      if (
        funnel.definition.progression === "linear" &&
        data.evidence.kind === "model-result"
      ) {
        const checkId = z.uuid().safeParse(data.causeId).data;
        const check =
          checkId &&
          (await this.module.tasksToStages.findById({ id: checkId }));
        if (
          !check ||
          check.kind !== "stage-check" ||
          !check.pending ||
          check.taskId !== task.id ||
          check.detail.stageId !== stage.id ||
          check.detail.publicationId !== task.publicationId ||
          check.assignmentRevision !== task.assignmentRevision ||
          check.detail.assigneeId !== data.actorId
        ) {
          throw new Error(
            "Forbidden error. A linear transition requires the current message's stage check",
          );
        }
      }
      if (
        !action ||
        !action.actors.includes(data.actorKind) ||
        !action.evidence.includes(data.evidence.kind) ||
        (action.deliveryStage &&
          (data.evidence.kind !== "delivery" ||
            data.evidence.stage !== action.deliveryStage))
      ) {
        throw new Error(
          "Forbidden error. This action and evidence are unavailable to the actor at this stage",
        );
      }

      let destination = action.nextStageId;
      if (destination || action.outcome === "completed") {
        destination = await this.nextStage(
          task,
          funnel.definition,
          destination,
        );
      }
      let patch: TTaskPatch;
      if (destination) {
        const nextStage = getStage(funnel.definition, destination);
        patch = enterStage(
          task.id,
          nextStage,
          task.revision + 1,
          task.assignmentRevision,
          now,
        );
      } else if (action.outcome) {
        patch = closeTask(action.outcome);
      } else {
        throw new Error(
          "Internal error. The action has no destination or outcome",
        );
      }

      return {
        patch,
        detail: {
          previousStageId: task.stageId,
          actionId: action.id,
          evidence: data.evidence,
        },
        actorKind: data.actorKind,
      };
    });
  }

  async recordEvidence(input: IRecordTaskEvidence) {
    const data = recordTaskEvidenceSchema.parse(input);
    return this.change(data, "evidence-recorded", async (task, now) => {
      if (task.deadlineAt && task.deadlineAt <= now) {
        throw new Error("Conflict error. The task deadline has passed");
      }
      assertEvidence(
        task,
        data.actorId,
        data.actorKind,
        data.expectedAssignmentRevision,
        data.evidence,
        now,
      );
      const funnel = await this.funnel(task);
      const stage = getStage(funnel.definition, task.stageId);
      if (task.expectedEvent === data.evidence.kind) {
        throw new Error(
          "Validation error. Use a transition for the expected event",
        );
      }
      if (!stage.waiting?.completionEvidence.includes(data.evidence.kind)) {
        throw new Error(
          "Forbidden error. This stage does not accept the evidence",
        );
      }
      return {
        patch: {},
        detail: { evidence: data.evidence },
        actorKind: data.actorKind,
      };
    });
  }

  async resumeCustomerWork(input: IResumeCustomerWork) {
    const data = resumeCustomerWorkSchema.parse(input);
    const task = await this.change(
      data,
      "customer-work-resumed",
      async (current, now) => {
        assertAssignment(
          current,
          data.assigneeId,
          data.expectedAssignmentRevision,
          now,
        );
        if (
          current.status !== "active" ||
          current.assigneeKind !== "ai" ||
          (current.deadlineAt && current.deadlineAt <= now)
        ) {
          throw new Error("Conflict error. The task is not accepting AI work");
        }
        const source = await this.module.tasksToStages.findById({
          id: data.causeId,
        });
        if (
          source?.taskId !== current.id ||
          source.kind !== "customer-message" ||
          !source.detail.messageId
        ) {
          throw new Error(
            "Not Found error. The original customer message is unavailable",
          );
        }
        return {
          patch: {},
          detail: {
            messageId: source.detail.messageId,
            sourceRevision: source.revision,
            assigneeId: data.assigneeId,
            assignmentRevision: current.assignmentRevision,
            publicationId: current.publicationId,
          },
          actorKind: data.actorKind ?? "manager",
        };
      },
    );
    const event = await this.module.tasksToStages.byOperation(
      task.id,
      data.operationKey,
    );
    if (!event) {
      throw new Error("Internal error. Resumed customer work was not recorded");
    }
    return { task, event };
  }

  private async clearAssignment(current: TTask, now: Date) {
    const assignmentRevision = current.assignmentRevision + 1;
    const patch: TTaskPatch = {
      assigneeId: null,
      assigneeKind: null,
      assignmentRevision,
      assignmentExpiresAt: null,
    };
    if (current.waitingSince && current.waitingRevision && current.timer) {
      const funnel = await this.funnel(current);
      const stage = getStage(funnel.definition, current.stageId);
      if (stage.waiting) {
        const remindersSent =
          current.timer.kind === "reminder"
            ? current.timer.number - 1
            : (stage.waiting?.reminderSeconds.length ?? 0);
        Object.assign(
          patch,
          nextTimer(
            current.id,
            stage,
            current.waitingSince,
            current.waitingRevision,
            assignmentRevision,
            remindersSent,
            now,
          ),
        );
      } else {
        Object.assign(patch, clearWaiting(), { status: "active" });
      }
    }
    return patch;
  }

  releaseAgentAssignment(current: TTask) {
    if (current.assigneeKind !== "ai" || !current.assigneeId) {
      return current;
    }
    return this.change(
      {
        storeId: current.storeId,
        taskId: current.id,
        actorId: current.assigneeId,
        expectedRevision: current.revision,
        operationKey: `release-agent:${current.assignmentRevision}`,
      },
      "assignment-released",
      async (task, now) => ({
        patch: await this.clearAssignment(task, now),
        detail: { assigneeId: current.assigneeId ?? undefined },
        actorKind: "system",
      }),
    );
  }

  async queuePaidOrderReply(
    task: TTask,
    input: {
      eventId: string;
      orderId: string;
      paymentIntentId: string;
      messageId: string;
    },
  ) {
    const resumesWaiting =
      task.status === "waiting" &&
      (task.expectedEvent === "payment" || task.expectedEvent === "message");
    if (
      task.orderId !== input.orderId ||
      (task.status !== "active" && !resumesWaiting) ||
      task.assigneeKind !== "ai" ||
      !task.assigneeId
    ) {
      return;
    }
    const operationKey = `paid-order-reply:${input.eventId}:${task.stageId}:${task.assignmentRevision}`;
    const previous = await this.module.tasksToStages.byOperation(
      task.id,
      operationKey,
    );
    if (previous) {
      return;
    }
    await this.change(
      {
        taskId: task.id,
        storeId: task.storeId,
        actorId: task.customerId,
        operationKey,
        causeId: input.eventId,
        expectedRevision: task.revision,
      },
      "customer-work-resumed",
      async () => ({
        patch: resumesWaiting
          ? { ...clearWaiting(), status: "active" as const }
          : {},
        actorKind: "system",
        detail: {
          assigneeId: task.assigneeId!,
          messageId: input.messageId,
          publicationId: task.publicationId,
          evidence: {
            kind: "payment",
            orderId: input.orderId,
            paymentId: input.paymentIntentId,
          },
        },
      }),
    );
    const event = await this.module.tasksToStages.byOperation(
      task.id,
      operationKey,
    );
    if (!event) {
      throw new Error("Internal error. The paid order reply was not recorded");
    }
    await this.module.tasksToStages.setPending(event.id, true);
    return event;
  }

  async queueStageEntry(task: TTask) {
    const stages = this.module.tasksToStages;
    return this.withTask(
      { storeId: task.storeId, taskId: task.id },
      async (current) => {
        if (
          current.stageId !== task.stageId ||
          current.assignmentRevision !== task.assignmentRevision ||
          current.status === "closed" ||
          current.assigneeKind !== "ai" ||
          !current.assigneeId
        ) {
          return;
        }
        const [state] = await stages.find({
          params: {
            limit: 1,
            filters: {
              and: [
                { column: "taskId", method: "eq", value: current.id },
                { column: "variant", method: "eq", value: "current" },
              ],
            },
          },
        });
        if (!state || state.detail.stageId !== current.stageId) {
          return;
        }
        const operationKey = `stage-entry:${state.id}:${state.revision}`;
        if (await stages.byOperation(current.id, operationKey)) {
          return;
        }
        const revised = await this.change(
          {
            taskId: current.id,
            storeId: current.storeId,
            expectedRevision: current.revision,
            actorId: current.assigneeId,
            operationKey,
            causeId: state.id,
          },
          "stage-entry",
          async () => ({
            patch: {},
            actorKind: "system",
            detail: {
              publicationId: current.publicationId,
              assigneeId: current.assigneeId!,
            },
          }),
        );
        const event = await stages.byOperation(current.id, operationKey);
        if (!event) {
          throw new Error("Internal error. The stage entry was not recorded");
        }
        await stages.setPending(event.id, true);
        return { event, task: revised };
      },
    );
  }

  async queueStageCheck(task: TTask, actorId: string, messageId: string) {
    if (
      task.status !== "active" ||
      task.assigneeKind !== "ai" ||
      !task.assigneeId ||
      isStoreEmployeeTraining(task.openingKey)
    ) {
      return;
    }
    const funnel = await this.funnel(task);
    const stage = getStage(funnel.definition, task.stageId);
    if (
      funnel.definition.progression !== "linear" ||
      !stageCompletionCondition(stage) ||
      !stageWorkFunding(funnel.definition, stage)
    ) {
      return;
    }
    const operationKey = `stage-check:${messageId}`;
    const previous = await this.module.tasksToStages.byOperation(
      task.id,
      operationKey,
    );
    if (previous) {
      return previous;
    }
    await this.change(
      {
        taskId: task.id,
        storeId: task.storeId,
        expectedRevision: task.revision,
        operationKey,
        actorId,
        causeId: messageId,
      },
      "stage-check",
      async () => ({
        patch: {},
        actorKind: "system",
        detail: {
          messageId,
          publicationId: task.publicationId,
          assigneeId: task.assigneeId!,
        },
      }),
    );
    const event = await this.module.tasksToStages.byOperation(
      task.id,
      operationKey,
    );
    if (!event) {
      throw new Error("Internal error. The stage check was not recorded");
    }
    await this.module.tasksToStages.setPending(event.id, true);
    return event;
  }

  async activity(input: TCustomerTaskActivity) {
    const data = customerTaskActivitySchema.parse(input);
    const task = await this.change(data, data.kind, async (current, now) => {
      if (
        data.kind !== "staff-message" &&
        current.customerId !== data.actorId
      ) {
        throw new Error(
          "Forbidden error. The task belongs to another customer",
        );
      }
      if (current.deadlineAt && current.deadlineAt <= now) {
        throw new Error("Conflict error. The task deadline has passed");
      }

      if (data.kind === "customer-budget-approved") {
        const funnel = await this.funnel(current);
        const stage = getStage(funnel.definition, current.stageId);
        const funding = stageWorkFunding(funnel.definition, stage);
        if (!customerPaysForWork(funding)) {
          throw new Error(
            "Forbidden error. The customer does not fund this task",
          );
        }
        return {
          patch: {},
          detail: {
            publicationId: current.publicationId,
            customerId: current.customerId,
            budgetCurrencyId: funding.currencyId,
            budgetPriceKey: data.priceKey,
            budgetRates: data.rates,
            approvedMaximum: data.approvedMaximum,
          },
          actorKind: "human",
        };
      }
      if (data.kind === "customer-handoff-requested") {
        return {
          patch: await this.clearAssignment(current, now),
          detail: { previousStageId: current.stageId },
          actorKind: "human",
        };
      }
      if (data.kind === "customer-cart-approved") {
        const funnel = await this.funnel(current);
        const stage = getStage(funnel.definition, current.stageId);
        if (!stage.cartOfferIds?.includes(data.cartSelection.offerId)) {
          throw new Error(
            "Forbidden error. The offer is unavailable for this stage",
          );
        }
        return {
          patch: {},
          detail: { orderId: data.orderId, cartSelection: data.cartSelection },
          actorKind: "human",
        };
      }
      const patch: TTaskPatch = {};
      if (
        data.kind === "customer-message" &&
        current.status === "waiting" &&
        current.expectedEvent === "message"
      ) {
        Object.assign(patch, clearWaiting(), { status: "active" });
      }
      return {
        patch,
        detail: {
          messageId: data.messageId,
          coverAttachmentRole: data.coverAttachmentRole,
          evidence: { kind: "message", messageId: data.messageId },
          assigneeId: current.assigneeId ?? undefined,
          assignmentRevision: current.assignmentRevision,
        },
        actorKind: "human",
      };
    });
    const event = await this.module.tasksToStages.byOperation(
      task.id,
      data.operationKey,
    );
    if (!event) {
      throw new Error("Internal error. Customer activity could not be found");
    }
    return { task, event };
  }

  async transferCustomer(input: ITransferTaskCustomer) {
    const data = transferTaskCustomerSchema.parse(input);
    return this.change(
      data,
      "customer-transferred",
      async (current) => {
        if (
          current.customerId !== data.previousCustomerId ||
          data.actorId !== data.customerId
        ) {
          throw new Error(
            "Forbidden error. The verified customer does not match the task",
          );
        }
        return {
          patch: { customerId: data.customerId },
          detail: {
            previousCustomerId: data.previousCustomerId,
            customerId: data.customerId,
          },
          actorKind: "human",
        };
      },
      { allowClosed: true },
    );
  }

  async attachOffer(input: IAttachTaskOffer) {
    const data = attachTaskOfferSchema.parse(input);
    return this.change(data, "offer-attached", async (task) => {
      const offer = await this.module.funnel.resolveSelection({
        storeId: task.storeId,
        offerId: data.offerId,
      });
      await this.owner().attachOffer(task.id, data.offerId);
      return { patch: {}, detail: offer };
    });
  }

  async attachOrder(input: IAttachTaskOrder) {
    const data = attachTaskOrderSchema.parse(input);
    return this.change(data, "order-attached", async (task) => {
      await this.validateOrder(task.storeId, data.orderId, {
        offerIds: task.offerIds,
      });
      await this.owner().attachOrder(task.id, data.orderId);
      return {
        patch: {},
        detail: { orderId: data.orderId },
      };
    });
  }

  async close(input: ICloseTask) {
    const data = closeTaskSchema.parse(input);
    return this.change(data, "closed", async () => ({
      patch: closeTask("closed-without-result"),
      detail: { reason: data.reason },
    }));
  }

  async applyTimer(
    input: IApplyTimer,
    onReminder?: (event: { id: string }) => Promise<unknown>,
  ) {
    const data = applyTimerSchema.parse(input);
    const owner = this.owner();
    return owner.transaction(async () => {
      const task = await this.requireTask(data, true);
      const key = `timer:${data.timerKey}`;
      const previous = await this.module.tasksToStages.byOperation(
        task.id,
        key,
      );
      if (previous) {
        const { operationDigest: previousDigest, ...event } = previous;
        return { task, event, applied: false };
      }

      const now = new Date();
      if (
        !task.timer ||
        task.timer.key !== data.timerKey ||
        !task.nextActionAt ||
        task.nextActionAt > now ||
        task.status !== "waiting"
      ) {
        return { task, event: null, applied: false };
      }
      if (!task.waitingSince || !task.waitingRevision || !task.deadlineAt) {
        throw new Error(
          "Internal error. Waiting task is missing its timer state",
        );
      }

      const funnel = await this.funnel(task);
      const stage = getStage(funnel.definition, task.stageId);
      const digest = operationDigest("timer", data);
      let patch: TTaskPatch;
      let kind: TTaskEventKind;
      let detail: ITaskEventDetail = { stageId: task.stageId };
      if (!stage.waiting) {
        const updated = await this.revise(task.id, {
          ...clearWaiting(),
          status: "active",
          revision: task.revision + 1,
          updatedAt: now,
        });
        return { task: updated, event: null, applied: false };
      }
      if (task.timer.kind === "reminder" && task.deadlineAt > now) {
        patch = nextTimer(
          task.id,
          stage,
          task.waitingSince,
          task.waitingRevision,
          task.assignmentRevision,
          task.timer.number,
          now,
        );
        kind = "reminder-due";
        detail = {
          ...detail,
          timerNumber: task.timer.number,
          waitingRevision: task.waitingRevision,
          customerId: task.customerId,
          publicationId: task.publicationId,
        };
      } else {
        patch = closeTask("closed-without-result");
        if (task.orderId) {
          await this.modules.ecommerce.order.cancelUnfulfilledAtDeadline(
            task.orderId,
            task.id,
          );
        }
        kind = "deadline-reached";
      }

      const updated = await this.revise(task.id, {
        ...patch,
        revision: task.revision + 1,
        updatedAt: now,
      });
      const eventRecord = await this.append(
        updated,
        kind,
        {
          actorKind: "system",
          operationKey: key,
          operationDigest: digest,
        },
        detail,
      );
      const { operationDigest: eventDigest, ...event } = eventRecord;
      if (kind === "reminder-due" && onReminder) {
        await onReminder(event);
      }
      return { task: updated, event, applied: true };
    });
  }

  override async create(): Promise<never> {
    throw new Error("Forbidden error. Use open to create a task");
  }

  override async findOrCreate(): Promise<never> {
    throw new Error("Forbidden error. Use open to create a task");
  }

  override async update(): Promise<never> {
    throw new Error("Forbidden error. Use task commands to change a task");
  }

  override async delete(): Promise<never> {
    throw new Error("Forbidden error. Close a task to retain its history");
  }
}
