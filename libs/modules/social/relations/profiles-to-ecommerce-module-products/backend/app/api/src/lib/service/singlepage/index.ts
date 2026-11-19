import { createModules } from "@sps/social/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/profiles-to-ecommerce-module-products/backend/repository/database";
import type { IStoreExpertScope, Repository } from "../../repository";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  resolveStoreExpert(scope: IStoreExpertScope) {
    return (this.repository as Repository).resolveStoreExpert(scope);
  }
}
