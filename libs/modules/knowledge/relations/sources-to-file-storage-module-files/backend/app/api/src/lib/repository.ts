import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/knowledge/relations/sources-to-file-storage-module-files/backend/repository/database";
import { eq } from "drizzle-orm";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async lockById(id: string) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: id }],
    });
    const records = await this.db
      .select()
      .from(Table)
      .where(eq(Table.id, id))
      .for("update");

    return records[0] || null;
  }
}
