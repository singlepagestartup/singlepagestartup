import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/relations/tasks-to-ecommerce-module-stores-to-products/backend/repository/database";

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {}
