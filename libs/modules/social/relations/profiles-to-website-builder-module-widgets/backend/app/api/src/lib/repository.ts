import "reflect-metadata";
import { injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/profiles-to-website-builder-module-widgets/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {}
