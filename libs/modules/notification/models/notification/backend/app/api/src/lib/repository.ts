import "reflect-metadata";
import { injectable } from "inversify";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/notification/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  // Internal delivery uses a stable UUID for idempotency. Public CRUD creation
  // continues to generate IDs and cannot choose another notification's key.
  async createSecuritySummary(data: typeof Table.$inferInsert) {
    const [created] = await this.db
      .insert(Table)
      .values(data)
      .onConflictDoNothing({ target: Table.id })
      .returning();
    if (created) {
      return created;
    }
    return this.findFirstByField("id", data.id);
  }
}
