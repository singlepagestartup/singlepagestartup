import { Component as SharedIcon } from "../../../../shared/icon";
import type { IComponentProps } from "./interface";

const labels = {
  locked: "Ожидает принятия превью",
  ready: "Готов к оплате",
  pending: "Ожидаем подтверждение оплаты",
  failed: "Оплата не прошла",
  paid: "Оплачено",
  declined: "Заказ закрыт",
} as const;

export function Component({
  order,
  state,
  onPay,
  onDiscussion,
  onRemove,
}: IComponentProps) {
  return (
    <section
      data-ds-block="ecommerce.order.work-checkout"
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="order"
      data-variant="work-checkout"
      className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-7"
    >
      <header>
        <div
          role="status"
          className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
        >
          <SharedIcon
            variant="phosphor"
            name={
              state === "paid"
                ? "check-circle"
                : state === "failed"
                  ? "warning"
                  : "credit-card"
            }
            size={20}
          />
          {labels[state]}
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          Заказ {order.id}
        </h1>
      </header>
      <dl className="mt-5 space-y-3 border-y border-border py-4 text-sm">
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Предложение</dt>
          <dd className="font-medium">{order.title}</dd>
        </div>
        {order.resultVersionNumber !== undefined && (
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Версия результата</dt>
            <dd className="font-medium">Версия {order.resultVersionNumber}</dd>
          </div>
        )}
        {order.invoiceId && (
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Счёт</dt>
            <dd className="font-medium">{order.invoiceId}</dd>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-1">
          <dt className="font-medium">Сумма заказа</dt>
          <dd className="text-xl font-semibold tabular-nums">
            {order.total.toLocaleString("ru-RU")} ₽
          </dd>
        </div>
      </dl>
      {state === "locked" && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Выберите и примите версию в обсуждении заказа. После этого здесь
          появится оплата.
        </p>
      )}
      {state === "failed" && (
        <p role="alert" className="mt-4 text-sm">
          Платёж не подтверждён. Повторите оплату этого заказа.
        </p>
      )}
      {state === "declined" && (
        <p className="mt-4 text-sm text-muted-foreground">
          Результат отклонён. Обсуждение доступно в истории.
        </p>
      )}
      {order.shipment && (
        <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm">
          <h2 className="font-semibold">Доставка · {order.shipment.status}</h2>
          {order.shipment.trackingCode && (
            <p className="mt-1 text-muted-foreground">
              Трек {order.shipment.trackingCode}
            </p>
          )}
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        {(state === "ready" || state === "failed" || state === "pending") && (
          <button
            type="button"
            disabled={state === "pending"}
            onClick={onPay}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {state === "pending"
              ? "Подтверждаем оплату…"
              : state === "failed"
                ? "Повторить оплату"
                : `Оплатить ${order.total.toLocaleString("ru-RU")} ₽`}
          </button>
        )}
        <button
          type="button"
          onClick={onDiscussion}
          className="min-h-11 rounded-xl border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Открыть обсуждение
        </button>
        {onRemove && (state === "ready" || state === "locked") && (
          <button
            type="button"
            onClick={onRemove}
            className="min-h-11 rounded-xl px-3 py-2 text-sm underline underline-offset-4 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Удалить из корзины
          </button>
        )}
      </div>
    </section>
  );
}
