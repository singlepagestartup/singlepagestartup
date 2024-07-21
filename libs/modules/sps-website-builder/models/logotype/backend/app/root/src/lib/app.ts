import "reflect-metadata";
import { injectable } from "inversify";
import { DefaultApp } from "@sps/shared-backend-api";
import { Table } from "@sps/sps-website-builder/models/logotype/backend/schema/table";

@injectable()
export class App extends DefaultApp<(typeof Table)["$inferSelect"]> {}
