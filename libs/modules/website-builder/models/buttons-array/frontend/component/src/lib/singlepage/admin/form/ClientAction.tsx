"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/website-builder/models/buttons-array/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/website-builder/models/buttons-array/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      title: props.data?.title || "",
      className: props.data?.className || "",
      description: props.data?.description || "",
      slug: props.data?.slug || "",
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
      variant="admin-form"
      name="buttons-array"
    >
      <div className="flex flex-col gap-6">
        <FormField
          ui="shadcn"
          type="text"
          label="Title"
          name="title"
          form={form}
          placeholder="Type title"
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Slug"
          name="slug"
          form={form}
          placeholder="Type slug"
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
          type="text"
          label="Class name"
          name="className"
          form={form}
          placeholder="Type class name"
        />

        <FormField
          ui="shadcn"
          type="tiptap"
          label="Description"
          name="description"
          form={form}
          placeholder="Type description"
        />

        {props.buttonsArraysToButtons
          ? props.buttonsArraysToButtons({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.widgetsToButtonsArrays
          ? props.widgetsToButtonsArrays({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.slidesToButtonsArrays
          ? props.slidesToButtonsArrays({
              data: props.data,

              isServer: props.isServer,
            })
          : null}

        {props.featuresToButtonsArrays
          ? props.featuresToButtonsArrays({
              data: props.data,

              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
