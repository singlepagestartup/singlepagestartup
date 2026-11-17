"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { api as offerApi } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import { api as storeApi } from "@sps/ecommerce/models/store/sdk/client";
import { api as currencyApi } from "@sps/billing/models/currency/sdk/client";
import { Button } from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import { cn, formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";
import type { IEcommerceCartSelection } from "@sps/rbac/models/subject/sdk/model";
import type { IOfferServiceOption } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import { DeliveryAddress } from "../list/checkout-default/DeliveryAddress";
import {
  ServiceCard,
  ServiceOptions,
  ServiceNoSelection,
} from "../list/checkout-default/ServiceCard";
import { QuantityInput } from "../list/checkout-default/QuantityInput";
import type { IComponentPropsExtended, IConfiguredPurchase } from "./interface";

interface IServiceIntent {
  productId: string;
  role: IOfferServiceOption["role"];
  quantity: string;
  title: string;
}
interface IDraft {
  offerId: string;
  currencyId: string;
  quantity: string;
  address: string;
  pickup: string;
  method: string;
  services: Record<string, string>;
  transfer: IServiceIntent[] | null;
  missing: IServiceIntent[];
}

const input =
  "min-h-11 w-full min-w-0 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50";
const incompleteCodes = new Set([
  "delivery_required",
  "address_required",
  "pickup_required",
]);

export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  const formId = useId();
  const createOrder = api.ecommerceModuleOrderCreate({});
  function initialDraft(): IDraft {
    return {
      offerId: "",
      currencyId: "",
      quantity: "1",
      address: "",
      pickup: "",
      method: "",
      services: {},
      transfer: null,
      missing: [],
    };
  }
  const [draft, setDraft] = useState<IDraft>(initialDraft);
  const [requestedDraft, setRequestedDraft] = useState<IDraft>(draft);
  const draftRef = useRef(draft);
  const identity = `${props.data.id}:${props.ecommerceModuleProduct.id}:${props.ecommerceModuleStore?.id ?? ""}`;
  const currentIdentity = useRef(identity);
  currentIdentity.current = identity;
  const knownOptions = useRef(
    new Map<string, Map<string, IOfferServiceOption>>(),
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [secondaryOpen, setSecondaryOpen] = useState(false);
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
      (!props.ecommerceModuleStore ||
        offer.storeId === props.ecommerceModuleStore.id) &&
      !props.excludedOfferIds?.includes(offer.id) &&
      (props.ecommerceModuleProduct.kind !== "service" ||
        offer.settings?.standalone === true),
  );
  const selected =
    offers.find((offer) => offer.id === draft.offerId) ??
    (!draft.offerId && offers.length === 1 ? offers[0] : undefined);
  const requestedOffer =
    offers.find((offer) => offer.id === requestedDraft.offerId) ??
    (!requestedDraft.offerId && offers.length === 1 ? offers[0] : undefined);
  const storeIds = [...new Set(offers.map((offer) => offer.storeId))];
  const stores = storeApi.find({
    params: {
      filters: { and: [{ column: "id", method: "inArray", value: storeIds }] },
    },
    reactQueryOptions: { enabled: storeIds.length > 0 },
  });

  function selectionOf(value: IDraft, id: string): IEcommerceCartSelection {
    return {
      offerId: id,
      currencyId: value.currencyId,
      quantity: Number(value.quantity),
      destination:
        value.method === "shipping"
          ? {
              address: value.address,
            }
          : value.method === "pickup"
            ? { pickupPointId: value.pickup }
            : {},
      services: Object.entries(value.services).map(([offerId, quantity]) => ({
        offerId,
        quantity: Number(quantity),
      })),
    };
  }
  const selection = selectionOf(draft, selected?.id ?? "");
  const requested = selectionOf(requestedDraft, requestedOffer?.id ?? "");
  const signature = JSON.stringify(selection);
  const requestedSignature = JSON.stringify(requested);
  const validNumbers =
    Number.isSafeInteger(selection.quantity) &&
    selection.quantity > 0 &&
    (selection.services ?? []).every(
      (service) =>
        Number.isSafeInteger(service.quantity) &&
        service.quantity > 0 &&
        service.quantity <= selection.quantity,
    );
  const servicesExceedProduct = (selection.services ?? []).some(
    (service) => service.quantity > selection.quantity,
  );
  const quote = offerApi.quote({
    data: requested,
    reactQueryOptions: {
      enabled:
        Boolean(requestedOffer) &&
        Number.isSafeInteger(requested.quantity) &&
        requested.quantity > 0 &&
        (requested.services ?? []).every(
          (service) =>
            Number.isSafeInteger(service.quantity) &&
            service.quantity > 0 &&
            service.quantity <= requested.quantity,
        ),
    },
  });
  const metadata =
    quote.data?.offerId === selected?.id ? quote.data : undefined;
  const previousOptions = knownOptions.current.get(selected?.id ?? "");
  const options = metadata
    ? [
        ...metadata.serviceOptions,
        ...Object.keys(draft.services)
          .filter(
            (id) =>
              !metadata.serviceOptions.some((option) => option.offerId === id),
          )
          .map((id) => previousOptions?.get(id))
          .filter((option): option is IOfferServiceOption => Boolean(option)),
      ]
    : [...(previousOptions?.values() ?? [])];
  useEffect(() => {
    if (!metadata) return;
    const known =
      knownOptions.current.get(metadata.offerId) ??
      new Map<string, IOfferServiceOption>();
    for (const option of metadata.serviceOptions)
      known.set(option.offerId, option);
    knownOptions.current.set(metadata.offerId, known);
  }, [metadata?.offerId, JSON.stringify(metadata?.serviceOptions)]);
  const orderedOptions = [...options].sort(
    (a, b) => Number(b.role === "delivery") - Number(a.role === "delivery"),
  );
  const currencyIds = metadata?.currencyIds ?? [];
  const currencies = currencyApi.find({
    params: {
      filters: {
        and: [{ column: "id", method: "inArray", value: currencyIds }],
      },
    },
    reactQueryOptions: { enabled: currencyIds.length > 0 },
  });
  const currency =
    currencies.data?.find((currency) => currency.id === draft.currencyId) ??
    (props.billingModule?.currency?.id === draft.currencyId
      ? props.billingModule.currency
      : undefined);
  const symbol = currency?.symbol ?? "";
  const productQuantityMax = Math.min(
    quantityBounds.max,
    metadata?.availableQuantity ?? quantityBounds.max,
  );
  const productTitle =
    props.ecommerceModuleProduct.title?.[props.language] ||
    props.ecommerceModuleProduct.title?.en ||
    props.ecommerceModuleProduct.slug ||
    (ru ? "Товар" : "Product");
  const returnedServices =
    quote.data?.charges.filter((charge) => charge.role !== "product") ?? [];
  const serviceChargeMatches =
    returnedServices.every((charge) =>
      requested.services?.some(
        (service) =>
          service.offerId === charge.offerId &&
          service.quantity === charge.quantity,
      ),
    ) &&
    (quote.data?.issues.length ||
      returnedServices.length === requested.services?.length);
  const currentQuote =
    signature === requestedSignature &&
    quote.data?.offerId === selection.offerId &&
    quote.data.quantity === selection.quantity &&
    quote.data.currencyId === selection.currencyId &&
    (["address", "region", "pickupPointId"] as const).every(
      (key) =>
        (quote.data?.destination?.[key] ?? "") ===
        (selection.destination?.[key] ?? ""),
    ) &&
    serviceChargeMatches &&
    !quote.isError &&
    !quote.isFetching
      ? quote.data
      : undefined;
  const ready = Boolean(
    selected &&
    draft.currencyId &&
    validNumbers &&
    currencyIds.includes(draft.currencyId) &&
    !draft.transfer &&
    !draft.missing.length &&
    currentQuote?.version &&
    !currentQuote.issues.some((issue) => !incompleteCodes.has(issue.code)),
  );
  const paymentReady =
    ready && currentQuote?.amount !== null && !currentQuote?.issues.length;
  const cartConfiguration: IConfiguredPurchase | undefined =
    ready && selected && currentQuote
      ? {
          selection,
          storeId: selected.storeId,
          expectedQuoteVersion: currentQuote.version,
          quote: currentQuote,
          currencySymbol: symbol,
        }
      : undefined;
  const configuration =
    paymentReady && !createOrder.isPending ? cartConfiguration : undefined;

  function edit(update: (value: IDraft) => IDraft, wait = false) {
    if (timer.current) clearTimeout(timer.current);
    const next = update(draftRef.current);
    draftRef.current = next;
    setDraft(next);
    setError("");
    setAdded(false);
    if (wait) timer.current = setTimeout(() => setRequestedDraft(next), 350);
    else setRequestedDraft(next);
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    edit(() => initialDraft());
    setSecondaryOpen(false);
  }, [
    props.data.id,
    props.ecommerceModuleProduct.id,
    props.ecommerceModuleStore?.id,
  ]);
  useEffect(() => {
    if (
      draft.offerId &&
      !offers.some((offer) => offer.id === draft.offerId) &&
      !offersQuery.isPending
    ) {
      edit(() => initialDraft());
    }
  }, [props.excludedOfferIds, offersQuery.data]);
  useEffect(() => {
    if (metadata && !draft.currencyId && currencyIds.length) {
      const preferred = props.billingModule?.currency?.id;
      edit((value) => ({
        ...value,
        currencyId:
          preferred && currencyIds.includes(preferred)
            ? preferred
            : currencyIds[0],
      }));
    }
  }, [
    metadata?.offerId,
    currencyIds.join(","),
    draft.currencyId,
    props.billingModule?.currency?.id,
  ]);
  useEffect(() => {
    if (!draft.transfer || !metadata) return;
    const services: Record<string, string> = {};
    const missing: IServiceIntent[] = [];
    let method = "";
    for (const service of draft.transfer) {
      const matches = options.filter(
        (option) =>
          option.productId === service.productId &&
          option.role === service.role,
      );
      if (matches.length !== 1) missing.push(service);
      else {
        services[matches[0].offerId] = service.quantity;
        if (matches[0].role === "delivery")
          method = matches[0].receiptMethod ?? "";
      }
    }
    edit((value) => ({ ...value, services, missing, method, transfer: null }));
  }, [draft.transfer, metadata?.offerId, JSON.stringify(options)]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const configuration = cartConfiguration;
    if (!configuration || createOrder.isPending) return;
    setError("");
    const submittedSignature = signature;
    const submittedIdentity = currentIdentity.current;
    try {
      await createOrder.mutateAsync({
        id: props.data.id,
        data: {
          productId: props.ecommerceModuleProduct.id,
          offerId: configuration.selection.offerId,
          storeId: configuration.storeId,
          quantity: configuration.selection.quantity,
          billingModuleCurrencyId: configuration.selection.currencyId,
          destination: configuration.selection.destination,
          services: configuration.selection.services,
          expectedQuoteVersion: configuration.expectedQuoteVersion,
        },
      });
      if (
        submittedIdentity === currentIdentity.current &&
        (!draftRef.current.offerId ||
          draftRef.current.offerId === configuration.selection.offerId) &&
        JSON.stringify(
          selectionOf(draftRef.current, configuration.selection.offerId),
        ) === submittedSignature
      )
        setAdded(true);
    } catch (cause) {
      if (
        submittedIdentity !== currentIdentity.current ||
        (draftRef.current.offerId &&
          draftRef.current.offerId !== configuration.selection.offerId) ||
        JSON.stringify(
          selectionOf(draftRef.current, configuration.selection.offerId),
        ) !== submittedSignature
      )
        return;
      setError(
        cause instanceof Error
          ? cause.message
          : ru
            ? "Не удалось добавить товар."
            : "Could not add the product.",
      );
      if (
        cause instanceof Error &&
        /Conflict|409|Offer terms changed|Quote expired/i.test(cause.message)
      ) {
        await quote.refetch();
      }
    }
  }
  const currencyUnavailable = Boolean(
    draft.currencyId && metadata && !currencyIds.includes(draft.currencyId),
  );
  const priceScope =
    metadata?.offerId === selected?.id &&
    metadata?.currencyId === draft.currencyId &&
    metadata?.quantity === selection.quantity &&
    validNumbers;
  const productCharge = currentQuote?.charges.find(
    (charge) => charge.role === "product",
  );
  const changeService = useCallback(
    (offerId: string, checked: boolean) => {
      if (!offerId && !selected?.settings?.requiredDelivery) {
        edit((value) => ({
          ...value,
          method: "",
          services: Object.fromEntries(
            Object.entries(value.services).filter(
              ([id]) =>
                !options.some(
                  (option) =>
                    option.offerId === id && option.role === "delivery",
                ),
            ),
          ),
        }));
        return;
      }
      const option = options.find((option) => option.offerId === offerId);
      if (!option) return;
      edit((value) => {
        const services = { ...value.services };
        let method = value.method;
        if (option.role === "delivery") {
          if (checked)
            for (const other of options.filter(
              (other) => other.role === "delivery",
            ))
              delete services[other.offerId];
          method = checked ? (option.receiptMethod ?? "") : "";
        }
        if (checked) services[offerId] = "1";
        else delete services[offerId];
        return { ...value, services, method };
      });
    },
    [options, selected?.settings?.requiredDelivery],
  );
  const allOffersExcluded = Boolean(
    props.excludedOfferIds?.length && !offersQuery.isPending && !offers.length,
  );
  const secondary =
    Boolean(props.excludedOfferIds?.length) && !allOffersExcluded;
  const hideWhenIdle = allOffersExcluded || (secondary && !secondaryOpen);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("w-full min-w-0 space-y-4", props.className)}
    >
      {secondary ? (
        <button
          type="button"
          aria-expanded={secondaryOpen}
          aria-controls={`${formId}-configuration`}
          className="min-h-11 w-full rounded-xl border border-border px-3 py-2 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          onClick={() => setSecondaryOpen((open) => !open)}
        >
          {ru ? "Другое предложение" : "Another offer"}
        </button>
      ) : null}
      {!allOffersExcluded ? (
        <div
          id={`${formId}-configuration`}
          hidden={secondary && !secondaryOpen}
        >
          <form onSubmit={submit} className="space-y-3" noValidate>
            <div className="grid min-w-0 grid-cols-2 items-end gap-2 min-[480px]:grid-cols-[minmax(8rem,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <QuantityInput
                id={`${formId}-quantity`}
                label={ru ? "Количество" : "Quantity"}
                contextLabel={productTitle}
                decreaseLabel={`${ru ? "Уменьшить количество товара" : "Decrease product quantity"}: ${productTitle}`}
                increaseLabel={`${ru ? "Увеличить количество товара" : "Increase product quantity"}: ${productTitle}`}
                min={quantityBounds.min}
                max={productQuantityMax}
                value={draft.quantity}
                onValueChange={(quantity) => {
                  edit((value) => ({ ...value, quantity }), true);
                }}
              />
              <div className="grid min-w-0 gap-1 text-xs font-medium">
                <label htmlFor={`${formId}-currency`}>
                  {ru ? "Валюта" : "Currency"}
                </label>
                <Select
                  ui="shadcn"
                  id={`${formId}-currency`}
                  className={input}
                  value={
                    currencyIds.includes(draft.currencyId)
                      ? draft.currencyId
                      : ""
                  }
                  disabled={!selected || !currencyIds.length}
                  placeholder={ru ? "Выберите валюту" : "Choose currency"}
                  options={currencyIds.map((id) => ({
                    value: id,
                    label:
                      currencies.data
                        ?.find((currency) => currency.id === id)
                        ?.slug?.toUpperCase() ||
                      (ru ? "Загружаем…" : "Loading…"),
                  }))}
                  onValueChange={(currencyId) =>
                    edit((value) => ({ ...value, currencyId }))
                  }
                />
              </div>
              <div className="col-span-2 flex min-w-0 items-center justify-between gap-2 min-[480px]:col-span-1 min-[480px]:grid min-[480px]:justify-normal min-[480px]:gap-1 min-[480px]:text-right">
                <span className="text-xs text-muted-foreground">
                  {ru ? "За 1 шт." : "Per item"}
                </span>
                <output
                  aria-label={ru ? "Цена за 1 шт." : "Unit price"}
                  className="flex min-h-6 items-center justify-end break-words text-sm font-semibold tabular-nums min-[480px]:min-h-12"
                >
                  {(() => {
                    const currentCharge =
                      productCharge &&
                      productCharge.offerId === selection.offerId &&
                      productCharge.quantity === selection.quantity;
                    const amount =
                      productCharge?.unitAmount !== undefined
                        ? productCharge.unitAmount
                        : productCharge?.quantity === 1
                          ? productCharge.amount
                          : undefined;
                    if (
                      currentCharge &&
                      amount !== null &&
                      amount !== undefined
                    ) {
                      return `${formatCurrencyAmount(amount, props.language)} ${symbol}`;
                    }
                    return quote.isFetching || signature !== requestedSignature
                      ? "…"
                      : "—";
                  })()}
                </output>
              </div>
            </div>
            <div className="grid gap-1 text-xs font-medium">
              <label htmlFor={`${formId}-store`}>
                {ru ? "Магазин" : "Store"}
              </label>
              <Select
                ui="shadcn"
                id={`${formId}-store`}
                className={input}
                value={selected?.id ?? ""}
                disabled={offersQuery.isPending}
                placeholder={ru ? "Выберите магазин" : "Choose a store"}
                options={offers.map((offer) => {
                  const store = stores.data?.find(
                    (store) => store.id === offer.storeId,
                  );
                  const name =
                    store?.title?.[props.language] ||
                    store?.title?.en ||
                    store?.slug ||
                    (ru ? "Магазин" : "Store");
                  return {
                    value: offer.id,
                    label:
                      offers.filter(
                        (candidate) => candidate.storeId === offer.storeId,
                      ).length > 1
                        ? `${name} · ${offer.sku}`
                        : name,
                  };
                })}
                onValueChange={(offerId) =>
                  edit((value) => ({
                    ...value,
                    offerId,
                    services: {},
                    missing: [],
                    pickup: "",
                    transfer: [
                      ...Object.entries(value.services).map(
                        ([id, quantity]) => {
                          const option = options.find(
                            (option) => option.offerId === id,
                          );
                          return {
                            productId: option?.productId ?? id,
                            role: option?.role ?? "add-on",
                            quantity,
                            title:
                              option?.titles?.[props.language] ||
                              option?.title ||
                              id,
                          };
                        },
                      ),
                      ...value.missing,
                    ],
                  }))
                }
              />
            </div>
            {orderedOptions.length ? (
              <div className="space-y-3">
                {(["delivery", "add-on"] as const).map((role) => {
                  const groupOptions = orderedOptions.filter(
                    (option) => option.role === role,
                  );
                  if (!groupOptions.length) return null;
                  const mandatory = Boolean(
                    selected?.settings?.requiredDelivery,
                  );
                  return (
                    <fieldset key={role} className="space-y-1.5">
                      <legend
                        id={formId + "-" + role + "-legend"}
                        className="mb-1 text-xs font-medium"
                      >
                        {role === "delivery"
                          ? ru
                            ? "Получение"
                            : "Fulfillment"
                          : ru
                            ? "Дополнительные услуги"
                            : "Additional services"}
                      </legend>
                      <div className="text-xs leading-4 text-muted-foreground">
                        {role === "delivery"
                          ? mandatory
                            ? ru
                              ? "Выберите один вариант"
                              : "Choose one option"
                            : ru
                              ? "Необязательно · один вариант"
                              : "Optional · one option"
                          : ru
                            ? "Можно выбрать несколько"
                            : "Choose any number"}
                      </div>
                      <ServiceOptions
                        id={formId + "-" + role + "-options"}
                        labelId={formId + "-" + role + "-legend"}
                        selectionName={formId + "-fulfillment"}
                        multiple={role === "add-on"}
                        required={mandatory}
                        value={
                          options.find(
                            (option) =>
                              option.role === "delivery" &&
                              draft.services[option.offerId] !== undefined,
                          )?.offerId ?? ""
                        }
                        onValueChange={(offerId) =>
                          changeService(offerId, true)
                        }
                      >
                        {role === "delivery" && !mandatory ? (
                          <ServiceNoSelection
                            id={formId + "-fulfillment-none"}
                            language={props.language}
                          />
                        ) : null}
                        {groupOptions.map((option) => {
                          const id = `${formId}-${option.offerId}`;
                          const checked =
                            draft.services[option.offerId] !== undefined;
                          const charge = currentQuote?.charges.find(
                            (charge) =>
                              charge.offerId === option.offerId &&
                              charge.quantity ===
                                Number(draft.services[option.offerId]),
                          );
                          const serverOption = metadata?.serviceOptions.find(
                            (item) => item.offerId === option.offerId,
                          );
                          const preview = priceScope
                            ? serverOption?.pricePreview
                            : undefined;
                          const tariff =
                            metadata?.currencyId === draft.currencyId
                              ? serverOption?.deliveryTariff
                              : undefined;
                          const amount =
                            charge?.amount ??
                            preview?.amount ??
                            (option.receiptMethod === "shipping" &&
                            tariff?.basis === "fixed"
                              ? tariff.fixedAmount
                              : undefined);
                          return (
                            <ServiceCard
                              key={option.offerId}
                              id={id}
                              language={props.language}
                              option={option}
                              checked={checked}
                              amount={amount}
                              from={!charge && preview?.kind === "from"}
                              currencySymbol={symbol}
                              tariff={tariff}
                              distanceKm={charge?.inputs?.distance_km}
                              pending={
                                Boolean(quote.isFetching) ||
                                signature !== requestedSignature
                              }
                              onCheckedChange={changeService}
                            >
                              {checked ? (
                                <div className="space-y-3 px-3 pb-3">
                                  {option.receiptMethod === "shipping" ? (
                                    <DeliveryAddress
                                      id={`${id}-address`}
                                      label={
                                        ru
                                          ? "Адрес доставки"
                                          : "Delivery address"
                                      }
                                      value={draft.address}
                                      offerId={option.offerId}
                                      language={props.language}
                                      className={input}
                                      onChange={(address, selected) =>
                                        edit(
                                          (value) => ({ ...value, address }),
                                          !selected,
                                        )
                                      }
                                    />
                                  ) : null}
                                  {option.receiptMethod === "pickup" ? (
                                    <div className="grid gap-1 text-xs">
                                      <label htmlFor={`${id}-pickup`}>
                                        {ru
                                          ? "Точка самовывоза"
                                          : "Pickup point"}
                                      </label>
                                      <Select
                                        ui="shadcn"
                                        id={`${id}-pickup`}
                                        className={input}
                                        value={draft.pickup}
                                        placeholder={
                                          ru
                                            ? "Выберите точку магазина"
                                            : "Choose a store location"
                                        }
                                        options={(
                                          option.pickupPointIds ?? []
                                        ).map((id) => ({
                                          value: id,
                                          label: id,
                                        }))}
                                        onValueChange={(pickup) =>
                                          edit((value) => ({
                                            ...value,
                                            pickup,
                                          }))
                                        }
                                      />
                                    </div>
                                  ) : null}
                                  {option.role === "add-on" ? (
                                    <QuantityInput
                                      id={`${id}-quantity`}
                                      label={
                                        ru
                                          ? "Количество единиц услуги"
                                          : "Service quantity"
                                      }
                                      contextLabel={`${option.titles?.[props.language] || option.title || option.productId} · ${productTitle}`}
                                      decreaseLabel={`${ru ? "Уменьшить количество услуги" : "Decrease service quantity"}: ${option.titles?.[props.language] || option.title || option.productId} (${productTitle})`}
                                      increaseLabel={`${ru ? "Увеличить количество услуги" : "Increase service quantity"}: ${option.titles?.[props.language] || option.title || option.productId} (${productTitle})`}
                                      min={quantityBounds.min}
                                      max={Math.max(
                                        0,
                                        Math.min(
                                          Number.isSafeInteger(
                                            selection.quantity,
                                          )
                                            ? selection.quantity
                                            : 0,
                                          charge?.availableQuantity ??
                                            metadata?.charges.find(
                                              (item) =>
                                                item.offerId === option.offerId,
                                            )?.availableQuantity ??
                                            quantityBounds.max,
                                        ),
                                      )}
                                      value={draft.services[option.offerId]}
                                      onValueChange={(quantity) => {
                                        edit(
                                          (value) => ({
                                            ...value,
                                            services: {
                                              ...value.services,
                                              [option.offerId]: quantity,
                                            },
                                          }),
                                          true,
                                        );
                                      }}
                                    />
                                  ) : null}
                                </div>
                              ) : null}
                            </ServiceCard>
                          );
                        })}
                      </ServiceOptions>
                    </fieldset>
                  );
                })}
              </div>
            ) : null}
            {draft.missing.length ? (
              <div className="space-y-2 text-xs text-destructive">
                <p role="alert">
                  {ru ? "Недоступные услуги" : "Unavailable services"}:{" "}
                  {draft.missing.map((service) => service.title).join(", ")}
                </p>
                <button
                  type="button"
                  className="min-h-11 underline"
                  onClick={() => edit((value) => ({ ...value, missing: [] }))}
                >
                  {ru
                    ? "Убрать недоступные услуги"
                    : "Remove unavailable services"}
                </button>
              </div>
            ) : null}
            {!validNumbers ? (
              <p role="alert" className="text-xs text-destructive">
                {servicesExceedProduct
                  ? ru
                    ? "Количество услуги не может превышать количество товара."
                    : "Service quantity cannot exceed product quantity."
                  : ru
                    ? "Укажите целое положительное количество."
                    : "Enter a positive whole quantity."}
              </p>
            ) : null}
            {currencyUnavailable ? (
              <p role="alert" className="text-xs text-destructive">
                {ru
                  ? "Выбранная валюта недоступна. Выберите другую валюту."
                  : "The selected currency is unavailable. Choose another currency."}
              </p>
            ) : null}
            {offersQuery.isError || quote.isError ? (
              <div className="space-y-2">
                <p role="alert" className="text-xs text-destructive">
                  {ru
                    ? "Не удалось загрузить предложения."
                    : "Could not load offers."}
                </p>
                <button
                  type="button"
                  className="min-h-11 text-sm underline"
                  onClick={() => {
                    void offersQuery.refetch();
                    void quote.refetch();
                  }}
                >
                  {ru ? "Повторить загрузку" : "Retry loading"}
                </button>
              </div>
            ) : null}
            {!offersQuery.isPending && !offers.length ? (
              <p className="text-sm text-muted-foreground">
                {ru ? "Нет доступных предложений." : "No available offers."}
              </p>
            ) : null}
            <section
              aria-label={ru ? "Расчёт" : "Receipt"}
              aria-busy={quote.isFetching || signature !== requestedSignature}
              className="space-y-2 rounded-xl border border-border bg-card p-3"
            >
              <h3 className="text-sm font-semibold">
                {ru ? "Расчёт" : "Receipt"}
              </h3>
              {quote.isFetching || signature !== requestedSignature ? (
                <p role="status" className="text-xs text-muted-foreground">
                  {ru ? "Рассчитываем…" : "Calculating…"}
                </p>
              ) : null}
              {currentQuote?.issues
                .filter((issue) => !incompleteCodes.has(issue.code))
                .map((issue) => (
                  <p
                    key={`${issue.offerId}-${issue.code}`}
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {issue.message}
                  </p>
                ))}
              <dl className="space-y-1 text-xs">
                {currentQuote?.charges.map((charge) => (
                  <div
                    key={charge.offerId}
                    className="flex justify-between gap-3"
                  >
                    <dt>
                      {charge.role === "product"
                        ? props.ecommerceModuleProduct.title?.[
                            props.language
                          ] ||
                          props.ecommerceModuleProduct.title?.en ||
                          (ru ? "Товар" : "Product")
                        : options.find(
                            (option) => option.offerId === charge.offerId,
                          )?.titles?.[props.language] ||
                          options.find(
                            (option) => option.offerId === charge.offerId,
                          )?.title ||
                          (ru ? "Услуга" : "Service")}{" "}
                      × {charge.quantity}
                    </dt>
                    <dd className="shrink-0 tabular-nums">
                      {formatCurrencyAmount(charge.amount, props.language)}{" "}
                      {symbol}
                    </dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold">
                  <dt>{ru ? "Итого" : "Total"}</dt>
                  <dd className="shrink-0 tabular-nums">
                    {paymentReady &&
                    currentQuote?.amount !== null &&
                    currentQuote?.amount !== undefined
                      ? `${formatCurrencyAmount(currentQuote.amount, props.language)} ${symbol}`
                      : quote.isFetching || signature !== requestedSignature
                        ? "…"
                        : ru
                          ? "Нужен выбор"
                          : "Selection needed"}
                  </dd>
                </div>
              </dl>
            </section>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {ready &&
            currentQuote?.issues.some((issue) =>
              incompleteCodes.has(issue.code),
            ) ? (
              <p className="text-xs text-muted-foreground">
                {ru
                  ? "Получение, адрес и услуги можно уточнить в корзине. Для оплаты завершите выбор."
                  : "You can finish fulfillment, address and services in the cart. Complete the selection before payment."}
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
            {added ? (
              <p role="status" className="text-xs text-muted-foreground">
                {ru ? "Товар в корзине." : "Added to your cart."}
              </p>
            ) : null}
          </form>
        </div>
      ) : null}
      {props.checkoutSlot?.(configuration, {
        refreshQuote: () => quote.refetch(),
        hideWhenIdle,
      })}
    </div>
  );
}
