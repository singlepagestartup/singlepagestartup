import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/relations/tasks-to-ecommerce-module-stores-to-products/backend/repository/database";

@injectable()
@injectFromBase()
export class Controller extends RESTController<typeof Table.$inferSelect> {
  override httpRoutes = [
    {
      method: "GET" as const,
      path: "/admin-records",
      handler: this.find.bind(this),
    },
  ];
}
