import "reflect-metadata";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/billing/models/invoice/backend/repository/database";

export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {}
