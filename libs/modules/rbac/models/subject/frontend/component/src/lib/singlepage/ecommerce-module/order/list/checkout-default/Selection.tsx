"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { api as offerApi } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import { api as currencyApi } from "@sps/billing/models/currency/sdk/client";
import type {
  IEcommerceCartSelection,
  IEcommerceCartSelectionResult,
} from "@sps/rbac/models/subject/sdk/model";
import type {
  IOfferQuote,
  IOfferServiceOption,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { ISelectionProps } from "./interface";

const input =
  "min-h-11 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50";
const button =
  "min-h-11 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50";

export function Selection(props: ISelectionProps) {
  const ru = props.language === "ru";
  const original =
    props.details.offerQuotes?.find(
      (quote) => quote.offerId === props.line.offerId,
    ) ??
    props.details.offerQuotes?.find(
      (quote) => quote.productId === props.line.productId,
    );
  const children = props.details.lines.filter(
    (line) => line.parentLineId === props.line.id && line.offerId,
  );
  const [offerId, setOfferId] = useState(
    props.line.offerId ?? original?.offerId ?? "",
  );
  const [currencyId, setCurrencyId] = useState(
    props.details.billingModuleCurrencyId ?? "",
  );
  const [quantity, setQuantity] = useState(props.line.quantity);
  const [address, setAddress] = useState(props.line.destination?.address ?? "");
  const [region, setRegion] = useState(props.line.destination?.region ?? "");
  const [pickup, setPickup] = useState(
    props.line.destination?.pickupPointId ?? "",
  );
  const [services, setServices] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      children.map((child) => [child.offerId!, child.quantity]),
    ),
  );
  const [transfer, setTransfer] = useState<{
    target: string;
    services: {
      productId: string;
      role: string;
      quantity: number;
      title: string;
    }[];
  } | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [dropMissing, setDropMissing] = useState(false);
  const [split, setSplit] = useState(false);
  const [splitQuantity, setSplitQuantity] = useState(1);
  const [secondAddress, setSecondAddress] = useState(address);
  const [secondRegion, setSecondRegion] = useState(region);
  const [preview, setPreview] = useState<{
    result: IEcommerceCartSelectionResult;
    selections: IEcommerceCartSelection[];
  } | null>(null);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);
  const knownOptions = useRef(
    new Map<string, IOfferServiceOption>(
      (original?.serviceOptions ?? []).map((option) => [
        option.offerId,
        option,
      ]),
    ),
  );
  const selectionMutation = api.ecommerceModuleOrderSelection({});
  const choices = (props.details.offers ?? []).filter(
    (offer) =>
      offer.productId === props.line.productId &&
      offer.variant === "default" &&
      (props.line.product?.kind !== "service" ||
        offer.settings?.standalone === true),
  );
  const discovery = offerApi.quote({
    data: { offerId, quantity, currencyId },
    reactQueryOptions: {
      enabled:
        Boolean(offerId) && Number.isSafeInteger(quantity) && quantity > 0,
    },
  });
  const available =
    discovery.data?.offerId === offerId ? discovery.data : undefined;
  const options = available?.serviceOptions ?? [];
  useEffect(() => {
    for (const option of available?.serviceOptions ?? []) {
      knownOptions.current.set(option.offerId, option);
    }
  }, [available]);
  const currencyIds =
    available?.currencyIds ?? props.details.availableCurrencyIds ?? [];
  const currencies = currencyApi.find({
    params: {
      filters: {
        and: [{ column: "id", method: "inArray", value: currencyIds }],
      },
    },
    reactQueryOptions: { enabled: currencyIds.length > 0 },
  });
  const effectiveServices = Object.entries(services).filter(
    ([id, count]) =>
      count > 0 && options.some((option) => option.offerId === id),
  );
  const selectedOptions = options.filter(
    (option) => (services[option.offerId] ?? 0) > 0,
  );
  const shipping = selectedOptions.some(
    (option) => option.receiptMethod === "shipping",
  );
  const pickupOption = selectedOptions.find(
    (option) => option.receiptMethod === "pickup",
  );
  const unknownServices = children
    .filter(
      (child) =>
        (services[child.offerId!] ?? 0) > 0 &&
        available &&
        !options.some((option) => option.offerId === child.offerId),
    )
    .map(
      (child) =>
        child.product?.title?.[props.language] ||
        child.product?.slug ||
        child.productId,
    );
  const unavailableServices = [...new Set([...missing, ...unknownServices])];

  useEffect(() => {
    requestSequence.current += 1;
    setPreview(null);
  }, [
    offerId,
    currencyId,
    quantity,
    address,
    region,
    pickup,
    services,
    dropMissing,
    split,
    splitQuantity,
    secondAddress,
    secondRegion,
  ]);
  useEffect(
    () => () => {
      requestSequence.current += 1;
    },
    [],
  );
  useEffect(() => {
    if (!transfer || !available || available.offerId !== transfer.target)
      return;
    const matched: Record<string, number> = {};
    const unavailable: string[] = [];
    for (const selected of transfer.services) {
      const targets = available.serviceOptions.filter(
        (option) =>
          option.productId === selected.productId &&
          option.role === selected.role,
      );
      if (targets.length === 1) matched[targets[0].offerId] = selected.quantity;
      else unavailable.push(selected.title);
    }
    setServices(matched);
    setMissing(unavailable);
    setDropMissing(false);
    setTransfer(null);
  }, [transfer, available]);

  function changeSeller(next: string) {
    const preserved = Object.entries(services)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => {
        const option = knownOptions.current.get(id);
        const child = children.find((child) => child.offerId === id);
        return {
          productId: option?.productId ?? child?.productId ?? id,
          role: option?.role ?? "unknown",
          quantity: count,
          title:
            option?.title ??
            child?.product?.title?.[props.language] ??
            child?.productId ??
            id,
        };
      });
    setTransfer({ target: next, services: preserved });
    setOfferId(next);
    setPreview(null);
    setError("");
  }

  function selections(): IEcommerceCartSelection[] {
    const destination = shipping
      ? { address, ...(region ? { region } : {}) }
      : pickupOption
        ? { pickupPointId: pickup }
        : {};
    const selected = effectiveServices.map(([id, count]) => ({
      offerId: id,
      quantity: count,
    }));
    const first = {
      offerId,
      quantity,
      currencyId,
      destination,
      services: selected,
    };
    if (!split) return [first];
    const remaining = quantity - splitQuantity;
    const firstServices = selected
      .map((selected) => ({
        ...selected,
        quantity:
          options.find((option) => option.offerId === selected.offerId)
            ?.role === "delivery"
            ? selected.quantity
            : Math.min(selected.quantity, remaining),
      }))
      .filter((selected) => selected.quantity > 0);
    const secondServices = selected
      .map((selected) => ({
        ...selected,
        quantity:
          options.find((option) => option.offerId === selected.offerId)
            ?.role === "delivery"
            ? selected.quantity
            : Math.max(0, selected.quantity - remaining),
      }))
      .filter((selected) => selected.quantity > 0);
    return [
      { ...first, quantity: remaining, services: firstServices },
      {
        ...first,
        quantity: splitQuantity,
        destination: shipping
          ? {
              address: secondAddress,
              ...(secondRegion ? { region: secondRegion } : {}),
            }
          : destination,
        services: secondServices,
      },
    ];
  }

  async function compare() {
    const sequence = ++requestSequence.current;
    const requested = selections();
    setError("");
    try {
      const result = await selectionMutation.mutateAsync({
        id: props.subject.id,
        orderId: props.ecommerceModuleOrder.id,
        data: {
          action: "preview",
          lineId: props.line.id,
          selections: requested,
        },
      });
      if (sequence === requestSequence.current)
        setPreview({ result, selections: requested });
    } catch (cause) {
      if (sequence === requestSequence.current)
        setError(
          cause instanceof Error
            ? cause.message
            : ru
              ? "Не удалось сравнить предложения."
              : "Could not compare offers.",
        );
    }
  }

  async function apply() {
    if (!preview) return;
    const sequence = ++requestSequence.current;
    setError("");
    try {
      await selectionMutation.mutateAsync({
        id: props.subject.id,
        orderId: props.ecommerceModuleOrder.id,
        data: {
          action: "apply",
          lineId: props.line.id,
          selections: preview.selections,
          expectedVersions: preview.result.quotes.map((quote) => quote.version),
          expectedSelectionUpdatedAt: new Date(
            props.line.selectionUpdatedAt,
          ).toISOString(),
        },
      });
      if (sequence === requestSequence.current) setPreview(null);
    } catch (cause) {
      if (sequence !== requestSequence.current) return;
      const message = cause instanceof Error ? cause.message : "";
      if (/Offer terms changed|Quote expired/.test(message)) {
        await compare();
        setError(
          ru
            ? "Условия изменились. Проверьте новый расчёт и подтвердите его ещё раз."
            : "Terms changed. Review and confirm the refreshed quote.",
        );
      } else
        setError(
          message ||
            (ru
              ? "Не удалось сохранить выбор."
              : "Could not save the selection."),
        );
    }
  }

  function cancel() {
    requestSequence.current += 1;
    setPreview(null);
    setOfferId(props.line.offerId ?? original?.offerId ?? "");
    setCurrencyId(props.details.billingModuleCurrencyId ?? "");
    setQuantity(props.line.quantity);
    setAddress(props.line.destination?.address ?? "");
    setRegion(props.line.destination?.region ?? "");
    setPickup(props.line.destination?.pickupPointId ?? "");
    setServices(
      Object.fromEntries(
        children.map((child) => [child.offerId!, child.quantity]),
      ),
    );
    setMissing([]);
    setDropMissing(false);
    setSplit(false);
    setTransfer(null);
    setError("");
  }

  function amounts(quote: IOfferQuote) {
    const symbol =
      currencies.data?.find((currency) => currency.id === quote.currencyId)
        ?.symbol ?? quote.currencyId;
    return (
      <dl className="space-y-1 text-xs">
        {quote.charges.map((charge) => (
          <div key={charge.offerId} className="flex justify-between gap-2">
            <dt>
              {charge.role === "product"
                ? ru
                  ? "Товар"
                  : "Product"
                : charge.role === "delivery"
                  ? ru
                    ? "Получение"
                    : "Fulfillment"
                  : ru
                    ? "Услуга"
                    : "Service"}{" "}
              · {charge.quantity}
            </dt>
            <dd className="tabular-nums">
              {charge.amount} {symbol}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-2 border-t border-border pt-1 font-semibold">
          <dt>{ru ? "Итого" : "Total"}</dt>
          <dd>
            {quote.amount === null
              ? ru
                ? "Нужен выбор"
                : "Selection needed"
              : `${quote.amount} ${symbol}`}
          </dd>
        </div>
      </dl>
    );
  }

  const validQuantities =
    Number.isSafeInteger(quantity) &&
    quantity > 0 &&
    (!split ||
      (Number.isSafeInteger(splitQuantity) &&
        splitQuantity > 0 &&
        splitQuantity < quantity &&
        quantity === props.line.quantity));
  return (
    <fieldset
      disabled={
        selectionMutation.isPending &&
        selectionMutation.variables?.data.action === "apply"
      }
      className="mt-4 min-w-0 space-y-3 border-t border-border pt-4"
    >
      <p className="text-xs text-muted-foreground">
        {ru
          ? "Магазин, адрес и услуги этого заказа"
          : "Store, destination and services for this order"}
      </p>
      <label className="grid gap-1 text-xs font-medium">
        {ru ? "Магазин" : "Store"}
        <select
          className={input}
          value={offerId}
          onChange={(event) => changeSeller(event.target.value)}
          disabled={
            selectionMutation.isPending &&
            selectionMutation.variables?.data.action === "apply"
          }
        >
          <option value="">{ru ? "Выберите магазин" : "Choose a store"}</option>
          {choices.map((offer) => (
            <option key={offer.id} value={offer.id}>
              {offer.store?.title?.[props.language] ||
                offer.store?.title?.en ||
                offer.store?.slug ||
                offer.storeId}{" "}
              · {offer.sku}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-xs font-medium">
          {ru ? "Количество" : "Quantity"}
          <input
            className={input}
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium">
          {ru ? "Валюта" : "Currency"}
          <select
            className={input}
            value={currencyId}
            onChange={(event) => setCurrencyId(event.target.value)}
          >
            <option value="">
              {ru ? "Выберите валюту" : "Choose currency"}
            </option>
            {currencyIds.map((id) => (
              <option key={id} value={id}>
                {currencies.data
                  ?.find((currency) => currency.id === id)
                  ?.slug?.toUpperCase() || id}
              </option>
            ))}
          </select>
        </label>
      </div>
      {options.length ? (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-medium">
            {ru
              ? "Получение и дополнительные услуги"
              : "Fulfillment and additional services"}
          </legend>
          {options.map((option) => (
            <div
              key={option.offerId}
              className="rounded-xl border border-border p-3"
            >
              <label className="flex min-h-9 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={(services[option.offerId] ?? 0) > 0}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setServices((current) => {
                      const next = { ...current };
                      if (option.role === "delivery" && checked)
                        for (const delivery of options.filter(
                          (item) => item.role === "delivery",
                        ))
                          delete next[delivery.offerId];
                      next[option.offerId] = checked ? 1 : 0;
                      return next;
                    });
                  }}
                />
                {option.title || option.productId}
                {option.receiptMethod === "pickup"
                  ? ru
                    ? " · самовывоз"
                    : " · pickup"
                  : option.receiptMethod === "electronic"
                    ? ru
                      ? " · электронная выдача"
                      : " · electronic fulfillment"
                    : ""}
              </label>
              {(services[option.offerId] ?? 0) > 0 &&
              option.role === "add-on" ? (
                <label className="mt-2 grid gap-1 text-xs">
                  {ru ? "Количество единиц услуги" : "Service quantity"}
                  <input
                    type="number"
                    className={input}
                    min={1}
                    max={quantity}
                    step={1}
                    value={services[option.offerId]}
                    onChange={(event) =>
                      setServices((current) => ({
                        ...current,
                        [option.offerId]: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              ) : null}
            </div>
          ))}
        </fieldset>
      ) : null}
      {shipping ? (
        <div className="space-y-3">
          <label className="grid gap-1 text-xs">
            {ru ? "Адрес доставки" : "Delivery address"}
            <input
              className={input}
              value={address}
              autoComplete="street-address"
              onChange={(event) => setAddress(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-xs">
            {ru ? "Регион" : "Region"}
            <input
              className={input}
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            />
          </label>
        </div>
      ) : null}
      {pickupOption ? (
        <label className="grid gap-1 text-xs">
          {ru ? "Точка самовывоза" : "Pickup point"}
          <select
            className={input}
            value={pickup}
            onChange={(event) => setPickup(event.target.value)}
          >
            <option value="">
              {ru ? "Выберите точку магазина" : "Choose a store location"}
            </option>
            {pickupOption.pickupPointIds?.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {unavailableServices.length ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-3 text-xs text-destructive"
        >
          <p>
            {ru ? "Недоступные услуги" : "Unavailable services"}:{" "}
            {unavailableServices.join(", ")}
          </p>
          <label className="mt-2 flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={dropMissing}
              onChange={(event) => setDropMissing(event.target.checked)}
            />
            {ru
              ? "Подтверждаю отказ от этих услуг"
              : "I agree to remove these services"}
          </label>
        </div>
      ) : null}
      {props.line.quantity >= 2 ? (
        <label className="flex min-h-11 items-center gap-2 text-xs">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={split}
            onChange={(event) => setSplit(event.target.checked)}
          />
          {ru ? "Разделить по адресам" : "Split by destination"}
        </label>
      ) : null}
      {split ? (
        <div className="space-y-3 rounded-xl border border-border p-3">
          <label className="grid gap-1 text-xs">
            {ru
              ? "Количество во втором заказе"
              : "Quantity in the second order"}
            <input
              className={input}
              type="number"
              min={1}
              max={quantity - 1}
              step={1}
              value={splitQuantity}
              onChange={(event) => setSplitQuantity(Number(event.target.value))}
            />
          </label>
          {shipping ? (
            <>
              <label className="grid gap-1 text-xs">
                {ru ? "Адрес второго заказа" : "Second order address"}
                <input
                  className={input}
                  value={secondAddress}
                  onChange={(event) => setSecondAddress(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-xs">
                {ru ? "Регион второго заказа" : "Second order region"}
                <input
                  className={input}
                  value={secondRegion}
                  onChange={(event) => setSecondRegion(event.target.value)}
                />
              </label>
            </>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {ru
              ? "Доставка рассчитывается для каждого заказа. Проверьте количество услуг в сравнении."
              : "Fulfillment is priced per order. Review service quantities in the comparison."}
          </p>
        </div>
      ) : null}
      {original ? (
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="mb-2 text-xs font-medium">
            {ru ? "Сохранённый выбор" : "Saved selection"}
          </p>
          {amounts(original)}
        </div>
      ) : null}
      {props.details.unpriced
        ?.filter((issue) => issue.ordersToProductsId === props.line.id)
        .map((issue, index) => (
          <p key={index} role="alert" className="text-xs text-destructive">
            {issue.reason}
          </p>
        ))}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className={`${button} w-full`}
        disabled={
          !offerId ||
          !currencyId ||
          !validQuantities ||
          Boolean(transfer) ||
          (unavailableServices.length > 0 && !dropMissing) ||
          (selectionMutation.isPending &&
            selectionMutation.variables?.data.action === "apply")
        }
        onClick={() => void compare()}
      >
        {selectionMutation.isPending
          ? ru
            ? "Рассчитываем…"
            : "Calculating…"
          : ru
            ? "Сравнить полный расчёт"
            : "Compare full price"}
      </button>
      {preview ? (
        <section
          aria-label={
            ru ? "Сравнение перед сохранением" : "Comparison before saving"
          }
          className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
        >
          <h3 className="text-sm font-semibold">
            {ru
              ? "Одинаковые количество, адрес и валюта"
              : "Same quantity, destination and currency"}
          </h3>
          {preview.result.comparisonQuotes?.map((quote, index) => (
            <div
              key={`previous-${index}`}
              className="rounded-xl border border-border bg-card p-3"
            >
              <p className="mb-2 text-xs font-medium">
                {ru
                  ? "Текущий магазин при новом выборе"
                  : "Current store with the proposed selection"}
              </p>
              {amounts(quote)}
            </div>
          ))}
          <p className="text-xs font-medium">
            {ru ? "Новый выбор" : "New selection"}
          </p>
          {preview.result.quotes.map((quote, index) => (
            <div
              key={`${quote.offerId}-${index}`}
              className="rounded-xl border border-border bg-card p-3"
            >
              {preview.result.quotes.length > 1 ? (
                <p className="mb-2 text-xs">
                  {ru ? "Заказ" : "Order"} {index + 1} · {quote.quantity}
                </p>
              ) : null}
              {amounts(quote)}
              {quote.issues.map((issue) => (
                <p
                  key={`${issue.code}-${issue.offerId}`}
                  role="alert"
                  className="mt-2 text-xs text-destructive"
                >
                  {issue.message}
                </p>
              ))}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            {ru
              ? "Итоги корзины изменятся после подтверждения. Отмена сохранит прежний выбор."
              : "Cart totals change after confirmation. Cancel keeps the previous selection."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={button}
              onClick={cancel}
              disabled={selectionMutation.isPending}
            >
              {ru ? "Отмена" : "Cancel"}
            </button>
            <button
              type="button"
              className={`${button} bg-primary text-primary-foreground hover:bg-primary/90`}
              onClick={() => void apply()}
              disabled={
                selectionMutation.isPending ||
                preview.result.quotes.some(
                  (quote) => quote.amount === null || quote.issues.length > 0,
                )
              }
            >
              {ru ? "Подтвердить выбор" : "Confirm selection"}
            </button>
          </div>
        </section>
      ) : null}
    </fieldset>
  );
}
