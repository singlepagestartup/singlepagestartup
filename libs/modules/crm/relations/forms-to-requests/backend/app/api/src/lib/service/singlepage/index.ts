import { createModules } from "../modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import type { Repository } from "../../repository";
import { Table } from "@sps/crm/relations/forms-to-requests/backend/repository/database";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

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
