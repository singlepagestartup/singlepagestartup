import Link from "next/link";
import { memo } from "react";
import { orderStatusLabel } from "@sps/ecommerce/models/order/sdk/model";
import type { IResult } from "@sps/rbac/models/subject/sdk/server";
interface IOrderCardProps {
  ecommerceModuleOrder: IResult["IEcommerceModuleOrderListResult"][number];
  language: string;
  href?: string;
}
export const OrderCard = memo(function OrderCard({
  ecommerceModuleOrder: order,
  language,
  href,
}: IOrderCardProps) {
  const ru = language === "ru";
  const title = (ru ? "Заказ №" : "Order #") + order.id.slice(0, 8);
  const date = new Intl.DateTimeFormat(language, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(order.createdAt));
  const orderStatus = order.status === "cancelled" ? "canceled" : order.status;
  const workState = order.customerDetails?.workState;
  // Work can still be awaiting payment after a cancellation or payment failure.
  const activeFulfillment = [
    "new",
    "paying",
    "paid",
    "approving",
    "packaging",
    "delivering",
  ].includes(orderStatus);
  const status = orderStatusLabel(
    activeFulfillment && workState ? workState : orderStatus,
    language,
  );
  const lines = order.customerDetails?.lines ?? [];
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {href ? (
              <Link className="underline underline-offset-4" href={href}>
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{date}</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {status}
        </span>
      </header>
      {lines.length ? (
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {lines.map((line) => (
            <li
              key={line.id}
              className="flex min-w-0 items-baseline justify-between gap-4 py-2 text-sm"
            >
              <span className="break-words min-w-0">
                {line.title?.[language] ||
                  line.title?.en ||
                  Object.values(line.title || {}).find(Boolean) ||
                  (ru
                    ? "Товар " + line.productId
                    : "Product " + line.productId)}
              </span>
              <span className="shrink-0 tabular-nums">
                {ru ? `${line.quantity} шт.` : `Qty ${line.quantity}`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          {ru
            ? "Состав заказа не сохранился."
            : "Item details are unavailable for this order."}
        </p>
      )}
    </article>
  );
});
