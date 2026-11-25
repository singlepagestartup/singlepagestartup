import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-social-module-chats/backend/repository/database";

@injectable()
@injectFromBase()
export class Controller extends RESTController<typeof Table.$inferSelect> {
  override httpRoutes = [];
}
