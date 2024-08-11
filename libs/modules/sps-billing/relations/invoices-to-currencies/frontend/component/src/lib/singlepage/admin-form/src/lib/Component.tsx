"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/sps-billing/relations/invoices-to-currencies/sdk/model";
import { api } from "@sps/sps-billing/relations/invoices-to-currencies/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as Invoice } from "@sps/sps-billing/models/invoice/frontend/component";
import { Component as Currency } from "@sps/sps-billing/models/currency/frontend/component";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      currencyId: props.data?.currencyId || "",
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
      module="sps-billing"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="invoices-to-currencies"
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

        <Invoice
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          variant="admin-select-input"
          formFieldName="invoiceId"
          form={form}
        />

        <Currency
          isServer={props.isServer}
          hostUrl={props.hostUrl}
          variant="admin-select-input"
          formFieldName="currencyId"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}
