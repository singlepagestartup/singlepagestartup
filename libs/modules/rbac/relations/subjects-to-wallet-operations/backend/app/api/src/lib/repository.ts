import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { and, eq, or, sql } from "drizzle-orm";
import { DatabaseRepository } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-wallet-operations/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  pendingReconciliations(limit: number, storeId?: string) {
    return this.db
      .select()
      .from(Table)
      .where(
        and(
          storeId ? eq(Table.storeId, storeId) : undefined,
          sql`(${Table.providerWork} ->> 'reconcileRequested' = 'true'
        OR ${Table.providerWork} ->> 'state' IN ('received','settled')
        OR (${Table.providerWork} ->> 'state' = 'dispatching' AND ${Table.updatedAt} < now() - interval '3 minutes'))`,
        ),
      )
      .orderBy(Table.updatedAt, Table.id)
      .limit(limit);
  }

  async obligations(
    senderId: string,
    currencyId: string,
    storeId: string,
    taskId: string,
    eventId?: string,
  ) {
    const wallet = or(
      eq(Table.senderId, senderId),
      eq(Table.advanceRecipientId, senderId),
    );
    const task = and(
      eq(Table.storeId, storeId),
      eq(Table.taskId, taskId),
      eq(Table.kind, "reserve"),
    );
    const used = sql`case when ${Table.state} = 'held' then ${Table.amount} when ${Table.state} = 'settled' then (${Table.settlement}->>'workAmount')::numeric else 0 end`;
    const [totals] = await this.db
      .select({
        held: sql<string>`coalesce(sum(case when ${Table.state} <> 'held' then 0 when ${Table.senderId} = ${senderId} then ${Table.amount}-${Table.advanceAmount} when ${Table.advanceRecipientId} = ${senderId} then ${Table.advanceAmount} else 0 end),0)::text`,
        committed: sql<string>`coalesce(sum(${used}) filter (where ${task}),0)::text`,
        runCommitted: sql<string>`coalesce(sum(${used}) filter (where ${task} and ${Table.eventId} = ${eventId ?? null}),0)::text`,
      })
      .from(Table)
      .where(and(eq(Table.currencyId, currencyId), or(wallet, task)));
    return totals;
  }
}
