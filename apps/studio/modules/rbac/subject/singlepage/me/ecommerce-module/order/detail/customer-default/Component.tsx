import type { IComponentProps } from "./interface";
import { OrderCard } from "../../OrderCard";
export function Component(props: IComponentProps) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant="me-ecommerce-module-order-detail-customer-default"
      className="grid min-w-0 gap-5"
    >
      <div className="grid gap-5">
        <a
          href={props.listHref}
          className="w-fit text-sm font-medium underline underline-offset-4"
        >
          Все заказы
        </a>
        {props.order ? (
          <>
            <OrderCard order={props.order} />
            <section className="grid min-w-0 gap-4">
              <header className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-xl font-semibold">Переписка по заказу</h3>
                {props.threadHref && (
                  <a
                    className="text-sm font-medium underline underline-offset-4"
                    href={props.threadHref}
                  >
                    Открыть в чатах
                  </a>
                )}
              </header>
              {props.discussion ?? (
                <p className="text-sm text-muted-foreground">
                  У этого заказа нет переписки.
                </p>
              )}
            </section>
          </>
        ) : (
          <p role="status">Заказ недоступен.</p>
        )}
      </div>
    </div>
  );
}
