"use client";

import { REGISTRATION_GRANT_VARIANT } from "@sps/shared-utils";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { Icon } from "@sps/ui-adapter";
import type { IQuantityProps } from "./interface";

export function Quantity(props: IQuantityProps) {
  const ru = props.language === "ru";
  const update = api.ecommerceModuleOrderUpdate({});
  const queries = useQueryClient();
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const pending = update.isPending || refreshing;
  const locked = props.line.variant === REGISTRATION_GRANT_VARIANT;
  const change = useCallback(
    async (quantity: number) => {
      if (
        pending ||
        locked ||
        quantity < 1 ||
        quantity > props.maxLineQuantity ||
        (props.singleUnitPerOrder && quantity !== 1)
      ) {
        return;
      }
      setError("");
      setRefreshing(true);
      props.onPendingChange?.(props.line.id, true);
      try {
        const lines = [{ id: props.line.id, quantity }];
        if (props.singleUnitPerOrder) {
          for (const line of props.attachedLines ?? []) {
            if (line.parentLineId === props.line.id && line.quantity > 1) {
              lines.push({ id: line.id, quantity: 1 });
            }
          }
        }
        await update.mutateAsync({
          id: props.subjectId,
          orderId: props.orderId,
          data: { ordersToProducts: lines },
        });
        await queries.invalidateQueries({
          queryKey: [`${route}/${props.subjectId}/ecommerce-module/orders`],
        });
      } catch {
        setError(
          ru
            ? "Не удалось изменить количество. Попробуйте ещё раз."
            : "Could not change the quantity. Please try again.",
        );
      } finally {
        setRefreshing(false);
        props.onPendingChange?.(props.line.id, false);
      }
    },
    [
      update.mutateAsync,
      pending,
      locked,
      queries,
      props.subjectId,
      props.orderId,
      props.line.id,
      props.maxLineQuantity,
      props.singleUnitPerOrder,
      props.attachedLines,
      props.onPendingChange,
      ru,
    ],
  );
  const decrease = useCallback(() => {
    void change(Math.min(props.line.quantity - 1, props.maxLineQuantity));
  }, [change, props.line.quantity, props.maxLineQuantity]);
  const increase = useCallback(() => {
    void change(props.line.quantity + 1);
  }, [change, props.line.quantity]);
  const setOne = useCallback(() => {
    void change(1);
  }, [change]);
  if (props.singleUnitPerOrder) {
    const hasExcessServiceQuantity = props.attachedLines?.some(
      (line) => line.parentLineId === props.line.id && line.quantity > 1,
    );
    return (
      <div className="space-y-2 text-sm">
        {props.line.quantity === 1 ? (
          <p>{ru ? "Количество — 1" : "Quantity · 1"}</p>
        ) : (
          <>
            <p role="alert" className="text-destructive">
              {ru
                ? `В корзине — ${props.line.quantity} шт. Для этого товара можно заказать только одну единицу.`
                : `The cart contains ${props.line.quantity} units of this item. The limit is one per order.`}
            </p>
            {!props.repairUnavailable && hasExcessServiceQuantity && (
              <p className="text-muted-foreground">
                {ru
                  ? "Количество связанных услуг также уменьшится до одной единицы."
                  : "This also reduces any linked services above one unit to one."}
              </p>
            )}
            {!props.repairUnavailable && props.requiresNewResult && (
              <p className="text-muted-foreground">
                {ru
                  ? "Перед оплатой исполнитель должен прислать новый результат, а вы — принять его."
                  : "The seller must submit a new result for you to accept before payment."}
              </p>
            )}
            {!props.repairUnavailable && (
              <button
                type="button"
                disabled={locked || pending}
                onClick={setOne}
                className="min-h-11 rounded-xl border border-border bg-card px-4 py-2 font-medium hover:bg-muted disabled:opacity-50"
              >
                {ru ? "Установить количество 1" : "Set quantity to 1"}
              </button>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
  return (
    <div>
      <div
        role="group"
        aria-label={`${ru ? "Количество" : "Quantity"}: ${props.line.product?.title?.[props.language] || props.line.product?.slug || ""}`}
        className="inline-flex items-center gap-0.5 rounded-xl bg-muted p-1"
      >
        <button
          type="button"
          aria-label={ru ? "Уменьшить количество" : "Decrease quantity"}
          disabled={locked || pending || props.line.quantity <= 1}
          onClick={decrease}
          className="grid size-9 place-items-center rounded-lg bg-card text-foreground hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:bg-transparent disabled:opacity-40"
        >
          <Icon name="minus" />
        </button>
        <output
          aria-live="polite"
          className="min-w-5 text-center text-sm font-semibold tabular-nums"
        >
          {props.line.quantity}
        </output>
        <button
          type="button"
          aria-label={ru ? "Увеличить количество" : "Increase quantity"}
          disabled={
            locked || pending || props.line.quantity >= props.maxLineQuantity
          }
          onClick={increase}
          className="grid size-9 place-items-center rounded-lg bg-card text-foreground hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:bg-transparent disabled:opacity-40"
        >
          <Icon name="plus" />
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
