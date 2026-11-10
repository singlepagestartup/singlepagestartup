import "reflect-metadata";
import { injectable } from "inversify";
import { DefaultApp } from "@sps/shared-backend-api";
import { Table } from "@sps/billing/models/invoice/backend/repository/database";
import type { Controller } from "./controller";

@injectable()
export class App extends DefaultApp<(typeof Table)["$inferSelect"]> {
  declare controller: Controller;
}
