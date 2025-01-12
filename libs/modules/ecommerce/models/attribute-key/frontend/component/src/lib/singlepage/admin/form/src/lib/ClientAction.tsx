"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/ecommerce/models/attribute-key/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
  types,
  fields,
} from "@sps/ecommerce/models/attribute-key/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      prefix: props.data?.prefix || "",
      suffix: props.data?.suffix || "",
      slug: props.data?.slug || "",
      type: props.data?.type || "",
      title: props.data?.title || "",
      field: props.data?.field || "string",
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
      name="attribute-key"
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
          type="text"
          name="slug"
          label="Slug"
          form={form}
          placeholder="Type slug"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="prefix"
          label="Prefix"
          form={form}
          placeholder="Type prefix"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="suffix"
          label="Suffix"
          form={form}
          placeholder="Type suffix"
        />

        <FormField
          ui="shadcn"
          type="select"
          name="type"
          label="Type"
          form={form}
          placeholder="Select type"
          options={types.map((type) => [type, type])}
        />

        <FormField
          ui="shadcn"
          type="select"
          name="field"
          label="Field"
          form={form}
          placeholder="Select field"
          options={fields.map((field) => [field, field])}
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
              hostUrl: props.hostUrl,
              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
