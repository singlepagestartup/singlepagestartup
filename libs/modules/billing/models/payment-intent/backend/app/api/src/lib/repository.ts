import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  withConsistencyDatabase,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { asc, inArray } from "drizzle-orm";
import { Table } from "@sps/billing/models/payment-intent/backend/repository/database";
import { moneyNumber } from "@sps/backend-utils";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  override insert(data: Record<string, unknown>) {
    const writable = { ...data };
    if (writable.amount !== undefined) {
      writable.amount = moneyNumber(writable.amount as string | number);
    }
    return super.insert(writable);
  }

  override updateFirstByField(
    field: string,
    value: unknown,
    data: Record<string, unknown>,
  ) {
    const writable = { ...data };
    if (writable.amount !== undefined) {
      writable.amount = moneyNumber(writable.amount as string | number);
    }
    return super.updateFirstByField(field, value, writable);
  }

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
