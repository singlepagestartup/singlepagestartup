import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/blog/relations/categories-to-website-builder-module-widgets/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {}
