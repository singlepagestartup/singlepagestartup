"use client";
import type { IComponentProps, ISubjectOrderListProps } from "./interface";
export type { ISubjectOrderListProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../shared/icon";

import { memo } from "react";
import Markdown from "markdown-to-jsx";

import type { IAIChatServicePageContent } from "../../../../../../../../website-builder/widget/singlepage/content/ai-chat/content";
import { useAIChatAccount } from "../../../../account/Account";
import orders from "./orders.json";

interface IOrder {
  id: string;
  date: string;
  tokens: number;
  total: string;
  status: string;
}
const OrderItem = memo(function OrderItem({
  data,
  showTokens,
}: {
  data: IOrder;
  showTokens: boolean;
}) {
  const receipt = `Заказ ${data.id}\nДата: ${data.date}\nСтатус: ${data.status === "Paid" ? "Оплачено" : data.status}\n${showTokens ? `Токены: ${data.tokens}\n` : ""}Итого: ${data.total}\nЧек для примера Studio`;
  return (
    <li className="grid min-w-0 gap-3 border-t border-border py-4 @[640px]:grid-cols-[minmax(0,1fr)_auto] @[640px]:items-center">
      <div>
        <p className="text-sm font-semibold">
          {showTokens
            ? `${data.tokens.toLocaleString("ru-RU")} токенов`
            : "Покупка услуги"}{" "}
          <span className="ml-2 inline-flex rounded-full bg-primary/25 px-2 py-1 text-xs font-medium">
            {data.status === "Paid" ? "Оплачено" : data.status}
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
      </div>
    </li>
  );
});
export function Component({
  variant = "me-ecommerce-module-order-list-ai-chat",
  showTokens = false,
  copy,
  empty = false,
}: IComponentProps = {}) {
  const account = useAIChatAccount();
  const purchases = copy?.sections.purchases;
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
      {empty ? (
        <p role="status" className="mt-5 rounded-xl bg-muted p-4 text-sm">
          {copy?.labels["purchases-empty"] ?? "Покупок пока нет."}
        </p>
      ) : (
        <ul aria-label="Покупки" className="mt-5">
          {orders.map((data) => (
            <OrderItem key={data.id} data={data} showTokens={showTokens} />
          ))}
        </ul>
      )}
    </section>
  );
}
