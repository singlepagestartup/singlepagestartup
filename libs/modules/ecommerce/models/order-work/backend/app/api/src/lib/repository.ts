import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { and, asc, eq, isNotNull, isNull, lt, or } from "drizzle-orm";
import { Table } from "@sps/ecommerce/models/order-work/backend/repository/database";
import { Table as Orders } from "@sps/ecommerce/models/order/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async undeliveredPayments(limit: number) {
    await trackRepositoryRead(Table, this.db);
    return this.db
      .select()
      .from(Table)
      .where(
        and(
          isNotNull(Table.paid),
          or(
            isNull(Table.paidDispatchedAt),
            and(
              isNull(Table.deliveredAt),
              lt(Table.paidDispatchedAt, new Date(Date.now() - 5 * 60 * 1000)),
            ),
          ),
        ),
      )
      .orderBy(asc(Table.updatedAt), asc(Table.id))
      .limit(limit);
  }

  async missingPayments(limit: number) {
    await trackRepositoryRead(Orders, this.db);
    await trackRepositoryRead(Table, this.db);
    return this.db
      .select({ orderId: Table.orderId })
      .from(Table)
      .innerJoin(Orders, eq(Orders.id, Table.orderId))
      .where(and(eq(Orders.status, "paid"), isNull(Table.paid)))
      .orderBy(asc(Table.updatedAt), asc(Table.id))
      .limit(limit);
  }
}
