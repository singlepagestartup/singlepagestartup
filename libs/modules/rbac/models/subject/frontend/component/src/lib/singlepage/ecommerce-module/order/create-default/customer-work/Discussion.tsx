"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  ICustomerWorkView,
  TCustomerWorkCommand,
} from "@sps/rbac/models/subject/sdk/model";
import { Button } from "@sps/shared-ui-shadcn";
import { PersonalNotes } from "./PersonalNotes";

interface IProps {
  subjectId: string;
  work: ICustomerWorkView;
  language: string;
  footer?: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  onContinueConsultation?: (id: string) => void;
}

export function Discussion({
  subjectId,
  work,
  language,
  footer,
  onClose,
  closeLabel,
  onContinueConsultation,
}: IProps) {
  const ru = language === "ru";
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const messageId = useId();
  const title = useRef<HTMLHeadingElement>(null);
  const retry = useRef<{ payload: string; key: string } | undefined>(undefined);
  const mutation = api.changeCustomerWork();
  const result = api.customerWork({
    id: subjectId,
    storeId: work.storeId,
    taskId: work.taskId,
  });
  const current = result.data ?? work;

  useEffect(() => {
    title.current?.focus();
  }, []);

  async function change(operation: "message" | "handoff" | "approve-budget") {
    const value = text.trim();
    const maximum = current.requiredMaximum ?? "";
    const priceKey = current.price?.key ?? "";
    const payload =
      operation === "message"
        ? `message:${value}`
        : operation === "approve-budget"
          ? `budget:${maximum}:${priceKey}`
          : "handoff";
    if (retry.current?.payload !== payload) {
      retry.current = { payload, key: crypto.randomUUID() };
    }
    const command = {
      storeId: work.storeId,
      taskId: work.taskId,
      operationKey: retry.current.key,
    };
    const data: TCustomerWorkCommand =
      operation === "message"
        ? { ...command, operation, text: value }
        : operation === "approve-budget"
          ? { ...command, operation, maximum, priceKey }
          : { ...command, operation };
    setError("");
    try {
      await mutation.mutateAsync({ id: subjectId, data });
      retry.current = undefined;
      if (operation === "message") setText("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : ru
            ? "Не удалось сохранить действие."
            : "The change could not be saved.",
      );
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || mutation.isPending) return;
    void change("message");
  }

  const status =
    current.status === "closed"
      ? ru
        ? "Обсуждение закрыто"
        : "Conversation closed"
      : current.assignment === "unassigned"
        ? ru
          ? "Ожидаем менеджера"
          : "Waiting for a manager"
        : (current.operator ?? (ru ? "Магазин" : "Store"));

  if (result.isError) {
    return (
      <p role="alert" className="p-4 text-sm">
        {ru ? "Обсуждение недоступно." : "This conversation is unavailable."}
      </p>
    );
  }

  return (
    <section
      aria-labelledby={`${messageId}-title`}
      className="min-w-0 rounded-2xl border border-border bg-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
        <div className="min-w-0">
          <h2
            ref={title}
            id={`${messageId}-title`}
            tabIndex={-1}
            className="text-lg font-semibold focus:outline-none"
          >
            {work.orderId
              ? ru
                ? "Обсуждение заказа"
                : "Order discussion"
              : ru
                ? "Консультация"
                : "Product question"}
          </h2>
          <p role="status" className="mt-1 text-sm text-muted-foreground">
            {status}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="min-h-11"
        >
          {closeLabel ?? (ru ? "Закрыть обсуждение" : "Close conversation")}
        </Button>
      </div>
      <div
        role="log"
        aria-label={ru ? "Переписка" : "Messages"}
        className="max-h-[28rem] min-h-28 space-y-3 overflow-y-auto p-4 sm:p-5"
      >
        {current.messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {ru
              ? "Напишите, что хотите узнать о предложении."
              : "Ask what you would like to know about this offer."}
          </p>
        )}
        {current.messages.map(({ id, author, kind, body }) => (
          <article
            key={id}
            className={`max-w-[95%] rounded-xl px-4 py-3 sm:max-w-[85%] ${kind === "customer" ? "ml-auto border border-border" : "bg-muted"}`}
          >
            <p className="text-xs font-semibold">
              {kind === "customer" && !ru ? "You" : author}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
              {body}
            </p>
          </article>
        ))}
      </div>
      {current.status !== "closed" && current.customerPays && (
        <form
          className="border-t border-border p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!mutation.isPending) void change("approve-budget");
          }}
        >
          <p className="text-sm font-medium">
            {ru ? "Максимум за работу" : "Maximum work charge"}{" "}
            {current.requiredMaximum} {current.fundingCurrency}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {current.approvedMaximum
              ? ru
                ? "Лимит подтверждён."
                : "You approved this limit."
              : ru
                ? "С вашего кошелька спишется стоимость выполненной работы в пределах этой суммы."
                : "You pay for completed work, up to this amount."}
          </p>
          {current.price ? (
            <details className="mt-2">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
                {ru
                  ? "Как рассчитывается цена"
                  : "How the charge is calculated"}
              </summary>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {current.price.rates.map((rate) => (
                  <li key={rate.capability} className="break-words">
                    <p>
                      {rate.model} · {rate.version}
                    </p>
                    <p>
                      {ru
                        ? "За 1 млн токенов, ввод и вывод"
                        : "Per 1M input and output tokens"}{" "}
                      {rate.inputUsdPerMillion} / {rate.outputUsdPerMillion} USD
                    </p>
                    <p>
                      {ru ? "Расход в USD × коэффициент" : "Usage in USD ×"}{" "}
                      {rate.workMultiplier} / {rate.usdPerSps} USD
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {ru
                ? "Магазин ещё не настроил тариф."
                : "The store has not set a rate yet."}
            </p>
          )}
          <Button
            type="submit"
            variant="outline"
            className="mt-2 min-h-11"
            disabled={
              mutation.isPending ||
              Boolean(current.approvedMaximum) ||
              !current.requiredMaximum ||
              !current.price
            }
          >
            {ru ? "Подтвердить лимит" : "Approve limit"}
          </Button>
        </form>
      )}
      {current.status !== "closed" && (
        <form onSubmit={submit} className="border-t border-border p-4 sm:p-5">
          <label htmlFor={messageId} className="text-sm font-medium">
            {ru ? "Сообщение" : "Message"}
          </label>
          <textarea
            id={messageId}
            value={text}
            onChange={(event) => setText(event.currentTarget.value)}
            rows={2}
            maxLength={8000}
            className="mt-2 block w-full min-w-0 rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="primary"
              className="min-h-11"
              disabled={
                !text.trim() ||
                mutation.isPending ||
                (current.customerPays &&
                  !current.approvedMaximum &&
                  current.assignment === "assistant")
              }
            >
              {ru ? "Отправить" : "Send"}
            </Button>
            {current.assignment === "assistant" && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={mutation.isPending}
                onClick={() => void change("handoff")}
              >
                {ru ? "Позвать менеджера" : "Ask for a manager"}
              </Button>
            )}
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="px-4 pb-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {current.consultationTaskId && onContinueConsultation && (
        <div className="border-t border-border px-4 py-2 sm:px-5">
          <button
            type="button"
            className="min-h-11 text-sm underline underline-offset-4"
            onClick={() => onContinueConsultation(current.consultationTaskId!)}
          >
            {ru
              ? "Открыть исходную консультацию"
              : "Open the original question"}
          </button>
        </div>
      )}
      {current.memory && (
        <PersonalNotes
          subjectId={subjectId}
          work={current}
          memory={current.memory}
          language={language}
        />
      )}
      {footer}
    </section>
  );
}
