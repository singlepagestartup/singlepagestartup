import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/role/backend/repository/database";

import { Repository } from "../../repository";
import { RoleDI } from "../../di";
import { Service as PermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
import { Service as RolesToPermissionsService } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/service";
import { Service as PublicResourceIdsService } from "./public-resource-ids";
import type { IPublicResourceIdsParams } from "@sps/rbac/models/role/sdk/model";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(RoleDI.IPermissionService)
    private readonly permission: PermissionService,
    @inject(RoleDI.IRolesToPermissionsService)
    private readonly rolesToPermissions: RolesToPermissionsService,
  ) {
    super(repository);
  }

  publicResourceIds(props: IPublicResourceIdsParams) {
    return new PublicResourceIdsService({
      permission: this.permission,
      rolesToPermissions: this.rolesToPermissions,
    }).execute(props);
  }
}
