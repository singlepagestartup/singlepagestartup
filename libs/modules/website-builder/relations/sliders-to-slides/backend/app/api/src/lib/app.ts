import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { DefaultApp } from "@sps/shared-backend-api";
import { Table } from "@sps/website-builder/relations/sliders-to-slides/backend/repository/database";

@injectable()
@injectFromBase()
export class App extends DefaultApp<(typeof Table)["$inferSelect"]> {}
