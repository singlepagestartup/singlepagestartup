import "reflect-metadata";
import { injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { sql } from "drizzle-orm";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
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
