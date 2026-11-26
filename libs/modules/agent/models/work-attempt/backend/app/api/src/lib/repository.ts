import "reflect-metadata";
import { injectable, injectFromBase } from "inversify";
import { and, eq, ne, or, sql } from "drizzle-orm";
import {
  DatabaseRepository,
  trackRepositoryRead,
  consistencyContext,
  withConsistencyTransaction,
} from "@sps/shared-backend-api";
import { Table } from "@sps/agent/models/work-attempt/backend/repository/database";
@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async hasUnfinishedOrReplyAttempt(eventId: string) {
    // Completed intermediate steps are reused by their step key on the next preparation.
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "eventId", method: "eq", value: eventId }],
    });
    const [attempt] = await this.db
      .select({ id: Table.id })
      .from(Table)
      .where(
        and(
          eq(Table.eventId, eventId),
          or(ne(Table.state, "delivered"), eq(Table.stepKey, "reply")),
        ),
      )
      .limit(1);
    return Boolean(attempt);
  }

  async atomic<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const run = async () => {
      await this.db.execute(
        sql`select pg_advisory_xact_lock(hashtext(${"agent.work:" + key}))`,
      );
      return operation();
    };
    if (consistencyContext.getStore()?.database) return run();
    return withConsistencyTransaction(this.db, run);
  }
}
