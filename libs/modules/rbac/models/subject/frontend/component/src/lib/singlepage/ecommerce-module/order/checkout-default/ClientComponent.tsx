"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  const ecommerceModuleOrderCheckout = api.ecommerceModuleOrderCheckout({});
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "stripe",
      email: "",
      ecommerceModule: {
        orders: [
          {
            id: props.ecommerceModuleOrder.id,
          },
        ],
      },
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setError("");
    try {
      const result = await ecommerceModuleOrderCheckout.mutateAsync({
        id: props.data.id,
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
          {props.language === "ru" ? "Оформить корзину" : "Checkout cart"}
        </summary>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3 border-t border-border p-4"
        >
          <FormField
            ui="shadcn"
            type="select"
            name="provider"
            form={form}
            placeholder="Select provider"
            options={providers.map((provider) => [provider, provider])}
          />
          <FormField
            ui="shadcn"
            type="text"
            name="email"
            form={form}
            placeholder="Email for invoice"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="primary"
            className="min-h-11 w-full rounded-xl"
            disabled={ecommerceModuleOrderCheckout.isPending}
          >
            {props.language === "ru"
              ? "Перейти к оплате"
              : "Continue to payment"}
          </Button>
        </form>
      </details>
    </Form>
  );
}
