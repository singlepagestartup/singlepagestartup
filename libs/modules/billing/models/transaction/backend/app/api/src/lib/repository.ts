import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { and, desc, eq, getTableColumns, or, sql } from "drizzle-orm";
import { Table as Parties } from "@sps/billing/relations/transactions-to-wallets/backend/repository/database";
import {
  DatabaseRepository,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/billing/models/transaction/backend/repository/database";

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async history(storeId: string, before?: string, taskId?: string) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "storeId", method: "eq", value: storeId }],
    });
    await trackRepositoryRead(Parties, this.db);
    const pageSize = 100;
    const earlier = before
      ? sql`(${Table.createdAt}, ${Table.id}) < (
      select ${Table.createdAt}, ${Table.id} from ${Table}
      where ${Table.storeId} = ${storeId} and ${Table.id} = ${before})`
      : undefined;
    const rows = await this.db
      .select({
        ...getTableColumns(Table),
        senderWalletId: Parties.senderWalletId,
        recipientWalletId: Parties.recipientWalletId,
        advanceRecipientWalletId: Parties.advanceRecipientWalletId,
      })
      .from(Table)
      .innerJoin(Parties, eq(Parties.transactionId, Table.id))
      .where(
        and(
          eq(Table.storeId, storeId),
          taskId ? eq(Table.taskId, taskId) : undefined,
          earlier,
        ),
      )
      .orderBy(desc(Table.createdAt), desc(Table.id))
      .limit(pageSize + 1);
    const items = rows.slice(0, pageSize);
    return {
      items,
      nextCursor: rows.length > pageSize ? items[pageSize - 1].id : null,
    };
  }

  pendingReconciliations(limit: number, storeId?: string) {
    return this.db
      .select()
      .from(Table)
      .where(
        and(
          storeId ? eq(Table.storeId, storeId) : undefined,
          sql`(${Table.providerWork} ->> 'reconcileRequested' = 'true'
        OR ${Table.providerWork} ->> 'state' IN ('received','settled')
        OR (${Table.providerWork} ->> 'state' = 'unknown' AND (
          ${Table.providerWork} ->> 'resolution' IS NOT NULL
          OR (${Table.providerWork} ->> 'provider' = 'openrouter'
            AND ${Table.providerWork} ->> 'providerRequestId' IS NOT NULL
            AND (${Table.providerWork} ->> 'checkedAt' IS NULL OR ${Table.updatedAt} < now() - interval '10 minutes'))))
        OR (${Table.providerWork} ->> 'state' = 'dispatching' AND ${Table.updatedAt} < now() - interval '3 minutes'))`,
        ),
      )
      .orderBy(Table.updatedAt, Table.id)
      .limit(limit);
  }

  async obligations(
    walletId: string,
    currencyId: string,
    storeId: string,
    taskId: string,
    eventId?: string,
    stageId?: string,
  ) {
    await trackRepositoryRead(Table, this.db);
    await trackRepositoryRead(Parties, this.db, {
      and: [{ column: "currencyId", method: "eq", value: currencyId }],
    });
    const wallet = or(
      eq(Parties.senderWalletId, walletId),
      eq(Parties.advanceRecipientWalletId, walletId),
    );
    const task = and(
      eq(Table.storeId, storeId),
      eq(Table.taskId, taskId),
      eq(Table.kind, "reserve"),
    );
    const used = sql`case when ${Table.state} = 'held' then ${Table.amount} when ${Table.state} = 'settled' then (${Table.settlement}->>'workAmount')::numeric else 0 end`;
    const [totals] = await this.db
      .select({
        held: sql<string>`coalesce(sum(case when ${Table.state} <> 'held' then 0 when ${Parties.senderWalletId} = ${walletId} then ${Table.amount}-${Table.advanceAmount} when ${Parties.advanceRecipientWalletId} = ${walletId} then ${Table.advanceAmount} else 0 end),0)::text`,
        committed: sql<string>`coalesce(sum(${used}) filter (where ${task}),0)::text`,
        stageCommitted: sql<string>`coalesce(sum(${used}) filter (where ${task} and (${Table.stageId} = ${stageId ?? null} or ${Table.stageId} is null)),0)::text`,
        runCommitted: sql<string>`coalesce(sum(${used}) filter (where ${task} and ${Table.eventId} = ${eventId ?? null}),0)::text`,
      })
      .from(Table)
      .innerJoin(Parties, eq(Parties.transactionId, Table.id))
      .where(and(eq(Parties.currencyId, currencyId), or(wallet, task)));
    return totals;
  }
}
