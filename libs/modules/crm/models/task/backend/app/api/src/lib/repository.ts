import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
  withConsistencyTransaction,
} from "@sps/shared-backend-api";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  isNull,
  inArray,
  lt,
  lte,
  notLike,
  or,
  sql,
} from "drizzle-orm";
import { Table } from "@sps/crm/models/task/backend/repository/database";
import { readPageCursor, updatedPage } from "@sps/crm/models/funnel/sdk/model";
import {
  STORE_EMPLOYEE_TRAINING_KEY_PREFIX,
  type IListTasks,
  type ITaskScope,
} from "@sps/crm/models/task/sdk/model";

import { Table as TaskOrder } from "@sps/crm/relations/tasks-to-ecommerce-module-orders/backend/repository/database";
import { Table as TaskOffer } from "@sps/crm/relations/tasks-to-ecommerce-module-stores-to-products/backend/repository/database";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { Table as TaskStage } from "@sps/crm/relations/tasks-to-stages/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  transaction<T>(operation: () => Promise<T>) {
    return withConsistencyTransaction(this.db, operation);
  }

  async lockOpening(storeId: string, openingKey: string) {
    const key = `crm:open:${storeId}:${openingKey}`;
    await this.db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`,
    );
  }

  async lockOrder(storeId: string, orderId: string) {
    const key = `crm:order:${storeId}:${orderId}`;
    await this.db.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`,
    );
  }

  async scoped({ taskId }: ITaskScope, lock = false) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: taskId }],
    });
    const query = this.db.select().from(Table).where(eq(Table.id, taskId));
    if (lock) {
      const [row] = await query.for("update");
      return row;
    }

    const [row] = await query;
    return row;
  }

  async list(
    input: IListTasks,
    now: Date,
    ids: string[],
    matchingSearchIds: string[],
  ) {
    const limit = input.limit ?? 50;
    const predicates = [
      inArray(Table.id, ids),
      notLike(Table.openingKey, `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX}%`),
    ];
    if (input.stageId) {
      predicates.push(eq(Table.stageId, input.stageId));
    }
    if (input.current) {
      predicates.push(
        or(eq(Table.status, "active"), eq(Table.status, "waiting"))!,
      );
    }
    if (input.status) {
      predicates.push(eq(Table.status, input.status));
    }
    if (input.search) {
      const needle = input.search.toLowerCase();
      predicates.push(
        or(
          sql`position(${needle} in lower(${Table.stageId})) > 0`,
          sql`position(${needle} in ${Table.id}::text) > 0`,
          inArray(Table.id, matchingSearchIds),
        )!,
      );
    }
    if (input.overdue === true) {
      predicates.push(lte(Table.deadlineAt, now));
    }
    if (input.overdue === false) {
      predicates.push(or(isNull(Table.deadlineAt), gt(Table.deadlineAt, now))!);
    }
    if (input.cursor) {
      const position = readPageCursor(input.cursor);
      predicates.push(
        or(
          lt(Table.updatedAt, position.updatedAt),
          and(
            eq(Table.updatedAt, position.updatedAt),
            lt(Table.id, position.id),
          ),
        )!,
      );
    }

    await trackRepositoryRead(Table, this.db);
    const rows = await this.db
      .select()
      .from(Table)
      .where(and(...predicates))
      .orderBy(desc(Table.updatedAt), desc(Table.id))
      .limit(limit + 1);
    return updatedPage(rows, limit);
  }

  async due(ids: string[], limit: number, now: Date) {
    await trackRepositoryRead(Table, this.db);
    return this.db
      .select()
      .from(Table)
      .where(
        and(
          inArray(Table.id, ids),
          eq(Table.status, "waiting"),
          lte(Table.nextActionAt, now),
        ),
      )
      .orderBy(asc(Table.nextActionAt), asc(Table.id))
      .limit(limit);
  }

  async dueForWorker(limit: number, now: Date) {
    await trackRepositoryRead(Table, this.db);
    return this.db
      .select()
      .from(Table)
      .where(and(eq(Table.status, "waiting"), lte(Table.nextActionAt, now)))
      .orderBy(asc(Table.nextActionAt), asc(Table.id))
      .limit(limit);
  }

  async commerce(taskIds: string[]) {
    await Promise.all(
      [TaskOrder, TaskOffer, TaskStage, Offer].map((t) =>
        trackRepositoryRead(t, this.db),
      ),
    );
    const [orders, offers, selectionHistory] = await Promise.all([
      this.db
        .select()
        .from(TaskOrder)
        .where(inArray(TaskOrder.taskId, taskIds))
        .orderBy(asc(TaskOrder.createdAt), asc(TaskOrder.id)),
      this.db
        .select({
          taskId: TaskOffer.taskId,
          offerId: Offer.id,
          productId: Offer.productId,
        })
        .from(TaskOffer)
        .innerJoin(Offer, eq(Offer.id, TaskOffer.offerId))
        .where(inArray(TaskOffer.taskId, taskIds))
        .orderBy(asc(TaskOffer.createdAt), asc(TaskOffer.id)),
      this.db
        .select({
          taskId: TaskStage.taskId,
          kind: TaskStage.kind,
          detail: TaskStage.detail,
        })
        .from(TaskStage)
        .where(
          and(
            inArray(TaskStage.taskId, taskIds),
            inArray(TaskStage.kind, [
              "opened",
              "offer-attached",
              "order-attached",
            ]),
          ),
        )
        .orderBy(asc(TaskStage.revision)),
    ]);
    return { orders, offers, selectionHistory };
  }

  async byCommerce(
    column: "offerId" | "productId" | "orderId",
    values: string[],
  ) {
    if (column === "orderId") {
      await trackRepositoryRead(TaskOrder, this.db);
      return this.db
        .select({ taskId: TaskOrder.taskId })
        .from(TaskOrder)
        .where(inArray(TaskOrder.orderId, values));
    }
    await Promise.all([
      trackRepositoryRead(TaskOffer, this.db),
      trackRepositoryRead(Offer, this.db),
    ]);
    return this.db
      .select({ taskId: TaskOffer.taskId })
      .from(TaskOffer)
      .innerJoin(Offer, eq(Offer.id, TaskOffer.offerId))
      .where(
        inArray(column === "productId" ? Offer.productId : Offer.id, values),
      );
  }

  async attachOffer(taskId: string, offerId: string) {
    await this.db
      .insert(TaskOffer)
      .values({ taskId, offerId })
      .onConflictDoNothing({ target: [TaskOffer.taskId, TaskOffer.offerId] });
  }

  async attachOrder(taskId: string, orderId: string) {
    await this.db
      .insert(TaskOrder)
      .values({ taskId, orderId })
      .onConflictDoNothing({ target: [TaskOrder.taskId, TaskOrder.orderId] });
  }

  async open(data: typeof Table.$inferInsert) {
    const [task] = await this.db.insert(Table).values(data).returning();
    return task;
  }

  async revise(id: string, data: Partial<typeof Table.$inferInsert>) {
    const [task] = await this.db
      .update(Table)
      .set(data)
      .where(eq(Table.id, id))
      .returning();
    return task;
  }
}
