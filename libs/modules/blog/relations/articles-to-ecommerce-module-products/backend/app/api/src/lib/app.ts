import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { DefaultApp } from "@sps/shared-backend-api";
import { Table } from "@sps/blog/relations/articles-to-ecommerce-module-products/backend/repository/database";

@injectable()
@injectFromBase()
export class App extends DefaultApp<(typeof Table)["$inferSelect"]> {}
