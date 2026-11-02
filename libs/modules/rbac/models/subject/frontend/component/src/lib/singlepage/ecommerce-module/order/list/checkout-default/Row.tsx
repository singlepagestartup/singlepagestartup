"use client";
import { memo, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG } from "@sps/shared-utils";
import { Icon } from "@sps/ui-adapter";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import { Component as DeleteDefault } from "../../delete-default";
import type { IRowProps, IQuantityProps } from "./interface";

function Quantity(props: IQuantityProps) {
  const update = api.ecommerceModuleOrderUpdate({});
  const queries = useQueryClient();
  const [error, setError] = useState("");
  const change = useCallback(
    async (quantity: number) => {
      if (update.isPending || quantity < 1) return;
      setError("");
      try {
        await update.mutateAsync({
          id: props.subjectId,
          orderId: props.orderId,
          data: { ordersToProducts: [{ id: props.line.id, quantity }] },
        });
        await queries.invalidateQueries({
          queryKey: [`${route}/${props.subjectId}/ecommerce-module/orders`],
        });
      } catch {
        setError("Не удалось изменить количество. Попробуйте ещё раз.");
      }
    },
    [
      update.mutateAsync,
      update.isPending,
      queries,
      props.subjectId,
      props.orderId,
      props.line.id,
    ],
  );
  const decrease = useCallback(() => {
    void change(props.line.quantity - 1);
  }, [change, props.line.quantity]);
  const increase = useCallback(() => {
    void change(props.line.quantity + 1);
  }, [change, props.line.quantity]);
  const locked =
    props.line.product?.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG;
  return (
    <div>
      <div
        role="group"
        aria-label={`Количество: ${props.line.product?.title?.[props.language] || props.line.product?.slug || "товар"}`}
        className="inline-flex items-center gap-1 rounded-xl bg-muted p-1"
      >
        <button
          type="button"
          aria-label="Уменьшить количество"
          disabled={locked || update.isPending || props.line.quantity <= 1}
          onClick={decrease}
          className="grid size-11 place-items-center rounded-lg hover:bg-card disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-foreground"
        >
          <Icon name="minus" size={20} />
        </button>
        <output
          aria-live="polite"
          className="min-w-7 text-center text-sm font-semibold"
        >
          {props.line.quantity}
        </output>
        <button
          type="button"
          aria-label="Увеличить количество"
          disabled={locked || update.isPending}
          onClick={increase}
          className="grid size-11 place-items-center rounded-lg hover:bg-card disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-foreground"
        >
          <Icon name="plus" size={20} />
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
export const Component = memo(function Row(props: IRowProps) {
  return (
    <li className="min-w-0 space-y-4 py-5 first:pt-0 last:pb-0">
      {props.ecommerceModuleOrder.cartDetails?.lines.map((line) =>
        line.product ? (
          <EcommerceModuleProduct
            key={line.id}
            isServer={false}
            variant="cart-default"
            dataSource="props"
            data={line.product}
            language={props.language}
          >
            <Quantity
              subjectId={props.subject.id}
              orderId={props.ecommerceModuleOrder.id}
              line={line}
              language={props.language}
            />
          </EcommerceModuleProduct>
        ) : (
          <p key={line.id}>Товар недоступен</p>
        ),
      )}
      <div className="hidden">
        <EcommerceModuleOrder
          isServer={false}
          variant="form-field-default"
          dataSource="props"
          data={props.ecommerceModuleOrder}
          formFieldName={`ecommerceModule.orders.${props.index}.id`}
          entityFieldName="id"
          form={props.form}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          {props.ecommerceModuleOrder.cartDetails?.totals.map((total) => (
            <p
              key={total.billingModuleCurrency.id}
              className="text-sm font-semibold"
            >
              {new Intl.NumberFormat("ru-RU", {
                maximumFractionDigits: 2,
              }).format(total.total)}{" "}
              {total.billingModuleCurrency.symbol}
            </p>
          ))}
        </div>
        <DeleteDefault
          isServer={false}
          variant="ecommerce-module-order-delete-default"
          data={props.subject}
          ecommerceModuleOrder={props.ecommerceModuleOrder}
          language="ru"
          className="w-auto px-3"
        />
      </div>
    </li>
  );
});
