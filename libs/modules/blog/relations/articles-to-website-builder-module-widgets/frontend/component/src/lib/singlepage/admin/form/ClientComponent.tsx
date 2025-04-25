"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import {
  variants,
  insertSchema,
} from "@sps/blog/relations/articles-to-website-builder-module-widgets/sdk/model";
import { api } from "@sps/blog/relations/articles-to-website-builder-module-widgets/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { Component as WebsiteBuilderModuleWidget } from "@sps/website-builder/models/widget/frontend/component";
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
      articleId: props.data?.articleId || "",
      orderIndex: props.data?.orderIndex || 0,
      className: props.data?.className || "",
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
      module="blog"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="articles-to-website-builder-module-widgets"
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

        <Article
          isServer={props.isServer}
          variant="admin-select-input"
          formFieldName="articleId"
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
