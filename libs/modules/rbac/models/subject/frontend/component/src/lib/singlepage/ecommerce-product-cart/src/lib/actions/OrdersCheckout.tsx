"use client";

import { IComponentPropsExtended } from "../interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import { Button, Form } from "@sps/shared-ui-shadcn";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@sps/ui-adapter";

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
});

export function Component(
  props: IComponentPropsExtended & {
    order: IOrder;
  },
) {
  const checkoutEntity = api.ecommerceOrdersCheckout({
    id: props.data.id,
    orderId: props.order.id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "stripe",
      email: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    checkoutEntity.mutate({
      data,
    });
  }

  useEffect(() => {
    if (checkoutEntity.isSuccess) {
      const paymentUrl =
        checkoutEntity.data.subjectsToEcommerceModuleOrders[0].order
          .ordersToBillingModulePaymentIntents[0].billingModulePaymentIntent
          .invoices[0].paymentUrl;
      window.location.href = paymentUrl;
    }
  }, [checkoutEntity.isSuccess]);

  return (
    <Form {...form}>
      <div className="flex flex-col w-full gap-1">
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
          label="Email for invoice"
          name="email"
          form={form}
          placeholder="Type email"
        />
        <Button
          onClick={form.handleSubmit(onSubmit)}
          variant="primary"
          className="w-full flex flex-shrink-0"
        >
          Checkout
        </Button>
      </div>
    </Form>
  );
}
