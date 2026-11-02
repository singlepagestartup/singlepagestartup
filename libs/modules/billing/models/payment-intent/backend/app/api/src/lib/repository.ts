import "reflect-metadata";
import { injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  withConsistencyDatabase,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { eq } from "drizzle-orm";
import { Table } from "@sps/billing/models/payment-intent/backend/repository/database";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  withPaymentIntentLock<T>(
    id: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const run = async () => {
      await trackRepositoryRead(Table, this.db, {
        and: [{ column: "id", method: "eq", value: id }],
      });
      await this.db
        .select({ id: Table.id })
        .from(Table)
        .where(eq(Table.id, id))
        .for("update");
      return operation();
    };
    if (consistencyContext.getStore()?.database) return run();
    return this.db.transaction((tx) => withConsistencyDatabase(tx, run));
  }
}
