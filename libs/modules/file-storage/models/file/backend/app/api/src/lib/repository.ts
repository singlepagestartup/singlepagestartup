import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  trackRepositoryRead,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { Table } from "@sps/file-storage/models/file/backend/repository/database";
import { asc, inArray } from "drizzle-orm";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  withFileLock<T>(id: string, operation: () => Promise<T>) {
    const run = async () => {
      await this.lock([id], "update");
      return operation();
    };
    if (consistencyContext.getStore()?.database) {
      return run();
    }
    return this.db.transaction((transaction) =>
      withConsistencyDatabase(transaction, run),
    );
  }

  async lock(ids: string[], mode: "key share" | "update" = "key share") {
    if (!ids.length) return [];
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "inArray", value: ids }],
    });
    return this.db
      .select()
      .from(Table)
      .where(inArray(Table.id, [...new Set(ids)]))
      .orderBy(asc(Table.id))
      .for(mode);
  }
}
