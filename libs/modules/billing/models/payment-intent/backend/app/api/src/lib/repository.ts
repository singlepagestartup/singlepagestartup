import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/billing/models/payment-intent/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {}
