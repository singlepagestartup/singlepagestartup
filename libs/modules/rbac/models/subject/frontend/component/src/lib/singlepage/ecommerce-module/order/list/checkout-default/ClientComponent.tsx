"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@sps/ui-adapter";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { ICartDetails } from "@sps/ecommerce/models/order/sdk/model";
import {
  ReceiptEmail,
  syncReceiptEmail,
} from "../../checkout-default/ReceiptEmail";
import { Component as Row } from "./Row";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Truck } from "lucide-react";
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
          total: "Итого",
          pricedItems: "Товары с ценой",
          delivery: "Доставка",
          deliveryNote:
            "Для цифровых товаров адрес не нужен. Доставка физических товаров пока недоступна.",
          unpriced:
            "У некоторых товаров нет цены. Удалите их из корзины перед оплатой.",
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
          total: "Total",
          pricedItems: "Priced items",
          delivery: "Delivery",
          deliveryNote:
            "Digital items do not need a shipping address. Shipping for physical items is currently unavailable.",
          unpriced:
            "Some products have no price. Remove them from your cart before paying.",
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
  });

  const [paymentUrls, setPaymentUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const lifecycle = useRef<symbol | null>(null);
  useEffect(() => {
    const current = Symbol();
    lifecycle.current = current;
    return () => {
      if (lifecycle.current === current) lifecycle.current = null;
    };
  }, []);

  const ecommerceModuleOrderCheckout = api.ecommerceModuleOrderCheckout({});
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

  const form = useForm({
    resolver: zodResolver(formSchema),
    shouldUnregister: true,
    defaultValues: {
      provider: "stripe",
      email: "",
    },
  });

  async function onSubmit(
    data: z.infer<typeof formSchema>,
    orders: { id: string }[],
  ) {
    const currentLifecycle = lifecycle.current;
    if (!currentLifecycle) return;
    setError("");
    try {
      const res = await ecommerceModuleOrderCheckout.mutateAsync({
        id: props.data.id,
        data: {
          ...data,
          ecommerceModule: { orders: orders.map(({ id }) => ({ id })) },
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
            if (!orders.length)
              return (
                <p className="px-6 py-12 text-sm text-muted-foreground">
                  {text.emptyCart}
                </p>
              );
            // Combine server-calculated amounts from the same authorized snapshot as the rows.
            const hasUnpriced = orders.some(
              (order) => order.cartDetails?.unpriced?.length,
            );
            const hasInvalidCurrency = orders.some(
              (order) =>
                !order.cartDetails?.billingModuleCurrencyId ||
                !order.cartDetails.availableCurrencyIds?.includes(
                  order.cartDetails.billingModuleCurrencyId,
                ),
            );
            const totals = new Map<string, ICartDetails["totals"][number]>();
            for (const order of orders) {
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
                <div className="min-h-28 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                  <ul className="space-y-3">
                    {orders.map((order) => (
                      <Row
                        key={order.id}
                        subject={props.data}
                        ecommerceModuleOrder={order}
                        language={props.language}
                      />
                    ))}
                  </ul>
                  <section
                    className="mt-5 flex items-start gap-3 border-t border-border pt-4"
                    aria-label={text.delivery}
                  >
                    <Truck
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">{text.delivery}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {text.deliveryNote}
                      </p>
                    </div>
                  </section>
                </div>
                <form
                  className="shrink-0 space-y-3 border-t border-border px-4 py-4 sm:px-6 sm:py-5"
                  noValidate
                  onSubmitCapture={(event) => syncReceiptEmail(event, form)}
                  onSubmit={form.handleSubmit(
                    (values) => onSubmit(values, orders),
                    () => setError(""),
                  )}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold">
                      {hasUnpriced ? text.pricedItems : text.total}
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
                              maximumFractionDigits: 2,
                            },
                          ).format(total.total)}{" "}
                          {total.billingModuleCurrency.symbol}
                        </p>
                      ))}
                    </div>
                  </div>
                  {hasUnpriced && (
                    <p role="alert" className="text-sm text-destructive">
                      {text.unpriced}
                    </p>
                  )}
                  {!hasUnpriced && hasInvalidCurrency && (
                    <p role="alert" className="text-sm text-destructive">
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
                    options={providers.map((provider) => [provider, provider])}
                  />
                  <ReceiptEmail
                    subject={props.data}
                    form={form}
                    label={text.email}
                    placeholder="name@example.com"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex min-h-11 w-full shrink-0 rounded-xl"
                    disabled={
                      ecommerceModuleOrderCheckout.isPending ||
                      hasUnpriced ||
                      hasInvalidCurrency ||
                      updatingCart ||
                      refreshingCart
                    }
                  >
                    {ecommerceModuleOrderCheckout.isPending
                      ? text.checkingOut
                      : text.checkout}
                  </Button>
                </form>
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
