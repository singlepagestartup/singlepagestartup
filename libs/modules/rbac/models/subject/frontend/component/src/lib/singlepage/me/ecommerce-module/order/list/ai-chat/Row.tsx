"use client";

import { memo, useCallback } from "react";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import type { IOrderRowProps } from "./interface";

export const Component = memo(function Component(props: IOrderRowProps) {
  const ru = props.language === "ru";
  const onRepeat = useCallback(
    () => props.onRepeat(props.order),
    [props.onRepeat, props.order],
  );

  return (
    <EcommerceModuleOrder
      isServer={false}
      variant="purchase-ai-chat"
      language={props.language}
      data={props.order}
      dataSource="props"
      purchaseDetails={props.order.purchaseDetails}
      actions={
        <button
          type="button"
          onClick={onRepeat}
          disabled={props.disabled}
          aria-expanded={props.confirming}
          className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-medium disabled:opacity-50"
        >
          {props.repeating
            ? ru
              ? "Повторяем…"
              : "Repeating…"
            : ru
              ? "Повторить заказ"
              : "Repeat order"}
        </button>
      }
      footer={
        props.confirming ? (
          <div
            role="group"
            aria-label={`${ru ? "Повторить заказ" : "Repeat order"} ${props.order.receipt || props.order.id}`}
            className="rounded-xl border border-border bg-muted p-4 text-sm"
          >
            <h3 className="font-semibold">
              {ru
                ? "Заменить содержимое корзины?"
                : "Replace your cart contents?"}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {ru
                ? `Текущие товары в корзине этого профиля будут заменены товарами из заказа ${props.order.receipt || props.order.id} в том же количестве. Исходный заказ и счета сохраняются. При оформлении можно выбрать другой способ оплаты.`
                : `The current contents of this profile’s cart will be replaced with the same products and quantities from order ${props.order.receipt || props.order.id}. The original order and invoices are kept. You can choose another payment method at checkout.`}
            </p>
            {props.order.status === "paying" && (
              <p role="note" className="mt-3 font-medium">
                {ru
                  ? "Прежняя оплата не отменяется и всё ещё может завершиться. Повторный заказ оплачивается отдельно."
                  : "The previous payment is not canceled and can still complete. The repeated order is paid separately."}
              </p>
            )}
            {props.error && (
              <p role="alert" className="mt-3 text-destructive">
                {props.error}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={props.onConfirm}
                disabled={props.disabled}
                className="min-h-11 rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {ru ? "Заменить корзину" : "Replace cart"}
              </button>
              <button
                type="button"
                onClick={props.onCancel}
                className="min-h-11 rounded-xl border border-border bg-card px-4 font-medium"
              >
                {ru ? "Отмена" : "Cancel"}
              </button>
            </div>
          </div>
        ) : null
      }
    />
  );
});
