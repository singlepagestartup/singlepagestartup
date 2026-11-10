import "reflect-metadata";
import { injectable } from "inversify";
import {
  type SQL,
  TransactionRollbackError,
  and,
  asc,
  eq,
  exists,
  notExists,
  gt,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import {
  DatabaseRepository,
  withConsistencyDatabase,
  trackRepositoryRead,
} from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/message/backend/repository/database";
import { Table as ChannelMessage } from "@sps/broadcast/relations/channels-to-messages/backend/repository/database";

export interface IDeliveryOwner {
  channelId: string;
  key: string;
  receipt: string;
}

export interface IEnqueueMessage {
  channelId: string;
  key: string;
  payload: string;
  announce?: boolean;
  // Initial state when adopting an existing delivery protocol.
  previous?: {
    receipt: string;
    claimedAt: Date;
    startedAt: Date;
    leaseUntil: Date | null;
    finishedAt: Date | null;
  };
}

const deliveryState = {
  key: ChannelMessage.deliveryKey,
  receipt: ChannelMessage.receipt,
  claimedAt: ChannelMessage.claimedAt,
  startedAt: ChannelMessage.startedAt,
  leaseUntil: ChannelMessage.leaseUntil,
  finishedAt: ChannelMessage.finishedAt,
};

@injectable()
export class DeliveryRepository extends DatabaseRepository<typeof Table> {
  protected override async trackRead(
    filters?: Parameters<typeof trackRepositoryRead>[2],
  ) {
    await super.trackRead(filters);
    const id = filters?.and?.find(
      (filter) => filter.column === "id" && filter.method === "eq",
    );
    await trackRepositoryRead(
      ChannelMessage,
      this.db,
      id ? { and: [{ ...id, column: "messageId" }] } : undefined,
    );
  }

  protected override get readScope() {
    const feedLink = this.db
      .select({ id: ChannelMessage.id })
      .from(ChannelMessage)
      .where(
        and(
          eq(ChannelMessage.messageId, Table.id),
          isNotNull(ChannelMessage.deliveryKey),
          eq(ChannelMessage.feedVisible, true),
        ),
      );
    return or(isNotNull(Table.expiresAt), exists(feedLink));
  }

  protected override get writeScope() {
    return isNotNull(Table.expiresAt);
  }

  async publishDelivery(input: IEnqueueMessage) {
    try {
      return await this.db.transaction(async (tx) => {
        // Serialize publication with reservation before inserting a payload.
        // Duplicate inserts otherwise hold a new message's capture locks while
        // waiting for the relation that a running consumer is checkpointing.
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext('sps.broadcast.delivery'), hashtext(${input.channelId}))`,
        );
        const existing = await tx
          .select({ id: ChannelMessage.id })
          .from(ChannelMessage)
          .where(
            and(
              eq(ChannelMessage.channelId, input.channelId),
              eq(ChannelMessage.deliveryKey, input.key),
            ),
          )
          .limit(1);
        if (existing.length) {
          return false;
        }
        const [message] = await tx
          .insert(Table)
          .values({ payload: input.payload, expiresAt: null })
          .returning({ id: Table.id });
        const [link] = await tx
          .insert(ChannelMessage)
          .values({
            channelId: input.channelId,
            messageId: message.id,
            deliveryKey: input.key,
            feedVisible: input.announce ?? false,
            ...input.previous,
          })
          .onConflictDoNothing({
            target: [ChannelMessage.channelId, ChannelMessage.deliveryKey],
            where: isNotNull(ChannelMessage.deliveryKey),
          })
          .returning({ id: ChannelMessage.id });
        if (!link) {
          // Roll back the payload as well as its consistency events.
          tx.rollback();
        }
        return true;
      });
    } catch (error) {
      if (error instanceof TransactionRollbackError) {
        return false;
      }
      throw error;
    }
  }

  async transientChannelMessages(channelId: string) {
    return this.db
      .select({ id: Table.id, payload: Table.payload })
      .from(ChannelMessage)
      .innerJoin(Table, eq(Table.id, ChannelMessage.messageId))
      .where(
        and(
          eq(ChannelMessage.channelId, channelId),
          isNotNull(Table.expiresAt),
        ),
      );
  }

  async withDeliveryQueue<T>(
    channelId: string,
    work: (now: Date) => Promise<T>,
  ) {
    return this.db.transaction(async (tx) => {
      const [row] = await tx.execute<{ locked: boolean; millis: number }>(
        sql`select pg_try_advisory_xact_lock(hashtext('sps.broadcast.delivery'), hashtext(${channelId})) as locked,
        extract(epoch from clock_timestamp()) * 1000 as millis`,
      );
      if (!row.locked) {
        return;
      }
      return withConsistencyDatabase(tx, () =>
        work(new Date(Number(row.millis))),
      );
    });
  }

  async deliveryStates(channelId: string, keys: string[]) {
    if (!keys.length) {
      return [];
    }
    return this.db
      .select({ ...deliveryState, payload: Table.payload })
      .from(ChannelMessage)
      .innerJoin(Table, eq(Table.id, ChannelMessage.messageId))
      .where(
        and(
          eq(ChannelMessage.channelId, channelId),
          inArray(ChannelMessage.deliveryKey, keys),
        ),
      );
  }

  async activeDeliveryCount(channelId: string, now: Date) {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(ChannelMessage)
      .where(
        and(
          eq(ChannelMessage.channelId, channelId),
          isNotNull(ChannelMessage.deliveryKey),
          isNull(ChannelMessage.finishedAt),
          gt(ChannelMessage.leaseUntil, now),
        ),
      );
    return row.count;
  }

  async readyDeliveries(channelId: string, now: Date, limit: number) {
    return this.db
      .select(deliveryState)
      .from(ChannelMessage)
      .where(
        and(
          eq(ChannelMessage.channelId, channelId),
          isNotNull(ChannelMessage.deliveryKey),
          isNull(ChannelMessage.finishedAt),
          or(
            isNull(ChannelMessage.leaseUntil),
            lte(ChannelMessage.leaseUntil, now),
          ),
        ),
      )
      .orderBy(asc(ChannelMessage.createdAt), asc(ChannelMessage.messageId))
      .limit(limit);
  }

  async reserveDelivery(
    owner: IDeliveryOwner,
    previous: string | null,
    now: Date,
    leaseUntil: Date,
    payload?: string,
  ) {
    const claim = this.db
      .update(ChannelMessage)
      .set({
        receipt: owner.receipt,
        claimedAt: now,
        startedAt: null,
        leaseUntil,
        finishedAt: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(ChannelMessage.channelId, owner.channelId),
          eq(ChannelMessage.deliveryKey, owner.key),
          previous === null
            ? isNull(ChannelMessage.receipt)
            : eq(ChannelMessage.receipt, previous),
          or(
            isNull(ChannelMessage.leaseUntil),
            lte(ChannelMessage.leaseUntil, now),
          ),
        ),
      )
      .returning({ messageId: ChannelMessage.messageId });
    return this.updateDeliveryPayload(claim.getSQL(), payload);
  }

  // The conditional receipt update and the public payload change are one SQL
  // statement. If ownership changed, the UPDATE has no message to write.
  private async updateDeliveryPayload(change: SQL, payload?: string) {
    const [message] = await this.db.execute<{
      id: string;
      payload: string;
    }>(sql`
      WITH changed(message_id) AS (${change})
      UPDATE ${Table} SET updated_at = clock_timestamp(),
        payload = coalesce(${payload ?? null}::text, ${Table.payload})
      FROM changed WHERE ${Table.id} = changed.message_id
      RETURNING ${Table.id}, ${Table.payload}
    `);
    return message;
  }

  private activeOwner(owner: IDeliveryOwner) {
    return and(
      eq(ChannelMessage.channelId, owner.channelId),
      eq(ChannelMessage.deliveryKey, owner.key),
      eq(ChannelMessage.receipt, owner.receipt),
      isNull(ChannelMessage.finishedAt),
      gt(ChannelMessage.leaseUntil, sql`clock_timestamp()`),
    );
  }

  async startDelivery(owner: IDeliveryOwner) {
    const rows = await this.db
      .update(ChannelMessage)
      .set({ startedAt: sql`clock_timestamp()` })
      .where(and(this.activeOwner(owner), isNull(ChannelMessage.startedAt)))
      .returning({ id: ChannelMessage.id });
    return rows.length > 0;
  }

  async renewDelivery(owner: IDeliveryOwner, seconds: number) {
    const rows = await this.db
      .update(ChannelMessage)
      .set({
        leaseUntil: sql`clock_timestamp() + make_interval(secs => ${seconds}::int)`,
      })
      .where(and(this.activeOwner(owner), isNotNull(ChannelMessage.startedAt)))
      .returning({ id: ChannelMessage.id });
    return rows.length > 0;
  }

  async acknowledgeDelivery(
    owner: IDeliveryOwner,
    payload?: string,
    pendingOnly = false,
  ) {
    const now = sql`clock_timestamp()`;
    const completed = this.db
      .update(ChannelMessage)
      .set({ leaseUntil: null, finishedAt: now, updatedAt: now })
      .where(
        and(
          this.activeOwner(owner),
          pendingOnly
            ? isNull(ChannelMessage.startedAt)
            : isNotNull(ChannelMessage.startedAt),
        ),
      )
      .returning({ messageId: ChannelMessage.messageId });
    const updatedDelivery = await this.updateDeliveryPayload(
      completed.getSQL(),
      payload,
    );

    return Boolean(updatedDelivery);
  }

  async checkpointDelivery(owner: IDeliveryOwner, payload: string) {
    const active = this.db
      .update(ChannelMessage)
      .set({ updatedAt: sql`clock_timestamp()` })
      .where(and(this.activeOwner(owner), isNotNull(ChannelMessage.startedAt)))
      .returning({ messageId: ChannelMessage.messageId });
    const updated = await this.updateDeliveryPayload(active.getSQL(), payload);
    return Boolean(updated);
  }

  async releaseDelivery(owner: IDeliveryOwner) {
    const released = this.db
      .update(ChannelMessage)
      .set({
        receipt: null,
        claimedAt: null,
        startedAt: null,
        leaseUntil: null,
        updatedAt: sql`clock_timestamp()`,
      })
      .where(this.activeOwner(owner))
      .returning({ messageId: ChannelMessage.messageId });
    const updatedDelivery = await this.updateDeliveryPayload(released.getSQL());

    return Boolean(updatedDelivery);
  }

  async removeCompleted(channelId: string, before: Date, limit: number) {
    const completed = this.db
      .select({ id: ChannelMessage.messageId })
      .from(ChannelMessage)
      .where(
        and(
          eq(ChannelMessage.channelId, channelId),
          isNotNull(ChannelMessage.deliveryKey),
          lte(ChannelMessage.finishedAt, before),
        ),
      )
      .orderBy(asc(ChannelMessage.finishedAt), asc(ChannelMessage.messageId))
      .limit(limit)
      .for("update", { skipLocked: true });
    return this.db
      .delete(Table)
      .where(inArray(Table.id, completed))
      .returning({ id: Table.id });
  }

  async ownsDelivery(owner: IDeliveryOwner) {
    const rows = await this.db
      .select({ id: ChannelMessage.id })
      .from(ChannelMessage)
      .where(this.activeOwner(owner))
      .limit(1);
    return rows.length > 0;
  }

  async removeExpiredDeliveries(
    channelId: string,
    before: Date,
    limit: number,
  ) {
    const expired = this.db
      .select({ id: ChannelMessage.messageId })
      .from(ChannelMessage)
      .where(
        and(
          eq(ChannelMessage.channelId, channelId),
          isNotNull(ChannelMessage.deliveryKey),
          lte(ChannelMessage.createdAt, before),
          or(
            isNull(ChannelMessage.leaseUntil),
            lte(ChannelMessage.leaseUntil, sql`clock_timestamp()`),
          ),
        ),
      )
      .orderBy(asc(ChannelMessage.createdAt), asc(ChannelMessage.messageId))
      .limit(limit)
      .for("update", { skipLocked: true });
    return this.db
      .delete(Table)
      .where(inArray(Table.id, expired))
      .returning({ id: Table.id });
  }

  // Out-of-band channel deletions cascade their relations. The scheduled sweep
  // also reclaims any durable payload left without its queue owner.
  async deleteOrphanedDeliveries(limit: number) {
    const owner = this.db
      .select({ id: ChannelMessage.id })
      .from(ChannelMessage)
      .where(
        and(
          eq(ChannelMessage.messageId, Table.id),
          isNotNull(ChannelMessage.deliveryKey),
        ),
      );
    const orphans = this.db
      .select({ id: Table.id })
      .from(Table)
      .where(and(isNull(Table.expiresAt), notExists(owner)))
      .limit(limit)
      .for("update", { skipLocked: true });
    return this.db
      .delete(Table)
      .where(inArray(Table.id, orphans))
      .returning({ id: Table.id });
  }
}
