import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import type { Repository } from "../../repository";
import { Table } from "@sps/crm/relations/forms-to-requests/backend/repository/database";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  withTransaction(db: Repository["db"]): this {
    const repository = Object.assign(
      Object.create(Object.getPrototypeOf(this.repository)),
      this.repository,
      { db },
    );
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, {
      repository,
    });
  }
}
