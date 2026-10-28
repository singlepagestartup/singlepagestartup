"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { FormField } from "@sps/ui-adapter";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";
import { ArrowRight, CreditCard } from "lucide-react";
import type {
  IComponentPropsExtended,
  ICheckoutFields,
  ICheckoutPriceProps,
} from "./interface";
const providers = [
  "stripe",
  "0xprocessing",
  "payselection",
  "payselection-international",
  "tiptoppay",
  "cloudpayments",
  "dummy",
  "paykeeper",
] as const;
const formSchema = z.object({
  provider: z
    .string()
    .refine(
      (value) => providers.some((provider) => provider === value),
      "Invalid provider",
    ),
  email: z.string().email(),
  quantity: z.number().int().positive(),
  comment: z.string().optional(),
  storeId: z.string().optional(),
  billingModule: z.object({
    currency: z.object({ id: z.string().optional() }),
  }),
});
function CheckoutPrice(props: ICheckoutPriceProps) {
  const currencyId = useWatch({
    control: props.form.control,
    name: "billingModule.currency.id",
  });
  const quantity = useWatch({ control: props.form.control, name: "quantity" });
  return currencyId ? (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4 text-sm">
      <span className="text-muted-foreground">
        {props.language === "ru" ? "Цена за единицу" : "Unit price"}
      </span>
      <div className="flex items-center gap-2 font-semibold">
        <Product
          isServer={false}
          variant="price-default"
          dataSource="props"
          data={props.product}
          billingModuleCurrencyId={currencyId}
          language={props.language}
        />
        <span className="text-xs font-normal text-muted-foreground">
          × {quantity || 1}
        </span>
      </div>
    </div>
  ) : null;
}
export function Component(props: IComponentPropsExtended) {
  const checkout = api.ecommerceModuleProductCheckout({});
  const [error, setError] = useState("");
  const form = useForm<ICheckoutFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "dummy",
      email: "",
      quantity: 1,
      comment: "",
      storeId: props.ecommerceModuleStore?.id,
      billingModule: { currency: { id: undefined } },
    },
  });
  async function submit(data: ICheckoutFields) {
    setError("");
    try {
      const result = await checkout.mutateAsync({
        id: props.data.id,
        productId: props.ecommerceModuleProduct.id,
        data,
      });
      const paymentUrl = result.billingModule.invoices[0]?.paymentUrl;
      if (!paymentUrl)
        throw new Error(
          props.language === "ru"
            ? "Платёжная ссылка не получена."
            : "No payment link was returned.",
        );
      window.location.href = paymentUrl;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : props.language === "ru"
            ? "Не удалось оформить заказ."
            : "Checkout could not be completed.",
      );
    }
  }
  return (
    <details
      data-module="rbac"
      data-model="subject"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "group min-w-0 rounded-xl border border-border bg-card",
        props.className,
      )}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
        <CreditCard size={18} />
        {props.language === "ru" ? "Купить в один шаг" : "One step checkout"}
        <ArrowRight size={16} />
      </summary>
      <div className="border-t border-border p-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            className="min-w-0 space-y-4"
            noValidate
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {props.language === "ru" ? "Валюта" : "Currency"}
                </p>
                <Product
                  isServer={false}
                  variant="currency-toggle-group-default"
                  dataSource="props"
                  data={props.ecommerceModuleProduct}
                  form={form}
                  formFieldName="billingModule.currency.id"
                />
              </div>
              <FormField
                ui="shadcn"
                type="number"
                min={1}
                step={1}
                name="quantity"
                form={form}
                label={props.language === "ru" ? "Количество" : "Quantity"}
                className="max-w-28"
                inputClassName="rounded-xl"
              />
            </div>
            <CheckoutPrice
              form={form}
              product={props.ecommerceModuleProduct}
              language={props.language}
            />
            <FormField
              ui="shadcn"
              type="select"
              name="provider"
              form={form}
              label={
                props.language === "ru" ? "Способ оплаты" : "Payment method"
              }
              placeholder={
                props.language === "ru"
                  ? "Выберите способ оплаты"
                  : "Select provider"
              }
              options={providers.map((provider) => [provider, provider])}
              inputClassName="rounded-xl"
            />
            <FormField
              ui="shadcn"
              type="text"
              name="email"
              form={form}
              label={
                props.language === "ru" ? "Email для счёта" : "Email for a bill"
              }
              placeholder="you@example.com"
              inputClassName="rounded-xl"
            />
            <FormField
              ui="shadcn"
              type="text"
              name="comment"
              form={form}
              label={props.language === "ru" ? "Комментарий" : "Comment"}
              inputClassName="rounded-xl"
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={checkout.isPending}
              className="min-h-11 w-full rounded-xl"
            >
              {checkout.isPending
                ? props.language === "ru"
                  ? "Оформляем…"
                  : "Processing…"
                : props.language === "ru"
                  ? "Перейти к оплате"
                  : "Continue to payment"}
            </Button>
          </form>
        </Form>
      </div>
    </details>
  );
}
