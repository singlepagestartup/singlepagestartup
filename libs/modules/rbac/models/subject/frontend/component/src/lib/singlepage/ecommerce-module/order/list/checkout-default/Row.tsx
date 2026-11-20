"use client";
import { memo, useCallback, useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { Select } from "@sps/ui-adapter";
import { Checkbox } from "@sps/shared-ui-shadcn";
import { Component as EcommerceModuleOrder } from "@sps/ecommerce/models/order/frontend/component";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IRowProps, ICurrencyProps } from "./interface";
import { Quantity } from "./Quantity";
import { Selection } from "./Selection";
import { hasDuplicateSingleUnitLines, hasSingleUnitLimit } from "./utils";

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

export const Component = memo(function Row(props: IRowProps) {
  const details = props.ecommerceModuleOrder.cartDetails;
  const ru = props.language === "ru";
  const lines = details?.lines.filter((line) => !line.parentLineId) ?? [];
  const onlyProduct = lines.length === 1 ? lines[0].product : null;
  const work = details?.work;
  const duplicateLimitedItems = hasDuplicateSingleUnitLines(
    details,
    props.ecommerceModuleProduct,
  );
  const selectionId = useId();
  const changeCartSelection = useCallback(
    (checked: boolean | "indeterminate") => {
      props.onCartItemSelectionChange?.(
        props.ecommerceModuleOrder.id,
        checked === true,
      );
    },
    [props.onCartItemSelectionChange, props.ecommerceModuleOrder.id],
  );
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
  const selectLabel =
    lines.length > 1
      ? ru
        ? "Выбрать весь заказ"
        : "Select the entire order"
      : ru
        ? "Выбрать позицию"
        : "Select item";
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
    <li className="grid min-w-0 gap-2">
      <EcommerceModuleOrder
        isServer={false}
        variant="cart-card-default"
        dataSource="props"
        data={props.ecommerceModuleOrder}
        language={props.language}
        cartDetails={details}
        headerSlot={
          props.selected !== undefined && lines.length > 0 ? (
            <div className="flex min-h-8 items-center gap-2 text-sm font-medium">
              <Checkbox
                id={selectionId}
                checked={props.selected}
                disabled={props.selectionDisabled}
                onCheckedChange={changeCartSelection}
                className="size-5 border-2 border-muted-foreground focus-visible:ring-foreground data-[state=checked]:border-primary"
              />
              <label htmlFor={selectionId} className="cursor-pointer py-1">
                {selectLabel}
                {productTitle && (
                  <span className="sr-only"> {productTitle}</span>
                )}
              </label>
            </div>
          ) : undefined
        }
        priceLabel={
          work && work.state !== "awaiting-payment"
            ? ru
              ? "Цена предложения"
              : "Offer price"
            : undefined
        }
        quantitySlots={
          details
            ? Object.fromEntries(
                lines.map((line) => {
                  const singleUnitPerOrder = hasSingleUnitLimit(
                    details,
                    line,
                    props.ecommerceModuleProduct,
                  );
                  return [
                    line.id,
                    singleUnitPerOrder || (!details.offers && !work) ? (
                      <Quantity
                        key={line.id}
                        subjectId={props.subject.id}
                        orderId={props.ecommerceModuleOrder.id}
                        line={line}
                        maxLineQuantity={details.maxLineQuantity}
                        language={props.language}
                        singleUnitPerOrder={singleUnitPerOrder}
                        attachedLines={details.lines}
                        requiresNewResult={work?.state === "awaiting-payment"}
                        repairUnavailable={duplicateLimitedItems}
                        onPendingChange={onSelectionPendingChange}
                      />
                    ) : null,
                  ];
                }),
              )
            : undefined
        }
        removeSlot={remove}
        currencySlot={
          !details?.offers &&
          !work && (
            <Currency
              subject={props.subject}
              ecommerceModuleOrder={props.ecommerceModuleOrder}
              language={props.language}
            />
          )
        }
        selectionSlots={
          !work && details?.offers
            ? Object.fromEntries(
                lines.map((line) => [
                  line.id,
                  <Selection
                    key={line.id}
                    line={line}
                    details={details}
                    subject={props.subject}
                    ecommerceModuleOrder={props.ecommerceModuleOrder}
                    ecommerceModuleProduct={props.ecommerceModuleProduct}
                    language={props.language}
                    onSelectionStateChange={onSelectionStateChange}
                    onSelectionPendingChange={onSelectionPendingChange}
                  />,
                ]),
              )
            : undefined
        }
      />
      {duplicateLimitedItems && (
        <p role="alert" className="text-sm text-destructive">
          {ru
            ? "В заказе несколько позиций одного товара с лимитом в одну единицу. Удалите этот заказ из корзины и добавьте товары заново."
            : "This order contains multiple lines for an item limited to one unit. Remove the order from your cart and add the items again."}
        </p>
      )}
      {props.children}
    </li>
  );
});
