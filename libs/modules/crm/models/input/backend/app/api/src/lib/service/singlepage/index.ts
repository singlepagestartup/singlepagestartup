import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/crm/models/input/backend/repository/database";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {}
