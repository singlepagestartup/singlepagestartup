import "reflect-metadata";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/billing/models/invoice/backend/repository/database";
import type { Repository } from "../../repository";

export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;
  lockForSettlement(id: string) {
    return this.repository.lockForSettlement(id);
  }
}
