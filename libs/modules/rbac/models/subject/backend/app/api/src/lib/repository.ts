import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  trackRepositoryRead,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { eq, sql } from "drizzle-orm";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  withCatalogLock<T>(keys: string[], operation: () => Promise<T>): Promise<T> {
    const run = async () => {
      for (const key of [...new Set(keys)].sort()) {
        await this.db.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.catalog:${key}`}))`,
        );
      }
      return operation();
    };
    if (consistencyContext.getStore()?.database) {
      return run();
    }
    return this.db.transaction((tx) => withConsistencyDatabase(tx, run));
  }

  withSubjectLock<T>(
    scope: { subjectId: string },
    operation: () => Promise<T>,
  ): Promise<T> {
    const run = async () => {
      await this.db.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.subject:${scope.subjectId}`}))`,
      );
      return operation();
    };
    if (consistencyContext.getStore()?.database) return run();
    return this.db.transaction((tx) => withConsistencyDatabase(tx, run));
  }

  async lockOrderDelivery(scope: { subjectId: string; orderId: string }) {
    if (!consistencyContext.getStore()?.database)
      throw new Error("Order delivery lock requires an owner transaction");
    await this.db.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.subject:${scope.subjectId}`}))`,
    );
    await this.db.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.order:${scope.orderId}`}))`,
    );
  }

  async lockCartGuest(subjectId: string) {
    if (!consistencyContext.getStore()?.database) {
      throw new Error("Guest cart lock requires a subject transaction");
    }
    // Identity links reference this row. Registration and logout must serialize
    // with the guest check and ownership changes in the same transaction.
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: subjectId }],
    });
    const [guest] = await this.db
      .select({
        variant: Table.variant,
        tokensValidAfter: Table.tokensValidAfter,
      })
      .from(Table)
      .where(eq(Table.id, subjectId))
      .for("update");
    return guest;
  }

  withOrderDelivery<T>(
    scope: { subjectId: string; orderId: string },
    operation: () => Promise<T>,
  ) {
    return this.withSubjectLock(scope, async () => {
      await this.lockOrderDelivery(scope);
      return operation();
    });
  }
}
