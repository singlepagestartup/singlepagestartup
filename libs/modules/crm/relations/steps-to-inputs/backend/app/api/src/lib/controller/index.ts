import "reflect-metadata";
import { injectable } from "inversify";
import { RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/relations/steps-to-inputs/backend/repository/database";

@injectable()
export class Controller extends RESTController<
  (typeof Table)["$inferSelect"]
> {}
