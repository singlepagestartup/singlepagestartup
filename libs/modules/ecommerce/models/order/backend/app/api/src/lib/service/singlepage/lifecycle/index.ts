import { consistencyContext, type IRepository } from "@sps/shared-backend-api";
import type { Table } from "@sps/ecommerce/models/order/backend/repository/database";
import type { Repository } from "../../../repository";

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

/** Server-owned Order fields and conditional lifecycle writes. */
export class Service {
  constructor(private readonly repository: Repository) {}

  revokeSubscription(props: { id: string }) {
    return this.repository.consumeFirstByField(
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
    return this.repository.consumeFirstByField(
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

  get protectedLifecycleFields() {
    return [
      "subscriptionPeriodStartsAt",
      "subscriptionPeriodEndsAt",
      "subscriptionPeriodInvoiceId",
      "subscriptionRevokedAt",
      "paymentFailureCanceledAt",
      "subscriptionSourceOrderId",
      "subscriptionSourceInvoiceId",
      "subscriptionSourceInterval",
      "subscriptionScheduledStartsAt",
      "subscriptionScheduledEndsAt",
      "subscriptionProviderInvoiceId",
    ] as const;
  }

  writableData(data: Record<string, unknown>, record?: IOrder | null) {
    const writable = { ...data };
    for (const field of this.protectedLifecycleFields) {
      if (!(field in writable)) {
        continue;
      }
      const supplied = writable[field];
      const persisted = record?.[field] ?? null;
      const referenceField = [
        "subscriptionPeriodInvoiceId",
        "subscriptionSourceOrderId",
        "subscriptionSourceInvoiceId",
        "subscriptionSourceInterval",
        "subscriptionProviderInvoiceId",
      ].includes(field);
      let equal = supplied === persisted;
      if (!referenceField) {
        equal =
          (supplied == null && persisted == null) ||
          (supplied != null &&
            persisted != null &&
            new Date(supplied as string).getTime() ===
              new Date(persisted).getTime());
      }
      if (supplied !== undefined && !equal) {
        throw new Error(
          "Validation error. Order lifecycle fields are server managed",
        );
      }
      delete writable[field];
    }
    // An ordinary cancellation is an explicit instruction to stop delivery.
    // Only the payment lifecycle capability preserves automatic failure recovery.
    if (["canceling", "canceled"].includes(String(writable.status))) {
      writable.paymentFailureCanceledAt = null;
    }
    return writable;
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
    return this.repository.insert({
      type: "cart",
      status: "new",
      subscriptionSourceOrderId: props.sourceOrderId,
      subscriptionSourceInvoiceId: props.sourceInvoiceId,
      subscriptionSourceInterval: props.interval,
    });
  }

  configureNextPeriod(props: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    providerInvoiceId?: string;
  }) {
    if (!consistencyContext.getStore()?.database) {
      throw new Error(
        "Conflict error. Period configuration requires an owner transaction",
      );
    }
    if (
      !Number.isFinite(props.startsAt.getTime()) ||
      !Number.isFinite(props.endsAt.getTime()) ||
      props.startsAt >= props.endsAt
    ) {
      throw new Error(
        "Validation error. Invalid scheduled subscription period",
      );
    }
    return this.repository.updateFirstByField("id", props.id, {
      subscriptionScheduledStartsAt: props.startsAt,
      subscriptionScheduledEndsAt: props.endsAt,
      ...(props.providerInvoiceId
        ? { subscriptionProviderInvoiceId: props.providerInvoiceId }
        : {}),
    });
  }

  private unchangedLifecycle(
    before: IOrder,
  ): NonNullable<Parameters<IRepository["consumeFirstByField"]>[3]> {
    return {
      and: [
        { column: "status", method: "eq", value: before.status },
        // PostgreSQL defaultNow has microseconds; the public Date DTO has milliseconds.
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
    };
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
    return this.repository.consumeFirstByField(
      "id",
      before.id,
      { status, type: "history", paymentFailureCanceledAt },
      this.unchangedLifecycle(before),
    );
  }

  /** Internal capability; generic CRUD cannot write its protected columns. */
  writeSubscriptionPeriod(props: ISubscriptionPeriodWrite) {
    return this.repository.consumeFirstByField(
      "id",
      props.id,
      {
        subscriptionPeriodStartsAt: props.startsAt,
        subscriptionPeriodEndsAt: props.endsAt,
        subscriptionPeriodInvoiceId: props.invoiceId,
        status: props.status,
      },
      this.unchangedLifecycle(props.before),
    );
  }
}
