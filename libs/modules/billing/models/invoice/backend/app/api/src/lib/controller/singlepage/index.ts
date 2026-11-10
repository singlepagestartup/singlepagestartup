import "reflect-metadata";
import { injectable } from "inversify";
import { RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/billing/models/invoice/backend/repository/database";
import type { Service } from "../../service";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  declare service: Service;
}
