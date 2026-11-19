import { Component as Icon } from "../../../../shared/icon";
import type { IComponentProps } from "./interface";

export function Component({
  offer,
  orderId,
  orderStatus = "cart",
  consulting,
  pendingAction,
  feedback,
  onAsk,
  onAdd,
  onOpenOrder,
  onOpenDiscussion,
}: IComponentProps) {
  const service = offer.kind === "service";
  const orderLabel = { cart: "В корзине", paid: "Оплачено", closed: "Закрыт" }[
    orderStatus
  ];

  return (
    <article className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-8">
        <span className="inline-flex size-11 items-center justify-center rounded-xl bg-muted text-foreground">
          <Icon variant="phosphor" name={service ? "file-text" : "package"} />
        </span>
        <h1 className="mt-5 max-w-[16ch] text-3xl font-semibold tracking-tight sm:text-5xl">
          {offer.title}
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
          {offer.description}
        </p>
        <h2 className="mt-8 border-t border-border pt-5 text-base font-semibold">
          {service ? "Что входит" : "О товаре"}
        </h2>
        <ul className="mt-3 space-y-2.5 text-sm">
          {offer.deliverables.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Icon
                variant="phosphor"
                name="check"
                size={20}
                className="shrink-0 text-muted-foreground"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="self-start rounded-2xl border border-border bg-card p-5 sm:p-6"
        aria-label="Условия покупки"
      >
        <p className="text-sm font-medium text-muted-foreground">
          {service ? "Цена услуги" : "В наличии"}
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
          {offer.price.toLocaleString("ru-RU")} ₽
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {service
            ? "Обсудите задачу, проверьте превью и оплатите выбранную версию."
            : "Оплата доступна сразу после добавления в корзину."}
        </p>
        <div className="mt-5 grid gap-2.5">
          <button
            type="button"
            onClick={orderId ? onOpenOrder : onAdd}
            disabled={!!pendingAction}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <Icon name="shopping-cart" variant="phosphor" size={20} />
            {pendingAction === "add"
              ? "Добавляем…"
              : orderId
                ? "Открыть заказ"
                : "Добавить в корзину"}
          </button>
          <button
            type="button"
            onClick={onAsk}
            disabled={!!pendingAction}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <Icon name="chat-circle" variant="phosphor" size={20} />
            {pendingAction === "ask"
              ? "Открываем обсуждение…"
              : "Задать вопрос"}
          </button>
        </div>
        {orderId && (
          <div className="mt-4 rounded-xl border border-border bg-muted px-4 py-3">
            <p role="status" className="text-sm font-medium">
              {orderLabel} · заказ {orderId}
            </p>
            <button
              type="button"
              onClick={onOpenDiscussion}
              className="min-h-11 cursor-pointer text-left text-sm font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Открыть обсуждение заказа
            </button>
          </div>
        )}
        {!orderId && consulting && (
          <button
            type="button"
            onClick={onOpenDiscussion}
            className="mt-3 min-h-11 w-full text-center text-sm font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Вернуться к обсуждению
          </button>
        )}
        {feedback && (
          <p role="status" className="mt-3 text-sm font-medium">
            {feedback}
          </p>
        )}
      </section>
    </article>
  );
}
