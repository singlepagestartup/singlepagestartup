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
} from "../list/checkout-default/ServiceCard";
import { QuantityInput } from "../list/checkout-default/QuantityInput";
import type { IComponentPropsExtended, IConfiguredPurchase } from "./interface";

interface IServiceIntent {
  offerId: string;
  serviceKey?: string;
  quantity: string;
}
interface IDraft {
  offerId: string;
  currencyId: string;
  quantity: string;
  address: string;
  method: string;
  services: Record<string, string>;
  transfer: IServiceIntent[] | null;
}

const input =
  "min-h-11 w-full min-w-0 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50";
const incompleteCodes = new Set(["address_required"]);

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
      method: "",
      services: {},
      transfer: null,
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
      offer.settings?.initialGrant !== true &&
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
  const options = metadata?.serviceOptions ?? [
    ...(previousOptions?.values() ?? []),
  ];
  useEffect(() => {
    if (!metadata) return;
    const known =
      knownOptions.current.get(metadata.offerId) ??
      new Map<string, IOfferServiceOption>();
    for (const option of metadata.serviceOptions) {
      known.set(option.offerId, option);
    }
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
    (["address", "region"] as const).every(
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
    let method = "";
    for (const service of draft.transfer) {
      const exact = options.find(
        (option) =>
          option.offerId === service.offerId ||
          option.compatibleOfferIds?.includes(service.offerId) ||
          Boolean(
            service.serviceKey && option.serviceKey === service.serviceKey,
          ),
      );
      if (exact) {
        services[exact.offerId] = service.quantity;
        if (exact.role === "delivery") method = exact.receiptMethod ?? "";
      }
    }
    edit((value) => ({ ...value, services, method, transfer: null }));
  }, [draft.transfer, metadata?.offerId, JSON.stringify(options)]);

  useEffect(() => {
    if (
      !metadata ||
      !metadata.selectedServices ||
      draft.transfer ||
      !validNumbers ||
      quote.isFetching ||
      signature !== requestedSignature ||
      metadata.currencyId !== draft.currencyId ||
      metadata.quantity !== selection.quantity
    )
      return;
    const canonical = (id: string) =>
      metadata.serviceOptions.find(
        (option) =>
          option.offerId === id || option.compatibleOfferIds?.includes(id),
      );
    // Retained quote data must not replace an explicit edit made after that request.
    if (
      Object.entries(draft.services).some(([id, count]) => {
        const option = canonical(id);
        return (
          option &&
          !metadata.selectedServices?.some(
            (selected) =>
              canonical(selected.offerId)?.offerId === option.offerId &&
              selected.quantity === Number(count),
          )
        );
      })
    )
      return;
    const services = Object.fromEntries(
      metadata.selectedServices.flatMap((selected) => {
        const option = canonical(selected.offerId);
        if (!option) return [];
        // Additional services are selected by the buyer, never by a retained quote.
        if (
          option.role === "add-on" &&
          !Object.keys(draft.services).some(
            (id) => canonical(id)?.offerId === option.offerId,
          )
        )
          return [];
        return [[option.offerId, String(selected.quantity)]];
      }),
    );
    const method =
      metadata.serviceOptions.find(
        (option) =>
          option.role === "delivery" && services[option.offerId] !== undefined,
      )?.receiptMethod ?? "";
    if (
      JSON.stringify(services) !== JSON.stringify(draft.services) ||
      method !== draft.method
    )
      edit((current) => ({ ...current, services, method }));
  }, [
    metadata,
    signature,
    requestedSignature,
    draft.transfer,
    validNumbers,
    quote.isFetching,
  ]);

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
    [options],
  );
  const allOffersExcluded = Boolean(
    props.excludedOfferIds?.length && !offersQuery.isPending && !offers.length,
  );
  const hideWhenIdle = Boolean(props.hideConfiguration || allOffersExcluded);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn("w-full min-w-0 space-y-4", props.className)}
    >
      {!hideWhenIdle ? (
        <div id={`${formId}-configuration`}>
          <form onSubmit={submit} className="@container space-y-3" noValidate>
            <div className="grid min-w-0 grid-cols-2 items-end gap-x-3 gap-y-2 @[420px]:grid-cols-[minmax(8rem,1fr)_minmax(5rem,1fr)_auto]">
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
              <div className="col-span-2 flex min-w-0 flex-wrap items-baseline justify-end gap-x-1.5 gap-y-0.5 @[420px]:col-span-1 @[420px]:min-h-12 @[420px]:items-center">
                <output
                  aria-label={ru ? "Цена за 1 шт." : "Unit price"}
                  className="min-w-0 break-words text-sm font-semibold tabular-nums"
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
                </output>{" "}
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {ru ? "за 1 шт." : "per item"}
                </span>
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
                    transfer: [
                      ...Object.entries(value.services).map(
                        ([id, quantity]) => {
                          const option = options.find(
                            (option) => option.offerId === id,
                          );
                          return {
                            offerId: id,
                            serviceKey: option?.serviceKey,
                            quantity,
                          };
                        },
                      ),
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
                  const mandatory = role === "delivery";
                  return (
                    <fieldset key={role} className="space-y-1.5">
                      <legend
                        id={formId + "-" + role + "-legend"}
                        className="mb-1 text-xs font-medium"
                      >
                        {role === "delivery"
                          ? ru
                            ? "Доставка"
                            : "Delivery"
                          : ru
                            ? "Дополнительные услуги"
                            : "Additional services"}
                      </legend>
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
                              {option.receiptMethod === "shipping" ||
                              option.role === "add-on" ? (
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
                    {ru && issue.code === "delivery_required"
                      ? "Для выбранных условий заказа нет доступного способа получения."
                      : issue.message}
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
