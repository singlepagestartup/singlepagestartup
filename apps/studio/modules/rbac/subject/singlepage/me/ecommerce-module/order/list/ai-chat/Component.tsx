"use client";
import type { IComponentProps, IOrder, IRepeatState } from "./interface";
export type { ISubjectOrderListProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../shared/icon";

import { memo, useCallback, useState } from "react";
import Markdown from "markdown-to-jsx";

import { useAIChatAccount } from "../../../../account/Account";
import orders from "./orders.json";

const OrderItem = memo(function OrderItem({
  data,
  showTokens,
  repeatState,
  repeatDisabled,
  onRepeat,
  onConfirm,
  onCancel,
}: {
  data: IOrder;
  showTokens: boolean;
  repeatState: IRepeatState;
  repeatDisabled: boolean;
  onRepeat: (id: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const status =
    data.status === "Paying"
      ? "Ожидает оплаты"
      : data.status === "Failed"
        ? "Ошибка оплаты"
        : data.status === "Canceled"
          ? "Отменён"
          : "Оплачено";
  const receipt = `Заказ ${data.id}\nДата: ${data.date}\nСтатус: ${status}\n${showTokens ? `Токены: ${data.tokens}\n` : ""}Итого: ${data.total}\nЧек для примера Studio`;
  return (
    <li className="grid min-w-0 gap-3 border-t border-border py-4 @[640px]:grid-cols-[minmax(0,1fr)_auto] @[640px]:items-center">
      <div>
        <p className="text-sm font-semibold">
          {showTokens
            ? `${data.tokens.toLocaleString("ru-RU")} токенов`
            : "Покупка услуги"}{" "}
          <span className="ml-2 inline-flex rounded-full bg-primary/25 px-2 py-1 text-xs font-medium">
            {status}
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {data.id} · {data.date}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-semibold">{data.total}</span>
        <a
          download={`${data.id}-receipt.txt`}
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(receipt)}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium"
        >
          <SharedIcon variant="phosphor" name="file-text" />
          Чек
        </a>
        <button
          type="button"
          onClick={() => onRepeat(data.id)}
          disabled={repeatDisabled}
          className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-medium disabled:opacity-50"
        >
          {repeatState === "pending" ? "Повторяем…" : "Повторить заказ"}
        </button>
      </div>
      {(repeatState === "confirmation" || repeatState === "error") && (
        <div
          role="group"
          aria-label={`Повторить заказ ${data.id}`}
          className="rounded-xl border border-border bg-muted p-4 text-sm @[640px]:col-span-2"
        >
          <h3 className="font-semibold">Заменить содержимое корзины?</h3>
          <p className="mt-2 text-muted-foreground">
            Текущие товары в корзине этого профиля будут заменены товарами из
            заказа {data.id} в том же количестве. Исходный заказ и счета
            сохраняются. При оформлении можно выбрать другой способ оплаты.
          </p>
          {data.status === "Paying" && (
            <p role="note" className="mt-3 font-medium">
              Прежняя оплата не отменяется и всё ещё может завершиться.
              Повторный заказ оплачивается отдельно.
            </p>
          )}
          {repeatState === "error" && (
            <p role="alert" className="mt-3 text-destructive">
              Не удалось повторить заказ. Попробуйте ещё раз.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onConfirm}
              className="min-h-11 rounded-xl bg-primary px-4 font-semibold text-primary-foreground"
            >
              Заменить корзину
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="min-h-11 rounded-xl border border-border bg-card px-4 font-medium"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </li>
  );
});
export function Component({
  variant = "me-ecommerce-module-order-list-ai-chat",
  showTokens = false,
  copy,
  empty = false,
  repeatState = "idle",
  repeatOutcome = "success",
}: IComponentProps = {}) {
  const account = useAIChatAccount();
  const purchases = copy?.sections.purchases;
  const [state, setState] = useState<IRepeatState>(repeatState);
  const [repeatingId, setRepeatingId] = useState<string | null>(
    repeatState === "idle" ? null : orders[0].id,
  );
  const [showCart, setShowCart] = useState(false);
  const onRepeat = useCallback((id: string) => {
    setRepeatingId(id);
    setState("confirmation");
    setShowCart(false);
  }, []);
  const onCancel = useCallback(() => {
    setRepeatingId(null);
    setState("idle");
  }, []);
  const onConfirm = useCallback(async () => {
    setState("pending");
    await new Promise((resolve) => setTimeout(resolve, 500));
    setState(repeatOutcome);
  }, [repeatOutcome]);
  return (
    <section
      className="@container min-w-0 rounded-2xl border border-border bg-card p-5 @[640px]:p-6"
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-xl font-semibold">
            <span className="grid size-10 place-items-center rounded-xl bg-muted">
              <SharedIcon variant="phosphor" name="wallet" />
            </span>
            {showTokens ? (purchases?.title ?? "Токены и покупки") : "Покупки"}
          </h2>
          <div className="mt-3 text-sm leading-6 text-muted-foreground [&_a]:underline">
            {showTokens && purchases ? (
              purchases.paragraphs.map((text, index) => (
                <Markdown key={index} options={{ disableParsingRawHTML: true }}>
                  {text}
                </Markdown>
              ))
            ) : (
              <p>
                Посмотрите покупки и чеки.
                {showTokens && " Оплаченные пакеты токенов указаны ниже."}
              </p>
            )}
          </div>
        </div>
        {showTokens && (
          <a
            href={
              copy?.labels["tokens-href"] ?? "/ai-chat/rbac/subjects/tokens"
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 text-sm font-semibold"
          >
            <SharedIcon variant="phosphor" name="plus" />
            {copy?.labels["buy-tokens"] ?? "Купить токены"}
          </a>
        )}
      </header>
      {showTokens && (
        <p className="my-5 text-sm text-muted-foreground">
          {account.balance
            ? `${(account.balance.free + account.balance.purchased).toLocaleString("ru-RU")} доступных токенов`
            : "Баланс недоступен"}
        </p>
      )}
      {state === "success" && (
        <div role="status" className="mt-5 rounded-xl bg-muted p-4 text-sm">
          <p>
            Заказ добавлен в корзину этого профиля. Можно выбрать способ оплаты.
          </p>
          <button
            type="button"
            onClick={() => setShowCart(true)}
            className="mt-3 min-h-11 rounded-xl bg-primary px-4 font-semibold text-primary-foreground"
          >
            Открыть корзину
          </button>
        </div>
      )}
      {showCart && (
        <section
          aria-label="Корзина"
          className="mt-5 rounded-xl border border-border p-4"
        >
          <h3 className="font-semibold">Корзина</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Товары и количество из заказа {repeatingId}. Выберите способ оплаты
            при оформлении.
          </p>
          <a
            href="/ecommerce/orders/checkout"
            className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Оформить заказ
          </a>
        </section>
      )}
      {empty ? (
        <p role="status" className="mt-5 rounded-xl bg-muted p-4 text-sm">
          {copy?.labels["purchases-empty"] ?? "Покупок пока нет."}
        </p>
      ) : (
        <ul aria-label="Покупки" className="mt-5">
          {orders.map((data) => (
            <OrderItem
              key={data.id}
              data={data}
              showTokens={showTokens}
              repeatState={repeatingId === data.id ? state : "idle"}
              repeatDisabled={state === "pending"}
              onRepeat={onRepeat}
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
