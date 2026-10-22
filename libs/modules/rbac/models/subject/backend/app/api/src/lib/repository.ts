import "reflect-metadata";
import { injectable } from "inversify";
import {
  DatabaseRepository,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { sql } from "drizzle-orm";

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  withOrderDelivery<T>(
    scope: { subjectId: string; orderId: string },
    operation: () => Promise<T>,
  ) {
    return this.db.transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        // Always lock Subject before Order: concurrent purchases also share balances.
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.subject:${scope.subjectId}`}))`,
        );
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.order:${scope.orderId}`}))`,
        );
        return operation();
      }),
    );
  }
}
