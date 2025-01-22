"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import { api } from "@sps/billing/relations/payment-intents-to-invoices/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as Invoice } from "@sps/billing/models/invoice/frontend/component";
import { Component as PaymentIntent } from "@sps/billing/models/payment-intent/frontend/component";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      paymentIntentId: props.data?.paymentIntentId || "",
      orderIndex: props.data?.orderIndex || 0,
      invoiceId: props.data?.invoiceId || "",
      className: props.data?.className || "",
    },
  });

  async function onSubmit(data: z.infer<typeof insertSchema>) {
    if (props.data?.id) {
      updateEntity.mutate({ id: props.data?.id, data });
      return;
    }

    createEntity.mutate({
      data,
    });
  }

  return (
    <ParentAdminForm<IModel, typeof variant>
      {...props}
      module="billing"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="payment-intents-to-invoices"
      type="relation"
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="number"
          label="Order index"
          name="orderIndex"
          form={form}
          placeholder="Order index"
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Class name"
          name="className"
          form={form}
          placeholder="Class name"
        />

        <FormField
          ui="shadcn"
          type="select"
          label="Variant"
          name="variant"
          form={form}
          placeholder="Select variant"
          options={variants.map((variant) => [variant, variant])}
        />

        <PaymentIntent
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="paymentIntentId"
          form={form}
        />

        <Invoice
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="invoiceId"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}
