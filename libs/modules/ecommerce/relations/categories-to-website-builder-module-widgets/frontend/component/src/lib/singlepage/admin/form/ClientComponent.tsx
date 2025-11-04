"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/sdk/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/sdk/model";
import { FormField } from "@sps/ui-adapter";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin/form/Component";
import { Component as AgregatedInput } from "@sps/shared-frontend-components/singlepage/admin/agregated-input/Component";
import { internationalization } from "@sps/shared-configuration";
import { useGetAdminFormState } from "@sps/shared-frontend-client-hooks";
import { Component as Category } from "@sps/ecommerce/models/category/frontend/component";
import { Component as WebsiteBuilderModuleWidget } from "@sps/website-builder/models/widget/frontend/component";

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
      categoryId: props.data?.categoryId || "",
      websiteBuilderModuleWidgetId:
        props.data?.websiteBuilderModuleWidgetId || "",
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
      name="categories-to-website-builder-module-widgets"
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

        <Category
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="categoryId"
          form={form}
        />

        <WebsiteBuilderModuleWidget
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="websiteBuilderModuleWidgetId"
          form={form}
        />
      </div>
    </ParentAdminForm>
  );
}
