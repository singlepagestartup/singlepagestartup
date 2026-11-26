"use client";

import { type ReactNode, useRef, useState } from "react";
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
  productTitle?: string;
  productSlot?: ReactNode;
  managerOnly?: boolean;
}

export function OrderActions({
  subjectId,
  work,
  language,
  productTitle,
  productSlot,
  managerOnly,
}: IProps) {
  const ru = language === "ru";
  const [error, setError] = useState("");
  const retry = useRef<{ payload: string; key: string } | undefined>(undefined);
  const mutation = api.changeCustomerWork();

  async function change(
    operation: "handoff" | "approve-budget" | "confirm-cart",
  ) {
    const maximum = work.requiredMaximum;
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

  if (managerOnly) {
    return (
      <div className="grid min-w-0 gap-2 justify-items-start">
        {work.canRequestManager && (
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

  const query = new URLSearchParams();
  if (work.offerId) query.set("offer", work.offerId);
  if (!work.orderId) query.set("consultation", work.taskId);
  const proposal = work.cartProposal;
  const replacesConfirmedProposal =
    productSlot && work.orderSummary && proposal?.orderId === work.orderId;

  return (
    <div className="grid min-w-0 gap-3 text-sm">
      {productSlot ??
        (work.productSlug && (
          <Link
            className="inline-flex min-h-11 items-center underline"
            href={`/${language}/ecommerce/products/${encodeURIComponent(work.productSlug)}?${query}`}
          >
            {productTitle || (ru ? "Открыть предложение" : "View offer")}
          </Link>
        ))}
      {proposal && !replacesConfirmedProposal && (
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="font-medium">{proposal.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {ru ? "Количество" : "Quantity"} {proposal.quantity}
            {" · "}
            {proposal.amount} {proposal.currency.toUpperCase()}
          </p>
          {proposal.orderId ? (
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
            {work.requiredMaximum
              ? `${ru ? "Максимум за работу" : "Maximum work charge"} ${work.requiredMaximum} ${work.fundingCurrency ?? ""}`
              : ru
                ? "Тариф этапа"
                : "Stage rate"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {work.rateApproved || work.approvedMaximum
              ? ru
                ? "Тариф подтверждён."
                : "Rate approved."
              : work.requiredMaximum
                ? ru
                  ? "С вашего кошелька спишется стоимость выполненной работы в пределах этой суммы."
                  : "You pay for completed work, up to this amount."
                : ru
                  ? "Стоимость каждого обращения списывается по этому тарифу с вашего кошелька."
                  : "Your wallet is charged at this rate for each request."}
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
                  <li
                    key={`${rate.capability}:${rate.model}`}
                    className="break-words"
                  >
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
                      {rate.topupTokens && rate.topupUsd ? (
                        <>
                          {ru ? "Курс пополнения" : "Top-up rate"} ·{" "}
                          {rate.topupUsd} USD = {rate.topupTokens} Token
                        </>
                      ) : (
                        <>1 Token = {rate.usdPerSps} USD</>
                      )}
                      {" · "}
                      {ru ? "Коэффициент" : "Multiplier"} ×{rate.workMultiplier}
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
              Boolean(work.rateApproved || work.approvedMaximum) ||
              !work.price
            }
          >
            {work.requiredMaximum
              ? ru
                ? "Подтвердить лимит"
                : "Approve limit"
              : ru
                ? "Подтвердить тариф"
                : "Approve rate"}
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
