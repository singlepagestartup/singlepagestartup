"use client";

import React, { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/sps-website-builder/models/hero-section-block/sdk/client";
import { useForm } from "react-hook-form";
import { FormField } from "@sps/ui-adapter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  variants,
  insertSchema,
} from "@sps/sps-website-builder/models/hero-section-block/sdk/model";
import { Component as ParentAdminForm } from "@sps/shared-frontend-components/sps-lite/admin/admin-form/Component";

export function Component(props: IComponentPropsExtended) {
  const update = api.update({
    id: props.data?.id,
  });
  const create = api.create();

  const form = useForm<z.infer<typeof insertSchema>>({
    resolver: zodResolver(insertSchema),
    defaultValues: {
      title: props.data?.title || "",
      subtitle: props.data?.subtitle || "",
      variant: props.data?.variant || "default",
      description: props.data?.description || "",
      className: props.data?.className || "",
      anchor: props.data?.anchor || "",
    },
  });

  async function onSubmit(data: z.infer<typeof insertSchema>) {
    if (props.data?.id) {
      update.mutate({
        id: props.data.id,
        data,
      });
      return;
    }

    create.mutate({
      data,
    });
  }

  useEffect(() => {
    if (update.data || create.data) {
      //
    }
  }, [update.data, create.data]);

  return (
    <ParentAdminForm
      module="sps-website-builder"
      form={form}
      id={props.data?.id}
      onSubmit={onSubmit}
      variant={props.variant}
      name="hero-section-block"
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
          name="anchor"
          label="Anchor"
          form={form}
          placeholder="Type anchor"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="subtitle"
          label="Subitle"
          form={form}
          placeholder="Type subtitle"
        />

        <FormField
          ui="shadcn"
          type="tiptap"
          label="Description"
          name="description"
          form={form}
          placeholder="Type description"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="className"
          label="Class name"
          form={form}
          placeholder="Type class name"
        />

        <FormField
          ui="shadcn"
          type="text"
          name="className"
          label="Class name"
          form={form}
          placeholder="Type class name"
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

        {props.widgetsToHeroSectionBlocks
          ? props.widgetsToHeroSectionBlocks(props)
          : null}

        {props.heroSectionBlocksToButtonsArrays
          ? props.heroSectionBlocksToButtonsArrays(props)
          : null}

        {props.heroSectionBlocksToSpsFileStorageModuleWidgets
          ? props.heroSectionBlocksToSpsFileStorageModuleWidgets(props)
          : null}
      </div>
    </ParentAdminForm>
  );
}
