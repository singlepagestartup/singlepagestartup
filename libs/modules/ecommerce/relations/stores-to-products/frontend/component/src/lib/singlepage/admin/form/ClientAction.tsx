"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import { api } from "@sps/ecommerce/relations/stores-to-products/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as Store } from "@sps/ecommerce/models/store/frontend/component";
import { Component as Product } from "@sps/ecommerce/models/product/frontend/component";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { createId } from "@paralleldrive/cuid2";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      storeId: props.data?.storeId || "",
      orderIndex: props.data?.orderIndex || 0,
      sku: props.data?.sku || createId(),
      productId: props.data?.productId || "",
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
      module="ecommerce"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="categories-to-products"
      type="relation"
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          label="SKU"
          name="sku"
          form={form}
          placeholder="Type SKU"
        />

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

        <Store
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="storeId"
          form={form}
        />

        <Product
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="productId"
          form={form}
        />

        {props.storesToProductsToAttributes
          ? props.storesToProductsToAttributes({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
