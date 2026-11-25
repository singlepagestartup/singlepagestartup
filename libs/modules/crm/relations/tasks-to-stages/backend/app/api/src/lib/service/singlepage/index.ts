import "reflect-metadata";
import type { TTaskStageState } from "@sps/crm/relations/tasks-to-stages/sdk/model/src/lib/workflow";

import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/relations/tasks-to-stages/backend/repository/database";
import {
  normalizeStageBehavior,
  type IPageInput,
  type TEvidenceKind,
} from "@sps/crm/models/funnel/sdk/model";
import type { Repository } from "../../repository";

interface IStageStateTask {
  id: string;
  stageId: string;
  revision: number;
  assignmentRevision: number;
}

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  private owner() {
    return this.repository as Repository;
  }

  async byOperation(taskId: string, operationKey: string) {
    const [row] = await this.find({
      params: {
        filters: {
          and: [
            { column: "taskId", method: "eq", value: taskId },
            { column: "operationKey", method: "eq", value: operationKey },
            { column: "variant", method: "eq", value: "history" },
          ],
        },
      },
    });
    return row;
  }

  async stageStates(taskId: string): Promise<Record<string, TTaskStageState>> {
    const rows = await this.owner().stageStates(taskId);
    const states: Record<string, TTaskStageState> = Object.create(null);
    for (const row of rows) {
      if (row.variant !== "history") {
        states[row.key] = row.variant;
      }
    }
    return states;
  }

  async addStages(
    task: IStageStateTask,
    funnelId: string,
    keys: string[],
    required: Set<string> = new Set(),
  ) {
    const stages = await this.owner().funnelStages(funnelId, keys);
    if (stages.length !== keys.length) {
      throw new Error(
        "Consistency error. Funnel stage keys must be unique and linked",
      );
    }
    const rows = stages.map(({ key, id }): typeof Table.$inferInsert => {
      let variant: TTaskStageState = "pending";
      if (key === task.stageId) {
        variant = "current";
      } else if (required.has(key)) {
        variant = "required";
      }
      return {
        taskId: task.id,
        stageId: id,
        variant,
        revision: task.revision,
        assignmentRevision: task.assignmentRevision,
        kind: "stage-state",
        status: "unknown",
        operationKey: key,
        operationDigest: "",
        detail: { stageId: key },
      };
    });
    await this.owner().addStageStates(rows);
  }

  async retainedStages(
    taskId: string,
    configuredKeys: string[],
    closed: boolean,
  ) {
    const rows = await this.owner().retainedStages(
      taskId,
      configuredKeys,
      closed,
    );
    return rows.map(({ stage }) => ({
      ...stage.configuration,
      ...(stage.configuration.behavior && {
        behavior: normalizeStageBehavior(stage.configuration.behavior),
      }),
      id: stage.key,
      name: stage.name,
      archived: true,
    }));
  }

  stageForTask(taskId: string, key: string) {
    return this.owner().stageForTask(taskId, key);
  }

  setStageState(task: IStageStateTask, key: string, variant: TTaskStageState) {
    return this.owner().setStageState(
      task.id,
      key,
      variant,
      task.revision,
      task.assignmentRevision,
    );
  }

  setPending(id: string, pending: boolean) {
    return this.owner().setPending(id, pending);
  }

  linkReplyAction(id: string, actionId: string) {
    return this.owner().linkReplyAction(id, actionId);
  }

  finishPending(id: string, onFinish: (actionId?: string) => Promise<void>) {
    return this.owner().finishPending(id, onFinish);
  }

  retryPreparation(id: string, failures: number, delayMs: number) {
    return this.owner().retryPreparation(id, failures, delayMs);
  }

  defer(id: string) {
    return this.owner().defer(id);
  }

  pendingEvents(limit: number, taskId?: string) {
    return this.owner().pendingEvents(limit, taskId);
  }

  async pendingHeads(limit: number, taskId?: string) {
    const events = await this.pendingEvents(limit, taskId);
    return events.map(({ id }) => ({ id }));
  }

  forMessages(taskId: string | undefined, messageIds: string[]) {
    return this.owner().forMessages(taskId, messageIds);
  }

  page(taskId: string, input: IPageInput) {
    return this.owner().page(taskId, input);
  }

  visitedStageIds(taskId: string, revision: number) {
    return this.owner().visitedStageIds(taskId, revision);
  }

  qualifyingEvidence(
    taskId: string,
    fromRevision: number,
    kinds: TEvidenceKind[],
  ) {
    return this.owner().qualifyingEvidence(taskId, fromRevision, kinds);
  }

  append(data: typeof Table.$inferInsert) {
    return this.insert(data);
  }

  override async create(): Promise<never> {
    throw new Error(
      "Forbidden error. Task history is written by task commands",
    );
  }

  override async findOrCreate(): Promise<never> {
    throw new Error(
      "Forbidden error. Task history is written by task commands",
    );
  }

  override async update(): Promise<never> {
    throw new Error("Forbidden error. Task history is immutable");
  }

  override async delete(): Promise<never> {
    throw new Error("Forbidden error. Task history is immutable");
  }
}
