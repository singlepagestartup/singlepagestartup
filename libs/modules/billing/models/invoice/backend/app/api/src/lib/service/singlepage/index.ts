import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/billing/models/invoice/backend/repository/database";
import type { Repository } from "../../repository";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;

  lockForSettlement(id: string) {
    return this.repository.lockForSettlement(id);
  }

  async failOpenInvoice(id: string) {
    return this.repository.consumeFirstByField(
      "id",
      id,
      { status: "failed" },
      {
        and: [{ column: "status", method: "eq", value: "open" }],
      },
    );
  }
}
