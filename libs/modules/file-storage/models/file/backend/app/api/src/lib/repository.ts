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

export type TCommerceReceiptGuard = (
  files: Array<Pick<typeof Table.$inferSelect, "id" | "file">>,
) => Promise<Set<string>>;

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  commerceReceiptGuard?: TCommerceReceiptGuard;

  async withoutCommerceReceipts(files: (typeof Table.$inferSelect)[]) {
    const guard = this.commerceReceiptGuard;
    if (!guard) {
      return files;
    }
    const records: (typeof Table.$inferSelect)[] = [];
    const batchSize = 500;
    for (let offset = 0; offset < files.length; offset += batchSize) {
      const batch = files.slice(offset, offset + batchSize);
      const protectedIds = await guard(batch);
      records.push(...batch.filter(({ id }) => !protectedIds.has(id)));
    }
    return records;
  }

  protected override selectDumpRecords(records: (typeof Table.$inferSelect)[]) {
    return this.withoutCommerceReceipts(records);
  }

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
