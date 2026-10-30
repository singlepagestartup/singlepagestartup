import "reflect-metadata";
import { injectable } from "inversify";
import { RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-roles/backend/repository/database";
import type { Service } from "../../service";
import type { IRevocationDependencies } from "../../service/singlepage";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  declare service: Service;

  configureRevocation(dependencies: IRevocationDependencies) {
    this.service.configureRevocation(dependencies);
  }
}
