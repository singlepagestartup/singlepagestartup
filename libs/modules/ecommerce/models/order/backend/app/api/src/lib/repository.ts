import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
  consistencyContext,
  withConsistencyDatabase,
  type IRepository,
} from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/order/backend/repository/database";
import { eq } from "drizzle-orm";

type IOrder = typeof Table.$inferSelect;
export interface ISubscriptionPeriodWrite {
  id: string;
  before: IOrder;
  startsAt: Date;
  endsAt: Date;
  invoiceId: string;
  status: IOrder["status"];
}

export interface IPaymentStatusWrite {
  before: IOrder;
  status: "paid" | "canceling" | "canceled";
}

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
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
    return this.db.transaction((tx) => withConsistencyDatabase(tx, run));
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
  revokeSubscription(props: { id: string }) {
    return super.consumeFirstByField(
      "id",
      props.id,
      { subscriptionRevokedAt: new Date() },
      {
        and: [
          { column: "subscriptionRevokedAt", method: "isNull", value: null },
          { column: "type", method: "eq", value: "history" },
        ],
      },
    );
  }
  expireSubscriptionPeriod(props: { before: IOrder; now: Date }) {
    return super.consumeFirstByField(
      "id",
      props.before.id,
      {
        status:
          props.before.status === "requested_cancelation"
            ? "canceling"
            : "delivered",
      },
      {
        and: [
          { column: "status", method: "eq", value: props.before.status },
          {
            column: "subscriptionPeriodInvoiceId",
            method: "eq",
            value: props.before.subscriptionPeriodInvoiceId,
          },
          {
            column: "subscriptionPeriodEndsAt",
            method: "eq",
            value: props.before.subscriptionPeriodEndsAt,
          },
          {
            column: "subscriptionPeriodEndsAt",
            method: "lte",
            value: props.now,
          },
        ],
      },
    );
  }
  private get protectedLifecycleFields() {
    return [
      "subscriptionPeriodStartsAt",
      "subscriptionPeriodEndsAt",
      "subscriptionPeriodInvoiceId",
      "subscriptionRevokedAt",
      "paymentFailureCanceledAt",
      "subscriptionSourceOrderId",
      "subscriptionSourceInvoiceId",
      "subscriptionSourceInterval",
    ] as const;
  }

  private writableData(data: Record<string, unknown>, record?: IOrder) {
    const writable = { ...data };
    for (const field of this.protectedLifecycleFields) {
      if (!(field in writable)) continue;
      const supplied = writable[field];
      const persisted = record?.[field] ?? null;
      const equal = [
        "subscriptionPeriodInvoiceId",
        "subscriptionSourceOrderId",
        "subscriptionSourceInvoiceId",
        "subscriptionSourceInterval",
      ].includes(field)
        ? supplied === persisted
        : (supplied == null && persisted == null) ||
          (supplied != null &&
            persisted != null &&
            new Date(supplied as string).getTime() ===
              new Date(persisted).getTime());
      if (supplied !== undefined && !equal)
        throw new Error(
          "Validation error. Order lifecycle fields are server managed",
        );
      delete writable[field];
    }
    // An ordinary cancellation is an explicit instruction to stop delivery.
    // Only the payment lifecycle capability preserves automatic failure recovery.
    if (["canceling", "canceled"].includes(String(writable.status))) {
      writable.paymentFailureCanceledAt = null;
    }
    return writable;
  }

  override insert(data: Record<string, unknown>) {
    return super.insert(this.writableData(data));
  }

  createNextPeriodCart(props: {
    sourceOrderId: string;
    sourceInvoiceId: string;
    interval: string;
  }) {
    if (!consistencyContext.getStore()?.database) {
      throw new Error(
        "Conflict error. Next-period cart requires an owner transaction",
      );
    }
    return super.insert({
      type: "cart",
      status: "new",
      subscriptionSourceOrderId: props.sourceOrderId,
      subscriptionSourceInvoiceId: props.sourceInvoiceId,
      subscriptionSourceInterval: props.interval,
    });
  }

  override async updateFirstByField(
    field: string,
    value: unknown,
    data: Record<string, unknown>,
  ) {
    const record = await this.findFirstByField(field, value);
    return super.updateFirstByField(
      field,
      value,
      this.writableData(data, record),
    );
  }

  override async consumeFirstByField(
    field: string,
    value: unknown,
    data: Record<string, unknown>,
    predicate?: Parameters<IRepository["consumeFirstByField"]>[3],
  ) {
    const record = await this.findFirstByField(field, value);
    return super.consumeFirstByField(
      field,
      value,
      this.writableData(data, record),
      predicate,
    );
  }

  writePaymentStatus({ before, status }: IPaymentStatusWrite) {
    let paymentFailureCanceledAt = before.paymentFailureCanceledAt;
    if (status === "paid") {
      paymentFailureCanceledAt = null;
    } else if (status === "canceling") {
      const unfulfilled =
        !before.subscriptionPeriodInvoiceId &&
        !before.subscriptionPeriodStartsAt &&
        !before.subscriptionPeriodEndsAt &&
        !before.subscriptionRevokedAt;
      paymentFailureCanceledAt = unfulfilled ? new Date() : null;
    }
    return super.consumeFirstByField(
      "id",
      before.id,
      { status, type: "history", paymentFailureCanceledAt },
      {
        and: [
          { column: "status", method: "eq", value: before.status },
          { column: "updatedAt", method: "gte", value: before.updatedAt },
          {
            column: "updatedAt",
            method: "lt",
            value: new Date(new Date(before.updatedAt).getTime() + 1),
          },
          ...this.protectedLifecycleFields.map((column) => ({
            column,
            method:
              before[column] == null ? ("isNull" as const) : ("eq" as const),
            value: before[column],
          })),
        ],
      },
    );
  }

  /** Internal capability; generic CRUD cannot write its protected columns. */
  writeSubscriptionPeriod(props: ISubscriptionPeriodWrite) {
    const and: NonNullable<
      Parameters<IRepository["consumeFirstByField"]>[3]
    >["and"] = [
      { column: "status", method: "eq", value: props.before.status },
      // PostgreSQL defaultNow has microseconds; the public Date DTO has milliseconds.
      { column: "updatedAt", method: "gte", value: props.before.updatedAt },
      {
        column: "updatedAt",
        method: "lt",
        value: new Date(new Date(props.before.updatedAt).getTime() + 1),
      },
      ...this.protectedLifecycleFields.map((column) => ({
        column,
        method:
          props.before[column] == null ? ("isNull" as const) : ("eq" as const),
        value: props.before[column],
      })),
    ];
    return super.consumeFirstByField(
      "id",
      props.id,
      {
        subscriptionPeriodStartsAt: props.startsAt,
        subscriptionPeriodEndsAt: props.endsAt,
        subscriptionPeriodInvoiceId: props.invoiceId,
        status: props.status,
      },
      { and },
    );
  }
}
