import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { IResult as IExtendedOrder } from "../find-by-id/extended";
import type { Repository } from "../../../repository";
import { compareInvoices, intervalEnd } from "./utils";

export interface IConstructorProps {
  findByIdExtended: (props: { id: string }) => Promise<IExtendedOrder>;
  writeSubscriptionPeriod: Repository["writeSubscriptionPeriod"];
  findById: (props: { id: string }) => Promise<IOrder | null>;
}
export interface IExecuteProps {
  id: string;
  expectedInvoiceId: string | null;
}
export interface IFreezeProps {
  id: string;
  expectedUpdatedAt: string;
}
export interface IResult {
  accepted: boolean;
  order: IOrder;
}

/** Receives only trusted orchestration calls; no public CRUD route exposes it. */
export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async assertPayment(props: { id: string }): Promise<boolean> {
    const order = await this.dependencies.findByIdExtended(props);
    if (order.subscriptionRevokedAt)
      throw new Error("Permission error. Subscription was explicitly revoked");
    const context = this.paymentContext(order);
    intervalEnd(new Date(), context.interval);
    if (!order.subscriptionPeriodInvoiceId) return true;
    const anchor = context.invoices.find(
      (invoice) => invoice.id === order.subscriptionPeriodInvoiceId,
    );
    if (!anchor)
      throw new Error(
        "Validation error. Accepted invoice no longer belongs to this order",
      );
    return compareInvoices(context.invoice, anchor) > 0;
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    const order = await this.dependencies.findByIdExtended({ id: props.id });
    if (order.subscriptionRevokedAt)
      throw new Error("Permission error. Subscription was explicitly revoked");
    if ((order.subscriptionPeriodInvoiceId ?? null) !== props.expectedInvoiceId)
      return { accepted: false, order };
    if (
      ![
        "paid",
        "delivering",
        "requested_cancelation",
        "delivered",
        "expired",
      ].includes(order.status)
    )
      throw new Error(
        "Validation error. Order cannot activate a subscription period",
      );
    const context = this.paymentContext(order);
    const anchor = order.subscriptionPeriodInvoiceId
      ? context.invoices.find(
          (invoice) => invoice.id === order.subscriptionPeriodInvoiceId,
        )
      : undefined;
    if (order.subscriptionPeriodInvoiceId && !anchor)
      throw new Error(
        "Validation error. Accepted invoice no longer belongs to this order",
      );
    if (anchor && compareInvoices(context.invoice, anchor) <= 0)
      return { accepted: false, order };
    if (!anchor && order.status !== "paid")
      throw new Error(
        "Validation error. Legacy subscription must be frozen before renewal",
      );
    const now = new Date();
    const previousEnd = order.subscriptionPeriodEndsAt
      ? new Date(order.subscriptionPeriodEndsAt)
      : undefined;
    const previousStart = order.subscriptionPeriodStartsAt
      ? new Date(order.subscriptionPeriodStartsAt)
      : undefined;
    if (
      anchor &&
      (!previousEnd ||
        !Number.isFinite(previousEnd.getTime()) ||
        !previousStart ||
        !Number.isFinite(previousStart.getTime()) ||
        previousStart > previousEnd)
    )
      throw new Error("Validation error. Incomplete subscription period");
    const intervalStartsAt = new Date(
      Math.max(now.getTime(), previousEnd?.getTime() ?? 0),
    );
    const startsAt =
      previousStart && previousEnd && previousStart <= now && now < previousEnd
        ? previousStart
        : now;
    return this.write(
      order,
      startsAt,
      intervalEnd(intervalStartsAt, context.interval),
      context.invoice.id,
      order.status === "requested_cancelation" ? order.status : "delivering",
    );
  }

  async freeze(props: IFreezeProps): Promise<IResult> {
    const order = await this.dependencies.findByIdExtended({ id: props.id });
    if (order.subscriptionRevokedAt)
      throw new Error("Permission error. Subscription was explicitly revoked");
    if (
      order.subscriptionPeriodInvoiceId ||
      order.subscriptionPeriodStartsAt ||
      order.subscriptionPeriodEndsAt
    ) {
      if (
        !order.subscriptionPeriodInvoiceId ||
        !order.subscriptionPeriodStartsAt ||
        !order.subscriptionPeriodEndsAt
      )
        throw new Error("Validation error. Incomplete subscription period");
      return { accepted: false, order };
    }
    if (!["delivering", "requested_cancelation"].includes(order.status))
      throw new Error(
        "Validation error. Only active legacy subscriptions can be frozen",
      );
    if (
      new Date(order.updatedAt).getTime() !==
      new Date(props.expectedUpdatedAt).getTime()
    )
      throw new Error(
        "Conflict error. Legacy order changed before period freeze",
      );
    const context = this.paymentContext(order);
    const startsAt = new Date(order.updatedAt);
    if (new Date(context.invoice.createdAt).getTime() > startsAt.getTime())
      throw new Error(
        "Validation error. Legacy paid invoice is newer than its delivery clock; reconcile before freeze",
      );
    return this.write(
      order,
      startsAt,
      intervalEnd(startsAt, context.interval),
      context.invoice.id,
      order.status,
    );
  }

  private paymentContext(order: IExtendedOrder) {
    if (
      order.type !== "history" ||
      order.checkoutAttributesByCurrency.type !== "subscription" ||
      !order.checkoutAttributesByCurrency.interval
    )
      throw new Error(
        "Validation error. Order is not a configured subscription purchase",
      );
    const invoices = Array.from(
      new Map(
        order.ordersToBillingModulePaymentIntents
          .flatMap((link) =>
            link.billingModulePaymentIntent.paymentIntentsToInvoices
              .map((relation) => relation.invoice)
              .filter((invoice) => invoice?.status === "paid"),
          )
          .map((invoice) => [invoice.id, invoice]),
      ).values(),
    ).sort(compareInvoices);
    const invoice = invoices.at(-1);
    if (!invoice)
      throw new Error(
        "Validation error. Subscription requires a confirmed paid invoice belonging to this order",
      );
    for (const item of invoices) compareInvoices(item, item);
    return {
      invoices,
      invoice,
      interval: order.checkoutAttributesByCurrency.interval,
    };
  }

  private async write(
    order: IOrder,
    startsAt: Date,
    endsAt: Date,
    invoiceId: string,
    status: string,
  ): Promise<IResult> {
    const updated = await this.dependencies.writeSubscriptionPeriod({
      id: order.id,
      before: order,
      startsAt,
      endsAt,
      invoiceId,
      status,
    });
    if (updated) return { accepted: true, order: updated };
    const current = await this.dependencies.findById({ id: order.id });
    if (!current)
      throw new Error("Not Found error. Subscription order disappeared");
    return { accepted: false, order: current };
  }
}
