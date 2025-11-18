"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/social/relations/threads-to-ecommerce-module-products/sdk/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/social/relations/threads-to-ecommerce-module-products/sdk/model";
import { FormField } from "@sps/ui-adapter";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import { Component as EcommerceModuleProduct } from "@sps/ecommerce/models/product/frontend/component";
import { Component as Thread } from "@sps/social/models/thread/frontend/component";

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
      className: props.data?.className || "",
      orderIndex: props.data?.orderIndex || 0,
      threadId: props.data?.threadId || "",
      ecommerceModuleProductId: props.data?.ecommerceModuleProductId || "",
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
      module="social"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="threads-to-ecommerce-module-products"
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
          name="className"
          label="Class Name"
          form={form}
          placeholder="Type class name"
        />

        <FormField
          ui="shadcn"
          type="select"
          label="Variant"
          name="variant"
          form={form}
          placeholder="Type title"
          options={variants.map((variant) => [variant, variant])}
        />

        <Thread
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="threadId"
          form={form}
        />

        <EcommerceModuleProduct
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="ecommerceModuleProductId"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}
