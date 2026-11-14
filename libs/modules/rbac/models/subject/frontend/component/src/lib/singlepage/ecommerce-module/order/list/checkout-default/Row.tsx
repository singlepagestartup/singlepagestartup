"use client";
import { memo, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG } from "@sps/shared-utils";
import { Icon, Select } from "@sps/ui-adapter";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
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
  const amount = details?.totals
    .filter((total) => total.billingModuleCurrency.id === selected)
    .reduce((sum, total) => sum + total.total, 0);
  const currency = options.find((item) => item.id === selected);
  const id = `order-currency-${props.ecommerceModuleOrder.id}`;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
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
          label: `${item.title} (${item.symbol})`,
        }))}
        className="min-w-48 rounded-xl"
      />
      {currency && (
        <p className="text-sm font-semibold">
          {new Intl.NumberFormat(props.language === "ru" ? "ru-RU" : "en-US", {
            maximumFractionDigits: 2,
          }).format(amount ?? 0)}{" "}
          {currency.symbol}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Quantity(props: IQuantityProps) {
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
      props.maxLineQuantity,
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
          disabled={
            locked ||
            update.isPending ||
            props.line.quantity >= props.maxLineQuantity
          }
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
  const details = props.ecommerceModuleOrder.cartDetails;
  return (
    <li className="min-w-0 space-y-4 py-5 first:pt-0 last:pb-0">
      {details?.lines.map((line) =>
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
              maxLineQuantity={details.maxLineQuantity}
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
        <Currency
          subject={props.subject}
          ecommerceModuleOrder={props.ecommerceModuleOrder}
          language={props.language}
        />
        <Subject
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
