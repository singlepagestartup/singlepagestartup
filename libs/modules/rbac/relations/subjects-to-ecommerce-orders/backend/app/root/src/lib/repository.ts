import "reflect-metadata";
import { injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-ecommerce-orders/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {}
