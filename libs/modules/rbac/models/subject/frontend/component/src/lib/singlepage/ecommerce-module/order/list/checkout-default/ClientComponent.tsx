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

const providers = [
  "stripe",
  "0xprocessing",
  "payselection",
  "cloudpayments",
  "dummy",
  "paykeeper",
] as const;

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
      "Invalid provider",
    ),
  email: z.string().email(),
  ecommerceModule: z.object({
    orders: z.array(
      z.object({
        id: z.string(),
      }),
    ),
  }),
});

export function Component(props: IComponentPropsExtended) {
  const [paymentUrls, setPaymentUrls] = useState<string[]>([]);
  const [error, setError] = useState("");

  const ecommerceModuleOrderCheckout = api.ecommerceModuleOrderCheckout({});

  const form = useForm<z.infer<typeof formSchema>>({
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
          setError("Не удалось получить ссылку на оплату. Попробуйте ещё раз.");
          return;
        }
        if (paymentUrls.length > 1) {
          setPaymentUrls(paymentUrls);
        } else {
          window.location.href = paymentUrls[0];
        }
      })
      .catch(() =>
        setError(
          "Не удалось оформить заказ. Проверьте данные и попробуйте ещё раз.",
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
                  В корзине пока нет товаров.
                </p>
              );
            // Combine server-calculated amounts from the same authorized snapshot as the rows.
            const totals = new Map<string, ICartDetails["totals"][number]>();
            for (const order of orders) {
              for (const total of order.cartDetails?.totals ?? []) {
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
                    Итого
                  </h3>
                  {[...totals.values()].map((total) => (
                    <p
                      key={total.billingModuleCurrency.id}
                      className="text-2xl font-semibold"
                    >
                      {new Intl.NumberFormat("ru-RU", {
                        maximumFractionDigits: 2,
                      }).format(total.total)}{" "}
                      {total.billingModuleCurrency.symbol}
                    </p>
                  ))}
                  <FormField
                    ui="shadcn"
                    type="select"
                    name="provider"
                    form={form}
                    label="Способ оплаты"
                    placeholder="Выберите способ оплаты"
                    options={providers.map((provider) => [provider, provider])}
                  />
                  <FormField
                    ui="shadcn"
                    type="text"
                    name="email"
                    form={form}
                    label="Email для чека"
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
                              Перейти к оплате
                            </Link>
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <Button
                      onClick={form.handleSubmit(onSubmit)}
                      variant="primary"
                      className="flex min-h-11 w-full shrink-0 rounded-xl"
                      disabled={ecommerceModuleOrderCheckout.isPending}
                    >
                      {ecommerceModuleOrderCheckout.isPending
                        ? "Оформляем…"
                        : "Перейти к оплате"}
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
