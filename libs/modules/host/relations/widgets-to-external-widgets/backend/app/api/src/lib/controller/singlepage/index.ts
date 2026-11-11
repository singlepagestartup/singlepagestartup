import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/host/relations/widgets-to-external-widgets/backend/repository/database";

@injectable()
@injectFromBase()
export class Controller extends RESTController<
  (typeof Table)["$inferSelect"]
> {}
