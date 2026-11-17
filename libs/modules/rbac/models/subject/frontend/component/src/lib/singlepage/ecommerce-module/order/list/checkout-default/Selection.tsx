"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import { formatCurrencyAmount } from "@sps/shared-frontend-client-utils";
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

interface ITransferredService {
  productId: string;
  role: string;
  quantity: string;
  title: string;
}

interface IDraft {
  offerId: string;
  currencyId: string;
  quantity: string;
  address: string;
  region: string;
  pickup: string;
  services: Record<string, string>;
  missing: ITransferredService[];
  transfer: ITransferredService[] | null;
  split: boolean;
  splitQuantity: string;
  secondAddress: string;
  secondRegion: string;
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
      pickup: props.line.destination?.pickupPointId ?? "",
      services: Object.fromEntries(
        children.map((child) => [child.offerId!, String(child.quantity)]),
      ),
      missing: [],
      transfer: null,
      split: false,
      splitQuantity: "1",
      secondAddress: "",
      secondRegion: props.line.destination?.region ?? "",
    };
  }

  const [draft, setDraftState] = useState<IDraft>(savedDraft);
  const draftValue = useRef(draft);
  const [discoveryQuantity, setDiscoveryQuantity] = useState(
    props.line.quantity,
  );
  const [readyRevision, setReadyRevision] = useState(0);
  const [pending, setPending] = useState(false);
  const [splitting, setSplitting] = useState(false);
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
  const splitRevision = useRef<number | null>(null);
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
  const discovery = offerApi.quote({
    data: {
      offerId: draft.offerId,
      // Service previews depend on product quantity; save still quotes the full draft.
      quantity: discoveryQuantity,
      currencyId: draft.currencyId,
    },
    reactQueryOptions: {
      enabled: Boolean(draft.offerId) && validDiscoveryQuantity,
    },
  });
  const available =
    discovery.data?.offerId === draft.offerId
      ? discovery.data
      : original?.offerId === draft.offerId
        ? original
        : undefined;
  const options = available?.serviceOptions ?? [];
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
  const pickupOption = selectedOptions.find(
    (option) => option.receiptMethod === "pickup",
  );
  const unknownServices = available
    ? Object.keys(draft.services).filter(
        (id) => !options.some((option) => option.offerId === id),
      )
    : [];
  const unavailableServices = [
    ...new Set([
      ...draft.missing.map((selected) => selected.title),
      ...unknownServices.map((id) => {
        const option = knownOptions.current.get(id);
        const child = children.find((line) => line.offerId === id);
        return (
          option?.titles?.[props.language] ||
          option?.title ||
          child?.product?.title?.[props.language] ||
          child?.product?.slug ||
          child?.productId ||
          id
        );
      }),
    ]),
  ];

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

  function canPersist(next: IDraft, includeSplit: boolean) {
    const count = Number(next.quantity);
    if (
      !next.offerId ||
      !next.currencyId ||
      !Number.isSafeInteger(count) ||
      count < 1 ||
      count > (props.details.maxLineQuantity ?? Number.MAX_SAFE_INTEGER) ||
      Object.values(next.services).some(
        (quantity) =>
          !Number.isSafeInteger(Number(quantity)) || Number(quantity) < 1,
      ) ||
      next.missing.length > 0 ||
      (next.split && !includeSplit)
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
    const collects = selected.find(
      (option) => option.receiptMethod === "pickup",
    );
    if (
      (delivers && !next.address.trim()) ||
      (collects && !collects.pickupPointIds?.includes(next.pickup)) ||
      (choices.find((offer) => offer.id === next.offerId)?.settings
        ?.requiredDelivery &&
        !selected.some((option) => option.role === "delivery"))
    )
      return false;
    return (
      !includeSplit ||
      (Number.isSafeInteger(Number(next.splitQuantity)) &&
        Number(next.splitQuantity) > 0 &&
        Number(next.splitQuantity) < count &&
        count === props.line.quantity &&
        (!delivers ||
          (Boolean(next.secondAddress.trim()) &&
            next.secondAddress.trim() !== next.address.trim())))
    );
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
    }
  }, [available]);

  useEffect(() => {
    if (!draft.transfer || !available) return;
    const matched: Record<string, string> = {};
    const missing: ITransferredService[] = [];
    for (const selected of draft.transfer) {
      const targets = available.serviceOptions.filter(
        (option) =>
          option.productId === selected.productId &&
          option.role === selected.role,
      );
      if (targets.length === 1) {
        matched[targets[0].offerId] = selected.quantity;
      } else {
        missing.push(selected);
      }
    }
    setDraft((current) =>
      current.transfer === draft.transfer
        ? { ...current, services: matched, missing, transfer: null }
        : current,
    );
  }, [draft.transfer, available]);

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
    setDraft((current) => (current.split ? current : savedDraft()));
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
      if (!draft.split) reportBlocked(false);
    }
  }, [props.line.selectionUpdatedAt, awaitingRefresh, pending, draft.split]);

  function edit(
    update: (current: IDraft) => IDraft,
    wait = false,
    submitSplit = false,
  ) {
    const nextRevision = ++revision.current;
    if (debounce.current) clearTimeout(debounce.current);
    splitRevision.current = submitSplit ? nextRevision : null;
    reportBlocked(true);
    conflict.current = false;
    setError("");
    setRefreshError("");
    setReceipt(null);
    const next = setDraft(update);
    reportPending(savingPersistable.current || canPersist(next, submitSplit));
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
          const child = children.find((line) => line.offerId === id);
          return {
            productId: option?.productId ?? child?.productId ?? id,
            role: option?.role ?? "unknown",
            quantity: count,
            title:
              option?.titles?.[props.language] ||
              option?.title ||
              child?.product?.title?.[props.language] ||
              child?.productId ||
              id,
          };
        }),
        ...current.missing,
      ];
      return {
        ...current,
        offerId,
        services: {},
        missing: [],
        transfer: preserved,
        pickup: "",
      };
    });
  }

  function selections(includeSplit: boolean): IEcommerceCartSelection[] {
    const destination = shipping
      ? {
          address: draft.address,
          ...(draft.region ? { region: draft.region } : {}),
        }
      : pickupOption
        ? { pickupPointId: draft.pickup }
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
    if (!includeSplit) return [first];
    const secondQuantity = Number(draft.splitQuantity);
    const remaining = quantity - secondQuantity;
    return [
      {
        ...first,
        quantity: remaining,
        services: services
          .map((selected) => ({
            ...selected,
            quantity:
              options.find((option) => option.offerId === selected.offerId)
                ?.role === "delivery"
                ? selected.quantity
                : Math.min(selected.quantity, remaining),
          }))
          .filter((selected) => selected.quantity > 0),
      },
      {
        ...first,
        quantity: secondQuantity,
        destination: shipping
          ? {
              address: draft.secondAddress,
              ...(draft.secondRegion ? { region: draft.secondRegion } : {}),
            }
          : destination,
        services: services
          .map((selected) => ({
            ...selected,
            quantity:
              options.find((option) => option.offerId === selected.offerId)
                ?.role === "delivery"
                ? selected.quantity
                : Math.max(0, selected.quantity - remaining),
          }))
          .filter((selected) => selected.quantity > 0),
      },
    ];
  }

  const validQuantities =
    Number.isSafeInteger(quantity) &&
    quantity > 0 &&
    quantity <= (props.details.maxLineQuantity ?? Number.MAX_SAFE_INTEGER) &&
    Object.values(draft.services).every(
      (count) => Number.isSafeInteger(Number(count)) && Number(count) > 0,
    );
  const validSplit =
    validQuantities &&
    Number.isSafeInteger(Number(draft.splitQuantity)) &&
    Number(draft.splitQuantity) > 0 &&
    Number(draft.splitQuantity) < quantity &&
    quantity === props.line.quantity &&
    (!shipping ||
      (Boolean(draft.secondAddress.trim()) &&
        draft.secondAddress.trim() !== draft.address.trim()));
  const validInput =
    Boolean(draft.offerId && draft.currencyId && available) &&
    validQuantities &&
    !draft.transfer &&
    unavailableServices.length === 0;

  useEffect(() => {
    reportPending(
      savingPersistable.current ||
        (revision.current > attemptedRevision.current &&
          canPersist(draft, splitRevision.current === revision.current)),
    );
  }, [draft, readyRevision, pending, available, discovery.isError]);

  useEffect(() => {
    const currentRevision = revision.current;
    const includeSplit = splitRevision.current === currentRevision;
    if (
      !mounted.current ||
      saving.current ||
      currentRevision === 0 ||
      readyRevision !== currentRevision ||
      attemptedRevision.current >= currentRevision ||
      !validInput ||
      (draft.split && (!includeSplit || !validSplit))
    ) {
      return;
    }
    const requested = selections(includeSplit);
    attemptedRevision.current = currentRevision;
    saving.current = true;
    savingPersistable.current = canPersist(draft, includeSplit);
    reportPending(savingPersistable.current);
    setPending(true);
    setSplitting(includeSplit);

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
        if (includeSplit && result.applied) {
          // Newly created orders render their own receipts after SDK refetch.
          // Rebase queued ordinary edits onto this order's remaining quantity.
          const first = requested[0];
          setDraft((current) => ({
            ...current,
            split: false,
            quantity:
              current.quantity === draft.quantity
                ? String(first.quantity)
                : current.quantity,
            services:
              JSON.stringify(current.services) ===
              JSON.stringify(draft.services)
                ? Object.fromEntries(
                    (first.services ?? []).map((selected) => [
                      selected.offerId,
                      String(selected.quantity),
                    ]),
                  )
                : current.services,
            secondAddress: "",
          }));
          splitRevision.current = null;
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
              canPersist(
                draftValue.current,
                splitRevision.current === revision.current,
              ),
          );
          setPending(false);
          setSplitting(false);
        }
      }
    }
    void save();
  }, [draft, readyRevision, pending, validInput, validSplit]);

  function retry() {
    if (conflict.current) {
      selectionUpdatedAt.current = new Date(
        props.line.selectionUpdatedAt,
      ).toISOString();
    }
    edit((current) => current, false, draft.split);
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
    !draft.split &&
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

  return (
    <fieldset className="min-w-0 space-y-3">
      <div className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)] items-end gap-2">
        <label className="grid gap-1 text-xs font-medium">
          {ru ? "Количество" : "Quantity"}
          <input
            className={`${input} px-2`}
            type="number"
            min={1}
            max={props.details.maxLineQuantity}
            step={1}
            value={draft.quantity}
            onChange={(event) => {
              const quantity = event.target.value;
              edit((current) => ({ ...current, quantity }), true);
            }}
          />
        </label>
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
        <div className="grid min-w-0 gap-1 text-right">
          <span className="text-xs text-muted-foreground">
            {ru ? "За товар" : "Product only"}
          </span>
          <output
            aria-label={ru ? "Стоимость товара" : "Product amount"}
            className="flex min-h-11 items-center justify-end break-words text-sm font-semibold tabular-nums"
          >
            {productAmountReady && productCharge
              ? `${formatCurrencyAmount(productCharge.amount, props.language)} ${selectedCurrencySymbol}`
              : pending || closePending.current
                ? "…"
                : "—"}
          </output>
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
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-medium">
            {ru
              ? "Получение и дополнительные услуги"
              : "Fulfillment and additional services"}
          </legend>
          {serviceOptions.map((option) => {
            const selected = draft.services[option.offerId] !== undefined;
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
              option.receiptMethod === "shipping" && tariff?.basis === "fixed"
                ? tariff.fixedAmount
                : undefined;
            const amount = charge?.amount ?? preview?.amount ?? fixedFallback;
            const from = !charge && preview?.kind === "from";
            const title =
              option.titles?.[props.language] ||
              option.title ||
              option.productId;
            const serviceId = `${controlId}-${option.offerId}`;
            return (
              <div
                key={option.offerId}
                role="group"
                aria-labelledby={`${serviceId}-title`}
                className="overflow-hidden rounded-xl border border-border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <div className="relative">
                  <Checkbox
                    id={serviceId}
                    aria-labelledby={`${serviceId}-title`}
                    aria-describedby={`${serviceId}-price`}
                    className="absolute left-3 top-6 size-5 rounded-md border-2 border-muted-foreground bg-card focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 data-[state=checked]:border-primary"
                    checked={selected}
                    onCheckedChange={(value) => {
                      const checked = value === true;
                      edit((current) => {
                        const services = { ...current.services };
                        if (option.role === "delivery" && checked) {
                          for (const delivery of options.filter(
                            (item) => item.role === "delivery",
                          )) {
                            delete services[delivery.offerId];
                          }
                        }
                        if (checked) services[option.offerId] = "1";
                        else delete services[option.offerId];
                        return { ...current, services };
                      });
                    }}
                  />
                  <label
                    htmlFor={serviceId}
                    className="block min-w-0 cursor-pointer p-3 pl-11 hover:bg-muted/50"
                  >
                    <span className="grid min-h-11 grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-x-2 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
                      <span className="min-w-0 break-words py-3 text-sm font-medium">
                        <span id={`${serviceId}-title`}>{title}</span>
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
                      <span
                        id={`${serviceId}-price`}
                        className="min-w-0 break-words text-right text-sm font-semibold tabular-nums"
                      >
                        {amount !== undefined
                          ? `${from ? (ru ? "от " : "from ") : ""}${formatCurrencyAmount(amount, props.language)} ${selectedCurrencySymbol}`
                          : pending ||
                              closePending.current ||
                              discovery.isFetching ||
                              (validDiscoveryQuantity &&
                                quantity !== discoveryQuantity)
                            ? "…"
                            : ru
                              ? "По расчёту"
                              : "Calculated"}
                      </span>
                    </span>
                    {option.receiptMethod === "shipping" ? (
                      <span className="block space-y-1 text-xs text-muted-foreground">
                        {tariff ? (
                          <span className="block">
                            {tariff.basis === "fixed"
                              ? ru
                                ? "Фиксированная стоимость"
                                : "Fixed price"
                              : tariff.basis === "distance"
                                ? ru
                                  ? "По расстоянию"
                                  : "By distance"
                                : ru
                                  ? "Расчётный тариф"
                                  : "Calculated tariff"}
                          </span>
                        ) : null}
                        {tariff?.basis === "distance" &&
                          charge?.inputs.distance_km && (
                            <span className="block">
                              {ru ? "Маршрут" : "Route"} ·{" "}
                              {new Intl.NumberFormat(ru ? "ru-RU" : "en-US", {
                                maximumFractionDigits: 3,
                              }).format(Number(charge.inputs.distance_km))}{" "}
                              {ru ? "км" : "km"}
                            </span>
                          )}
                        <span className="block">
                          {option.regionIds?.length
                            ? `${ru ? "Зона доставки" : "Delivery area"}: ${option.regionIds.join(", ")}`
                            : ru
                              ? "Зона доставки не указана"
                              : "Delivery area is not specified"}
                        </span>
                      </span>
                    ) : null}
                  </label>
                </div>
                {selected ? (
                  <div className="space-y-3 px-3 pb-3">
                    {option.receiptMethod === "shipping" ? (
                      <DeliveryAddress
                        id={`${serviceId}-address`}
                        label={ru ? "Адрес доставки" : "Delivery address"}
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
                    {option.receiptMethod === "pickup" ? (
                      <div className="grid gap-1 text-xs">
                        <label htmlFor={`${serviceId}-pickup`}>
                          {ru ? "Точка самовывоза" : "Pickup point"}
                        </label>
                        <Select
                          ui="shadcn"
                          id={`${serviceId}-pickup`}
                          className={input}
                          value={draft.pickup}
                          onValueChange={(pickup) =>
                            edit((current) => ({ ...current, pickup }))
                          }
                          placeholder={
                            ru
                              ? "Выберите точку магазина"
                              : "Choose a store location"
                          }
                          options={(option.pickupPointIds ?? []).map((id) => ({
                            value: id,
                            label: id,
                          }))}
                        />
                      </div>
                    ) : null}
                    {option.role === "add-on" ? (
                      <div className="grid gap-1 text-xs">
                        <label htmlFor={`${serviceId}-quantity`}>
                          {ru ? "Количество единиц услуги" : "Service quantity"}
                        </label>
                        <input
                          id={`${serviceId}-quantity`}
                          type="number"
                          className={input}
                          min={1}
                          max={quantity}
                          step={1}
                          value={draft.services[option.offerId]}
                          onChange={(event) => {
                            const count = event.target.value;
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
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </fieldset>
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
              checked={false}
              onCheckedChange={(checked) => {
                if (checked !== true) return;
                edit((current) => ({
                  ...current,
                  missing: [],
                  services: Object.fromEntries(
                    Object.entries(current.services).filter(([id]) =>
                      options.some((option) => option.offerId === id),
                    ),
                  ),
                }));
              }}
            />
            {ru ? "Убрать недоступные услуги" : "Remove unavailable services"}
          </label>
        </div>
      ) : null}
      {quantity >= 2 || draft.split ? (
        <label
          htmlFor={`${controlId}-split`}
          className="flex min-h-11 cursor-pointer items-center gap-3 text-xs"
        >
          <Checkbox
            id={`${controlId}-split`}
            className="size-5 rounded-md border-2 border-muted-foreground bg-card focus-visible:ring-foreground"
            checked={draft.split}
            disabled={splitting}
            onCheckedChange={(checked) =>
              edit((current) => ({ ...current, split: checked === true }))
            }
          />
          {ru ? "Разделить по адресам" : "Split by destination"}
        </label>
      ) : null}
      {draft.split ? (
        <fieldset
          disabled={splitting}
          className="space-y-3 rounded-xl border border-border p-3"
        >
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
              value={draft.splitQuantity}
              onChange={(event) => {
                const splitQuantity = event.target.value;
                edit((current) => ({ ...current, splitQuantity }), true);
              }}
            />
          </label>
          {shippingOption ? (
            <DeliveryAddress
              id={`${controlId}-second-address`}
              label={ru ? "Адрес второго заказа" : "Second order address"}
              value={draft.secondAddress}
              offerId={shippingOption.offerId}
              language={props.language}
              className={input}
              onChange={(secondAddress, selected) =>
                edit((current) => ({ ...current, secondAddress }), !selected)
              }
            />
          ) : null}
          <p className="text-xs text-muted-foreground">
            {ru
              ? "Будут созданы два заказа. Доставка рассчитывается для каждого заказа."
              : "This creates two orders. Fulfillment is priced for each order."}
          </p>
          <button
            type="button"
            className={button}
            disabled={!validInput || !validSplit || pending}
            onClick={() => edit((current) => current, false, true)}
          >
            {ru ? "Разделить заказ" : "Split order"}
          </button>
        </fieldset>
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
            {issue.message}
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
