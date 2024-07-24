import "reflect-metadata";
import { injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/sps-rbac/relations/roles-to-permissions/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {}
