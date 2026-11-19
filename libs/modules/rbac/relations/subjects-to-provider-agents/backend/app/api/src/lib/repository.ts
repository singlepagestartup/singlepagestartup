import "reflect-metadata";
import { injectable, injectFromBase } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-provider-agents/backend/repository/database";
@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {}
