import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/relations/stores-to-orders/backend/repository/database";

@injectable()
@injectFromBase()
export class Controller extends RESTController<
  (typeof Table)["$inferSelect"]
> {}
