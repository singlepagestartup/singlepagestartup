"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReceiptEmail } from "./ReceiptEmail";
import { CheckoutForm } from "./CheckoutForm";
import { OrderComment } from "./OrderComment";
import { FormField } from "@sps/ui-adapter";
import { cn } from "@sps/shared-frontend-client-utils";

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
      (value) =>
        value === "stripe" ||
        value === "0xprocessing" ||
        value === "payselection" ||
        value === "payselection-international" ||
        value === "tiptoppay" ||
        value === "cloudpayments" ||
        value === "dummy" ||
        value === "paykeeper",
      "Invalid provider",
    ),
  email: z.email(),
  comment: z.string().trim().optional(),
  ecommerceModule: z.object({
    orders: z.array(
      z.object({
        id: z.string(),
      }),
    ),
  }),
});

export function Component(props: IComponentPropsExtended) {
  const ecommerceModuleOrderCheckout = api.ecommerceModuleOrderCheckout({});
  const [error, setError] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "stripe",
      email: "",
      comment: "",
      ecommerceModule: {
        orders: [
          {
            id: props.ecommerceModuleOrder.id,
          },
        ],
      },
    },
  });

  async function onSubmit({ comment, ...data }: z.infer<typeof formSchema>) {
    if (props.disabled || ecommerceModuleOrderCheckout.isPending) return;
    setError("");
    try {
      const result = await ecommerceModuleOrderCheckout.mutateAsync({
        id: props.data.id,
        data: { ...data, ...(comment ? { comment } : {}) },
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
          : "Checkout could not be completed.",
      );
    }
  }

  return (
    <Form
      data-module="rbac"
      data-model="subject"
      data-model-id={props.data.id}
      data-variant={props.variant}
      {...form}
    >
      <details
        className={cn(
          "min-w-0 rounded-xl border border-border",
          props.className,
        )}
      >
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          {props.language === "ru"
            ? "Оплатить этот заказ"
            : "Pay for this order"}
        </summary>
        <CheckoutForm
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3 border-t border-border p-4"
        >
          <FormField
            ui="shadcn"
            type="select"
            name="provider"
            form={form}
            label={props.language === "ru" ? "Способ оплаты" : "Payment method"}
            placeholder={
              props.language === "ru"
                ? "Выберите способ оплаты"
                : "Select a payment method"
            }
            options={providers.map((provider) => [provider, provider])}
          />
          <ReceiptEmail
            subject={props.data}
            form={form}
            label={props.language === "ru" ? "Email для чека" : "Receipt email"}
            placeholder="name@example.com"
          />
          <OrderComment form={form} language={props.language} />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            className="min-h-11 w-full rounded-xl"
            disabled={props.disabled || ecommerceModuleOrderCheckout.isPending}
          >
            {props.language === "ru"
              ? "Перейти к оплате"
              : "Continue to payment"}
          </Button>
        </CheckoutForm>
      </details>
    </Form>
  );
}
