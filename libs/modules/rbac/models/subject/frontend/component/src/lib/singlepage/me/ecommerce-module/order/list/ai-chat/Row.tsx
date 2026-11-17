"use client";

import { memo, useCallback } from "react";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import type { IOrderRowProps } from "./interface";

export const Component = memo(function Component(props: IOrderRowProps) {
  const ru = props.language === "ru";
  const nextPeriod = props.order.purchaseDetails?.canPayNextPeriod === true;
  const canRepeat =
    nextPeriod || props.order.purchaseDetails?.canRepeatPayment === true;
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
        canRepeat ? (
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
              : nextPeriod
                ? ru
                  ? "Следующая поставка"
                  : "Next delivery"
                : ru
                  ? "Повторить заказ"
                  : "Repeat order"}
          </button>
        ) : null
      }
      footer={
        props.confirming && canRepeat ? (
          <div
            role="group"
            aria-label={`${ru ? "Повторить заказ" : "Repeat order"} ${props.order.receipt || props.order.id}`}
            className="rounded-xl border border-border bg-muted p-4 text-sm"
          >
            <h3 className="font-semibold">
              {nextPeriod
                ? ru
                  ? "Подготовить следующую поставку?"
                  : "Prepare the next delivery?"
                : ru
                  ? "Заменить содержимое корзины?"
                  : "Replace your cart contents?"}
            </h3>
            <p className="mt-2 text-muted-foreground">
              {nextPeriod
                ? ru
                  ? "В корзину добавится следующая поставка с повторяющимися услугами. Услуги первой поставки не повторяются. Проверьте наличие и новую цену перед оплатой. Остальные товары в корзине сохранятся."
                  : "The next delivery and its recurring services will be added to your cart. First-delivery services are omitted. Check availability and the current price before paying. Your other cart items are kept."
                : ru
                  ? `Текущие товары в корзине будут заменены товарами из заказа ${props.order.receipt || props.order.id} в том же количестве. Исходный заказ и счета сохраняются. При оформлении можно выбрать другой способ оплаты.`
                  : `The current contents of your cart will be replaced with the same products and quantities from order ${props.order.receipt || props.order.id}. The original order and invoices are kept. You can choose another payment method at checkout.`}
            </p>
            {!nextPeriod ? (
              <p role="note" className="mt-3 font-medium">
                {ru
                  ? "Если прежний платёж ещё обрабатывается банком, он тоже может пройти. Новый заказ оплачивается отдельно."
                  : "If your bank is still processing the previous payment, it may also complete. The new order is paid separately."}
              </p>
            ) : null}
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
                {nextPeriod
                  ? ru
                    ? "Добавить поставку"
                    : "Add delivery"
                  : ru
                    ? "Заменить корзину"
                    : "Replace cart"}
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
