import { memo } from "react";
import { Component as SharedIcon } from "../../../../shared/icon";
import type {
  IOrderHistoryItem,
  IOrderInvoice,
  OrderPaymentStatus,
} from "../../interface";
import { formatOrderMoney } from "../../shared";
import content from "./content.json";
import type { IComponentProps } from "./interface";

const statusLabels: Record<OrderPaymentStatus, string> = {
  paid: "Paid",
  "awaiting-payment": "Awaiting payment",
  cancelled: "Cancelled",
};

function PaymentStatus({ status }: { status: OrderPaymentStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status === "paid" ? "bg-primary text-primary-foreground" : "border border-border bg-muted text-foreground"}`}
    >
      <SharedIcon
        variant="phosphor"
        name={status === "paid" ? "check" : "clock"}
        className="size-3.5"
      />
      {statusLabels[status]}
    </span>
  );
}

const HistoryRow = memo(function HistoryRow({
  order,
  expanded,
}: {
  order: IOrderHistoryItem;
  expanded: boolean;
}) {
  return (
    <li>
      <details
        open={expanded}
        className="group overflow-hidden rounded-2xl border border-border bg-card"
      >
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4 p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:p-6 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1 basis-48">
            <p className="text-xs text-muted-foreground">
              {order.id} · {order.date}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              {order.title}{" "}
              <span className="text-muted-foreground">× {order.quantity}</span>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{order.seller}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-lg font-semibold tabular-nums">
              {order.amount === null
                ? "Included in shared invoice"
                : formatOrderMoney(order.amount, order.currency)}
            </span>
            <PaymentStatus status={order.status} />
            <SharedIcon
              variant="phosphor"
              name="caret-down"
              className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </div>
        </summary>
        <div className="space-y-5 border-t border-border px-5 py-5 sm:px-6">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{order.fulfilment}</p>
            {order.periodLabel ? <p>{order.periodLabel}</p> : null}
            <p>
              {order.amount === null
                ? "Shared invoice"
                : "Your share of invoice"}{" "}
              <span className="font-medium text-foreground">
                {order.invoiceId}
              </span>
            </p>
            <p className="break-all text-xs">Offer: {order.offerId}</p>
          </div>
          {order.charges.length > 0 ? (
            <ul
              className="space-y-3"
              aria-label={`Saved charges for ${order.id}`}
            >
              {order.charges.map((charge) => (
                <li
                  key={charge.id}
                  className={`flex items-start justify-between gap-4 text-sm ${charge.kind === "product" ? "font-semibold" : "ml-4 border-l border-border pl-4"}`}
                >
                  <div className="min-w-0">
                    <p>
                      {charge.title} × {charge.quantity}
                    </p>
                    <p className="mt-1 text-xs font-normal text-muted-foreground">
                      Sold by {charge.seller}
                      {charge.fulfilledBy
                        ? ` · Fulfilled by ${charge.fulfilledBy}`
                        : ""}
                      {charge.schedule === "first-delivery"
                        ? " · First delivery only"
                        : ""}
                      {charge.schedule === "every-delivery"
                        ? " · Every delivery"
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums">
                    {charge.amount === 0
                      ? "Free"
                      : formatOrderMoney(charge.amount, order.currency)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              This older invoice has no saved amount for each order. Its total
              is shown once in the invoice below.
            </p>
          )}
          {order.note ? (
            <p className="rounded-xl bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">
              {order.note}
            </p>
          ) : null}
        </div>
      </details>
    </li>
  );
});

const InvoiceRow = memo(function InvoiceRow({
  invoice,
}: {
  invoice: IOrderInvoice;
}) {
  return (
    <li className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="break-all text-sm font-semibold">{invoice.id}</p>
        <PaymentStatus status={invoice.status} />
      </div>
      <p className="mt-4 text-2xl font-semibold tabular-nums">
        {formatOrderMoney(invoice.amount, invoice.currency)}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {invoice.description}
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        {invoice.orderIds.length === 1 ? "Order" : "Orders"}:{" "}
        {invoice.orderIds.join(", ")}
      </p>
      {invoice.legacy ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Shared total. The saved invoice does not identify each order’s share.
        </p>
      ) : null}
      {invoice.status === "awaiting-payment" ? (
        <a
          className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          href="/?path=/story/modules-ecommerce-models-order-singlepage-order-checkout-payment-default--mixed-payment-states"
          target="_top"
        >
          Open unpaid invoice
        </a>
      ) : null}
    </li>
  );
});

export const defaultOrderHistoryDefaultProps = {
  orders: content.orders as IOrderHistoryItem[],
  invoices: content.invoices as IOrderInvoice[],
  expanded: true,
  title: "Purchase history",
  description:
    "Two paid orders share the RUB invoice. The USD invoice is awaiting payment.",
} satisfies IComponentProps;

export function OrderHistoryDefault(props: IComponentProps) {
  const { orders, invoices, expanded, title, description } = {
    ...defaultOrderHistoryDefaultProps,
    ...props,
  };

  return (
    <section
      className="mx-auto w-full min-w-0 max-w-5xl space-y-6 text-foreground"
      data-ds-block="ecommerce.order.history-default"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="order"
      data-variant="history-default"
    >
      <header>
        <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </header>
      {orders.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No purchases yet.
        </p>
      ) : (
        <ul className="space-y-4" aria-label="Orders">
          {orders.map((order) => (
            <HistoryRow key={order.id} order={order} expanded={expanded} />
          ))}
        </ul>
      )}
      {invoices.length > 0 ? (
        <section className="space-y-4" aria-label="Invoices">
          <h3 className="text-xl font-semibold">Invoices</h3>
          <ul className="grid gap-4 md:grid-cols-2">
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
