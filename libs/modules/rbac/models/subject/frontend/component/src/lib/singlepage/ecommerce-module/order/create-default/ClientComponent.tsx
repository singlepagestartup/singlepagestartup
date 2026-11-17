"use client";
import { useEffect, useId, useState } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { api as offerApi } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import { api as storeApi } from "@sps/ecommerce/models/store/sdk/client";
import { api as currencyApi } from "@sps/billing/models/currency/sdk/client";
import { Button, Input } from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import { cn, formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";

const input =
  "h-12 min-h-12 w-full min-w-0 rounded-lg border border-border bg-card px-4 py-2 text-sm font-normal text-foreground shadow-sm outline-none transition focus-visible:border-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60";
const incompleteCodes = new Set([
  "delivery_required",
  "address_required",
  "pickup_required",
]);

export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  const formId = useId();
  const createOrder = api.ecommerceModuleOrderCreate({});
  const [offerId, setOfferId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const offersQuery = offerApi.find({
    params: {
      filters: {
        and: [
          {
            column: "productId",
            method: "eq",
            value: props.ecommerceModuleProduct.id,
          },
          { column: "variant", method: "eq", value: "default" },
          ...(props.ecommerceModuleStore
            ? [
                {
                  column: "storeId",
                  method: "eq",
                  value: props.ecommerceModuleStore.id,
                },
              ]
            : []),
        ],
      },
    },
  });
  const offers = (offersQuery.data ?? []).filter(
    (offer) =>
      offer.productId === props.ecommerceModuleProduct.id &&
      offer.variant === "default" &&
      (props.ecommerceModuleProduct.kind !== "service" ||
        offer.settings?.standalone === true),
  );
  const selected =
    offers.find((offer) => offer.id === offerId) ??
    (offers.length === 1 ? offers[0] : undefined);
  const storeIds = [...new Set(offers.map((offer) => offer.storeId))];
  const stores = storeApi.find({
    params: {
      filters: { and: [{ column: "id", method: "inArray", value: storeIds }] },
    },
    reactQueryOptions: { enabled: storeIds.length > 0 },
  });
  const quote = offerApi.quote({
    data: { offerId: selected?.id ?? "", quantity, currencyId },
    reactQueryOptions: {
      enabled:
        Boolean(selected) && Number.isSafeInteger(quantity) && quantity > 0,
    },
  });
  const currentQuote =
    quote.data?.offerId === selected?.id && quote.data?.quantity === quantity
      ? quote.data
      : undefined;
  const displayedAmount =
    currentQuote?.amount ??
    currentQuote?.charges.find((charge) => charge.role === "product")?.amount;
  const currencyIds = currentQuote?.currencyIds ?? [];
  const currencies = currencyApi.find({
    params: {
      filters: {
        and: [{ column: "id", method: "inArray", value: currencyIds }],
      },
    },
    reactQueryOptions: { enabled: currencyIds.length > 0 },
  });
  const offerOptions = offers.map((offer) => {
    const store = stores.data?.find((store) => store.id === offer.storeId);
    const name =
      store?.title?.[props.language] ||
      store?.title?.en ||
      store?.slug ||
      (ru ? "Магазин" : "Store");
    const hasMultipleOffers = offers.some(
      (candidate) =>
        candidate.id !== offer.id && candidate.storeId === offer.storeId,
    );
    return {
      value: offer.id,
      label: hasMultipleOffers ? `${name} · ${offer.sku}` : name,
    };
  });
  const serviceNames = [
    ...new Set(
      currentQuote?.serviceOptions.map(
        (option) => option.titles?.[props.language] || option.title,
      ) ?? [],
    ),
  ];
  useEffect(() => {
    setOfferId("");
    setCurrencyId("");
    setQuantity(1);
    setError("");
    setAdded(false);
  }, [
    props.data.id,
    props.ecommerceModuleProduct.id,
    props.ecommerceModuleStore?.id,
  ]);
  useEffect(() => {
    if (currentQuote && (!currencyId || !currencyIds.includes(currencyId))) {
      const preferred = props.billingModule?.currency?.id;
      setCurrencyId(
        preferred && currencyIds.includes(preferred)
          ? preferred
          : (currencyIds[0] ?? ""),
      );
    }
  }, [currentQuote, currencyId, props.billingModule?.currency?.id]);
  const blockingIssues =
    currentQuote?.issues.filter((issue) => !incompleteCodes.has(issue.code)) ??
    [];
  const ready = Boolean(
    selected &&
    currencyId &&
    currencyIds.includes(currencyId) &&
    currentQuote?.currencyId === currencyId &&
    !blockingIssues.length &&
    !quote.isFetching &&
    Number.isSafeInteger(quantity) &&
    quantity >= 1,
  );
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || !selected) return;
    setError("");
    setAdded(false);
    try {
      await createOrder.mutateAsync({
        id: props.data.id,
        data: {
          productId: props.ecommerceModuleProduct.id,
          offerId: selected.id,
          storeId: selected.storeId,
          quantity,
          billingModuleCurrencyId: currencyId,
          ...(currentQuote?.version
            ? { expectedQuoteVersion: currentQuote.version }
            : {}),
        },
      });
      setAdded(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : ru
            ? "Не удалось добавить товар."
            : "Could not add the product.",
      );
    }
  }
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("w-full min-w-0", props.className)}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-1.5 text-xs font-medium">
          <label htmlFor={`${formId}-store`}>{ru ? "Магазин" : "Store"}</label>
          <Select
            ui="shadcn"
            id={`${formId}-store`}
            value={selected?.id ?? ""}
            disabled={offersQuery.isPending || createOrder.isPending}
            placeholder={ru ? "Выберите магазин" : "Choose a store"}
            options={offerOptions}
            onValueChange={(value) => {
              setOfferId(value);
              setCurrencyId("");
              setAdded(false);
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5 text-xs font-medium">
            <label htmlFor={`${formId}-currency`}>
              {ru ? "Валюта" : "Currency"}
            </label>
            <Select
              ui="shadcn"
              id={`${formId}-currency`}
              value={currencyId}
              disabled={
                !selected || createOrder.isPending || !currencyIds.length
              }
              placeholder={ru ? "Выберите валюту" : "Choose currency"}
              options={currencyIds.map((id) => {
                const currency = currencies.data?.find(
                  (currency) => currency.id === id,
                );
                return {
                  value: id,
                  label:
                    currency?.slug?.toUpperCase() ||
                    currency?.symbol ||
                    (ru ? "Валюта" : "Currency"),
                };
              })}
              onValueChange={(value) => {
                setCurrencyId(value);
                setAdded(false);
              }}
            />
          </div>
          <label className="grid gap-1.5 text-xs font-medium">
            {ru ? "Количество" : "Quantity"}
            <Input
              type="number"
              className={input}
              min={1}
              step={1}
              value={quantity}
              disabled={createOrder.isPending}
              onChange={(event) => {
                setQuantity(Number(event.target.value));
                setAdded(false);
              }}
            />
          </label>
        </div>
        {displayedAmount !== undefined ? (
          <p className="text-lg font-semibold">
            {formatCurrencyAmount(displayedAmount, props.language)}{" "}
            {currencies.data?.find(
              (currency) => currency.id === currentQuote?.currencyId,
            )?.symbol ?? ""}
          </p>
        ) : null}
        {selected &&
        currentQuote?.availableQuantity !== null &&
        currentQuote?.availableQuantity !== undefined ? (
          <p className="text-xs text-muted-foreground">
            {ru ? "Доступно" : "Available"}: {currentQuote.availableQuantity}
          </p>
        ) : null}
        {blockingIssues.map((issue) => (
          <p
            role="alert"
            key={`${issue.offerId}-${issue.code}`}
            className="text-sm text-destructive"
          >
            {issue.message}
          </p>
        ))}
        {offersQuery.isError || quote.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {ru
              ? "Не удалось загрузить предложения. Повторите попытку."
              : "Could not load offers. Please retry."}
          </p>
        ) : null}
        {!offersQuery.isPending && !offers.length ? (
          <p className="text-sm text-muted-foreground">
            {ru ? "Нет доступных предложений." : "No available offers."}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          disabled={createOrder.isPending || !ready}
          className="min-h-11 w-full rounded-xl"
        >
          {createOrder.isPending
            ? ru
              ? "Добавляем…"
              : "Adding…"
            : ru
              ? "Добавить в корзину"
              : "Add to cart"}
        </Button>
        {serviceNames.length ? (
          <p className="text-xs text-muted-foreground">
            {ru ? "В корзине можно выбрать" : "Available in your cart"}:{" "}
            {serviceNames.join(", ")}.
          </p>
        ) : null}
        {currentQuote?.issues.some((issue) =>
          incompleteCodes.has(issue.code),
        ) ? (
          <p className="text-xs text-muted-foreground">
            {ru
              ? "Получение, адрес и услуги можно выбрать в корзине."
              : "Choose fulfillment, address and services in your cart."}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {added ? (
          <p role="status" className="text-xs text-muted-foreground">
            {ru ? "Товар в корзине." : "Added to your cart."}
          </p>
        ) : null}
      </form>
    </div>
  );
}
