import { createModule } from "../module";
import { createModules } from "@sps/rbac/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/role/backend/repository/database";

import { Service as PublicResourceIdsService } from "../startup/public-resource-ids";
import type { IPublicResourceIdsParams } from "@sps/rbac/models/role/sdk/model";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  publicResourceIds(props: IPublicResourceIdsParams) {
    return new PublicResourceIdsService({
      permission: this.module.permission,
      rolesToPermissions: this.module.rolesToPermissions,
    }).execute(props);
  }
}
