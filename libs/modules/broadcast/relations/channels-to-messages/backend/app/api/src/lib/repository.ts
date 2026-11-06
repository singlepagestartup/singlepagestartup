import "reflect-metadata";
import { eq, isNull } from "drizzle-orm";
import { injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/relations/channels-to-messages/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  protected override get readScope() {
    return eq(Table.feedVisible, true);
  }

  protected override get writeScope() {
    return isNull(Table.deliveryKey);
  }
}
