import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/relations/topics-to-notifications/backend/repository/database";

@injectable()
@injectFromBase()
export class Controller extends RESTController<
  (typeof Table)["$inferSelect"]
> {}
