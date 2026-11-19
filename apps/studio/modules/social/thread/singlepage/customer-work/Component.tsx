"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Component as Icon } from "../../../../shared/icon";
import type { IComponentProps, IWorkResultVersion } from "./interface";

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";
const primaryClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60";

export function Component(props: IComponentProps) {
  const [message, setMessage] = useState("");
  const messageId = useId();
  const resultId = useId();
  const senderLabel = {
    assistant: "Личный ассистент",
    pending: "Ожидаем менеджера",
    manager: "Менеджер магазина",
  }[props.handoff];

  function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (text) {
      props.onSend(text);
      setMessage("");
    }
  }

  return (
    <section className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div className="min-w-0 rounded-2xl border border-border bg-card">
        <header className="flex flex-wrap justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {props.orderId
                ? `Заказ ${props.orderId}`
                : `Консультация ${props.reference}`}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {props.title}
            </h1>
            <p role="status" className="mt-2 text-sm text-muted-foreground">
              {props.operator} · {senderLabel}
            </p>
            {props.resultStatus && (
              <a
                href={`#${resultId}`}
                className="mt-1 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
              >
                К результату
              </a>
            )}
          </div>
          {props.handoff === "assistant" && (
            <button
              type="button"
              onClick={props.onHandoff}
              className={`${actionClass} self-start`}
            >
              <Icon variant="phosphor" name="users" size={20} /> Позвать
              менеджера
            </button>
          )}
        </header>
        <div
          role="log"
          aria-label="Переписка"
          className="min-h-48 space-y-4 p-5 sm:p-6"
        >
          {props.messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Напишите, что хотите узнать о предложении.
            </p>
          )}
          {props.messages.map((entry) =>
            entry.kind === "event" ? (
              <p
                key={entry.id}
                className="break-words text-center text-xs font-medium text-muted-foreground"
              >
                {entry.body}
              </p>
            ) : (
              <article
                key={entry.id}
                className={`max-w-[95%] rounded-2xl px-4 py-3 sm:max-w-[85%] ${entry.kind === "customer" ? "ml-auto border border-border bg-background" : "bg-muted"}`}
              >
                <p className="text-xs font-semibold">{entry.author}</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {entry.body}
                </p>
              </article>
            ),
          )}
        </div>
        <form
          onSubmit={handleSend}
          className="border-t border-border p-4 sm:p-5"
        >
          <label htmlFor={messageId} className="text-sm font-medium">
            Сообщение
          </label>
          <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <textarea
              id={messageId}
              value={message}
              onChange={(event) => setMessage(event.currentTarget.value)}
              placeholder="Напишите в чат"
              rows={2}
              maxLength={2000}
              className="w-full min-w-0 resize-y rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              className={primaryClass}
              disabled={!message.trim()}
            >
              <Icon variant="phosphor" name="paper-plane-tilt" size={20} />{" "}
              Отправить
            </button>
          </div>
        </form>
      </div>
      {props.resultStatus ? (
        <ResultReview {...props} resultId={resultId} />
      ) : (
        props.onAddToCart && (
          <aside className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Предложение</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {props.price.toLocaleString("ru-RU")} ₽
            </p>
            <button
              type="button"
              className={`${actionClass} mt-4 w-full`}
              onClick={props.onAddToCart}
            >
              <Icon variant="phosphor" name="shopping-cart" size={20} />{" "}
              Добавить в корзину
            </button>
          </aside>
        )
      )}
    </section>
  );
}

function ResultReview(props: IComponentProps & { resultId: string }) {
  const group = useId();
  const [selectedId, setSelectedId] = useState<string>();
  const active =
    props.versions?.find(
      ({ id }) => id === (props.acceptedVersionId ?? selectedId),
    ) ?? props.versions?.at(-1);
  const status = props.resultStatus;

  return (
    <aside
      id={props.resultId}
      tabIndex={-1}
      className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <h2 className="text-lg font-semibold">Результат работы</h2>
      {status === "preparing" && (
        <p role="status" className="mt-3 rounded-xl bg-muted p-3 text-sm">
          Готовим превью. Оплата откроется после принятия версии.
        </p>
      )}
      {status === "declined" && (
        <p role="status" className="mt-3 rounded-xl bg-muted p-3 text-sm">
          Вы отказались от результата. Заказ закрыт.
        </p>
      )}
      {status === "review" && !!props.versions?.length && (
        <fieldset className="mt-4 min-w-0">
          <legend className="text-sm font-medium">
            Выберите версию для просмотра
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {props.versions.map(({ id, number }) => (
              <label
                key={id}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm has-checked:border-ring has-checked:bg-muted"
              >
                <input
                  type="radio"
                  name={group}
                  value={id}
                  checked={active?.id === id}
                  onChange={() => setSelectedId(id)}
                  className="accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
                />
                Версия {number}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {active && <VersionPreview version={active} />}
      {status === "review" && active && (
        <>
          <p className="mt-4 text-sm font-medium">
            К оплате после принятия · {props.price.toLocaleString("ru-RU")} ₽
          </p>
          <button
            type="button"
            className={`${primaryClass} mt-3 w-full`}
            onClick={() => props.onAccept(active.id)}
          >
            Принять версию {active.number}
          </button>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {props.onRevision && (
              <button
                type="button"
                className={actionClass}
                onClick={props.onRevision}
              >
                Попросить правку
              </button>
            )}
            <button
              type="button"
              className={actionClass}
              onClick={props.onDecline}
            >
              Отказаться
            </button>
          </div>
        </>
      )}
      {(status === "accepted" || status === "paid") && active && (
        <>
          <p
            role="status"
            className="mt-4 flex items-center gap-2 text-sm font-medium"
          >
            <Icon variant="phosphor" name="check-circle" size={20} />
            {status === "accepted"
              ? `Принята версия ${active.number}`
              : `Оплачена версия ${active.number}`}
          </p>
          <button
            type="button"
            className={`${primaryClass} mt-3 w-full`}
            onClick={props.onCheckout}
          >
            {status === "accepted"
              ? "Перейти к оплате"
              : "Открыть файлы заказа"}
          </button>
        </>
      )}
    </aside>
  );
}

function VersionPreview({ version }: { version: IWorkResultVersion }) {
  return (
    <article className="mt-4 rounded-xl border border-border bg-muted p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon variant="phosphor" name="file-text" size={20} /> Превью · версия{" "}
        {version.number} · {version.pages} стр.
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug">
        {version.title}
      </h3>
      <ul className="mt-3 list-disc space-y-1 pl-4 text-sm leading-relaxed">
        {version.sections.map((section) => (
          <li key={section}>{section}</li>
        ))}
      </ul>
    </article>
  );
}
