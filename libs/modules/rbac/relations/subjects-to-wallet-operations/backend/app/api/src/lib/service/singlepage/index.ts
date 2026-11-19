import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import type { IModel } from "@sps/rbac/relations/subjects-to-wallet-operations/sdk/model";
import { Repository } from "../../repository";

@injectable()
export class Service extends CRUDService<IModel> {
  declare repository: Repository;

  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }

  pendingReconciliations(limit: number) {
    return this.repository.pendingReconciliations(limit);
  }

  obligations(
    senderId: string,
    currencyId: string,
    storeId: string,
    taskId: string,
  ) {
    return this.repository.obligations(senderId, currencyId, storeId, taskId);
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
