"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/billing/models/currency/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { variants, insertSchema } from "@sps/billing/models/currency/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const { status } = useGetAdminFormState({
    updateEntity,
    createEntity,
  });

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      isDefault: props.data?.isDefault || false,
      symbol: props.data?.symbol || "",
      slug: props.data?.slug || "",
      title: props.data?.title || "",
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
      name="currency"
      status={status}
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          name="symbol"
          label="Symbol"
          form={form}
          placeholder="Type symbol"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="slug"
          label="Slug"
          form={form}
          placeholder="Type slug"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="title"
          label="Title"
          form={form}
          placeholder="Type title"
        />

        <FormField
          ui="shadcn"
          type="checkbox"
          name="isDefault"
          label="Is default"
          form={form}
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
