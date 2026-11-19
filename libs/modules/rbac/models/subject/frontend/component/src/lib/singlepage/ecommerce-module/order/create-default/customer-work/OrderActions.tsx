"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  ICustomerWorkView,
  TCustomerWorkCommand,
} from "@sps/rbac/models/subject/sdk/model";
import { Button } from "@sps/shared-ui-shadcn";
interface IProps {
  subjectId: string;
  work: ICustomerWorkView;
  language: string;
}

export function OrderActions({ subjectId, work, language }: IProps) {
  const ru = language === "ru";
  const [error, setError] = useState("");
  const retry = useRef<{ payload: string; key: string } | undefined>(undefined);
  const mutation = api.changeCustomerWork();

  async function change(
    operation: "handoff" | "approve-budget" | "confirm-cart",
  ) {
    const maximum = work.requiredMaximum ?? "";
    const priceKey = work.price?.key ?? "";
    const proposalId = work.cartProposal?.id ?? "";
    const payload = JSON.stringify([operation, maximum, priceKey, proposalId]);
    if (retry.current?.payload !== payload) {
      retry.current = { payload, key: crypto.randomUUID() };
    }
    const command = {
      storeId: work.storeId,
      taskId: work.taskId,
      operationKey: retry.current.key,
    };
    const data: TCustomerWorkCommand =
      operation === "approve-budget"
        ? { ...command, operation, maximum, priceKey }
        : operation === "confirm-cart"
          ? { ...command, operation, proposalId }
          : { ...command, operation };
    setError("");
    try {
      await mutation.mutateAsync({ id: subjectId, data });
      retry.current = undefined;
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

  const query = new URLSearchParams();
  if (work.offerId) query.set("offer", work.offerId);
  if (!work.orderId) query.set("consultation", work.taskId);

  return (
    <div className="grid min-w-0 gap-3 text-sm">
      {work.productSlug && (
        <Link
          className="inline-flex min-h-11 items-center underline"
          href={`/${language}/ecommerce/products/${encodeURIComponent(work.productSlug)}?${query}`}
        >
          {ru ? "К предложению" : "Back to offer"}
        </Link>
      )}
      {work.cartProposal && (
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="font-medium">{work.cartProposal.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {ru ? "Количество" : "Quantity"} {work.cartProposal.quantity}
            {" · "}
            {work.cartProposal.amount}{" "}
            {work.cartProposal.currency.toUpperCase()}
          </p>
          {work.cartProposal.orderId ? (
            <p role="status" className="mt-2 text-sm">
              {ru ? "Предложение в корзине." : "Added to your cart."}
            </p>
          ) : (
            <Button
              className="mt-2 min-h-11"
              type="button"
              variant="primary"
              disabled={mutation.isPending}
              onClick={() => void change("confirm-cart")}
            >
              {ru ? "Добавить в корзину" : "Add this choice to my cart"}
            </Button>
          )}
        </div>
      )}
      {work.status !== "closed" && work.customerPays && (
        <form
          className="rounded-lg border border-border bg-card p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!mutation.isPending) void change("approve-budget");
          }}
        >
          <p className="text-sm font-medium">
            {ru ? "Максимум за работу" : "Maximum work charge"}{" "}
            {work.requiredMaximum} {work.fundingCurrency}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {work.approvedMaximum
              ? ru
                ? "Лимит подтверждён."
                : "You approved this limit."
              : ru
                ? "С вашего кошелька спишется стоимость выполненной работы в пределах этой суммы."
                : "You pay for completed work, up to this amount."}
          </p>
          {work.price ? (
            <details className="mt-2">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
                {ru
                  ? "Как рассчитывается цена"
                  : "How the charge is calculated"}
              </summary>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {work.price.rates.map((rate) => (
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
              Boolean(work.approvedMaximum) ||
              !work.requiredMaximum ||
              !work.price
            }
          >
            {ru ? "Подтвердить лимит" : "Approve limit"}
          </Button>
        </form>
      )}
      {work.status !== "closed" && work.assignment === "assistant" && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 justify-self-start"
          disabled={mutation.isPending}
          onClick={() => void change("handoff")}
        >
          {ru ? "Позвать менеджера" : "Ask for a manager"}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
