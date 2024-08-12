import "reflect-metadata";
import { injectable } from "inversify";
import { RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/sps-ecommerce/relations/widgets-to-products-list-blocks/backend/repository/database";

@injectable()
export class Controller extends RESTController<
  (typeof Table)["$inferSelect"]
> {}
