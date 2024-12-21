"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormField } from "@sps/ui-adapter";
import { Component as BillingCurrency } from "@sps/billing/models/currency/frontend/component";

const providers = [
  "stripe",
  "0xprocessing",
  "payselection",
  "payselection-international",
  "tiptoppay",
  "cloudpayments",
  "dummy",
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
        value === "cloudpayments" ||
        value === "tiptoppay" ||
        value === "dummy",
      "Invalid provider",
    ),
  email: z.string().email(),
  quantity: z.number().int().positive(),
  comment: z.string().optional(),
  billingModuleCurrencyId: z.string(),
});

export function Component(props: IComponentPropsExtended) {
  const productCheckout = api.ecommerceProductCheckout({
    id: props.data.id,
    productId: props.product.id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "dummy",
      email: "",
      quantity: 1,
      comment: "",
      billingModuleCurrencyId: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    productCheckout.mutate({
      data,
    });
  }

  useEffect(() => {
    if (productCheckout.isSuccess) {
      const paymentUrl =
        productCheckout.data.subjectsToEcommerceModuleOrders[0].order
          .ordersToBillingModulePaymentIntents[0].billingModulePaymentIntent
          .invoices[0].paymentUrl;
      window.location.href = paymentUrl;
    }
  }, [productCheckout.isSuccess]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Form {...form}>
        <div className="flex flex-col gap-3">
          <BillingCurrency
            isServer={false}
            hostUrl={props.hostUrl}
            variant="admin-select-input"
            form={form}
            formFieldName="billingModuleCurrencyId"
          />
          <FormField
            ui="shadcn"
            type="select"
            label="Provider"
            name="provider"
            form={form}
            placeholder="Select provider"
            options={providers.map((provider) => [provider, provider])}
          />
          <FormField
            ui="shadcn"
            type="text"
            label="Email"
            name="email"
            form={form}
            placeholder="Type your email"
            className="w-full"
          />
          <FormField
            ui="shadcn"
            type="text"
            label="Comment"
            name="comment"
            form={form}
            placeholder="Type comment"
            className="w-full"
          />

          <Button onClick={form.handleSubmit(onSubmit)} variant="primary">
            One step checkout
          </Button>
        </div>
      </Form>
    </div>
  );
}
