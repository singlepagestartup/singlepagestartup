import "reflect-metadata";
import { injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  withConsistencyDatabase,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { asc, inArray } from "drizzle-orm";
import { Table } from "@sps/billing/models/payment-intent/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  withPaymentIntentLock<T>(
    id: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    return this.withPaymentIntentLocks([id], operation);
  }

  withPaymentIntentLocks<T>(
    ids: string[],
    operation: () => Promise<T>,
  ): Promise<T> {
    const orderedIds = [...new Set(ids)].sort();
    if (!orderedIds.length)
      throw new Error("Validation error. Payment intent is required");
    const run = async () => {
      await trackRepositoryRead(Table, this.db, {
        and: [{ column: "id", method: "inArray", value: orderedIds }],
      });
      await this.db
        .select({ id: Table.id })
        .from(Table)
        .where(inArray(Table.id, orderedIds))
        .orderBy(asc(Table.id))
        .for("update");
      return operation();
    };
    if (consistencyContext.getStore()?.database) return run();
    return this.db.transaction((tx) => withConsistencyDatabase(tx, run));
  }
}
