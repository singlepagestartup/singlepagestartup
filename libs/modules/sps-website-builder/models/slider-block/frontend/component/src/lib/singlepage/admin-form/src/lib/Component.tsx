"use client";

import { IComponentPropsExtended, variant, IModel } from "./interface";
import { api } from "@sps/sps-website-builder/models/slider-block/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/sps-website-builder/models/slider-block/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/singlepage/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const updateEntity = api.update();
  const createEntity = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      variant: props.data?.variant || "default",
      title: props.data?.title || "",
      subtitle: props.data?.subtitle || "",
      description: props.data?.description || "",
      anchor: props.data?.anchor || "",
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
      module="sps-website-builder"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="slider-block"
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
          label="Subtitle"
          name="subtitle"
          form={form}
          placeholder="Type subtitle"
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Description"
          name="description"
          form={form}
          placeholder="Type description"
        />

        <FormField
          ui="shadcn"
          type="text"
          label="Anchor"
          name="anchor"
          form={form}
          placeholder="Type anchor"
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
          type="select"
          label="Variant"
          name="variant"
          form={form}
          placeholder="Type title"
          options={variants.map((variant) => [variant, variant])}
        />

        {props.sliderBlocksToSliders
          ? props.sliderBlocksToSliders({
              data: props.data,
              hostUrl: props.hostUrl,
              isServer: props.isServer,
            })
          : null}

        {props.widgetsToSliderBlocks
          ? props.widgetsToSliderBlocks({
              data: props.data,
              hostUrl: props.hostUrl,
              isServer: props.isServer,
            })
          : null}
      </div>
    </ParentAdminForm>
  );
}
