import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/telegram/models/page/backend/repository/database";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {}