"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/billing/models/payment-intent/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
  statuses,
  types,
  intervals,
} from "@sps/billing/models/payment-intent/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      amount: props.data?.amount || 0,
      status: props.data?.status || "requires_payment_method",
      interval: props.data?.interval || "",
      type: props.data?.type || "one_off",
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
      module="website-builder"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="payment-intent"
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="number"
          label="Amount"
          name="amount"
          form={form}
          placeholder="Type amount"
        />

        <FormField
          ui="shadcn"
          type="select"
          label="Status"
          name="status"
          form={form}
          placeholder="Select status"
          options={statuses.map((status) => [status, status])}
        />

        <FormField
          ui="shadcn"
          type="select"
          label="Type"
          name="type"
          form={form}
          placeholder="Select type"
          options={types.map((type) => [type, type])}
        />

        <FormField
          ui="shadcn"
          type="select"
          label="Interval"
          name="interval"
          form={form}
          placeholder="Select interval"
          options={intervals.map((interval) => [interval, interval])}
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

        {props.paymentIntentsToInvoices
          ? props.paymentIntentsToInvoices({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.paymentIntentsToCurrencies
          ? props.paymentIntentsToCurrencies({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
