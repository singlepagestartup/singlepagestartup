"use client";
import { internationalization } from "@sps/shared-configuration";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Icon } from "@sps/ui-adapter";
import { useCallback, useEffect, useRef, useState } from "react";
import { Component as Row } from "./Row";
import type {
  IComponentPropsExtended,
  IOrderRowProps,
  IRepeatConfirmation,
} from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <History
      key={props.data.id}
      data={props.data}
      variant={props.variant}
      isServer={false}
      language={props.language}
    />
  );
}

function History(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const [confirmation, setConfirmation] = useState<IRepeatConfirmation | null>(
    null,
  );
  const [repeatingId, setRepeatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [repeated, setRepeated] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const inFlight = useRef(false);
  const lifecycle = useRef(0);
  useEffect(() => {
    const current = ++lifecycle.current;
    return () => {
      if (lifecycle.current === current) lifecycle.current++;
    };
  }, []);
  const repeat = subjectApi.ecommerceModuleOrderRepeat({});
  const orders = subjectApi.ecommerceModuleOrderList({
    id: props.data.id,
    params: {
      includePurchaseDetails: true,
      filters: {
        and: [{ column: "type", method: "eq", value: "history" }],
      },
    },
  });
  const onRepeat = useCallback((order: IOrderRowProps["order"]) => {
    if (inFlight.current || order.purchaseDetails?.canRepeatPayment !== true)
      return;
    setConfirmation({
      orderId: order.id,
    });
    setError("");
    setRepeated(false);
    setShowCart(false);
  }, []);
  const onCancel = useCallback(() => {
    if (inFlight.current) return;
    setConfirmation(null);
    setError("");
  }, []);
  const onConfirm = useCallback(async () => {
    if (!confirmation || inFlight.current) return;
    if (
      !orders.data?.some(
        (order) =>
          order.id === confirmation.orderId &&
          order.purchaseDetails?.canRepeatPayment === true,
      )
    ) {
      setConfirmation(null);
      return;
    }
    const captured = confirmation;
    const currentLifecycle = lifecycle.current;
    inFlight.current = true;
    setRepeatingId(captured.orderId);
    setError("");
    try {
      await repeat.mutateAsync({
        id: props.data.id,
        orderId: captured.orderId,
      });
      if (lifecycle.current !== currentLifecycle) return;
      setConfirmation(null);
      setRepeated(true);
    } catch (cause) {
      if (lifecycle.current !== currentLifecycle) return;
      setError(
        cause instanceof Error &&
          cause.message.includes(
            "Initial Free is available only through authentication bootstrap",
          )
          ? ru
            ? "Начальную бесплатную подписку нельзя оформить повторно."
            : "The initial free subscription cannot be ordered again."
          : cause instanceof Error
            ? cause.message
            : ru
              ? "Не удалось повторить заказ. Попробуйте ещё раз."
              : "Could not repeat the order. Please try again.",
      );
    } finally {
      inFlight.current = false;
      if (lifecycle.current === currentLifecycle) setRepeatingId(null);
    }
  }, [confirmation, orders.data, repeat.mutateAsync, props.data.id, ru]);
  const onShowCart = useCallback(() => setShowCart(true), []);
  return (
    <section
      className="@container min-w-0 rounded-2xl border border-border bg-card p-5 @[640px]:p-6"
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      aria-label={ru ? "Покупки" : "Purchases"}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-xl font-semibold">
            <span className="grid size-10 place-items-center rounded-xl bg-muted">
              <Icon name="wallet" />
            </span>

            {ru ? "Покупки" : "Purchases"}
          </h2>
          <div className="mt-3 text-sm leading-6 text-muted-foreground">
            <p>
              {ru
                ? "Посмотрите свои покупки и чеки."
                : "View purchases and receipts."}
            </p>
          </div>
        </div>
      </header>
      {repeated && (
        <div role="status" className="mt-5 rounded-xl bg-muted p-4 text-sm">
          <p>
            {ru
              ? "Заказ добавлен в корзину. Можно выбрать способ оплаты."
              : "The order is in your cart. You can choose a payment method."}
          </p>
          <button
            type="button"
            onClick={onShowCart}
            className="mt-3 min-h-11 rounded-xl bg-primary px-4 font-semibold text-primary-foreground"
          >
            {ru ? "Открыть корзину" : "Open cart"}
          </button>
        </div>
      )}
      {showCart && (
        <section
          aria-label={ru ? "Корзина" : "Cart"}
          className="mt-5 rounded-xl border border-border p-4"
        >
          <h3 className="mb-4 font-semibold">{ru ? "Корзина" : "Cart"}</h3>
          <Subject
            isServer={false}
            variant="ecommerce-module-order-list-checkout-default"
            dataSource="props"
            data={props.data}
            language={language}
          />
        </section>
      )}
      {orders.isPending ? (
        <p role="status" className="mt-5 rounded-xl bg-muted p-4 text-sm">
          {ru ? "Загрузка покупок…" : "Loading purchases…"}
        </p>
      ) : orders.isError ? (
        <div role="alert" className="mt-5 rounded-xl bg-muted p-4 text-sm">
          <p>
            {ru
              ? "Не удалось загрузить покупки."
              : "Purchases could not be loaded."}
          </p>
          <button
            type="button"
            onClick={() => void orders.refetch()}
            className="mt-3 min-h-11 rounded-xl border border-border bg-card px-4 font-medium"
          >
            {ru ? "Повторить" : "Try again"}
          </button>
        </div>
      ) : orders.data?.length ? (
        <ul
          aria-label={ru ? "История заказов" : "Order history"}
          className="mt-5"
        >
          {[...orders.data]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((order) => (
              <Row
                language={language}
                key={order.id}
                order={order}
                confirming={
                  confirmation?.orderId === order.id && repeatingId !== order.id
                }
                repeating={repeatingId === order.id}
                disabled={!!repeatingId}
                error={confirmation?.orderId === order.id ? error : ""}
                onRepeat={onRepeat}
                onConfirm={onConfirm}
                onCancel={onCancel}
              />
            ))}
        </ul>
      ) : (
        <p role="status" className="mt-5 rounded-xl bg-muted p-4 text-sm">
          {ru ? "Покупок пока нет." : "No purchases yet."}
        </p>
      )}
    </section>
  );
}
