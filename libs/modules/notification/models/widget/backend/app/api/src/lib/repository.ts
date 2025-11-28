import "reflect-metadata";
import { injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/widget/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {}
