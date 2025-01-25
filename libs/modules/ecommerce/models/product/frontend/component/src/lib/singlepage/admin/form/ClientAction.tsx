"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/ecommerce/models/product/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
  types,
} from "@sps/ecommerce/models/product/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      title: props.data?.title || "",
      description: props.data?.description || "",
      shortDescription: props.data?.shortDescription || "",
      type: props.data?.type || "one_off",
      sku: props.data?.sku || "",
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
      name="product"
    >
      <div className="flex flex-col gap-6">
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
          type="tiptap"
          name="description"
          label="Description"
          form={form}
          placeholder="Type description"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="sku"
          label="SKU"
          form={form}
          placeholder="Type sku"
        />

        <FormField
          ui="shadcn"
          type="tiptap"
          name="shortDescription"
          label="Short description"
          form={form}
          placeholder="Type short description"
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
          label="Variant"
          name="variant"
          form={form}
          placeholder="Select variant"
          options={variants.map((variant) => [variant, variant])}
        />

        {props.productsToAttributes
          ? props.productsToAttributes({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.ordersToProducts
          ? props.ordersToProducts({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.categoriesToProducts
          ? props.categoriesToProducts({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.storesToProducts
          ? props.storesToProducts({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.productsToFileStorageModuleWidgets
          ? props.productsToFileStorageModuleWidgets({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.widgetsToProducts
          ? props.widgetsToProducts({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.productsToWebsiteBuilderModuleWidgets
          ? props.productsToWebsiteBuilderModuleWidgets({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
