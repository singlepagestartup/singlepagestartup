"use client";
import { REGISTRATION_GRANT_VARIANT } from "@sps/shared-utils";
import { memo, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { Icon, Select } from "@sps/ui-adapter";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IRowProps, IQuantityProps, ICurrencyProps } from "./interface";
import { Selection } from "./Selection";

function Currency(props: ICurrencyProps) {
  const update = api.ecommerceModuleOrderUpdate({});
  const queries = useQueryClient();
  const [error, setError] = useState("");
  const details = props.ecommerceModuleOrder.cartDetails;
  const available = details?.availableCurrencyIds ?? [];
  const options = [
    ...new Map(
      details?.totals
        .filter((total) => available.includes(total.billingModuleCurrency.id))
        .map((total) => [
          total.billingModuleCurrency.id,
          total.billingModuleCurrency,
        ]),
    ).values(),
  ];
  const selectedId = details?.billingModuleCurrencyId;
  const selected =
    selectedId && available.includes(selectedId) ? selectedId : "";
  const change = useCallback(
    async (currencyId: string) => {
      if (!currencyId || update.isPending) return;
      setError("");
      try {
        await update.mutateAsync({
          id: props.subject.id,
          orderId: props.ecommerceModuleOrder.id,
          data: { billingModule: { currency: { id: currencyId } } },
        });
        await queries.invalidateQueries({
          queryKey: [`${route}/${props.subject.id}/ecommerce-module/orders`],
        });
      } catch {
        setError(
          props.language === "ru"
            ? "Не удалось изменить валюту. Попробуйте ещё раз."
            : "Could not change the currency. Please retry.",
        );
      }
    },
    [
      update.mutateAsync,
      update.isPending,
      queries,
      props.subject.id,
      props.ecommerceModuleOrder.id,
      props.language,
    ],
  );
  const id = `order-currency-${props.ecommerceModuleOrder.id}`;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {props.language === "ru" ? "Валюта оплаты" : "Payment currency"}
      </label>
      <Select
        ui="shadcn"
        id={id}
        value={selected}
        onValueChange={change}
        disabled={update.isPending || !options.length}
        placeholder={
          props.language === "ru" ? "Выберите валюту" : "Choose a currency"
        }
        options={options.map((item) => ({
          value: item.id,
          label:
            item.slug && /^[a-z]{3}$/i.test(item.slug)
              ? `${item.slug.toUpperCase()} · ${item.symbol}`
              : item.title,
        }))}
        className="h-9 min-h-9 w-auto max-w-full gap-2 rounded-lg bg-card px-2.5 py-1 text-xs shadow-none"
        contentClassName="w-max min-w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-content-available-width)] whitespace-nowrap [&_[role=option]>span:last-child]:truncate"
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Quantity(props: IQuantityProps) {
  const ru = props.language === "ru";
  const update = api.ecommerceModuleOrderUpdate({});
  const queries = useQueryClient();
  const [error, setError] = useState("");
  const change = useCallback(
    async (quantity: number) => {
      if (
        update.isPending ||
        quantity < 1 ||
        quantity > props.maxLineQuantity
      ) {
        return;
      }
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
        setError(
          ru
            ? "Не удалось изменить количество. Попробуйте ещё раз."
            : "Could not change the quantity. Please try again.",
        );
      }
    },
    [
      update.mutateAsync,
      update.isPending,
      queries,
      props.subjectId,
      props.orderId,
      props.line.id,
      props.maxLineQuantity,
      ru,
    ],
  );
  const decrease = useCallback(() => {
    void change(Math.min(props.line.quantity - 1, props.maxLineQuantity));
  }, [change, props.line.quantity, props.maxLineQuantity]);
  const increase = useCallback(() => {
    void change(props.line.quantity + 1);
  }, [change, props.line.quantity]);
  const locked = props.line.variant === REGISTRATION_GRANT_VARIANT;
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
          disabled={locked || update.isPending || props.line.quantity <= 1}
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
            locked ||
            update.isPending ||
            props.line.quantity >= props.maxLineQuantity
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
export const Component = memo(function Row(props: IRowProps) {
  const details = props.ecommerceModuleOrder.cartDetails;
  const ru = props.language === "ru";
  const lines = details?.lines.filter((line) => !line.parentLineId) ?? [];
  const onlyProduct = lines.length === 1 ? lines[0].product : null;
  const onSelectionStateChange = useCallback(
    (lineId: string, blocked: boolean) => {
      props.onOrderSelectionStateChange?.(
        props.ecommerceModuleOrder.id,
        lineId,
        blocked,
      );
    },
    [props.onOrderSelectionStateChange, props.ecommerceModuleOrder.id],
  );
  const onSelectionPendingChange = useCallback(
    (lineId: string, pending: boolean) => {
      props.onOrderSelectionPendingChange?.(
        props.ecommerceModuleOrder.id,
        lineId,
        pending,
      );
    },
    [props.onOrderSelectionPendingChange, props.ecommerceModuleOrder.id],
  );
  const productTitle =
    onlyProduct?.title?.[props.language] ||
    onlyProduct?.title?.en ||
    onlyProduct?.slug;
  let removeLabel;
  if (productTitle) {
    removeLabel = ru
      ? `Удалить из корзины: ${productTitle}`
      : `Remove from cart: ${productTitle}`;
  } else if (lines.length > 1) {
    removeLabel = ru ? "Удалить группу товаров" : "Remove item group";
  }
  const remove = (
    <Subject
      isServer={false}
      variant="ecommerce-module-order-delete-default"
      dataSource="props"
      data={props.subject}
      ecommerceModuleOrder={props.ecommerceModuleOrder}
      language={props.language}
      iconOnly
      label={removeLabel}
    />
  );
  return (
    <li className="min-w-0">
      <EcommerceModuleOrder
        isServer={false}
        variant="cart-card-default"
        dataSource="props"
        data={props.ecommerceModuleOrder}
        language={props.language}
        cartDetails={details}
        quantitySlots={
          details && !details.offers
            ? Object.fromEntries(
                lines.map((line) => [
                  line.id,
                  <Quantity
                    key={line.id}
                    subjectId={props.subject.id}
                    orderId={props.ecommerceModuleOrder.id}
                    line={line}
                    maxLineQuantity={details.maxLineQuantity}
                    language={props.language}
                  />,
                ]),
              )
            : undefined
        }
        removeSlot={remove}
        currencySlot={
          !details?.offers && (
            <Currency
              subject={props.subject}
              ecommerceModuleOrder={props.ecommerceModuleOrder}
              language={props.language}
            />
          )
        }
        selectionSlots={
          details?.offers &&
          Object.fromEntries(
            lines.map((line) => [
              line.id,
              <Selection
                key={line.id}
                line={line}
                details={details}
                subject={props.subject}
                ecommerceModuleOrder={props.ecommerceModuleOrder}
                language={props.language}
                onSelectionStateChange={onSelectionStateChange}
                onSelectionPendingChange={onSelectionPendingChange}
              />,
            ]),
          )
        }
      />
    </li>
  );
});
