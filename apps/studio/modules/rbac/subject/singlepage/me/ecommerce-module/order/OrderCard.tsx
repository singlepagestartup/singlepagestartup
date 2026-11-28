import { Component as EcommerceModuleProduct } from "../../../../../../ecommerce/product";
import type { ReactNode } from "react";
import type { IOrder } from "./list/customer-default/interface";
export function OrderCard({
  order,
  href,
  children,
}: {
  order: IOrder;
  href?: string;
  children?: ReactNode;
}) {
  const title = "Заказ №" + order.id.slice(0, 8);
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {href ? (
              <a className="underline underline-offset-4" href={href}>
                {title}
              </a>
            ) : (
              title
            )}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{order.date}</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {order.status}
        </span>
      </header>
      {order.lines.length ? (
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {order.lines.map((line) => (
            <li key={line.id}>
              <EcommerceModuleProduct
                variant="customer-order-line"
                data={{
                  id: line.productId,
                  title: { ru: line.title },
                  slug: line.slug,
                }}
                language="ru"
                quantity={line.quantity}
                priceLabel={line.priceLabel}
                coverUrl={line.coverUrl}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Состав заказа не сохранился.
        </p>
      )}
      {children}
    </article>
  );
}
