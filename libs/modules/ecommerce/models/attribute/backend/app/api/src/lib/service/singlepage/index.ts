import { createModule } from "../module";
import { createModules } from "@sps/ecommerce/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/attribute/backend/repository/database";
import { Repository } from "../../repository";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }
}
