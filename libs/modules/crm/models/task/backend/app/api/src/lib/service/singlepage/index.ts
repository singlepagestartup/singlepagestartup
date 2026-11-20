import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { createModules } from "@sps/crm/backend/app/api/src/lib/modules";
import { Table } from "@sps/crm/models/task/backend/repository/database";
import type { TActorKind } from "@sps/crm/models/funnel/sdk/model";
import type {
  ITaskEventDetail,
  TTaskEventKind,
} from "@sps/crm/models/task-event/sdk/model";
import {
  applyTimerSchema,
  assignTaskSchema,
  attachTaskOrderSchema,
  closeTaskSchema,
  customerTaskActivitySchema,
  getTaskWorkSchema,
  isStoreEmployeeTraining,
  listDueTasksSchema,
  listTasksSchema,
  migrateTaskSchema,
  openTaskSchema,
  recordTaskEvidenceSchema,
  taskHistorySchema,
  taskScopeSchema,
  transferTaskCustomerSchema,
  transitionTaskSchema,
  type IApplyTimer,
  type IAssignTask,
  type IAttachTaskOrder,
  type ICloseTask,
  type IGetTaskWork,
  type IListDueTasks,
  type IListTasks,
  type IMigrateTask,
  type IOpenTask,
  type IRecordTaskEvidence,
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

type TTask = typeof Table.$inferSelect;
type TTaskPatch = Partial<typeof Table.$inferInsert>;

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

  private async requireTask(scope: ITaskScope, lock = false) {
    const task = await this.owner().scoped(scope, lock);
    if (!task) {
      throw new Error("Not Found error. Task does not exist in this store");
    }
    return task;
  }

  async get(input: ITaskScope) {
    return this.requireTask(taskScopeSchema.parse(input));
  }

  async withTask<T>(input: ITaskScope, operation: (task: TTask) => Promise<T>) {
    const scope = taskScopeSchema.parse(input);
    return this.owner().transaction(async () => {
      const task = await this.requireTask(scope, true);
      return operation(task);
    });
  }

  private async publication(task: TTask) {
    const publication = await this.module.funnelPublication.findById({
      id: task.publicationId,
    });
    if (!publication || publication.funnelId !== task.funnelId) {
      throw new Error(
        "Internal error. The task's funnel publication is missing",
      );
    }
    return publication;
  }

  async getPublication(input: ITaskScope) {
    const task = await this.get(input);
    return this.publication(task);
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
      throw new Error("Conflict error. The task is not accepting work");
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
    const publication = await this.publication(task);
    const stage = getStage(publication.definition, task.stageId);
    const employeeTraining = isStoreEmployeeTraining(task.openingKey);
    return {
      task,
      stage: employeeTraining ? trainEmployeeStage(stage.id) : stage,
      funding: publication.definition.workFunding,
      maintenanceSourceId: employeeTraining
        ? undefined
        : publication.definition.maintenanceSourceId,
    };
  }

  async list(input: IListTasks) {
    return this.owner().list(listTasksSchema.parse(input), new Date());
  }

  async history(input: ITaskHistory) {
    const data = taskHistorySchema.parse(input);
    const task = await this.requireTask(data);
    return this.module.taskEvent.page(task.id, data);
  }

  async listDue(input: IListDueTasks) {
    const { storeId, limit = 50 } = listDueTasksSchema.parse(input);
    return this.owner().due(storeId, limit, new Date());
  }

  async listDueForWorker(input: { limit?: number } = {}) {
    const { limit = 50 } = listDueTasksSchema
      .omit({ storeId: true })
      .parse(input);
    return this.owner().dueForWorker(limit, new Date());
  }

  private async validateOrder(
    storeId: string,
    orderId: string,
    selection: { productId?: string | null; offerId?: string | null },
    taskId?: string,
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

    const [attached] = await this.find({
      params: {
        limit: 1,
        filters: {
          and: [
            { column: "storeId", method: "eq", value: storeId },
            { column: "orderId", method: "eq", value: orderId },
          ],
        },
      },
    });
    if (attached && attached.id !== taskId) {
      throw new Error("Conflict error. Order already has a task in this store");
    }
  }

  private async append(
    task: TTask,
    kind: TTaskEventKind,
    audit: IAudit,
    detail: ITaskEventDetail,
  ) {
    const event = await this.module.taskEvent.append({
      taskId: task.id,
      revision: task.revision,
      assignmentRevision: task.assignmentRevision,
      kind,
      ...audit,
      detail,
    });
    await this.module.tasksToTaskEvents.create({
      data: { taskId: task.id, eventId: event.id },
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
    const digest = operationDigest("opened", data);
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
        if (previous.openingDigest !== digest) {
          throw new Error(
            "Conflict error. Opening key already belongs to another request",
          );
        }
        return previous;
      }

      const publication = await this.module.funnel.current(
        data.storeId,
        data.funnelId,
      );
      if (
        data.expectedPublicationId &&
        data.expectedPublicationId !== publication.id
      ) {
        throw new Error(
          "Conflict error. The funnel was published again. Reload its current version",
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
          publication.definition.workFunding?.payer !== "store-owner" ||
          publication.definition.maintenanceSourceId
        ) {
          throw new Error(
            "Validation error. Employee training requires a published store budget",
          );
        }
      } else {
        selection = await this.module.funnel.resolveSelection(data);
        this.module.funnel.assertApplicable(publication.bindings, {
          ...selection,
          formId: data.formId,
          storeId: data.storeId,
        });
        if (data.orderId) {
          await this.validateOrder(data.storeId, data.orderId, selection);
        }
      }
      const stage = getStage(
        publication.definition,
        publication.definition.initialStageId,
      );
      const id = randomUUID();
      const task = await owner.open({
        id,
        storeId: data.storeId,
        funnelId: data.funnelId,
        publicationId: publication.id,
        customerId: data.customerId,
        ...selection,
        orderId: data.orderId,
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
      await this.module.tasksToFunnelPublications.create({
        data: { taskId: task.id, publicationId: publication.id },
      });
      if (selection.productId) {
        await this.module.tasksToEcommerceModuleProducts.create({
          data: { taskId: task.id, productId: selection.productId },
        });
      }
      if (selection.offerId) {
        await this.module.tasksToEcommerceModuleStoresToProducts.create({
          data: { taskId: task.id, offerId: selection.offerId },
        });
      }
      if (data.orderId) {
        await this.module.tasksToEcommerceModuleOrders.create({
          data: { taskId: task.id, orderId: data.orderId },
        });
      }
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
          publicationId: publication.id,
          stageId: stage.id,
          orderId: data.orderId,
          formId: data.formId,
        },
      );
      return task;
    });
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
      const previous = await this.module.taskEvent.byOperation(
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
      const revised = await owner.revise(task.id, {
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
      return revised;
    });
  }

  async assign(
    input: IAssignTask,
    actorKind: "manager" | "system" = "manager",
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
        const publication = await this.publication(task);
        const stage = getStage(publication.definition, task.stageId);
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
      }

      return {
        patch,
        detail: { assigneeId: data.assigneeId, assignmentRevision },
        actorKind,
      };
    });
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

      const publication = await this.publication(task);
      const stage = getStage(publication.definition, task.stageId);
      const action = stage.actions.find((entry) => entry.id === data.actionId);
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

      let patch: TTaskPatch;
      if (action.nextStageId) {
        const nextStage = getStage(publication.definition, action.nextStageId);
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
      const publication = await this.publication(task);
      const stage = getStage(publication.definition, task.stageId);
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

  async activity(input: TCustomerTaskActivity) {
    const data = customerTaskActivitySchema.parse(input);
    const task = await this.change(data, data.kind, async (current, now) => {
      if (current.customerId !== data.actorId) {
        throw new Error(
          "Forbidden error. The task belongs to another customer",
        );
      }
      if (current.deadlineAt && current.deadlineAt <= now) {
        throw new Error("Conflict error. The task deadline has passed");
      }

      if (data.kind === "customer-budget-approved") {
        const published = await this.publication(current);
        const funding = published.definition.workFunding;
        if (funding?.payer !== "customer") {
          throw new Error(
            "Forbidden error. The customer does not fund this task",
          );
        }
        return {
          patch: {},
          detail: {
            publicationId: published.id,
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
        const assignmentRevision = current.assignmentRevision + 1;
        const patch: TTaskPatch = {
          assigneeId: null,
          assigneeKind: null,
          assignmentRevision,
          assignmentExpiresAt: null,
        };
        if (current.waitingSince && current.waitingRevision && current.timer) {
          const published = await this.publication(current);
          const stage = getStage(published.definition, current.stageId);
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
        }
        return {
          patch,
          detail: { previousStageId: current.stageId },
          actorKind: "human",
        };
      }
      if (data.kind === "customer-cart-approved") {
        const published = await this.publication(current);
        const stage = getStage(published.definition, current.stageId);
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
      if (current.status === "waiting" && current.expectedEvent === "message") {
        Object.assign(patch, clearWaiting(), { status: "active" });
      }
      return {
        patch,
        detail: {
          messageId: data.messageId,
          evidence: { kind: "message", messageId: data.messageId },
          assigneeId: current.assigneeId ?? undefined,
          assignmentRevision: current.assignmentRevision,
        },
        actorKind: "human",
      };
    });
    const event = await this.module.taskEvent.byOperation(
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

  async migrate(input: IMigrateTask) {
    const data = migrateTaskSchema.parse(input);
    return this.change(data, "migrated", async (task, now) => {
      const publication = await this.module.funnelPublication.findById({
        id: data.publicationId,
      });
      if (!publication || publication.funnelId !== task.funnelId) {
        throw new Error(
          "Not Found error. The selected publication does not belong to the task's funnel",
        );
      }
      if (publication.id === task.publicationId) {
        throw new Error(
          "Validation error. Select a different publication to migrate the task",
        );
      }

      const stage = getStage(publication.definition, data.stageId);
      const links = this.module.tasksToFunnelPublications;
      const [link] = await links.find({
        params: {
          filters: {
            and: [{ column: "taskId", method: "eq", value: task.id }],
          },
        },
      });
      if (!link) {
        throw new Error(
          "Internal error. The current publication relation is missing",
        );
      }
      await links.update({
        id: link.id,
        data: { publicationId: publication.id },
      });

      return {
        patch: {
          ...enterStage(
            task.id,
            stage,
            task.revision + 1,
            task.assignmentRevision,
            now,
          ),
          publicationId: publication.id,
        },
        detail: {
          previousPublicationId: task.publicationId,
          publicationId: publication.id,
          previousStageId: task.stageId,
          reason: data.reason,
        },
        actorKind: "manager",
      };
    });
  }

  async attachOrder(input: IAttachTaskOrder) {
    const data = attachTaskOrderSchema.parse(input);
    return this.change(data, "order-attached", async (task) => {
      if (task.orderId) {
        throw new Error("Conflict error. Task is already linked to an order");
      }

      await this.validateOrder(task.storeId, data.orderId, task, task.id);
      await this.module.tasksToEcommerceModuleOrders.create({
        data: { taskId: task.id, orderId: data.orderId },
      });
      return {
        patch: { orderId: data.orderId },
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
      const previous = await this.module.taskEvent.byOperation(task.id, key);
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

      const publication = await this.publication(task);
      const stage = getStage(publication.definition, task.stageId);
      const digest = operationDigest("timer", data);
      let patch: TTaskPatch;
      let kind: TTaskEventKind;
      let causeId: string | undefined;
      let detail: ITaskEventDetail = { stageId: task.stageId };
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
        const completionEvidence = stage.waiting?.completionEvidence ?? [];
        let result: Awaited<
          ReturnType<Service["module"]["taskEvent"]["qualifyingEvidence"]>
        > = undefined;
        if (
          completionEvidence.length > 0 &&
          stage.waiting?.silenceOutcome !== "closed-without-result"
        ) {
          result = await this.module.taskEvent.qualifyingEvidence(
            task.id,
            task.waitingRevision,
            completionEvidence,
          );
        }
        causeId = result?.id;
        detail = { ...detail, evidence: result?.detail.evidence };
        patch = closeTask(result ? "completed" : "closed-without-result");
        kind = "deadline-reached";
      }

      const updated = await owner.revise(task.id, {
        ...patch,
        revision: task.revision + 1,
        updatedAt: now,
      });
      const eventRecord = await this.append(
        updated,
        kind,
        {
          actorKind: "system",
          causeId,
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
