"use client";

import type { IComponentPropsExtended, IRowProps } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { currencyPrecision } from "@sps/shared-utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@sps/ui-adapter";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { ICartDetails } from "@sps/ecommerce/models/order/sdk/model";
import { ReceiptEmail } from "../../checkout-default/ReceiptEmail";
import { CheckoutForm } from "../../checkout-default/CheckoutForm";
import { Component as Row } from "./Row";
import { hasInvalidSingleUnitQuantity } from "./utils";
import { DiscussionAction } from "./DiscussionAction";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { OrderComment } from "../../checkout-default/OrderComment";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { route } from "@sps/rbac/models/subject/sdk/model";

const providers = [
  "stripe",
  "0xprocessing",
  "payselection",
  "cloudpayments",
  "dummy",
  "paykeeper",
] as const;

export function Component(props: IComponentPropsExtended) {
  return (
    <Checkout
      key={props.data.id}
      data={props.data}
      language={props.language}
      variant={props.variant}
      isServer={false}
      onDiscussionOpen={props.onDiscussionOpen}
      onSelectionPendingChange={props.onSelectionPendingChange}
    />
  );
}

function Checkout(props: IComponentPropsExtended) {
  const text =
    props.language === "ru"
      ? {
          invalidProvider: "Выберите способ оплаты.",
          invalidEmail: "Введите корректный email для чека.",
          paymentLinkError:
            "Не удалось получить ссылку на оплату. Попробуйте ещё раз.",
          checkoutError: "Не удалось оформить заказ. Попробуйте ещё раз.",
          emptyCart: "В корзине пока нет товаров.",
          prepayment: "Предоплата",
          postpayment: "Постоплата",
          postpaymentTerms: "Оплата после принятия результата.",
          selectItems: "Выберите товары или услуги.",
          selectedTotal: "К оплате сейчас",
          total: "Итого",
          savedTotal: "Сохранённая сумма",
          pricedItems: "Товары с ценой",
          unpriced: "Завершите выбор и исправьте ошибки в отмеченных заказах.",
          invalidCurrency: "Выберите валюту оплаты для каждого заказа.",
          provider: "Способ оплаты",
          providerPlaceholder: "Выберите способ оплаты",
          email: "Email для чека",
          checkout: "Перейти к оплате",
          checkingOut: "Оформляем…",
        }
      : {
          invalidProvider: "Choose a payment method.",
          invalidEmail: "Enter a valid email address for your receipt.",
          paymentLinkError: "Could not get a payment link. Please try again.",
          checkoutError: "Could not place your order. Please try again.",
          emptyCart: "Your cart is empty.",
          prepayment: "Payment upfront",
          postpayment: "Payment after acceptance",
          postpaymentTerms: undefined,
          selectItems: "Select items to continue.",
          selectedTotal: "Due now",
          total: "Total",
          savedTotal: "Saved total",
          pricedItems: "Priced items",
          unpriced:
            "Complete the selection and resolve the issues in the marked orders.",
          invalidCurrency: "Choose a payment currency for each order.",
          provider: "Payment method",
          providerPlaceholder: "Choose a payment method",
          email: "Receipt email",
          checkout: "Proceed to payment",
          checkingOut: "Processing…",
        };
  const formSchema = z.object({
    provider: z
      .string()
      .refine(
        (value) =>
          value === "stripe" ||
          value === "0xprocessing" ||
          value === "payselection" ||
          value === "cloudpayments" ||
          value === "dummy" ||
          value === "paykeeper",
        text.invalidProvider,
      ),
    email: z.string().trim().email(text.invalidEmail),
    comment: z.string().trim().optional(),
  });

  const [paymentUrls, setPaymentUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState(() => new Map<string, boolean>());
  const changeCartItemSelection = useCallback(
    (orderId: string, selected: boolean) => {
      setSelection((previous) => new Map(previous).set(orderId, selected));
      setError("");
    },
    [],
  );
  const isOrderSelected = (order: IRowProps["ecommerceModuleOrder"]) =>
    selection.get(order.id) ??
    (order.cartDetails?.lines.filter((line) => !line.parentLineId).length ??
      0) <= 1;
  const blockedSelections = useRef(new Map<string, Set<string>>());
  const pendingSelections = useRef(new Map<string, Set<string>>());
  const reportedPending = useRef(false);
  const selectionPendingListener = useRef(props.onSelectionPendingChange);
  selectionPendingListener.current = props.onSelectionPendingChange;
  const [, setSelectionRevision] = useState(0);
  const checkoutSnapshot = useRef<{
    cartOrders: IRowProps["ecommerceModuleOrder"][];
    paymentOrders: IRowProps["ecommerceModuleOrder"][];
    blocked: boolean;
  } | null>(null);
  const publishSelectionPending = useCallback(() => {
    const pending = (checkoutSnapshot.current?.cartOrders ?? []).some((order) =>
      order.cartDetails?.lines.some(
        (line) =>
          !line.parentLineId &&
          pendingSelections.current.get(order.id)?.has(line.id),
      ),
    );
    if (pending === reportedPending.current) return;
    reportedPending.current = pending;
    selectionPendingListener.current?.(pending);
  }, []);
  const onOrderSelectionPendingChange = useCallback(
    (orderId: string, lineId: string, pending: boolean) => {
      const lines = pendingSelections.current.get(orderId);
      if (Boolean(lines?.has(lineId)) === pending) return;
      if (pending) {
        const next = lines ?? new Set<string>();
        next.add(lineId);
        pendingSelections.current.set(orderId, next);
      } else if (lines) {
        lines.delete(lineId);
        if (!lines.size) pendingSelections.current.delete(orderId);
      }
      publishSelectionPending();
    },
    [publishSelectionPending],
  );
  useEffect(() => {
    publishSelectionPending();
  });
  useEffect(() => () => selectionPendingListener.current?.(false), []);
  const onOrderSelectionStateChange = useCallback(
    (orderId: string, lineId: string, blocked: boolean) => {
      const lines = blockedSelections.current.get(orderId);
      if (Boolean(lines?.has(lineId)) === blocked) return;
      if (blocked) {
        const next = lines ?? new Set<string>();
        next.add(lineId);
        blockedSelections.current.set(orderId, next);
      } else if (lines) {
        lines.delete(lineId);
        if (!lines.size) blockedSelections.current.delete(orderId);
      }
      setSelectionRevision((revision) => revision + 1);
    },
    [],
  );
  const hasBlockedSelections = useCallback(
    (orders: IRowProps["ecommerceModuleOrder"][]) =>
      orders.some((order) =>
        order.cartDetails?.lines.some(
          (line) =>
            !line.parentLineId &&
            blockedSelections.current.get(order.id)?.has(line.id),
        ),
      ),
    [],
  );
  const lifecycle = useRef<symbol | null>(null);
  const canOpenDiscussion = useCallback(() => lifecycle.current !== null, []);
  useEffect(() => {
    const current = Symbol();
    lifecycle.current = current;
    return () => {
      if (lifecycle.current === current) lifecycle.current = null;
    };
  }, []);

  const ecommerceModuleOrderCheckout = api.ecommerceModuleOrderCheckout({});
  const paying =
    useIsMutating({
      mutationKey: [`${route}/:id/ecommerce-module/orders/checkout`],
      predicate: (mutation) =>
        (mutation.state.variables as { id?: string } | undefined)?.id ===
        props.data.id,
    }) > 0;
  const updatingCart =
    useIsMutating({
      mutationKey: [`${route}/:id/ecommerce-module/orders/:orderId`],
      predicate: (mutation) =>
        (mutation.state.variables as { id?: unknown } | undefined)?.id ===
        props.data.id,
    }) > 0;
  const refreshingCart =
    useIsFetching({
      queryKey: [`${route}/${props.data.id}/ecommerce-module/orders`],
    }) > 0;
  const changingSelection =
    useIsMutating({
      mutationKey: [`${route}/:id/ecommerce-module/orders/:orderId/selection`],
      predicate: (mutation) =>
        (mutation.state.variables as { id?: string } | undefined)?.id ===
        props.data.id,
    }) > 0;

  const form = useForm({
    resolver: zodResolver(formSchema),
    shouldUnregister: true,
    defaultValues: {
      provider: "stripe",
      email: "",
      comment: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const currentLifecycle = lifecycle.current;
    const snapshot = checkoutSnapshot.current;
    if (
      !currentLifecycle ||
      !snapshot?.paymentOrders.length ||
      snapshot.blocked ||
      hasBlockedSelections(snapshot.paymentOrders)
    )
      return;
    setError("");
    try {
      const res = await ecommerceModuleOrderCheckout.mutateAsync({
        id: props.data.id,
        data: {
          provider: data.provider,
          email: data.email,
          ...(data.comment ? { comment: data.comment } : {}),
          ecommerceModule: {
            orders: snapshot.paymentOrders.map(({ id, cartDetails }) => {
              const lineIds = cartDetails?.lines
                .filter((line) => !line.parentLineId)
                .map((line) => line.id);
              return lineIds?.length ? { id, lineIds } : { id };
            }),
          },
        },
      });
      if (lifecycle.current !== currentLifecycle) return;
      const paymentUrls = res.billingModule.invoices.map(
        (invoice) => invoice.paymentUrl,
      );
      if (!paymentUrls.length || paymentUrls.some((url) => !url)) {
        setError(text.paymentLinkError);
        return;
      }
      if (paymentUrls.length > 1) {
        setPaymentUrls(paymentUrls);
      } else {
        window.location.href = paymentUrls[0];
      }
    } catch (cause) {
      if (lifecycle.current !== currentLifecycle) return;
      setError(
        cause instanceof Error && cause.message
          ? `${text.checkoutError} ${cause.message}`
          : text.checkoutError,
      );
    }
  }

  if (paymentUrls.length) {
    return (
      <div className="flex flex-col gap-2 px-6 py-5">
        {paymentUrls.map((paymentUrl) => (
          <Button
            key={paymentUrl}
            variant="primary"
            className="min-h-11 w-full shrink-0 rounded-xl"
            asChild={true}
          >
            <Link href={paymentUrl} target="_blank">
              {text.checkout}
            </Link>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Form
      data-module="rbac"
      data-model="subject"
      data-model-id={props.data.id}
      data-variant={props.data.variant}
      {...form}
    >
      <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto">
        <Subject
          isServer={false}
          variant="ecommerce-module-order-list-default"
          data={props.data}
          language={props.language}
          apiProps={{ params: { includeCartDetails: true } }}
        >
          {({ data: orders }) => {
            if (!orders.length) {
              checkoutSnapshot.current = null;
              return (
                <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-8 text-center">
                  <Image
                    src="/images/empty-cart.webp"
                    alt=""
                    width={512}
                    height={512}
                    className="size-40 max-w-full object-contain mix-blend-multiply sm:size-48 dark:hue-rotate-180 dark:invert dark:mix-blend-screen"
                  />
                  <p className="text-base font-medium text-foreground">
                    {text.emptyCart}
                  </p>
                </div>
              );
            }
            const prepayment = orders.filter(
              (order) => !order.cartDetails?.work,
            );
            const postpayment = orders.filter(
              (order) =>
                order.cartDetails?.work &&
                order.cartDetails.work.state !== "awaiting-payment",
            );
            const accepted = orders.filter(
              (order) => order.cartDetails?.work?.state === "awaiting-payment",
            );
            const paymentOrders = prepayment.filter(isOrderSelected);
            const shouldSelectItems =
              prepayment.length > 0 && !paymentOrders.length;
            const hasUnpriced = paymentOrders.some(
              (order) => order.cartDetails?.unpriced?.length,
            );
            const hasInvalidQuantity = paymentOrders.some((order) =>
              hasInvalidSingleUnitQuantity(order.cartDetails),
            );
            const hasInvalidCurrency = paymentOrders.some(
              (order) =>
                !order.cartDetails?.billingModuleCurrencyId ||
                !order.cartDetails.availableCurrencyIds?.includes(
                  order.cartDetails.billingModuleCurrencyId,
                ),
            );
            const checkoutBlocked =
              paying ||
              ecommerceModuleOrderCheckout.isPending ||
              hasUnpriced ||
              hasInvalidQuantity ||
              hasInvalidCurrency ||
              updatingCart ||
              changingSelection ||
              refreshingCart;
            checkoutSnapshot.current = {
              cartOrders: orders,
              paymentOrders,
              blocked: checkoutBlocked,
            };
            const hasUnappliedSelection = hasBlockedSelections(paymentOrders);
            const showingSavedTotal =
              hasUnappliedSelection ||
              updatingCart ||
              changingSelection ||
              refreshingCart;
            const partialCheckout =
              paymentOrders.length !== prepayment.length ||
              postpayment.length > 0 ||
              accepted.length > 0;
            const totalHeading = showingSavedTotal
              ? text.savedTotal
              : hasUnpriced
                ? text.pricedItems
                : partialCheckout
                  ? text.selectedTotal
                  : text.total;
            const totals = new Map<string, ICartDetails["totals"][number]>();
            for (const order of paymentOrders) {
              for (const total of order.cartDetails?.totals ?? []) {
                if (
                  total.billingModuleCurrency.id !==
                    order.cartDetails?.billingModuleCurrencyId ||
                  !order.cartDetails.availableCurrencyIds?.includes(
                    total.billingModuleCurrency.id,
                  )
                )
                  continue;
                const previous = totals.get(total.billingModuleCurrency.id);
                totals.set(total.billingModuleCurrency.id, {
                  ...total,
                  total: (previous?.total ?? 0) + total.total,
                });
              }
            }
            return (
              <>
                <div className="shrink-0 space-y-5 px-4 py-5 sm:flex-1 sm:px-6 [@media(min-width:640px)_and_(min-height:740px)]:min-h-36 [@media(min-width:640px)_and_(min-height:740px)]:overflow-y-auto">
                  {prepayment.length > 0 && (
                    <section className="space-y-2">
                      <h2 className="text-sm font-semibold">
                        {text.prepayment}
                      </h2>
                      <ul className="space-y-3">
                        {prepayment.map((order) => (
                          <Row
                            key={order.id}
                            subject={props.data}
                            ecommerceModuleOrder={order}
                            language={props.language}
                            selected={isOrderSelected(order)}
                            selectionDisabled={paying}
                            onCartItemSelectionChange={changeCartItemSelection}
                            onOrderSelectionStateChange={
                              onOrderSelectionStateChange
                            }
                            onOrderSelectionPendingChange={
                              onOrderSelectionPendingChange
                            }
                          />
                        ))}
                      </ul>
                    </section>
                  )}
                  {(postpayment.length > 0 || accepted.length > 0) && (
                    <section className="space-y-2">
                      <h2 className="text-sm font-semibold">
                        {text.postpayment}
                      </h2>
                      {postpayment.length > 0 && text.postpaymentTerms && (
                        <p className="text-sm text-muted-foreground">
                          {text.postpaymentTerms}
                        </p>
                      )}
                      <ul className="space-y-3">
                        {postpayment.map((order) => (
                          <Row
                            key={order.id}
                            subject={props.data}
                            ecommerceModuleOrder={order}
                            language={props.language}
                            headerSlot={
                              <DiscussionAction
                                subjectId={props.data.id}
                                ecommerceModuleOrder={order}
                                language={props.language}
                                canOpenDiscussion={canOpenDiscussion}
                                onDiscussionOpen={props.onDiscussionOpen}
                              />
                            }
                            onOrderSelectionPendingChange={
                              onOrderSelectionPendingChange
                            }
                          />
                        ))}
                        {accepted.map((order) => {
                          const details = order.cartDetails;
                          const product = details?.lines.find(
                            (line) => !line.parentLineId,
                          )?.product;
                          const selected = isOrderSelected(order);
                          return (
                            <Row
                              key={order.id}
                              subject={props.data}
                              ecommerceModuleOrder={order}
                              language={props.language}
                              selected={selected}
                              selectionDisabled={paying}
                              onCartItemSelectionChange={
                                changeCartItemSelection
                              }
                              onOrderSelectionPendingChange={
                                onOrderSelectionPendingChange
                              }
                            >
                              {product && (
                                <div hidden={!selected}>
                                  <Subject
                                    isServer={false}
                                    variant="ecommerce-module-order-checkout-default"
                                    dataSource="props"
                                    data={props.data}
                                    ecommerceModuleProduct={product}
                                    ecommerceModuleOrder={order}
                                    language={props.language}
                                    disabled={
                                      paying ||
                                      !selected ||
                                      updatingCart ||
                                      changingSelection ||
                                      refreshingCart ||
                                      hasInvalidSingleUnitQuantity(details) ||
                                      Boolean(details?.unpriced?.length) ||
                                      !details?.availableCurrencyIds?.includes(
                                        details.billingModuleCurrencyId ?? "",
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </Row>
                          );
                        })}
                      </ul>
                    </section>
                  )}
                </div>
                {prepayment.length > 0 && (
                  <div className="shrink-0 space-y-4 border-t border-border bg-card px-4 py-4 sm:px-6 sm:py-5">
                    {shouldSelectItems && (
                      <p
                        role="status"
                        className="text-sm text-muted-foreground"
                      >
                        {text.selectItems}
                      </p>
                    )}
                    {prepayment.length > 0 && (
                      <div hidden={!paymentOrders.length}>
                        <CheckoutForm
                          className="space-y-3"
                          noValidate
                          form={form}
                          onSubmit={form.handleSubmit(onSubmit, () =>
                            setError(""),
                          )}
                        >
                          {hasUnpriced && (
                            <p
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {text.unpriced}
                            </p>
                          )}
                          {!hasUnpriced && hasInvalidCurrency && (
                            <p
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {text.invalidCurrency}
                            </p>
                          )}
                          <FormField
                            ui="shadcn"
                            type="select"
                            name="provider"
                            form={form}
                            label={text.provider}
                            placeholder={text.providerPlaceholder}
                            options={providers.map((provider) => [
                              provider,
                              provider,
                            ])}
                          />
                          <ReceiptEmail
                            subject={props.data}
                            form={form}
                            label={text.email}
                            placeholder="name@example.com"
                          />
                          <OrderComment form={form} language={props.language} />
                          <div
                            aria-live="polite"
                            aria-busy={showingSavedTotal}
                            className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3"
                          >
                            <h3 className="text-base font-semibold">
                              {totalHeading}
                            </h3>
                            <div className="text-right tabular-nums">
                              {[...totals.values()].map((total) => (
                                <p
                                  key={total.billingModuleCurrency.id}
                                  className="text-2xl font-semibold"
                                >
                                  {new Intl.NumberFormat(
                                    props.language === "ru" ? "ru-RU" : "en-US",
                                    {
                                      maximumFractionDigits: currencyPrecision(
                                        total.billingModuleCurrency,
                                      ),
                                    },
                                  ).format(total.total)}{" "}
                                  {total.billingModuleCurrency.symbol}
                                </p>
                              ))}
                            </div>
                          </div>
                          <Button
                            type="submit"
                            variant="primary"
                            className="flex min-h-11 w-full shrink-0 rounded-xl"
                            disabled={
                              !paymentOrders.length ||
                              checkoutBlocked ||
                              hasUnappliedSelection
                            }
                          >
                            {ecommerceModuleOrderCheckout.isPending
                              ? text.checkingOut
                              : text.checkout}
                          </Button>
                        </CheckoutForm>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          }}
        </Subject>
        {error && (
          <p role="alert" className="px-6 pb-5 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </Form>
  );
}
