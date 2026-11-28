import Link from "next/link";
import { memo, type ReactNode } from "react";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import {
  orderDisplayStatus,
  orderStatusLabel,
} from "@sps/ecommerce/models/order/sdk/model";
import type { IResult } from "@sps/rbac/models/subject/sdk/server";
interface IOrderCardProps {
  ecommerceModuleOrder: IResult["IEcommerceModuleOrderListResult"][number];
  language: string;
  href?: string;
  children?: ReactNode;
}
export const OrderCard = memo(function OrderCard({
  ecommerceModuleOrder: order,
  language,
  href,
  children,
}: IOrderCardProps) {
  const ru = language === "ru";
  const title = (ru ? "Заказ №" : "Order #") + order.id.slice(0, 8);
  const date = new Intl.DateTimeFormat(language, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(order.createdAt));
  const displayStatus = orderDisplayStatus(
    order.status,
    order.customerDetails?.workState,
  );
  const status = orderStatusLabel(displayStatus, language);
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
            <li key={line.id} className="min-w-0">
              <EcommerceModuleProduct
                isServer={false}
                dataSource="props"
                variant="customer-order-line"
                data={{
                  id: line.productId,
                  title: line.title,
                  slug: line.productSlug,
                }}
                language={language}
                quantity={line.quantity}
                coverUrl={line.coverUrl}
                priceLabel={
                  line.price
                    ? `${formatCurrencyAmount(line.price.amount, language)} ${line.price.symbol}`
                    : displayStatus === "awaiting-result"
                      ? ru
                        ? "Цена при согласовании результата"
                        : "Price at result review"
                      : undefined
                }
              />
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
      {children}
    </article>
  );
});
