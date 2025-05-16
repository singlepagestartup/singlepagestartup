"use client";

import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@sps/ui-adapter";
import { Component as BillingCurrency } from "@sps/billing/models/currency/frontend/component";

const providers = [
  "stripe",
  "0xprocessing",
  "payselection",
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
        value === "cloudpayments" ||
        value === "dummy",
      "Invalid provider",
    ),
  email: z.string().email(),
  billingModule: z.object({
    currency: z.object({
      id: z.string(),
    }),
  }),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "stripe",
      email: "",
      billingModule: {
        currency: {
          id: undefined,
        },
      },
      ecommerceModule: {
        orders: [
          {
            id: props.order.id,
          },
        ],
      },
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    ecommerceModuleOrderCheckout
      .mutateAsync({
        id: props.data.id,
        data,
      })
      .then((res) => {
        const paymentUrl = res.billingModule.invoices[0].paymentUrl;
        window.location.href = paymentUrl;
      });
  }

  return (
    <Form {...form}>
      <div className="flex flex-col w-full gap-2">
        <BillingCurrency
          isServer={false}
          variant="toggle-group-default"
          form={form}
          formFieldName="billingModule.currency.id"
          className="w-fit"
        />
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
        <Button
          onClick={form.handleSubmit(onSubmit)}
          variant="primary"
          className="w-full flex flex-shrink-0"
          disabled={ecommerceModuleOrderCheckout.isPending}
        >
          Checkout
        </Button>
      </div>
    </Form>
  );
}
