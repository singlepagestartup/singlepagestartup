import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/messages-to-crm-module-task-events/backend/repository/database";

@injectable()
@injectFromBase()
export class Controller extends RESTController<typeof Table.$inferSelect> {
  override httpRoutes = [];
}
