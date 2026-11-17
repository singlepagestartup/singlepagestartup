"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Select } from "@sps/ui-adapter";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { api as offerApi } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import { api as currencyApi } from "@sps/billing/models/currency/sdk/client";
import {
  route,
  type IEcommerceCartSelection,
  type IEcommerceCartSelectionResult,
} from "@sps/rbac/models/subject/sdk/model";
import type { IOfferServiceOption } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { ISelectionProps } from "./interface";
import { DeliveryAddress } from "./DeliveryAddress";
import { ServiceCard, ServiceOptions } from "./ServiceCard";
import { QuantityInput } from "./QuantityInput";

interface ITransferredService {
  offerId: string;
  serviceKey?: string;
  quantity: string;
}

interface IDraft {
  offerId: string;
  currencyId: string;
  quantity: string;
  address: string;
  region: string;
  services: Record<string, string>;
  transfer: ITransferredService[] | null;
}

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

  function savedDraft(): IDraft {
    return {
      offerId: props.line.offerId ?? original?.offerId ?? "",
      currencyId: props.details.billingModuleCurrencyId ?? "",
      quantity: String(props.line.quantity),
      address: props.line.destination?.address ?? "",
      region: props.line.destination?.region ?? "",
      services: Object.fromEntries(
        children.map((child) => [child.offerId!, String(child.quantity)]),
      ),
      transfer: null,
    };
  }

  const [draft, setDraftState] = useState<IDraft>(savedDraft);
  const draftValue = useRef(draft);
  const [discoveryQuantity, setDiscoveryQuantity] = useState(
    props.line.quantity,
  );
  const [readyRevision, setReadyRevision] = useState(0);
  const [pending, setPending] = useState(false);
  const [awaitingRefresh, setAwaitingRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [receipt, setReceipt] = useState<IEcommerceCartSelectionResult | null>(
    null,
  );
  const [error, setError] = useState("");
  const revision = useRef(0);
  const appliedRevision = useRef(0);
  const attemptedRevision = useRef(0);
  const saving = useRef(false);
  const savingPersistable = useRef(false);
  const mounted = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conflict = useRef(false);
  const refresh = useRef<{ revision: number; timestamp: string } | null>(null);
  const selectionUpdatedAt = useRef(
    new Date(props.line.selectionUpdatedAt).toISOString(),
  );
  const observedSelectionUpdatedAt = useRef(selectionUpdatedAt.current);
  const callback = useRef(props.onSelectionStateChange);
  callback.current = props.onSelectionStateChange;
  const pendingCallback = useRef(props.onSelectionPendingChange);
  pendingCallback.current = props.onSelectionPendingChange;
  const blocked = useRef(false);
  const closePending = useRef(false);
  const knownOptions = useRef(
    new Map<string, IOfferServiceOption>(
      (original?.serviceOptions ?? []).map((option) => [
        option.offerId,
        option,
      ]),
    ),
  );
  const selectionMutation = api.ecommerceModuleOrderSelection({});
  const previewMutation = api.ecommerceModuleOrderSelection({});
  const [previewRetry, setPreviewRetry] = useState(0);
  const queries = useQueryClient();
  const choices = (props.details.offers ?? []).filter(
    (offer) =>
      offer.productId === props.line.productId &&
      offer.variant === "default" &&
      (props.line.product?.kind !== "service" ||
        offer.settings?.standalone === true),
  );
  const quantity = Number(draft.quantity);
  const validDiscoveryQuantity =
    Number.isSafeInteger(quantity) &&
    quantity > 0 &&
    quantity <= (props.details.maxLineQuantity ?? Number.MAX_SAFE_INTEGER);
  useEffect(() => {
    if (!validDiscoveryQuantity || quantity === discoveryQuantity) return;
    const timeout = setTimeout(() => setDiscoveryQuantity(quantity), 350);
    return () => clearTimeout(timeout);
  }, [quantity, discoveryQuantity, validDiscoveryQuantity]);
  const discoveryShipping = Object.keys(draft.services).some(
    (id) => knownOptions.current.get(id)?.receiptMethod === "shipping",
  );
  const discoverySelection: IEcommerceCartSelection = {
    offerId: draft.offerId,
    quantity: discoveryQuantity,
    currencyId: draft.currencyId,
    destination: discoveryShipping
      ? {
          ...(draft.address ? { address: draft.address } : {}),
          ...(draft.region ? { region: draft.region } : {}),
        }
      : {},
    services: Object.entries(draft.services).map(([offerId, count]) => ({
      offerId,
      quantity: Number(count),
    })),
  };
  const discoveryEnabled =
    Boolean(draft.offerId) &&
    validDiscoveryQuantity &&
    Object.values(draft.services).every(
      (count) =>
        Number.isSafeInteger(Number(count)) &&
        Number(count) > 0 &&
        Number(count) <= quantity,
    );
  // Renewal lineage selects the scoped reader. Its server verifies paid fulfillment.
  const renewal = Boolean(
    props.ecommerceModuleOrder.subscriptionSourceOrderId ||
    props.ecommerceModuleOrder.subscriptionSourceInvoiceId,
  );
  const discoverySignature = JSON.stringify(discoverySelection);
  const publicDiscovery = offerApi.quote({
    data: discoverySelection,
    reactQueryOptions: { enabled: discoveryEnabled && !renewal },
  });
  useEffect(() => {
    if (!renewal || !discoveryEnabled) return;
    void previewMutation
      .mutateAsync({
        id: props.subject.id,
        orderId: props.ecommerceModuleOrder.id,
        data: {
          action: "preview",
          lineId: props.line.id,
          selections: [discoverySelection],
        },
      })
      .catch(() => undefined);
  }, [
    renewal,
    discoveryEnabled,
    discoverySignature,
    props.subject.id,
    props.ecommerceModuleOrder.id,
    props.line.id,
    previewRetry,
  ]);
  const previewMatches =
    previewMutation.variables?.id === props.subject.id &&
    previewMutation.variables.orderId === props.ecommerceModuleOrder.id &&
    previewMutation.variables.data.lineId === props.line.id &&
    JSON.stringify(previewMutation.variables.data.selections[0]) ===
      discoverySignature;
  const discovery = renewal
    ? {
        data: previewMatches ? previewMutation.data?.quotes[0] : undefined,
        isFetching:
          discoveryEnabled && (!previewMatches || previewMutation.isPending),
        isError: previewMatches && previewMutation.isError,
        refetch: () => setPreviewRetry((value) => value + 1),
      }
    : publicDiscovery;
  const available =
    discovery.data?.offerId === draft.offerId
      ? discovery.data
      : original?.offerId === draft.offerId
        ? original
        : undefined;
  const productQuantityMax = Math.min(
    props.details.maxLineQuantity ?? quantityBounds.max,
    available?.availableQuantity ?? quantityBounds.max,
  );
  const productTitle =
    props.line.product?.title?.[props.language] ||
    props.line.product?.title?.en ||
    props.line.product?.slug ||
    (ru ? "Товар" : "Product");
  const options = (available?.serviceOptions ?? []).filter(
    (option) =>
      !available?.fulfillmentAlreadySatisfied || option.role !== "delivery",
  );
  const serviceOptions = [...options].sort(
    (first, second) =>
      Number(second.role === "delivery") - Number(first.role === "delivery"),
  );
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
  const selectedOptions = options.filter(
    (option) => draft.services[option.offerId] !== undefined,
  );
  const shippingOption = selectedOptions.find(
    (option) => option.receiptMethod === "shipping",
  );
  const shipping = Boolean(shippingOption);

  function reportBlocked(value: boolean) {
    if (blocked.current === value) return;
    blocked.current = value;
    callback.current?.(props.line.id, value);
  }

  function reportPending(value: boolean) {
    if (closePending.current === value) return;
    closePending.current = value;
    pendingCallback.current?.(props.line.id, value);
  }

  function setDraft(update: (current: IDraft) => IDraft) {
    const next = update(draftValue.current);
    draftValue.current = next;
    setDraftState(next);
    return next;
  }

  function canPersist(next: IDraft) {
    const count = Number(next.quantity);
    if (
      !next.offerId ||
      !next.currencyId ||
      !Number.isSafeInteger(count) ||
      count < 1 ||
      count > productQuantityMax ||
      Object.values(next.services).some(
        (quantity) =>
          !Number.isSafeInteger(Number(quantity)) ||
          Number(quantity) < 1 ||
          Number(quantity) > count,
      )
    )
      return false;
    if (next.transfer) return true;
    const metadata =
      available?.offerId === next.offerId ? available : undefined;
    if (!metadata) return draft.offerId !== next.offerId || !discovery.isError;
    if (
      !metadata.currencyIds.includes(next.currencyId) ||
      Object.keys(next.services).some(
        (id) =>
          !metadata.serviceOptions.some((option) => option.offerId === id),
      )
    )
      return false;
    const selected = metadata.serviceOptions.filter(
      (option) => next.services[option.offerId] !== undefined,
    );
    const delivers = selected.some(
      (option) => option.receiptMethod === "shipping",
    );
    if (
      (delivers && !next.address.trim()) ||
      (!metadata.fulfillmentAlreadySatisfied &&
        metadata.serviceOptions.some((option) => option.role === "delivery") &&
        !selected.some((option) => option.role === "delivery"))
    )
      return false;
    return true;
  }

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (debounce.current) clearTimeout(debounce.current);
      callback.current?.(props.line.id, false);
      pendingCallback.current?.(props.line.id, false);
    };
  }, [props.line.id]);

  useEffect(() => {
    for (const option of available?.serviceOptions ?? []) {
      knownOptions.current.set(option.offerId, option);
      for (const id of option.compatibleOfferIds ?? [])
        knownOptions.current.set(id, option);
    }
  }, [available]);

  useEffect(() => {
    if (!draft.transfer || !available) return;
    const matched: Record<string, string> = {};
    for (const selected of draft.transfer) {
      const exact = available.serviceOptions.find(
        (option) =>
          option.offerId === selected.offerId ||
          option.compatibleOfferIds?.includes(selected.offerId) ||
          Boolean(
            selected.serviceKey && option.serviceKey === selected.serviceKey,
          ),
      );
      if (exact) matched[exact.offerId] = selected.quantity;
    }
    setDraft((current) =>
      current.transfer === draft.transfer
        ? { ...current, services: matched, transfer: null }
        : current,
    );
  }, [draft.transfer, available]);

  useEffect(() => {
    const metadata = discovery.data;
    if (
      !metadata?.selectedServices ||
      discovery.isFetching ||
      draft.transfer ||
      !validDiscoveryQuantity ||
      quantity !== discoveryQuantity ||
      metadata.offerId !== draft.offerId ||
      metadata.currencyId !== draft.currencyId ||
      metadata.quantity !== quantity ||
      Object.values(draft.services).some(
        (count) =>
          !Number.isSafeInteger(Number(count)) ||
          Number(count) < 1 ||
          Number(count) > quantity,
      )
    )
      return;
    const canonical = (id: string) =>
      metadata.serviceOptions.find(
        (option) =>
          (!metadata.fulfillmentAlreadySatisfied ||
            option.role !== "delivery") &&
          (option.offerId === id || option.compatibleOfferIds?.includes(id)),
      );
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
    if (JSON.stringify(services) !== JSON.stringify(draft.services))
      edit((current) => ({ ...current, services }));
  }, [
    discovery.data,
    discovery.isFetching,
    draft,
    discoveryQuantity,
    validDiscoveryQuantity,
  ]);

  // A cart refetch must not replace edits made while its save was in flight.
  useEffect(() => {
    const next = new Date(props.line.selectionUpdatedAt).toISOString();
    if (next === observedSelectionUpdatedAt.current) return;
    observedSelectionUpdatedAt.current = next;
    if (
      saving.current ||
      refresh.current ||
      revision.current !== appliedRevision.current
    )
      return;
    selectionUpdatedAt.current = next;
    setDraft(() => savedDraft());
    setReceipt(null);
  }, [props.line.selectionUpdatedAt]);

  useEffect(() => {
    const expected = refresh.current;
    if (!expected || saving.current) return;
    const latest = expected.revision === revision.current;
    const received = new Date(props.line.selectionUpdatedAt).toISOString();
    if (received !== expected.timestamp) {
      if (
        new Date(received).getTime() > new Date(expected.timestamp).getTime()
      ) {
        refresh.current = null;
        setAwaitingRefresh(false);
        if (latest) {
          appliedRevision.current = expected.revision - 1;
          conflict.current = true;
          setError(
            ru
              ? "Позиция изменилась в другом окне. Проверьте параметры и повторите сохранение."
              : "This item changed in another window. Review your choices and retry saving.",
          );
        }
      }
      return;
    }
    refresh.current = null;
    setAwaitingRefresh(false);
    setRefreshError("");
    if (latest) {
      setReceipt(null);
      reportBlocked(false);
    }
  }, [props.line.selectionUpdatedAt, awaitingRefresh, pending]);

  function edit(update: (current: IDraft) => IDraft, wait = false) {
    const nextRevision = ++revision.current;
    if (debounce.current) clearTimeout(debounce.current);
    reportBlocked(true);
    conflict.current = false;
    setError("");
    setRefreshError("");
    setReceipt(null);
    const next = setDraft(update);
    reportPending(savingPersistable.current || canPersist(next));
    if (wait) {
      debounce.current = setTimeout(() => {
        if (mounted.current) setReadyRevision(nextRevision);
      }, 350);
    } else {
      setReadyRevision(nextRevision);
    }
  }

  function changeSeller(offerId: string) {
    if (offerId === draft.offerId) return;
    edit((current) => {
      const preserved = current.transfer ?? [
        ...Object.entries(current.services).map(([id, count]) => {
          const option = knownOptions.current.get(id);
          return {
            offerId: id,
            serviceKey: option?.serviceKey,
            quantity: count,
          };
        }),
      ];
      return {
        ...current,
        offerId,
        services: {},
        transfer: preserved,
      };
    });
  }

  function selections(): IEcommerceCartSelection[] {
    const destination = shipping
      ? {
          address: draft.address,
          ...(draft.region ? { region: draft.region } : {}),
        }
      : {};
    const services = Object.entries(draft.services)
      .filter(([id]) => options.some((option) => option.offerId === id))
      .map(([offerId, count]) => ({ offerId, quantity: Number(count) }));
    const first = {
      offerId: draft.offerId,
      quantity,
      currencyId: draft.currencyId,
      destination,
      services,
    };
    return [first];
  }

  const validQuantities =
    Number.isSafeInteger(quantity) &&
    quantity > 0 &&
    quantity <= (props.details.maxLineQuantity ?? Number.MAX_SAFE_INTEGER) &&
    Object.values(draft.services).every(
      (count) => Number.isSafeInteger(Number(count)) && Number(count) > 0,
    );
  const validInput =
    Boolean(draft.offerId && draft.currencyId && available) &&
    validQuantities &&
    !draft.transfer &&
    Object.keys(draft.services).every((id) =>
      options.some((option) => option.offerId === id),
    );

  useEffect(() => {
    reportPending(
      savingPersistable.current ||
        (revision.current > attemptedRevision.current && canPersist(draft)),
    );
  }, [draft, readyRevision, pending, available, discovery.isError]);

  useEffect(() => {
    const currentRevision = revision.current;
    if (
      !mounted.current ||
      saving.current ||
      currentRevision === 0 ||
      readyRevision !== currentRevision ||
      attemptedRevision.current >= currentRevision ||
      !validInput
    ) {
      return;
    }
    const requested = selections();
    attemptedRevision.current = currentRevision;
    saving.current = true;
    savingPersistable.current = canPersist(draft);
    reportPending(savingPersistable.current);
    setPending(true);

    async function save() {
      try {
        const result = await selectionMutation.mutateAsync({
          id: props.subject.id,
          orderId: props.ecommerceModuleOrder.id,
          data: {
            action: "save",
            lineId: props.line.id,
            selections: requested,
            expectedSelectionUpdatedAt: selectionUpdatedAt.current,
          },
        });
        if (!mounted.current) return;
        if (result.applied && result.selectionUpdatedAt) {
          selectionUpdatedAt.current = result.selectionUpdatedAt;
          refresh.current = {
            revision: currentRevision,
            timestamp: result.selectionUpdatedAt,
          };
          setAwaitingRefresh(true);
        }
        if (currentRevision !== revision.current) return;
        setReceipt(result);
        conflict.current = false;
        if (result.applied) {
          appliedRevision.current = currentRevision;
        }
      } catch (cause) {
        if (!mounted.current || currentRevision !== revision.current) return;
        const message = cause instanceof Error ? cause.message : "";
        conflict.current = /Cart selection changed/i.test(message);
        setError(
          conflict.current
            ? ru
              ? "Позиция изменилась в другом окне. Проверьте параметры и повторите сохранение."
              : "This item changed in another window. Review your choices and retry saving."
            : message ||
                (ru
                  ? "Не удалось сохранить выбор."
                  : "Could not save the selection."),
        );
      } finally {
        saving.current = false;
        savingPersistable.current = false;
        if (mounted.current) {
          reportPending(
            revision.current > attemptedRevision.current &&
              canPersist(draftValue.current),
          );
          setPending(false);
        }
      }
    }
    void save();
  }, [draft, readyRevision, pending, validInput]);

  function retry() {
    if (conflict.current) {
      selectionUpdatedAt.current = new Date(
        props.line.selectionUpdatedAt,
      ).toISOString();
    }
    edit((current) => current);
  }

  async function refreshCart() {
    setRefreshing(true);
    setRefreshError("");
    try {
      await queries.invalidateQueries(
        { queryKey: [`${route}/${props.subject.id}/ecommerce-module/orders`] },
        { throwOnError: true },
      );
    } catch {
      if (mounted.current) {
        setRefreshError(
          ru
            ? "Не удалось обновить корзину. Попробуйте ещё раз."
            : "Could not refresh the cart. Please retry.",
        );
      }
    } finally {
      if (mounted.current) setRefreshing(false);
    }
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

  const unsaved = revision.current !== appliedRevision.current;
  const currentReceipt =
    receipt?.quotes[0] ?? (!unsaved ? original : undefined);
  const receiptIssues =
    receipt?.quotes.flatMap((quote) => quote.issues) ??
    (!unsaved ? (original?.issues ?? []) : []);
  function currencyRecord(id: string | undefined) {
    return (
      currencies.data?.find((currency) => currency.id === id) ??
      props.details.totals?.find(
        (total) => total.billingModuleCurrency.id === id,
      )?.billingModuleCurrency
    );
  }
  function currencySymbol(id: string | undefined) {
    const currency = currencyRecord(id);
    return currency?.symbol || currency?.title || "";
  }
  const symbol = currencySymbol(currentReceipt?.currencyId);
  const unavailableCurrency =
    Boolean(draft.currencyId && available) &&
    !currencyIds.includes(draft.currencyId);
  const priceStale = Boolean(
    !receipt?.applied &&
    original &&
    props.line.offerId &&
    props.line.quoteVersion !== original.version,
  );
  useEffect(() => {
    if (priceStale || unavailableCurrency) reportBlocked(true);
  }, [priceStale, unavailableCurrency]);
  const receiptReady =
    !unsaved &&
    !awaitingRefresh &&
    !priceStale &&
    !unavailableCurrency &&
    currentReceipt?.amount !== null &&
    currentReceipt?.amount !== undefined &&
    receiptIssues.length === 0;
  const productCharge = currentReceipt?.charges.find(
    (charge) => charge.role === "product" && charge.offerId === draft.offerId,
  );
  const currentAmount =
    currentReceipt?.offerId === draft.offerId &&
    currentReceipt.currencyId === draft.currencyId &&
    currentReceipt.quantity === quantity;
  const productAmountReady =
    currentAmount && productCharge?.quantity === quantity;
  const selectedCurrencySymbol = currencySymbol(draft.currencyId);
  const changeService = useCallback(
    (offerId: string, checked: boolean) => {
      const option = options.find((option) => option.offerId === offerId);
      if (!option) return;
      edit((current) => {
        const services = { ...current.services };
        if (option.role === "delivery" && checked) {
          for (const delivery of options.filter(
            (item) => item.role === "delivery",
          ))
            delete services[delivery.offerId];
        }
        if (checked) services[offerId] = "1";
        else delete services[offerId];
        return {
          ...current,
          services,
        };
      });
    },
    [options, available],
  );

  return (
    <fieldset className="@container min-w-0 space-y-3">
      <div className="grid min-w-0 grid-cols-2 items-end gap-x-3 gap-y-2 @[420px]:grid-cols-[minmax(8rem,1fr)_minmax(5rem,1fr)_auto]">
        <QuantityInput
          id={`${controlId}-quantity`}
          label={ru ? "Количество" : "Quantity"}
          contextLabel={productTitle}
          decreaseLabel={`${ru ? "Уменьшить количество товара" : "Decrease product quantity"}: ${productTitle}`}
          increaseLabel={`${ru ? "Увеличить количество товара" : "Increase product quantity"}: ${productTitle}`}
          min={quantityBounds.min}
          max={productQuantityMax}
          value={draft.quantity}
          onValueChange={(quantity) => {
            edit((current) => ({ ...current, quantity }), true);
          }}
        />
        <div className="grid min-w-0 gap-1 text-xs font-medium">
          <label htmlFor={`${controlId}-currency`}>
            {ru ? "Валюта" : "Currency"}
          </label>
          <Select
            ui="shadcn"
            id={`${controlId}-currency`}
            className={`${input} px-2`}
            value={
              currencyIds.includes(draft.currencyId) ? draft.currencyId : ""
            }
            onValueChange={(currencyId) =>
              edit((current) => ({ ...current, currencyId }))
            }
            placeholder={ru ? "Выберите валюту" : "Choose currency"}
            options={currencyIds.map((id) => ({
              value: id,
              label:
                currencyRecord(id)?.slug?.toUpperCase() ||
                currencyRecord(id)?.title ||
                (ru ? "Загружаем…" : "Loading…"),
            }))}
          />
        </div>
        <div className="col-span-2 flex min-w-0 flex-wrap items-baseline justify-end gap-x-1.5 gap-y-0.5 @[420px]:col-span-1 @[420px]:min-h-12 @[420px]:items-center">
          <output
            aria-label={ru ? "Цена за 1 шт." : "Unit price"}
            className="min-w-0 break-words text-sm font-semibold tabular-nums"
          >
            {(() => {
              const amount =
                productCharge?.unitAmount !== undefined
                  ? productCharge.unitAmount
                  : productCharge?.quantity === 1
                    ? productCharge.amount
                    : undefined;
              if (
                productAmountReady &&
                amount !== null &&
                amount !== undefined
              ) {
                return `${formatCurrencyAmount(amount, props.language)} ${selectedCurrencySymbol}`;
              }
              return pending || closePending.current ? "…" : "—";
            })()}
          </output>{" "}
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {ru ? "за 1 шт." : "per item"}
          </span>
        </div>
      </div>
      <div className="grid gap-1 text-xs font-medium">
        <label htmlFor={`${controlId}-store`}>{ru ? "Магазин" : "Store"}</label>
        <Select
          ui="shadcn"
          id={`${controlId}-store`}
          className={input}
          value={draft.offerId}
          onValueChange={changeSeller}
          placeholder={ru ? "Выберите магазин" : "Choose a store"}
          options={choices.map((offer) => ({
            value: offer.id,
            label: storeTitle(offer.id),
          }))}
        />
      </div>
      {options.length ? (
        <div className="space-y-3">
          {(["delivery", "add-on"] as const).map((role) => {
            const groupOptions = serviceOptions.filter(
              (option) => option.role === role,
            );
            if (!groupOptions.length) return null;
            const mandatory = role === "delivery";
            return (
              <fieldset key={role} className="space-y-1.5">
                <legend
                  id={controlId + "-" + role + "-legend"}
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
                  id={controlId + "-" + role + "-options"}
                  labelId={controlId + "-" + role + "-legend"}
                  selectionName={controlId + "-fulfillment"}
                  multiple={role === "add-on"}
                  required={mandatory}
                  value={
                    options.find(
                      (option) =>
                        option.role === "delivery" &&
                        draft.services[option.offerId] !== undefined,
                    )?.offerId ?? ""
                  }
                  onValueChange={(offerId) => changeService(offerId, true)}
                >
                  {groupOptions.map((option) => {
                    const selected =
                      draft.services[option.offerId] !== undefined;
                    const charge =
                      currentAmount && selected
                        ? currentReceipt?.charges.find(
                            (charge) =>
                              charge.offerId === option.offerId &&
                              charge.quantity ===
                                Number(draft.services[option.offerId]),
                          )
                        : undefined;
                    const currentOption = currentAmount
                      ? currentReceipt?.serviceOptions.find(
                          (item) => item.offerId === option.offerId,
                        )
                      : undefined;
                    const tariff =
                      currentOption?.deliveryTariff ??
                      (available?.currencyId === draft.currencyId
                        ? option.deliveryTariff
                        : undefined);
                    const preview =
                      currentOption?.pricePreview ??
                      (validDiscoveryQuantity &&
                      available?.offerId === draft.offerId &&
                      available.currencyId === draft.currencyId &&
                      available.quantity === quantity
                        ? option.pricePreview
                        : undefined);
                    const fixedFallback =
                      option.receiptMethod === "shipping" &&
                      tariff?.basis === "fixed"
                        ? tariff.fixedAmount
                        : undefined;
                    const amount =
                      charge?.amount ?? preview?.amount ?? fixedFallback;
                    const from = !charge && preview?.kind === "from";
                    const serviceId = `${controlId}-${option.offerId}`;
                    return (
                      <ServiceCard
                        key={option.offerId}
                        id={serviceId}
                        language={props.language}
                        option={option}
                        checked={selected}
                        amount={amount}
                        from={from}
                        currencySymbol={selectedCurrencySymbol}
                        tariff={tariff}
                        distanceKm={charge?.inputs.distance_km}
                        pending={
                          pending ||
                          closePending.current ||
                          Boolean(discovery.isFetching) ||
                          (validDiscoveryQuantity &&
                            quantity !== discoveryQuantity)
                        }
                        onCheckedChange={changeService}
                      >
                        {option.receiptMethod === "shipping" ||
                        option.role === "add-on" ? (
                          <div className="space-y-3 px-3 pb-3">
                            {option.receiptMethod === "shipping" ? (
                              <DeliveryAddress
                                id={`${serviceId}-address`}
                                label={
                                  ru ? "Адрес доставки" : "Delivery address"
                                }
                                value={draft.address}
                                offerId={option.offerId}
                                language={props.language}
                                className={input}
                                onChange={(address, selected) =>
                                  edit(
                                    (current) => ({ ...current, address }),
                                    !selected,
                                  )
                                }
                              />
                            ) : null}
                            {option.role === "add-on" ? (
                              <QuantityInput
                                id={`${serviceId}-quantity`}
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
                                    Number.isSafeInteger(quantity)
                                      ? quantity
                                      : 0,
                                    charge?.availableQuantity ??
                                      original?.charges.find(
                                        (item) =>
                                          item.offerId === option.offerId,
                                      )?.availableQuantity ??
                                      quantityBounds.max,
                                  ),
                                )}
                                value={draft.services[option.offerId]}
                                onValueChange={(count) => {
                                  edit(
                                    (current) => ({
                                      ...current,
                                      services: {
                                        ...current.services,
                                        [option.offerId]: count,
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
      {!available && discovery.isError ? (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-destructive">
            {ru
              ? "Не удалось загрузить параметры магазина."
              : "Could not load the store options."}
          </p>
          <button
            type="button"
            className={button}
            onClick={() => void discovery.refetch()}
          >
            {ru ? "Повторить загрузку" : "Retry loading"}
          </button>
        </div>
      ) : null}
      {!validQuantities ? (
        <p role="alert" className="text-xs text-destructive">
          {ru
            ? "Укажите целое положительное количество."
            : "Enter a positive whole quantity."}
        </p>
      ) : null}
      {unavailableCurrency ? (
        <p role="alert" className="text-xs text-destructive">
          {ru
            ? "Выбранная валюта недоступна. Выберите другую валюту."
            : "The selected currency is unavailable. Choose another currency."}
        </p>
      ) : null}
      {error ? (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
          <button
            type="button"
            className={button}
            disabled={pending}
            onClick={retry}
          >
            {ru ? "Повторить сохранение" : "Retry saving"}
          </button>
        </div>
      ) : null}
      {priceStale && !unsaved && !awaitingRefresh ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {ru
              ? "Цена или условия изменились."
              : "The price or terms have changed."}
          </p>
          <button
            type="button"
            className={button}
            onClick={() => edit((current) => current)}
          >
            {ru ? "Обновить цену" : "Refresh price"}
          </button>
        </div>
      ) : null}
      {(awaitingRefresh || conflict.current) && !pending ? (
        <div className="space-y-2">
          {refreshError ? (
            <p role="alert" className="text-xs text-destructive">
              {refreshError}
            </p>
          ) : null}
          <button
            type="button"
            className={button}
            disabled={refreshing}
            onClick={() => void refreshCart()}
          >
            {ru ? "Обновить корзину" : "Refresh cart"}
          </button>
        </div>
      ) : null}
      <section
        aria-label={ru ? "Расчёт" : "Receipt"}
        aria-busy={pending || awaitingRefresh || closePending.current}
        className="space-y-2 rounded-xl border border-border bg-card p-3"
      >
        <h3 className="text-sm font-semibold">{ru ? "Расчёт" : "Receipt"}</h3>
        {pending || closePending.current || awaitingRefresh ? (
          <p role="status" className="text-xs text-muted-foreground">
            {awaitingRefresh && !pending
              ? ru
                ? "Обновляем корзину…"
                : "Refreshing cart…"
              : ru
                ? "Сохраняем…"
                : "Saving…"}
          </p>
        ) : null}
        {receiptIssues.map((issue, index) => (
          <p
            key={`${issue.code}-${issue.offerId}-${index}`}
            role="alert"
            className="text-xs text-destructive"
          >
            {ru && issue.code === "delivery_required"
              ? "Для выбранных условий заказа нет доступного способа получения."
              : issue.message}
          </p>
        ))}
        {!receipt &&
          !unsaved &&
          props.details.unpriced
            ?.filter((issue) => issue.ordersToProductsId === props.line.id)
            .map((issue, index) => (
              <p
                key={`unpriced-${index}`}
                role="alert"
                className="text-xs text-destructive"
              >
                {issue.reason}
              </p>
            ))}
        {!currentReceipt ? (
          <p className="text-xs text-muted-foreground">
            {ru
              ? "Выберите магазин и параметры заказа."
              : "Choose a store and order options."}
          </p>
        ) : null}
        <dl className="space-y-1 text-xs">
          {currentReceipt?.charges.map((charge) => {
            const option =
              currentReceipt.serviceOptions.find(
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
          <div className="flex justify-between gap-2 border-t border-border pt-2 font-semibold">
            <dt>{ru ? "Итого" : "Total"}</dt>
            <dd className="shrink-0 tabular-nums">
              {receiptReady
                ? `${formatCurrencyAmount(currentReceipt!.amount!, props.language)} ${symbol}`
                : pending || awaitingRefresh || closePending.current
                  ? ru
                    ? "Рассчитываем…"
                    : "Calculating…"
                  : ru
                    ? "Нужен выбор"
                    : "Selection needed"}
            </dd>
          </div>
        </dl>
      </section>
    </fieldset>
  );
}
