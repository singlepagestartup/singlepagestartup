import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/models/task-event/backend/repository/database";
import type {
  IPageInput,
  TEvidenceKind,
} from "@sps/crm/models/funnel/sdk/model";
import type { Repository } from "../../repository";

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
          ],
        },
      },
    });
    return row;
  }

  page(taskId: string, input: IPageInput) {
    return this.owner().page(taskId, input);
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
