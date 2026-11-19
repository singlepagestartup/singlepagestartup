import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { and, asc, desc, eq, gt, isNull, lt, lte, or, sql } from "drizzle-orm";
import { Table } from "@sps/crm/models/task/backend/repository/database";
import { readPageCursor, updatedPage } from "@sps/crm/models/funnel/sdk/model";
import type { IListTasks, ITaskScope } from "@sps/crm/models/task/sdk/model";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  transaction<T>(operation: () => Promise<T>) {
    return this.db.transaction((tx) => withConsistencyDatabase(tx, operation));
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

  async scoped({ storeId, taskId }: ITaskScope, lock = false) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: taskId }],
    });
    const query = this.db
      .select()
      .from(Table)
      .where(and(eq(Table.storeId, storeId), eq(Table.id, taskId)));
    if (lock) {
      const [row] = await query.for("update");
      return row;
    }

    const [row] = await query;
    return row;
  }

  async list(input: IListTasks, now: Date) {
    const limit = input.limit ?? 50;
    const predicates = [eq(Table.storeId, input.storeId)];
    if (input.funnelId) {
      predicates.push(eq(Table.funnelId, input.funnelId));
    }
    if (input.stageId) {
      predicates.push(eq(Table.stageId, input.stageId));
    }
    if (input.customerId) {
      predicates.push(eq(Table.customerId, input.customerId));
    }
    if (input.orderId) {
      predicates.push(eq(Table.orderId, input.orderId));
    }
    if (input.publicationId) {
      predicates.push(eq(Table.publicationId, input.publicationId));
    }
    if (input.assigneeId) {
      predicates.push(eq(Table.assigneeId, input.assigneeId));
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
          sql`position(${needle} in ${Table.orderId}::text) > 0`,
          sql`position(${needle} in ${Table.customerId}::text) > 0`,
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

    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "storeId", method: "eq", value: input.storeId }],
    });
    const rows = await this.db
      .select()
      .from(Table)
      .where(and(...predicates))
      .orderBy(desc(Table.updatedAt), desc(Table.id))
      .limit(limit + 1);
    return updatedPage(rows, limit);
  }

  async due(storeId: string, limit: number, now: Date) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "storeId", method: "eq", value: storeId }],
    });
    return this.db
      .select()
      .from(Table)
      .where(
        and(
          eq(Table.storeId, storeId),
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
