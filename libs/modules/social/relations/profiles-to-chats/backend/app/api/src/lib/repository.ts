import "reflect-metadata";
import { injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/profiles-to-chats/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {}
