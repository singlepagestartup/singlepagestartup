import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { columnLayout } from "./Columns";
import type { IComponentPropsExtended } from "./interface";

export const Component = memo(function OrderRow({
  data,
  language,
  href,
  variant,
  showItems,
  quantity,
  isServer,
}: IComponentPropsExtended) {
  const ru = language === "ru";
  return (
    <li
      data-module="ecommerce"
      data-model="order"
      data-id={data.id}
      data-variant={variant}
      className="min-w-0"
    >
      <Link
        href={href}
        className={`group grid min-h-12 min-w-0 grid-cols-[minmax(0,1fr)_1rem] items-center gap-x-4 gap-y-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-card-foreground hover:border-foreground/30 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-ring ${columnLayout(showItems, quantity !== undefined)}`}
      >
        <span title={data.id} className="font-medium tabular-nums">
          <span className="sr-only">
            {ru ? "Заказ" : "Order"} {data.id}
          </span>
          <span aria-hidden="true">{data.id.slice(0, 8)}</span>
        </span>
        {showItems && (
          <span className="col-start-1 grid min-w-0 gap-1 md:col-start-auto">
            {data.items?.length
              ? data.items.map((line) => (
                  <span key={line.id} className="block">
                    <Product
                      isServer={isServer}
                      variant="order-line-title"
                      dataSource="props"
                      data={line.product}
                      language={language}
                    />{" "}
                    <span className="inline-block whitespace-nowrap text-muted-foreground">
                      × {line.quantity}
                    </span>
                  </span>
                ))
              : "—"}
          </span>
        )}
        <time
          className="col-start-1 text-muted-foreground md:col-start-auto"
          dateTime={data.createdAt}
        >
          {new Intl.DateTimeFormat(language, {
            dateStyle: "medium",
            timeZone: "UTC",
          }).format(new Date(data.createdAt))}
        </time>
        <span className="col-start-1 md:col-start-auto">
          <OrderStatusBadge status={data.status} language={language} />
        </span>
        {showItems && (
          <span className="col-start-1 tabular-nums md:col-start-auto">
            <span className="md:sr-only">{ru ? "Стоимость" : "Total"} · </span>
            {data.total
              ? `${formatCurrencyAmount(data.total.amount, language)} ${data.total.symbol}`
              : "—"}
          </span>
        )}
        {quantity !== undefined && (
          <span className="col-start-1 tabular-nums md:col-start-auto">
            <span className="md:sr-only">
              {ru ? "Количество" : "Quantity"}:{" "}
            </span>
            {quantity}
          </span>
        )}
        <ChevronRight
          aria-hidden="true"
          className="col-start-2 row-start-1 size-4 text-muted-foreground group-hover:text-foreground md:col-start-auto md:row-start-auto"
        />
      </Link>
    </li>
  );
});
