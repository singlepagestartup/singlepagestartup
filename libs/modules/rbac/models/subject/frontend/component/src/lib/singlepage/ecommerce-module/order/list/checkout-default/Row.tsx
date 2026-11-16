"use client";
import { memo, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG } from "@sps/shared-utils";
import { Icon, Select } from "@sps/ui-adapter";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IRowProps, IQuantityProps, ICurrencyProps } from "./interface";

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
      <label htmlFor={id} className="text-xs text-muted-foreground">
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
        className="h-9 min-h-9 w-auto max-w-full gap-2 rounded-lg px-2.5 py-1 text-xs shadow-none"
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
  const locked =
    props.line.product?.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG;
  return (
    <div>
      <div
        role="group"
        aria-label={`${ru ? "Количество" : "Quantity"}: ${props.line.product?.title?.[props.language] || props.line.product?.slug || ""}`}
        className="inline-flex items-center rounded-full border border-border bg-muted/50"
      >
        <button
          type="button"
          aria-label={ru ? "Уменьшить количество" : "Decrease quantity"}
          disabled={locked || update.isPending || props.line.quantity <= 1}
          onClick={decrease}
          className="grid size-10 place-items-center rounded-full hover:bg-card disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-foreground"
        >
          <Icon name="minus" className="size-4" />
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
          className="grid size-10 place-items-center rounded-full hover:bg-card disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-foreground"
        >
          <Icon name="plus" className="size-4" />
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
  const lines = details?.lines ?? [];
  const onlyProduct = lines.length === 1 ? lines[0].product : null;
  const selectedId = details?.billingModuleCurrencyId;
  const totals =
    selectedId && details?.availableCurrencyIds?.includes(selectedId)
      ? details.totals.filter(
          (item) => item.billingModuleCurrency.id === selectedId,
        )
      : [];
  const hasUnpriced = Boolean(details?.unpriced?.length);
  const amount =
    totals.length > 0 ? (
      <span className="max-w-full wrap-anywhere text-right text-base font-semibold leading-tight tabular-nums">
        {new Intl.NumberFormat(props.language, {
          maximumFractionDigits: 2,
        }).format(totals.reduce((sum, item) => sum + item.total, 0))}{" "}
        {totals[0].billingModuleCurrency.symbol}
      </span>
    ) : null;
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
      iconOnly={!!onlyProduct}
      label={removeLabel}
    />
  );
  return (
    <li className="min-w-0 rounded-2xl border border-border bg-card">
      <div className="space-y-4 p-3 sm:p-4">
        {lines.map((line) =>
          line.product && details ? (
            <EcommerceModuleProduct
              key={line.id}
              isServer={false}
              variant="cart-default"
              dataSource="props"
              data={line.product}
              language={props.language}
              priceSlot={onlyProduct && !hasUnpriced ? amount : undefined}
            >
              <div className="flex flex-wrap items-start justify-between gap-1">
                <Quantity
                  subjectId={props.subject.id}
                  orderId={props.ecommerceModuleOrder.id}
                  line={line}
                  maxLineQuantity={details.maxLineQuantity}
                  language={props.language}
                />
                {onlyProduct && remove}
              </div>
            </EcommerceModuleProduct>
          ) : (
            <p key={line.id} className="text-sm text-muted-foreground">
              {ru ? "Товар недоступен" : "Item unavailable"}
            </p>
          ),
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-b-2xl border-t border-border/70 bg-muted/25 px-3 py-1.5 sm:px-4">
        <Currency
          subject={props.subject}
          ecommerceModuleOrder={props.ecommerceModuleOrder}
          language={props.language}
        />
        {(!onlyProduct || hasUnpriced) && amount && (
          <span className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
            {hasUnpriced
              ? ru
                ? "Товары с ценой"
                : "Priced items"
              : ru
                ? "Сумма заказа"
                : "Order subtotal"}{" "}
            <span className="text-foreground">{amount}</span>
          </span>
        )}
        {!onlyProduct && remove}
      </div>
    </li>
  );
});
