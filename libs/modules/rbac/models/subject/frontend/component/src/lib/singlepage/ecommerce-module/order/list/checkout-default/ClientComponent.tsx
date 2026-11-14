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
import { Component as Row } from "./Row";
import { useState } from "react";
import Link from "next/link";
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
  const text =
    props.language === "ru"
      ? {
          invalidProvider: "Выберите способ оплаты.",
          invalidEmail: "Введите корректный email для чека.",
          noOrders: "В корзине нет заказов для оформления.",
          paymentLinkError:
            "Не удалось получить ссылку на оплату. Попробуйте ещё раз.",
          checkoutError: "Не удалось оформить заказ. Попробуйте ещё раз.",
          invalidForm: "Проверьте email для чека и данные заказа.",
          emptyCart: "В корзине пока нет товаров.",
          total: "Итого",
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
          noOrders: "There are no orders to check out.",
          paymentLinkError: "Could not get a payment link. Please try again.",
          checkoutError: "Could not place your order. Please try again.",
          invalidForm: "Check your receipt email and order details.",
          emptyCart: "Your cart is empty.",
          total: "Total",
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
    ecommerceModule: z.object({
      orders: z
        .array(
          z.object({
            id: z.string(),
          }),
        )
        .min(1, text.noOrders),
    }),
  });

  const [paymentUrls, setPaymentUrls] = useState<string[]>([]);
  const [error, setError] = useState("");

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
      ecommerceModule: {
        orders: [],
      },
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setError("");
    ecommerceModuleOrderCheckout
      .mutateAsync({
        id: props.data.id,
        data,
      })
      .then((res) => {
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
      })
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error && cause.message
            ? `${text.checkoutError} ${cause.message}`
            : text.checkoutError,
        ),
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
      <div className="flex h-full min-h-0 w-full flex-col">
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
                <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto px-6 py-6">
                  {orders.map((order, index) => (
                    <Row
                      key={order.id}
                      subject={props.data}
                      ecommerceModuleOrder={order}
                      index={index}
                      form={form}
                      language={props.language}
                    />
                  ))}
                </ul>
                <div className="shrink-0 space-y-3 border-t border-border px-6 py-5">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {text.total}
                  </h3>
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
                  <FormField
                    ui="shadcn"
                    type="text"
                    name="email"
                    form={form}
                    label={text.email}
                    placeholder="name@example.com"
                  />
                  {error && (
                    <p role="alert" className="text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  {paymentUrls.length ? (
                    <div className="flex flex-col gap-2">
                      {paymentUrls.map((paymentUrl, index) => {
                        return (
                          <Button
                            key={index}
                            variant="primary"
                            className="flex min-h-11 w-full shrink-0 rounded-xl"
                            asChild={true}
                          >
                            <Link href={paymentUrl} target="_blank">
                              {text.checkout}
                            </Link>
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <Button
                      onClick={form.handleSubmit(onSubmit, () =>
                        setError(text.invalidForm),
                      )}
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
                  )}
                </div>
              </>
            );
          }}
        </Subject>
      </div>
    </Form>
  );
}
