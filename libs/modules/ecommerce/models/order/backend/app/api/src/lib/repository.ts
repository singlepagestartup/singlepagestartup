import "reflect-metadata";
import { injectable } from "inversify";
import {
  DatabaseRepository,
  trackRepositoryRead,
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

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {
  async lockForLifecycle(props: { id: string }) {
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: props.id }],
    });
    return this.db
      .select({ id: Table.id })
      .from(Table)
      .where(eq(Table.id, props.id))
      .for("update");
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
  private get protectedPeriodFields() {
    return [
      "subscriptionPeriodStartsAt",
      "subscriptionPeriodEndsAt",
      "subscriptionPeriodInvoiceId",
      "subscriptionRevokedAt",
    ] as const;
  }

  private writableData(data: Record<string, unknown>, record?: IOrder) {
    const writable = { ...data };
    for (const field of this.protectedPeriodFields) {
      if (!(field in writable)) continue;
      const supplied = writable[field];
      const persisted = record?.[field] ?? null;
      const equal =
        field === "subscriptionPeriodInvoiceId"
          ? supplied === persisted
          : (supplied == null && persisted == null) ||
            (supplied != null &&
              persisted != null &&
              new Date(supplied as string).getTime() ===
                new Date(persisted).getTime());
      if (supplied !== undefined && !equal)
        throw new Error(
          "Validation error. Subscription period fields are server managed",
        );
      delete writable[field];
    }
    return writable;
  }

  override insert(data: Record<string, unknown>) {
    return super.insert(this.writableData(data));
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
      ...this.protectedPeriodFields.map((column) => ({
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
