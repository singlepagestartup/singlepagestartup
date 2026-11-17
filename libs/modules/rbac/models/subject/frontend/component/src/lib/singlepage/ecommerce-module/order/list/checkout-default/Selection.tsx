"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Checkbox } from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
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
  const controlId = useId();
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
  const applying =
    selectionMutation.isPending &&
    selectionMutation.variables?.data.action === "apply";
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
  const regionIds = [
    ...new Set(
      selectedOptions
        .filter((option) => option.receiptMethod === "shipping")
        .flatMap((option) => option.regionIds ?? []),
    ),
  ];
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
            option?.titles?.[props.language] ??
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
        {quote.charges.map((charge) => {
          const option =
            quote.serviceOptions.find(
              (option) => option.offerId === charge.offerId,
            ) ?? knownOptions.current.get(charge.offerId);
          const title =
            charge.role === "product"
              ? props.line.product?.title?.[props.language] ||
                props.line.product?.title?.en ||
                (ru ? "Товар" : "Product")
              : option?.titles?.[props.language] ||
                option?.title ||
                (charge.role === "delivery"
                  ? ru
                    ? "Получение"
                    : "Fulfillment"
                  : ru
                    ? "Услуга"
                    : "Service");
          return (
            <div key={charge.offerId} className="flex justify-between gap-2">
              <dt className="min-w-0">
                {title} × {charge.quantity}
              </dt>
              <dd className="shrink-0 tabular-nums">
                {formatCurrencyAmount(charge.amount, props.language)} {symbol}
              </dd>
            </div>
          );
        })}
        <div className="flex justify-between gap-2 border-t border-border pt-1 font-semibold">
          <dt>{ru ? "Итого" : "Total"}</dt>
          <dd className="shrink-0 tabular-nums">
            {quote.amount === null
              ? ru
                ? "Нужен выбор"
                : "Selection needed"
              : `${formatCurrencyAmount(quote.amount, props.language)} ${symbol}`}
          </dd>
        </div>
      </dl>
    );
  }

  function storeTitle(id: string) {
    const offer = props.details.offers?.find((offer) => offer.id === id);
    const title =
      offer?.store?.title?.[props.language] ||
      offer?.store?.title?.en ||
      offer?.store?.slug ||
      (ru ? "Магазин" : "Store");
    return offer?.sku &&
      choices.filter((choice) => choice.storeId === offer.storeId).length > 1
      ? `${title} · ${offer.sku}`
      : title;
  }

  function quoteSummary(quote: IOfferQuote) {
    function amount(value: string | null) {
      return value?.includes(".")
        ? value.replace(/0+$/, "").replace(/\.$/, "")
        : value;
    }
    return JSON.stringify({
      offerId: quote.offerId,
      currencyId: quote.currencyId,
      quantity: quote.quantity,
      amount: amount(quote.amount),
      charges: quote.charges
        .map((charge) => [
          charge.offerId,
          charge.quantity,
          amount(charge.amount),
        ])
        .sort(),
      issues: quote.issues,
    });
  }

  function destinationDetails(destination: IOfferQuote["destination"]) {
    const text = [
      destination?.address,
      destination?.region,
      destination?.pickupPointId,
    ]
      .filter(Boolean)
      .join(", ");
    return text ? (
      <p className="mt-2 break-words text-xs text-muted-foreground">{text}</p>
    ) : null;
  }

  const savedOfferId = props.line.offerId ?? original?.offerId ?? "";
  const savedStore = choices.find(
    (offer) => offer.id === savedOfferId,
  )?.storeId;
  const selectedStore = choices.find((offer) => offer.id === offerId)?.storeId;
  const storeChanged =
    savedStore && selectedStore
      ? savedStore !== selectedStore
      : savedOfferId !== offerId;
  const servicesChanged =
    JSON.stringify([...effectiveServices].sort()) !==
    JSON.stringify(
      children.map((child) => [child.offerId!, child.quantity]).sort(),
    );
  const proposedDestination = selections()[0].destination;
  const destinationChanged = (
    ["address", "region", "pickupPointId"] as const
  ).some(
    (key) =>
      (props.line.destination?.[key] ?? "") !==
      (proposedDestination?.[key] ?? ""),
  );
  const selectionChanged =
    savedOfferId !== offerId ||
    currencyId !== props.details.billingModuleCurrencyId ||
    quantity !== props.line.quantity ||
    servicesChanged ||
    destinationChanged ||
    split;
  const sameSelectionAndPrice =
    !selectionChanged &&
    original &&
    original.amount !== null &&
    original.issues.length === 0 &&
    preview?.result.quotes.length === 1 &&
    quoteSummary(original) === quoteSummary(preview.result.quotes[0]);
  // Cart details contain live prices; only the saved version records consent.
  const unchanged =
    sameSelectionAndPrice &&
    Boolean(props.line.offerId) &&
    props.line.quoteVersion === preview?.result.quotes[0].version;
  const reconfirm = sameSelectionAndPrice && !unchanged;
  const comparisonQuotes = storeChanged
    ? (preview?.result.comparisonQuotes?.filter(
        (quote) =>
          !original ||
          destinationChanged ||
          quoteSummary(quote) !== quoteSummary(original),
      ) ?? [])
    : [];

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
      disabled={applying}
      className="mt-4 min-w-0 space-y-3 border-t border-border pt-4"
    >
      <p className="text-xs text-muted-foreground">
        {ru
          ? "Магазин, адрес и услуги этого заказа"
          : "Store, destination and services for this order"}
      </p>
      <div className="grid gap-1 text-xs font-medium">
        <label htmlFor={`${controlId}-store`}>{ru ? "Магазин" : "Store"}</label>
        <Select
          ui="shadcn"
          id={`${controlId}-store`}
          className={input}
          value={offerId}
          onValueChange={changeSeller}
          disabled={applying}
          placeholder={ru ? "Выберите магазин" : "Choose a store"}
          options={choices.map((offer) => ({
            value: offer.id,
            label: storeTitle(offer.id),
          }))}
        />
      </div>
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
        <div className="grid gap-1 text-xs font-medium">
          <label htmlFor={`${controlId}-currency`}>
            {ru ? "Валюта" : "Currency"}
          </label>
          <Select
            ui="shadcn"
            id={`${controlId}-currency`}
            className={input}
            value={currencyId}
            onValueChange={setCurrencyId}
            disabled={applying}
            placeholder={ru ? "Выберите валюту" : "Choose currency"}
            options={currencyIds.map((id) => ({
              value: id,
              label:
                currencies.data
                  ?.find((currency) => currency.id === id)
                  ?.slug?.toUpperCase() || id,
            }))}
          />
        </div>
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
              className="overflow-hidden rounded-xl border border-border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
            >
              <label
                htmlFor={`${controlId}-${option.offerId}`}
                className="flex min-h-14 w-full cursor-pointer items-center gap-3 p-3 text-sm hover:bg-muted/50 has-[:disabled]:cursor-wait"
              >
                <Checkbox
                  id={`${controlId}-${option.offerId}`}
                  className="size-5 rounded-md border-2 border-muted-foreground bg-card focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 data-[state=checked]:border-primary"
                  checked={(services[option.offerId] ?? 0) > 0}
                  disabled={applying}
                  onCheckedChange={(value) => {
                    const checked = value === true;
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
                <span className="min-w-0 flex-1">
                  {option.titles?.[props.language] ||
                    option.title ||
                    option.productId}
                  {option.receiptMethod === "pickup"
                    ? ru
                      ? " · самовывоз"
                      : " · pickup"
                    : option.receiptMethod === "electronic"
                      ? ru
                        ? " · электронная выдача"
                        : " · electronic fulfillment"
                      : ""}
                </span>
              </label>
              {(services[option.offerId] ?? 0) > 0 &&
              option.role === "add-on" ? (
                <label className="grid gap-1 px-3 pb-3 text-xs">
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
          <div className="grid gap-1 text-xs">
            <label htmlFor={`${controlId}-region`}>
              {ru ? "Регион" : "Region"}
            </label>
            {regionIds.length ? (
              <Select
                ui="shadcn"
                id={`${controlId}-region`}
                className={input}
                value={region}
                onValueChange={setRegion}
                disabled={applying}
                placeholder={ru ? "Выберите регион" : "Choose a region"}
                options={regionIds.map((id) => ({ value: id, label: id }))}
              />
            ) : (
              <input
                id={`${controlId}-region`}
                className={input}
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              />
            )}
          </div>
        </div>
      ) : null}
      {pickupOption ? (
        <div className="grid gap-1 text-xs">
          <label htmlFor={`${controlId}-pickup`}>
            {ru ? "Точка самовывоза" : "Pickup point"}
          </label>
          <Select
            ui="shadcn"
            id={`${controlId}-pickup`}
            className={input}
            value={pickup}
            onValueChange={setPickup}
            disabled={applying}
            placeholder={
              ru ? "Выберите точку магазина" : "Choose a store location"
            }
            options={(pickupOption.pickupPointIds ?? []).map((id) => ({
              value: id,
              label: id,
            }))}
          />
        </div>
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
          <label
            htmlFor={`${controlId}-remove-services`}
            className="mt-2 flex min-h-11 cursor-pointer items-center gap-3"
          >
            <Checkbox
              id={`${controlId}-remove-services`}
              className="size-5 rounded-md border-2 border-destructive bg-card focus-visible:ring-foreground"
              checked={dropMissing}
              disabled={applying}
              onCheckedChange={(checked) => setDropMissing(checked === true)}
            />
            {ru
              ? "Подтверждаю отказ от этих услуг"
              : "I agree to remove these services"}
          </label>
        </div>
      ) : null}
      {props.line.quantity >= 2 ? (
        <label
          htmlFor={`${controlId}-split`}
          className="flex min-h-11 cursor-pointer items-center gap-3 text-xs"
        >
          <Checkbox
            id={`${controlId}-split`}
            className="size-5 rounded-md border-2 border-muted-foreground bg-card focus-visible:ring-foreground"
            checked={split}
            disabled={applying}
            onCheckedChange={(checked) => setSplit(checked === true)}
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
            ? selectionChanged
              ? "Посмотреть новую цену"
              : "Проверить цену"
            : selectionChanged
              ? "Review new price"
              : "Check price"}
      </button>
      {preview ? (
        <section
          aria-label={
            ru ? "Сравнение перед сохранением" : "Comparison before saving"
          }
          className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
        >
          <h3 className="text-sm font-semibold">
            {unchanged
              ? ru
                ? "Выбор и стоимость не изменились"
                : "Selection and price are unchanged"
              : reconfirm
                ? ru
                  ? "Подтвердите актуальный расчёт"
                  : "Confirm the current quote"
                : storeChanged
                  ? ru
                    ? "Смена магазина"
                    : "Store change"
                  : ru
                    ? "Изменения перед сохранением"
                    : "Changes before saving"}
          </h3>
          {original && !sameSelectionAndPrice ? (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">
                {ru ? "Сейчас" : "Current selection"}
              </p>
              <p className="mb-2 text-sm font-medium">
                {storeTitle(savedOfferId)}
              </p>
              {amounts(original)}
              {destinationDetails(props.line.destination)}
            </div>
          ) : null}
          {preview.result.quotes.map((quote, index) => (
            <div
              key={`${quote.offerId}-${index}`}
              className="rounded-xl border border-border bg-card p-3"
            >
              <p className="text-xs text-muted-foreground">
                {sameSelectionAndPrice
                  ? ru
                    ? "Текущий выбор"
                    : "Current selection"
                  : ru
                    ? "После подтверждения"
                    : "After confirmation"}
              </p>
              <p className="mb-2 text-sm font-medium">
                {storeTitle(quote.offerId)}
              </p>
              {preview.result.quotes.length > 1 ? (
                <p className="mb-2 text-xs">
                  {ru ? "Заказ" : "Order"} {index + 1} · {quote.quantity}
                </p>
              ) : null}
              {amounts(quote)}
              {destinationDetails(
                quote.destination ?? preview.selections[index]?.destination,
              )}
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
          {comparisonQuotes.length ? (
            <details className="rounded-xl border border-border bg-card p-3 text-xs">
              <summary className="cursor-pointer font-medium">
                {ru
                  ? "Текущий магазин при новых параметрах"
                  : "Current store with the new parameters"}
              </summary>
              <p className="mt-2 text-muted-foreground">
                {ru
                  ? "Тот же товар, количество, адрес и доступные услуги в текущем магазине."
                  : "The same product, quantity, destination and available services at the current store."}
              </p>
              {comparisonQuotes.map((quote, index) => (
                <div key={`${quote.offerId}-${index}`} className="mt-3">
                  <p className="mb-2 font-medium">
                    {storeTitle(quote.offerId)}
                  </p>
                  {preview.result.quotes.length > 1 ? (
                    <p className="mb-2">
                      {ru ? "Заказ" : "Order"} {index + 1}
                    </p>
                  ) : null}
                  {amounts(quote)}
                  {destinationDetails(quote.destination)}
                  {quote.issues.map((issue) => (
                    <p
                      key={`${issue.code}-${issue.offerId}`}
                      role="alert"
                      className="mt-2 text-destructive"
                    >
                      {issue.message}
                    </p>
                  ))}
                </div>
              ))}
            </details>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {unchanged
              ? ru
                ? "Расчёт проверен. Текущий выбор сохранён."
                : "Price checked. Your current selection is saved."
              : reconfirm
                ? ru
                  ? "Цена не изменилась. Подтвердите актуальные условия перед оплатой."
                  : "The price is unchanged. Confirm the current terms before checkout."
                : ru
                  ? "Изменения сохранятся после подтверждения. Отмена сохранит прежний выбор."
                  : "Changes are saved after confirmation. Cancel keeps the previous selection."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={button}
              onClick={cancel}
              disabled={selectionMutation.isPending}
            >
              {unchanged
                ? ru
                  ? "Закрыть расчёт"
                  : "Close price check"
                : ru
                  ? "Отмена"
                  : "Cancel"}
            </button>
            {!unchanged ? (
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
            ) : null}
          </div>
        </section>
      ) : null}
    </fieldset>
  );
}
