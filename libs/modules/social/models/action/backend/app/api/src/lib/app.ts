import "reflect-metadata";
import { injectable } from "inversify";
import { DefaultApp } from "@sps/shared-backend-api";
import { Table } from "@sps/social/models/action/backend/repository/database";

@injectable()
export class App extends DefaultApp<(typeof Table)["$inferSelect"]> {}
