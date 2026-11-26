import type { IOrder } from "./list/customer-default/interface";
export function OrderCard({ order, href }: { order: IOrder; href?: string }) {
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
            <li
              key={line.id}
              className="flex min-w-0 items-baseline justify-between gap-4 py-2 text-sm"
            >
              <span className="break-words min-w-0">{line.title}</span>
              <span className="shrink-0 tabular-nums">{line.quantity} шт.</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Состав заказа не сохранился.
        </p>
      )}
    </article>
  );
}
