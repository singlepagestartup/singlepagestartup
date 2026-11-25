import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import type { IModel } from "@sps/billing/models/transaction/sdk/model";
import { Repository } from "../../repository";

@injectable()
export class Service extends CRUDService<IModel> {
  declare repository: Repository;

  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }

  pendingReconciliations(limit: number, storeId?: string) {
    return this.repository.pendingReconciliations(limit, storeId);
  }
  history(storeId: string, before?: string, taskId?: string) {
    return this.repository.history(storeId, before, taskId);
  }

  obligations(
    walletId: string,
    currencyId: string,
    storeId: string,
    taskId: string,
    eventId?: string,
    stageId?: string,
  ) {
    return this.repository.obligations(
      walletId,
      currencyId,
      storeId,
      taskId,
      eventId,
      stageId,
    );
  }

  async byKey(storeId: string, operationKey: string) {
    const records = await this.find({
      params: {
        filters: {
          and: [
            { column: "storeId", method: "eq", value: storeId },
            { column: "operationKey", method: "eq", value: operationKey },
          ],
        },
        limit: 1,
      },
    });
    return records[0];
  }
}
