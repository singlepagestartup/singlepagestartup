"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/ecommerce/relations/offers-to-offers/sdk/model";
import { api } from "@sps/ecommerce/relations/offers-to-offers/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as StoresToProducts } from "@sps/ecommerce/relations/stores-to-products/frontend/component";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-v2/form/Component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update({
    id: props.data?.id ?? "",
  });
  const createEntity = api.create();

  const { status } = useGetAdminFormState({
    updateEntity,
    createEntity,
  });

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "delivery",
      recurrence: props.data?.recurrence ?? "first",
      sourceOfferId: props.data?.sourceOfferId || "",
      orderIndex: props.data?.orderIndex || 0,
      targetOfferId: props.data?.targetOfferId || "",
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
      isServer={false}
      module="ecommerce"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="offers-to-offers"
      type="relation"
      status={status}
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

        <FormField
          ui="shadcn"
          type="select"
          label="Subscription deliveries"
          name="recurrence"
          form={form}
          options={[
            ["first", "First delivery only"],
            ["each", "Every delivery"],
          ]}
        />

        <StoresToProducts
          isServer={false}
          variant="admin-v2-select-input"
          formFieldName="sourceOfferId"
          form={form}
        />

        <StoresToProducts
          isServer={false}
          variant="admin-v2-select-input"
          formFieldName="targetOfferId"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}
