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

  async function change(operation: "handoff" | "confirm-cart") {
    const proposalId = work.cartProposal?.id ?? "";
    const payload = JSON.stringify([operation, proposalId]);
    if (retry.current?.payload !== payload) {
      retry.current = { payload, key: crypto.randomUUID() };
    }
    const command = {
      storeId: work.storeId,
      taskId: work.taskId,
      operationKey: retry.current.key,
    };
    const data: TCustomerWorkCommand =
      operation === "confirm-cart"
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
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
