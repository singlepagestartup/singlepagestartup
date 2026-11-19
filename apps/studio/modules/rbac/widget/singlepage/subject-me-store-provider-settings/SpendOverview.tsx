"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Component as Icon } from "../../../../shared/icon";
import type { IComponentProps, IProviderAttempt } from "./interface";

const budgetStatuses = {
  ready: "Готово к вызову",
  "waiting-budget": "Ожидает бюджета",
  "waiting-provider": "Подключение недоступно",
  reconciling: "Ожидает сверки",
} as const;

const attemptStatuses = {
  reserved: "Резерв открыт",
  reconciling: "На сверке",
  settled: "Расход подтверждён",
  denied: "Отказ провайдера",
} as const;

const input =
  "min-h-11 min-w-0 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const secondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60";

export function SpendOverview({
  budget,
  attempts,
  assistant,
  onSaveLimit,
  onReserve,
  onReconcile,
}: Pick<
  IComponentProps,
  | "budget"
  | "attempts"
  | "assistant"
  | "onSaveLimit"
  | "onReserve"
  | "onReconcile"
>) {
  const [amount, setAmount] = useState(String(budget.limit));
  const headingId = useId();
  const available = Math.max(
    0,
    Math.min(
      budget.limit - budget.spent - budget.reserved,
      budget.wallet - budget.reserved,
    ),
  );
  const attemptOpen = attempts.some(
    ({ state }) => state === "reserved" || state === "reconciling",
  );
  const minimum = budget.spent + budget.reserved;
  const minimumHintId = useId();

  function updateLimit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const limit = Number(amount);
    if (Number.isSafeInteger(limit) && limit >= minimum) onSaveLimit(limit);
  }

  return (
    <div className="grid min-w-0 gap-5">
      <section
        aria-labelledby={headingId}
        className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              id={headingId}
              className="flex items-center gap-2 text-xl font-semibold"
            >
              <Icon variant="phosphor" name="wallet" size={20} /> Бюджет задачи
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {budget.payer} · на кошельке {budget.wallet} SPS
            </p>
          </div>
          <p
            role="status"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
          >
            <Icon
              variant="phosphor"
              name={
                budget.status === "ready"
                  ? "check-circle"
                  : budget.status === "reconciling"
                    ? "clock"
                    : "warning"
              }
              size={20}
            />
            {budgetStatuses[budget.status]}
          </p>
        </header>
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          {[
            { key: "Лимит", value: budget.limit },
            { key: "В резерве", value: budget.reserved },
            { key: "Потрачено", value: budget.spent },
            { key: "Доступно", value: available },
          ].map(({ key, value }) => (
            <div key={key} className="min-w-0 bg-background p-3">
              <dt className="text-xs text-muted-foreground">{key}</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {value} <span className="text-xs font-medium">SPS</span>
              </dd>
            </div>
          ))}
        </dl>
        <form className="mt-4" onSubmit={updateLimit}>
          <label
            className="block text-sm font-medium"
            htmlFor={`${headingId}-limit`}
          >
            Лимит задачи, SPS
          </label>
          <div className="mt-1 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              id={`${headingId}-limit`}
              type="number"
              min={minimum}
              step={1}
              required
              value={amount}
              aria-describedby={minimumHintId}
              onChange={(event) => setAmount(event.currentTarget.value)}
              className={input}
            />
            <button type="submit" className={secondary}>
              Обновить лимит
            </button>
          </div>
          <p id={minimumHintId} className="mt-2 text-xs text-muted-foreground">
            Минимум {minimum} SPS с учётом расхода и открытого резерва.
          </p>
        </form>
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">Подготовить превью</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {budget.status === "waiting-provider"
              ? "Выберите активное подключение или обновите ключ."
              : budget.status === "waiting-budget"
                ? `Для новой попытки требуется ${budget.required} SPS. Доступно ${available} SPS.`
                : budget.status === "reconciling"
                  ? "Открытый резерв сохраняется до сверки ответа провайдера."
                  : `Верхняя сумма попытки · ${budget.required} SPS.`}
          </p>
          <button
            type="button"
            onClick={onReserve}
            disabled={budget.status === "waiting-provider" || attemptOpen}
            className={`${primary} mt-3`}
          >
            <Icon variant="phosphor" name="play" size={20} /> Запустить попытку
          </button>
        </div>
      </section>

      <section
        aria-label="Вызовы и сверка"
        className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
      >
        <h2 className="text-xl font-semibold">Вызовы и сверка</h2>
        {attempts.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            У задачи пока нет внешних вызовов.
          </p>
        )}
        <ul className="mt-3 space-y-2">
          {attempts.map((attempt) => (
            <li
              key={attempt.id}
              className="min-w-0 rounded-xl border border-border bg-background"
            >
              <details className="group">
                <summary className="flex min-h-14 cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="flex min-w-0 items-center gap-2 font-semibold">
                    <Icon
                      variant="phosphor"
                      name="caret-down"
                      size={20}
                      className="shrink-0 transition-transform group-open:rotate-180"
                    />
                    <span>
                      {attempt.provider} · {attempt.id}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {attemptStatuses[attempt.state]}
                  </span>
                </summary>
                <AttemptDetails
                  attempt={attempt}
                  payer={budget.payer}
                  assistant={assistant.name}
                />
              </details>
              {(attempt.state === "reserved" ||
                attempt.state === "reconciling") && (
                <div className="px-3 pb-3">
                  <button
                    type="button"
                    onClick={() => onReconcile(attempt.id)}
                    className={secondary}
                  >
                    <Icon variant="phosphor" name="arrow-right" size={20} />{" "}
                    Сверить вызов
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AttemptDetails({
  attempt,
  payer,
  assistant,
}: {
  attempt: IProviderAttempt;
  payer: string;
  assistant: string;
}) {
  const internalSpend =
    attempt.spend ?? (attempt.state === "denied" ? 0 : undefined);

  return (
    <div className="border-t border-border p-3 text-sm">
      <dl className="grid gap-3 break-words sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Исполнитель</dt>
          <dd>{attempt.subjectName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Подключение</dt>
          <dd>
            {attempt.connectionLabel}, версия {attempt.connectionVersion}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Внешний аккаунт</dt>
          <dd>{attempt.externalAccount}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Модель и цель</dt>
          <dd>
            {attempt.model} · {attempt.purpose}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Резерв попытки</dt>
          <dd>{attempt.reserve} SPS</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Внутренний расход</dt>
          <dd>
            {internalSpend === undefined
              ? "Ожидает сверки"
              : `${internalSpend} SPS`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Внешняя стоимость</dt>
          <dd>
            {attempt.externalCost
              ? `${attempt.externalCost} USD${attempt.estimated ? " · расчётная" : ""}`
              : "Нет суммы"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            {attempt.provider === "OpenRouter" ? "ID генерации" : "ID ответа"}
          </dt>
          <dd className="break-all">
            {attempt.externalId ?? "Ожидает ответа"}
          </dd>
        </div>
        {attempt.units && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Токены модели</dt>
            <dd>
              {attempt.units.input} на входе · {attempt.units.output} на выходе
            </dd>
          </div>
        )}
      </dl>
      {attempt.receipt && (
        <section className="mt-4 rounded-lg bg-muted p-3">
          <h3 className="text-sm font-semibold">
            Квитанция {attempt.receipt.id}
          </h3>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed">
            <li>
              {payer} → {assistant} · {attempt.receipt.work} SPS
            </li>
            <li>
              {assistant} → {attempt.subjectName} · {attempt.receipt.delegated}{" "}
              SPS
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
