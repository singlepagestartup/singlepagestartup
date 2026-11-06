import "reflect-metadata";
import { injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/repository/database";
import { eq } from "drizzle-orm";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  async lockById(id: string) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: id }],
    });
    return (
      (
        await this.db.select().from(Table).where(eq(Table.id, id)).for("update")
      )[0] || null
    );
  }
}
