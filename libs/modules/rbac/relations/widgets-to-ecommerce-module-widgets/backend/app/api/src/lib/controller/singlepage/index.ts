import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/backend/repository/database";

@injectable()
@injectFromBase()
export class Controller extends RESTController<
  (typeof Table)["$inferSelect"]
> {}
