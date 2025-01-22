"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/ecommerce/relations/categories-to-file-storage-module-widgets/sdk/model";
import { api } from "@sps/ecommerce/relations/categories-to-file-storage-module-widgets/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as Category } from "@sps/ecommerce/models/category/frontend/component";
import { Component as FileStorageModuleWidget } from "@sps/file-storage/models/widget/frontend/component";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      categoryId: props.data?.categoryId || "",
      orderIndex: props.data?.orderIndex || 0,
      className: props.data?.className || "",
      fileStorageModuleWidgetId: props.data?.fileStorageModuleWidgetId || "",
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
      name="categories-to-file-storage-module-widgets"
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

        <Category
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="categoryId"
          form={form}
        />

        <FileStorageModuleWidget
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="fileStorageModuleWidgetId"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}
