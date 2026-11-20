"use client";

import { useId, useState } from "react";
import { Component as SocialChat } from "../../../widget/singlepage/chat-overview-default";
import { Component as SharedIcon } from "../../../../shared/icon";
import type { IComponentProps, IWorkResultVersion } from "./interface";

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";
const primaryClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60";

export function Component(props: IComponentProps) {
  const resultId = useId();
  const participant =
    props.handoff === "pending" ? "Ожидаем менеджера" : props.operator;
  const reference = props.orderId
    ? `Заказ ${props.orderId}`
    : `Консультация ${props.reference}`;

  return (
    <SocialChat
      key={props.reference}
      chat={{
        id: props.reference,
        name: props.title,
        description: reference,
        icon: "general",
        unread: 0,
        memberIds: ["customer", "operator"],
      }}
      conversation={{
        thread: {
          id: props.reference,
          title: props.title,
          description: `${reference} · ${participant}`,
          excerpt: "",
          date: "",
          unread: 0,
        },
        messages: props.messages.map((message) => ({
          id: message.id,
          author: message.author || "Магазин",
          role: "",
          time: "",
          side: message.kind === "customer" ? "outgoing" : "incoming",
          body: message.body,
          attachments: message.attachments,
          reactions: [],
        })),
        onSend: props.onSend,
        actions: props.handoff === "assistant" && (
          <button
            type="button"
            className={actionClass}
            onClick={props.onHandoff}
          >
            Позвать менеджера
          </button>
        ),
        timelineFooter: props.resultStatus ? (
          <>
            <ResultReview {...props} resultId={resultId} />
            {props.delivery}
          </>
        ) : (
          props.onAddToCart && (
            <button
              type="button"
              className={actionClass}
              onClick={props.onAddToCart}
            >
              Добавить в корзину · {props.price.toLocaleString("ru-RU")} ₽
            </button>
          )
        ),
      }}
    />
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
            <SharedIcon variant="phosphor" name="check-circle" size={20} />
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
        <SharedIcon variant="phosphor" name="file-text" size={20} /> Превью ·
        версия {version.number} · {version.pages} стр.
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
