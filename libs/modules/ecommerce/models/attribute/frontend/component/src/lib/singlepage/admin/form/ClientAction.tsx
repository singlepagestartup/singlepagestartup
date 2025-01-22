"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/ecommerce/models/attribute/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/ecommerce/models/attribute/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      boolean: props.data?.boolean || null,
      date: props.data?.date ? new Date(props.data.date) : null,
      datetime: props.data?.datetime ? new Date(props.data.datetime) : null,
      number: props.data?.number || null,
      string: props.data?.string || "",
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
      module="ecommerce"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="attribute"
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          name="string"
          label="String"
          form={form}
          placeholder="Type string"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="number"
          label="Number"
          form={form}
          placeholder="Type number"
        />

        <FormField
          ui="shadcn"
          type="datetime"
          name="datetime"
          label="Datetime"
          form={form}
          placeholder="Select datetime"
        />

        <FormField
          ui="shadcn"
          type="datetime"
          name="date"
          label="Date"
          form={form}
          placeholder="Select date"
        />

        <FormField
          ui="shadcn"
          type="checkbox"
          name="boolean"
          label="Boolean"
          form={form}
          placeholder="Select boolean"
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

        {props.attributesToAttributeKeys
          ? props.attributesToAttributeKeys({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.productsToAttributes
          ? props.productsToAttributes({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.storesToAttributes
          ? props.storesToAttributes({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.attributesToBillingModuleCurrencies
          ? props.attributesToBillingModuleCurrencies({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
