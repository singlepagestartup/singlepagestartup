import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
  consistencyContext,
  withConsistencyTransaction,
} from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/order/backend/repository/database";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import type {
  IOrderWork,
  IOrderWorkFile,
  IOrderWorkPayment,
  IOrderWorkDecision,
} from "@sps/ecommerce/models/order/sdk/model/src/lib/work";

// Older orders and already-issued payment intents refer to a generated result ID.
function storedWork(record: IOrderWork): IOrderWork {
  const legacy = record as IOrderWork & {
    versions?: (IOrderWorkFile & { number?: number })[];
    acceptedVersionId?: string | null;
  };
  if (!legacy.versions) {
    return record;
  }
  const files =
    record.files ??
    legacy.versions.map(({ id, number, ...file }) => ({
      ...file,
      id: file.previewFileId,
      ...(id !== file.previewFileId && { legacyMessageId: id }),
    }));
  const fileIds = new Map(
    files.flatMap((file) =>
      file.legacyMessageId ? [[file.legacyMessageId, file.id] as const] : [],
    ),
  );
  const actualId = (id: string) => fileIds.get(id) ?? id;
  const decisions = record.decisions.map((entry) => {
    const { resultVersionId, ...decision } = entry as IOrderWorkDecision & {
      resultVersionId?: string;
    };
    return {
      ...decision,
      fileId: actualId(decision.fileId ?? resultVersionId!),
    };
  });
  const { versions, acceptedVersionId, ...rest } = legacy;
  const payment = record.paid as
    (IOrderWorkPayment & { resultVersionId?: string | null }) | null;
  let paid: IOrderWorkPayment | null = null;
  if (payment) {
    const { resultVersionId, ...entry } = payment;
    const fileId = entry.fileId ?? resultVersionId;
    paid = { ...entry, fileId: fileId ? actualId(fileId) : null };
  }
  const accepted = Object.hasOwn(rest, "acceptedFileId")
    ? rest.acceptedFileId
    : acceptedVersionId;
  return {
    ...rest,
    files,
    decisions,
    paid,
    acceptedFileId: accepted ? actualId(accepted) : null,
  };
}

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async fulfillmentForOrder(orderId: string) {
    await this.trackRead({
      and: [{ column: "id", method: "eq", value: orderId }],
    });
    const [row] = await this.db
      .select({ work: Table.fulfillmentWork })
      .from(Table)
      .where(eq(Table.id, orderId));
    return row?.work ? storedWork(row.work) : undefined;
  }

  async saveFulfillment(orderId: string, work: IOrderWork) {
    const [row] = await this.db
      .update(Table)
      .set({ fulfillmentWork: work })
      .where(eq(Table.id, orderId))
      .returning({ work: Table.fulfillmentWork });
    if (!row?.work) {
      throw new Error("Not Found error. Order does not exist");
    }
    return storedWork(row.work);
  }

  async patchFulfillment(orderId: string, changes: Partial<IOrderWork>) {
    // Merge only the updated fields so an outbox acknowledgement cannot overwrite delivery.
    const patch = JSON.stringify({
      ...changes,
      updatedAt: new Date().toISOString(),
    });
    const [row] = await this.db
      .update(Table)
      .set({
        fulfillmentWork: sql`${Table.fulfillmentWork} || ${patch}::jsonb`,
      })
      .where(and(eq(Table.id, orderId), isNotNull(Table.fulfillmentWork)))
      .returning({ work: Table.fulfillmentWork });
    if (!row?.work) {
      throw new Error("Not Found error. Order work does not exist");
    }
    return storedWork(row.work);
  }

  async missingPayments(limit: number) {
    await this.trackRead();
    return this.db
      .select({ orderId: Table.id })
      .from(Table)
      .where(
        and(
          eq(Table.status, "paid"),
          isNotNull(Table.fulfillmentWork),
          sql`${Table.fulfillmentWork}->>'paid' is null`,
        ),
      )
      .orderBy(asc(Table.updatedAt), asc(Table.id))
      .limit(limit);
  }

  async undeliveredPayments(limit: number) {
    await this.trackRead();
    const work = Table.fulfillmentWork;
    const rows = await this.db
      .select({ work })
      .from(Table)
      .where(
        sql`${work}->>'paid' is not null and (${work}->>'paidDispatchedAt' is null or
        (${work}->>'receiptFileId' is null and (${work}->>'paidDispatchedAt')::timestamptz < now() - interval '5 minutes'))`,
      )
      .orderBy(asc(Table.updatedAt), asc(Table.id))
      .limit(limit);
    return rows.flatMap(({ work }) => (work ? [storedWork(work)] : []));
  }

  withLifecycleLock<T>(
    id: string,
    operation: () => Promise<T>,
    mode: "update" | "no key update" = "update",
  ): Promise<T> {
    const run = async () => {
      await this.lockForLifecycle({ id, mode });
      return operation();
    };
    if (consistencyContext.getStore()?.database) {
      return run();
    }
    return withConsistencyTransaction(this.db, run);
  }

  async lockForLifecycle(props: {
    id: string;
    mode?: "update" | "no key update";
  }) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: props.id }],
    });
    return this.db
      .select({ id: Table.id })
      .from(Table)
      .where(eq(Table.id, props.id))
      .for(props.mode ?? "update");
  }
}
